-- T1-H: vexforge_battle_resolve — Contrato autoritativo e idempotente de PvP.
-- Fecha: 2026-08-02 | Chat: 138
--
-- Diagnóstico: vexforge_battle_resolve no existía en el schema cache.
-- El cliente llamaba `supabase.rpc('vexforge_battle_resolve', { p_challenger_id, p_opponent_id, p_idempotency_key })`
-- pero la RPC no estaba creada → todos los PvP fallaban silenciosamente.
-- Los 2 pvp_matches existentes tienen winner=null y elo=0.
--
-- Este contrato:
-- 1. Valida identidad desde auth.uid() (p_challenger_id debe coincidir).
-- 2. Idempotencia vía reference_id en pvp_matches.
-- 3. Carga el mazo real (player_deck + cards). Si el oponente no tiene mazo,
--    genera un deck sintético escalado a su MMR.
-- 4. Deriva stats de combate desde power/affinity/prestige/charge (columnas reales).
-- 5. Aplica ForgeFormation: champion identification + deck bonus + pure bonus.
-- 6. Simula combate por turnos (champion-first, guard intercept).
-- 7. Calcula ELO con K=32 (fórmula estándar).
-- 8. Escribe pvp_matches, pvp_rankings (upsert), wallet_tx (VEX), player_progress (XP).
-- 9. Retorna RealBattleResult JSON compatible con el cliente (ok, match_id, winner_id,
--    you_won, elo_change, total_turns, turns[], final_units[], engine).

-- ─── Función principal ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.vexforge_battle_resolve(
  p_challenger_id   uuid,
  p_opponent_id     uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  -- Auth
  v_auth_player_id  uuid;
  v_challenger_name text;
  v_opponent_name   text;

  -- System state
  v_brake boolean := false;

  -- Idempotency
  v_existing record;

  -- Active season
  v_season_id uuid;

  -- MMR
  v_mmr_a   numeric := 1000;
  v_mmr_b   numeric := 1000;

  -- Deck state as JSONB arrays of unit objects
  v_units_a jsonb := '[]'::jsonb;
  v_units_b jsonb := '[]'::jsonb;

  -- Card iteration
  v_card            record;
  v_keywords        text[];
  v_guard           bool;
  v_lifesteal       bool;
  v_shielded        bool;
  v_rush            bool;
  v_hp              int;
  v_atk             int;
  v_def             int;
  v_spd             int;

  -- ForgeFormation
  v_champ_a_idx     int := -1;
  v_champ_b_idx     int := -1;
  v_reserve_a_count int := 0;
  v_reserve_b_count int := 0;
  v_same_faction_a  bool := false;
  v_same_faction_b  bool := false;
  v_faction_a       text;
  v_faction_b       text;

  -- Combat simulation
  v_turns           jsonb := '[]'::jsonb;
  v_turn_num        int   := 0;
  v_max_rounds      int   := 30;
  v_round           int;
  v_side            text;
  v_attacker        jsonb;
  v_defender        jsonb;
  v_attk_idx        int;
  v_def_idx         int;
  v_damage          int;
  v_is_crit         bool;
  v_is_kill         bool;
  v_heal_amount     int;
  v_new_hp          int;
  v_alive_a         int;
  v_alive_b         int;
  v_champ_a_alive   bool := true;
  v_champ_b_alive   bool := true;
  v_champ_a_hp      int;
  v_champ_b_hp      int;
  v_events          jsonb;
  v_i               int;
  v_j               int;
  v_best_spd        int;
  v_best_idx        int;
  v_tmp_unit        jsonb;
  v_tmp_hp          int;
  v_tmp_atk         int;
  v_tmp_def         int;
  v_tmp_spd         int;
  v_tmp_alive       bool;
  v_tmp_guard       bool;
  v_tmp_lifesteal   bool;
  v_tmp_shielded    bool;

  -- Winner resolution
  v_winner_id uuid;
  v_you_won   bool;

  -- ELO
  v_k        numeric := 32;
  v_exp_a    numeric;
  v_elo_a    int;
  v_elo_b    int;

  -- Rewards
  v_vex_winner int := 50;
  v_vex_loser  int := 5;
  v_xp_winner  int := 100;
  v_xp_loser   int := 20;

  -- DB writes
  v_match_id  uuid;
  v_ref_a     text;
  v_ref_b     text;
  v_level_a   int;
  v_xp_a      int;
  v_xp_req_a  int;
  v_level_b   int;
  v_xp_b      int;
  v_xp_req_b  int;

  -- Power snapshots
  v_power_a   int := 0;
  v_power_b   int := 0;

  -- Final units for response
  v_final_units jsonb := '[]'::jsonb;

  -- Synthetic deck generation
  v_syn_power   int;
  v_syn_name    text;
  v_syn_rarity  text;
  v_syn_faction text;

BEGIN

  --------------------------------------------------------------------------
  -- 0. Emergency brake
  --------------------------------------------------------------------------
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Emergency brake active');
  END IF;

  --------------------------------------------------------------------------
  -- 1. Auth validation — challenger must be the authenticated user
  --------------------------------------------------------------------------
  SELECT p.id, p.display_name
    INTO v_auth_player_id, v_challenger_name
    FROM public.players p
   WHERE p.auth_user_id = auth.uid()
   LIMIT 1;

  IF v_auth_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  IF v_auth_player_id != p_challenger_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Identity mismatch: p_challenger_id does not match authenticated user');
  END IF;

  IF p_challenger_id = p_opponent_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot battle yourself');
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Idempotency key required');
  END IF;

  --------------------------------------------------------------------------
  -- 2. Idempotency: return cached result if same key was already resolved
  --------------------------------------------------------------------------
  SELECT id, winner, elo_change_a, elo_change_b, player_a, player_b, metadata
    INTO v_existing
    FROM public.pvp_matches
   WHERE reference_id = p_idempotency_key
   LIMIT 1;

  IF FOUND THEN
    v_you_won := (v_existing.winner = p_challenger_id);
    RETURN jsonb_build_object(
      'ok',          true,
      'match_id',    v_existing.id,
      'winner_id',   v_existing.winner,
      'you_won',     v_you_won,
      'elo_change',  CASE WHEN (v_existing.player_a = p_challenger_id)
                          THEN v_existing.elo_change_a
                          ELSE v_existing.elo_change_b END,
      'total_turns', COALESCE((v_existing.metadata->>'total_turns')::int, 10),
      'turns',       COALESCE(v_existing.metadata->'turns', '[]'::jsonb),
      'final_units', COALESCE(v_existing.metadata->'final_units', '[]'::jsonb),
      'engine',      'vexforge_battle_resolve_v1',
      'idempotent',  true
    );
  END IF;

  --------------------------------------------------------------------------
  -- 3. Get opponent name
  --------------------------------------------------------------------------
  SELECT display_name INTO v_opponent_name
    FROM public.players WHERE id = p_opponent_id LIMIT 1;
  v_opponent_name := COALESCE(v_opponent_name, 'Oponente');
  v_challenger_name := COALESCE(v_challenger_name, 'Forjador');

  --------------------------------------------------------------------------
  -- 4. Active season
  --------------------------------------------------------------------------
  SELECT id INTO v_season_id
    FROM public.pvp_seasons
   WHERE active = true
   ORDER BY starts_at DESC
   LIMIT 1;

  --------------------------------------------------------------------------
  -- 5. Load MMR for both players
  --------------------------------------------------------------------------
  IF v_season_id IS NOT NULL THEN
    SELECT COALESCE(mmr, 1000) INTO v_mmr_a
      FROM public.pvp_rankings
     WHERE player_id = p_challenger_id
       AND season_id = v_season_id
     ORDER BY updated_at DESC LIMIT 1;

    SELECT COALESCE(mmr, 1000) INTO v_mmr_b
      FROM public.pvp_rankings
     WHERE player_id = p_opponent_id
       AND season_id = v_season_id
     ORDER BY updated_at DESC LIMIT 1;
  END IF;
  v_mmr_a := COALESCE(v_mmr_a, 1000);
  v_mmr_b := COALESCE(v_mmr_b, 1000);

  --------------------------------------------------------------------------
  -- 6. Load challenger deck (player_deck JOIN cards, max 8 cards)
  --------------------------------------------------------------------------
  FOR v_card IN
    SELECT c.id, c.name, c.faction, c.rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10)     AS power,
           COALESCE(c.affinity, 2)   AS affinity,
           COALESCE(c.prestige, 1)   AS prestige,
           COALESCE(c.charge, 1)     AS charge,
           COALESCE(c.synergy_json, '{}') AS synergy_json,
           pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_challenger_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC
     LIMIT 8
  LOOP
    v_keywords  := ARRAY(SELECT jsonb_array_elements_text(
                           COALESCE(v_card.synergy_json->'keywords', '[]')));
    v_guard     := 'Guard'  = ANY(v_keywords);
    v_lifesteal := 'Drain'  = ANY(v_keywords);
    v_shielded  := 'Veil'   = ANY(v_keywords);
    v_rush      := 'Surge'  = ANY(v_keywords);
    -- Stat derivation from canonical card columns
    v_hp  := v_card.power * 4 + v_card.affinity;
    v_atk := v_card.power + v_card.affinity / 4;
    v_def := v_card.prestige * 2 + v_card.affinity / 8;
    v_spd := v_card.charge * 4 + v_card.affinity / 10;
    IF v_rush    THEN v_spd := v_spd + 20; END IF;
    IF v_guard   THEN v_def := v_def + 5;  END IF;
    v_power_a   := v_power_a + v_card.power;

    v_units_a := v_units_a || jsonb_build_array(jsonb_build_object(
      'id',         v_card.id,
      'name',       v_card.name,
      'faction',    COALESCE(v_card.faction, 'Guerrero'),
      'rarity',     COALESCE(v_card.rarity, 'Common'),
      'image_url',  v_card.image_url,
      'hp',         v_hp,
      'max_hp',     v_hp,
      'atk',        v_atk,
      'def',        v_def,
      'spd',        v_spd,
      'power',      v_card.power,
      'keywords',   to_jsonb(v_keywords),
      'alive',      true,
      'guard',      v_guard,
      'lifesteal',  v_lifesteal,
      'shielded',   v_shielded,
      'side',       'a',
      'is_champion',v_card.is_champion
    ));
  END LOOP;

  --------------------------------------------------------------------------
  -- 7. Load opponent deck (same logic)
  --------------------------------------------------------------------------
  FOR v_card IN
    SELECT c.id, c.name, c.faction, c.rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10)     AS power,
           COALESCE(c.affinity, 2)   AS affinity,
           COALESCE(c.prestige, 1)   AS prestige,
           COALESCE(c.charge, 1)     AS charge,
           COALESCE(c.synergy_json, '{}') AS synergy_json,
           pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_opponent_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC
     LIMIT 8
  LOOP
    v_keywords  := ARRAY(SELECT jsonb_array_elements_text(
                           COALESCE(v_card.synergy_json->'keywords', '[]')));
    v_guard     := 'Guard'  = ANY(v_keywords);
    v_lifesteal := 'Drain'  = ANY(v_keywords);
    v_shielded  := 'Veil'   = ANY(v_keywords);
    v_rush      := 'Surge'  = ANY(v_keywords);
    v_hp  := v_card.power * 4 + v_card.affinity;
    v_atk := v_card.power + v_card.affinity / 4;
    v_def := v_card.prestige * 2 + v_card.affinity / 8;
    v_spd := v_card.charge * 4 + v_card.affinity / 10;
    IF v_rush  THEN v_spd := v_spd + 20; END IF;
    IF v_guard THEN v_def := v_def + 5;  END IF;
    v_power_b := v_power_b + v_card.power;

    v_units_b := v_units_b || jsonb_build_array(jsonb_build_object(
      'id',         v_card.id,
      'name',       v_card.name,
      'faction',    COALESCE(v_card.faction, 'Guerrero'),
      'rarity',     COALESCE(v_card.rarity, 'Common'),
      'image_url',  v_card.image_url,
      'hp',         v_hp,
      'max_hp',     v_hp,
      'atk',        v_atk,
      'def',        v_def,
      'spd',        v_spd,
      'power',      v_card.power,
      'keywords',   to_jsonb(v_keywords),
      'alive',      true,
      'guard',      v_guard,
      'lifesteal',  v_lifesteal,
      'shielded',   v_shielded,
      'side',       'b',
      'is_champion', v_card.is_champion
    ));
  END LOOP;

  --------------------------------------------------------------------------
  -- 8. Synthetic deck for players with no deck (scaled to MMR)
  --------------------------------------------------------------------------
  IF jsonb_array_length(v_units_a) = 0 THEN
    v_units_a := public._vexforge_gen_synthetic_deck(v_mmr_a, 'a');
    v_power_a  := (v_mmr_a / 1000.0 * 25 + 10)::int * 4;
  END IF;
  IF jsonb_array_length(v_units_b) = 0 THEN
    v_units_b := public._vexforge_gen_synthetic_deck(v_mmr_b, 'b');
    v_power_b  := (v_mmr_b / 1000.0 * 25 + 10)::int * 4;
  END IF;

  --------------------------------------------------------------------------
  -- 9. Apply ForgeFormation: identify champions + reserve bonus
  --------------------------------------------------------------------------
  -- Find champion index for side A
  v_champ_a_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF (v_units_a->v_i->>'is_champion')::bool THEN
      v_champ_a_idx := v_i;
      EXIT;
    END IF;
  END LOOP;
  -- If no explicit champion, use highest power card (index 0, already sorted)
  IF v_champ_a_idx = -1 THEN v_champ_a_idx := 0; END IF;

  -- Find champion index for side B
  v_champ_b_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF (v_units_b->v_i->>'is_champion')::bool THEN
      v_champ_b_idx := v_i;
      EXIT;
    END IF;
  END LOOP;
  IF v_champ_b_idx = -1 THEN v_champ_b_idx := 0; END IF;

  -- Reserve count = total cards - 3 (champion + vanguard + sentinel)
  v_reserve_a_count := GREATEST(0, jsonb_array_length(v_units_a) - 3);
  v_reserve_b_count := GREATEST(0, jsonb_array_length(v_units_b) - 3);

  -- Apply champion deck bonus: ATK +1.2/reserve, DEF +0.8/reserve, HP +5/reserve
  IF v_reserve_a_count > 0 THEN
    v_tmp_hp  := (v_units_a->v_champ_a_idx->>'hp')::int  + v_reserve_a_count * 5;
    v_tmp_atk := (v_units_a->v_champ_a_idx->>'atk')::int + FLOOR(v_reserve_a_count * 1.2);
    v_tmp_def := (v_units_a->v_champ_a_idx->>'def')::int + FLOOR(v_reserve_a_count * 0.8);
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'hp'],  to_jsonb(v_tmp_hp));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'max_hp'], to_jsonb(v_tmp_hp));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'atk'], to_jsonb(v_tmp_atk));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'def'], to_jsonb(v_tmp_def));
  END IF;
  IF v_reserve_b_count > 0 THEN
    v_tmp_hp  := (v_units_b->v_champ_b_idx->>'hp')::int  + v_reserve_b_count * 5;
    v_tmp_atk := (v_units_b->v_champ_b_idx->>'atk')::int + FLOOR(v_reserve_b_count * 1.2);
    v_tmp_def := (v_units_b->v_champ_b_idx->>'def')::int + FLOOR(v_reserve_b_count * 0.8);
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'hp'],  to_jsonb(v_tmp_hp));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'max_hp'], to_jsonb(v_tmp_hp));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'atk'], to_jsonb(v_tmp_atk));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'def'], to_jsonb(v_tmp_def));
  END IF;

  -- Formation Pure Bonus: +15% to all 3 active cards if same faction
  IF jsonb_array_length(v_units_a) >= 2 THEN
    v_faction_a      := v_units_a->0->>'faction';
    v_same_faction_a := true;
    FOR v_i IN 1 .. LEAST(2, jsonb_array_length(v_units_a) - 1) LOOP
      IF (v_units_a->v_i->>'faction') != v_faction_a THEN
        v_same_faction_a := false;
        EXIT;
      END IF;
    END LOOP;
    IF v_same_faction_a THEN
      FOR v_i IN 0 .. LEAST(2, jsonb_array_length(v_units_a) - 1) LOOP
        v_tmp_hp  := ROUND((v_units_a->v_i->>'hp')::numeric  * 1.15);
        v_tmp_atk := ROUND((v_units_a->v_i->>'atk')::numeric * 1.15);
        v_tmp_def := ROUND((v_units_a->v_i->>'def')::numeric * 1.15);
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'hp'],  to_jsonb(v_tmp_hp));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'max_hp'], to_jsonb(v_tmp_hp));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'atk'], to_jsonb(v_tmp_atk));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'def'], to_jsonb(v_tmp_def));
      END LOOP;
    END IF;
  END IF;
  IF jsonb_array_length(v_units_b) >= 2 THEN
    v_faction_b      := v_units_b->0->>'faction';
    v_same_faction_b := true;
    FOR v_i IN 1 .. LEAST(2, jsonb_array_length(v_units_b) - 1) LOOP
      IF (v_units_b->v_i->>'faction') != v_faction_b THEN
        v_same_faction_b := false;
        EXIT;
      END IF;
    END LOOP;
    IF v_same_faction_b THEN
      FOR v_i IN 0 .. LEAST(2, jsonb_array_length(v_units_b) - 1) LOOP
        v_tmp_hp  := ROUND((v_units_b->v_i->>'hp')::numeric  * 1.15);
        v_tmp_atk := ROUND((v_units_b->v_i->>'atk')::numeric * 1.15);
        v_tmp_def := ROUND((v_units_b->v_i->>'def')::numeric * 1.15);
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'hp'],  to_jsonb(v_tmp_hp));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'max_hp'], to_jsonb(v_tmp_hp));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'atk'], to_jsonb(v_tmp_atk));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'def'], to_jsonb(v_tmp_def));
      END LOOP;
    END IF;
  END IF;

  --------------------------------------------------------------------------
  -- 10. Combat simulation (ForgeFormation rules)
  -- Turn order: fastest unit attacks. Guard units on the defending side
  -- absorb hits before the champion.
  -- Champion death = immediate loss.
  -- Max 30 rounds to prevent infinite loops.
  --------------------------------------------------------------------------
  v_alive_a    := jsonb_array_length(v_units_a);
  v_alive_b    := jsonb_array_length(v_units_b);
  v_turn_num   := 0;

  -- Track champion HP separately for efficiency
  v_champ_a_hp := (v_units_a->v_champ_a_idx->>'hp')::int;
  v_champ_b_hp := (v_units_b->v_champ_b_idx->>'hp')::int;

  FOR v_round IN 1 .. v_max_rounds LOOP
    EXIT WHEN NOT v_champ_a_alive OR NOT v_champ_b_alive;

    -- Count alive units on each side
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;
    EXIT WHEN v_alive_a = 0 OR v_alive_b = 0;

    -- ── Side A attacks (pick fastest alive unit on side A) ──
    v_best_spd := -1;
    v_best_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool THEN
        v_tmp_spd := (v_units_a->v_i->>'spd')::int;
        IF v_tmp_spd > v_best_spd THEN
          v_best_spd := v_tmp_spd;
          v_best_idx := v_i;
        END IF;
      END IF;
    END LOOP;
    v_attk_idx := v_best_idx;
    v_attacker  := v_units_a->v_attk_idx;

    -- Target: prefer Guard units on side B, then lowest HP alive unit
    v_def_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool AND (v_units_b->v_i->>'guard')::bool THEN
        v_def_idx := v_i;
        EXIT;
      END IF;
    END LOOP;
    -- If no guard, pick lowest HP alive (but never champion until last)
    IF v_def_idx = -1 THEN
      v_tmp_hp := 99999;
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        IF (v_units_b->v_i->>'alive')::bool AND v_i != v_champ_b_idx THEN
          IF (v_units_b->v_i->>'hp')::int < v_tmp_hp THEN
            v_tmp_hp  := (v_units_b->v_i->>'hp')::int;
            v_def_idx := v_i;
          END IF;
        END IF;
      END LOOP;
    END IF;
    -- If only champion alive on B, target champion
    IF v_def_idx = -1 THEN v_def_idx := v_champ_b_idx; END IF;
    v_defender := v_units_b->v_def_idx;

    -- Calculate damage
    v_tmp_atk := (v_attacker->>'atk')::int;
    v_tmp_def := (v_defender->>'def')::int;
    -- Crit: 20% chance, seeded from round + attacker power
    v_is_crit := ((v_round * 7 + (v_attacker->>'power')::int * 3) % 10) >= 8;
    IF v_is_crit THEN v_tmp_atk := ROUND(v_tmp_atk * 1.5); END IF;
    -- Veil/Shield absorbs first hit then is removed
    IF (v_defender->>'shielded')::bool THEN
      v_damage := 0;
      v_units_b := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'shielded'], 'false'::jsonb);
    ELSE
      v_damage := GREATEST(1, v_tmp_atk - v_tmp_def);
    END IF;
    -- Lifesteal (Drain keyword): heal 30% of damage
    v_heal_amount := 0;
    IF (v_attacker->>'lifesteal')::bool AND v_damage > 0 THEN
      v_heal_amount := GREATEST(1, ROUND(v_damage * 0.3));
      v_new_hp      := LEAST((v_attacker->>'max_hp')::int,
                             (v_attacker->>'hp')::int + v_heal_amount);
      v_units_a := jsonb_set(v_units_a, ARRAY[v_attk_idx::text, 'hp'], to_jsonb(v_new_hp));
    END IF;
    -- Apply damage to defender
    v_new_hp   := GREATEST(0, (v_defender->>'hp')::int - v_damage);
    v_is_kill  := (v_new_hp = 0);
    v_units_b  := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'hp'], to_jsonb(v_new_hp));
    IF v_is_kill THEN
      v_units_b := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'alive'], 'false'::jsonb);
      IF v_def_idx = v_champ_b_idx THEN
        v_champ_b_alive := false;
        v_champ_b_hp    := 0;
      END IF;
    ELSE
      IF v_def_idx = v_champ_b_idx THEN
        v_champ_b_hp := v_new_hp;
      END IF;
    END IF;

    -- Build turn data (BattleTurnData shape)
    v_turn_num := v_turn_num + 1;
    v_events   := '[]'::jsonb;
    IF v_heal_amount > 0 THEN
      v_events := jsonb_build_array(jsonb_build_object('type', 'lifesteal', 'side', 'a', 'heal', v_heal_amount));
    END IF;
    -- Count alive after damage
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;

    v_turns := v_turns || jsonb_build_array(jsonb_build_object(
      'turn',          v_turn_num,
      'atk_side',      'a',
      'attacker',      jsonb_build_object(
        'name',      v_attacker->>'name',
        'faction',   v_attacker->>'faction',
        'rarity',    v_attacker->>'rarity',
        'image_url', v_attacker->>'image_url',
        'hp',        (v_units_a->v_attk_idx->>'hp')::int,
        'max_hp',    (v_attacker->>'max_hp')::int,
        'atk',       (v_attacker->>'atk')::int,
        'def',       (v_attacker->>'def')::int,
        'spd',       (v_attacker->>'spd')::int,
        'keywords',  v_attacker->'keywords'
      ),
      'defender',      jsonb_build_object(
        'name',      v_defender->>'name',
        'faction',   v_defender->>'faction',
        'rarity',    v_defender->>'rarity',
        'image_url', v_defender->>'image_url',
        'hp',        v_new_hp,
        'max_hp',    (v_defender->>'max_hp')::int
      ),
      'damage',        v_damage,
      'is_crit',       v_is_crit,
      'is_kill',       v_is_kill,
      'lifesteal_heal',v_heal_amount,
      'events',        v_events,
      'alive_a',       v_alive_a,
      'alive_b',       v_alive_b
    ));

    EXIT WHEN NOT v_champ_b_alive;

    --------------------------------------------------------------------------
    -- Side B attacks (same logic, mirrored)
    --------------------------------------------------------------------------
    EXIT WHEN v_alive_b = 0;

    v_best_spd := -1;
    v_best_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool THEN
        v_tmp_spd := (v_units_b->v_i->>'spd')::int;
        IF v_tmp_spd > v_best_spd THEN
          v_best_spd := v_tmp_spd;
          v_best_idx := v_i;
        END IF;
      END IF;
    END LOOP;
    v_attk_idx := v_best_idx;
    v_attacker  := v_units_b->v_attk_idx;

    -- Target on side A: guard first, then lowest HP non-champion, then champion
    v_def_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool AND (v_units_a->v_i->>'guard')::bool THEN
        v_def_idx := v_i;
        EXIT;
      END IF;
    END LOOP;
    IF v_def_idx = -1 THEN
      v_tmp_hp := 99999;
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        IF (v_units_a->v_i->>'alive')::bool AND v_i != v_champ_a_idx THEN
          IF (v_units_a->v_i->>'hp')::int < v_tmp_hp THEN
            v_tmp_hp  := (v_units_a->v_i->>'hp')::int;
            v_def_idx := v_i;
          END IF;
        END IF;
      END LOOP;
    END IF;
    IF v_def_idx = -1 THEN v_def_idx := v_champ_a_idx; END IF;
    v_defender := v_units_a->v_def_idx;

    v_tmp_atk := (v_attacker->>'atk')::int;
    v_tmp_def := (v_defender->>'def')::int;
    v_is_crit := ((v_round * 11 + (v_attacker->>'power')::int * 5) % 10) >= 8;
    IF v_is_crit THEN v_tmp_atk := ROUND(v_tmp_atk * 1.5); END IF;
    IF (v_defender->>'shielded')::bool THEN
      v_damage := 0;
      v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'shielded'], 'false'::jsonb);
    ELSE
      v_damage := GREATEST(1, v_tmp_atk - v_tmp_def);
    END IF;
    v_heal_amount := 0;
    IF (v_attacker->>'lifesteal')::bool AND v_damage > 0 THEN
      v_heal_amount := GREATEST(1, ROUND(v_damage * 0.3));
      v_new_hp      := LEAST((v_attacker->>'max_hp')::int,
                             (v_attacker->>'hp')::int + v_heal_amount);
      v_units_b := jsonb_set(v_units_b, ARRAY[v_attk_idx::text, 'hp'], to_jsonb(v_new_hp));
    END IF;
    v_new_hp  := GREATEST(0, (v_defender->>'hp')::int - v_damage);
    v_is_kill := (v_new_hp = 0);
    v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'hp'], to_jsonb(v_new_hp));
    IF v_is_kill THEN
      v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'alive'], 'false'::jsonb);
      IF v_def_idx = v_champ_a_idx THEN
        v_champ_a_alive := false;
        v_champ_a_hp    := 0;
      END IF;
    ELSE
      IF v_def_idx = v_champ_a_idx THEN
        v_champ_a_hp := v_new_hp;
      END IF;
    END IF;

    v_turn_num := v_turn_num + 1;
    v_events   := '[]'::jsonb;
    IF v_heal_amount > 0 THEN
      v_events := jsonb_build_array(jsonb_build_object('type', 'lifesteal', 'side', 'b', 'heal', v_heal_amount));
    END IF;
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;

    v_turns := v_turns || jsonb_build_array(jsonb_build_object(
      'turn',          v_turn_num,
      'atk_side',      'b',
      'attacker',      jsonb_build_object(
        'name',      v_attacker->>'name',
        'faction',   v_attacker->>'faction',
        'rarity',    v_attacker->>'rarity',
        'image_url', v_attacker->>'image_url',
        'hp',        (v_units_b->v_attk_idx->>'hp')::int,
        'max_hp',    (v_attacker->>'max_hp')::int,
        'atk',       (v_attacker->>'atk')::int,
        'def',       (v_attacker->>'def')::int,
        'spd',       (v_attacker->>'spd')::int,
        'keywords',  v_attacker->'keywords'
      ),
      'defender',      jsonb_build_object(
        'name',      v_defender->>'name',
        'faction',   v_defender->>'faction',
        'rarity',    v_defender->>'rarity',
        'image_url', v_defender->>'image_url',
        'hp',        v_new_hp,
        'max_hp',    (v_defender->>'max_hp')::int
      ),
      'damage',        v_damage,
      'is_crit',       v_is_crit,
      'is_kill',       v_is_kill,
      'lifesteal_heal',v_heal_amount,
      'events',        v_events,
      'alive_a',       v_alive_a,
      'alive_b',       v_alive_b
    ));

    EXIT WHEN NOT v_champ_a_alive;
  END LOOP;

  --------------------------------------------------------------------------
  -- 11. Determine winner
  -- Primary: champion death. Secondary: remaining total HP.
  --------------------------------------------------------------------------
  v_alive_a := 0;
  v_alive_b := 0;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF (v_units_a->v_i->>'alive')::bool THEN v_alive_a := v_alive_a + 1; END IF;
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF (v_units_b->v_i->>'alive')::bool THEN v_alive_b := v_alive_b + 1; END IF;
  END LOOP;

  IF NOT v_champ_b_alive AND v_champ_a_alive THEN
    v_winner_id := p_challenger_id;
  ELSIF NOT v_champ_a_alive AND v_champ_b_alive THEN
    v_winner_id := p_opponent_id;
  ELSIF NOT v_champ_a_alive AND NOT v_champ_b_alive THEN
    -- Simultaneous death: highest remaining HP total wins
    IF v_champ_a_hp >= v_champ_b_hp THEN
      v_winner_id := p_challenger_id;
    ELSE
      v_winner_id := p_opponent_id;
    END IF;
  ELSE
    -- Max rounds reached: winner by total HP remaining
    DECLARE v_hp_sum_a int := 0; v_hp_sum_b int := 0;
    BEGIN
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        IF (v_units_a->v_i->>'alive')::bool THEN
          v_hp_sum_a := v_hp_sum_a + (v_units_a->v_i->>'hp')::int;
        END IF;
      END LOOP;
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        IF (v_units_b->v_i->>'alive')::bool THEN
          v_hp_sum_b := v_hp_sum_b + (v_units_b->v_i->>'hp')::int;
        END IF;
      END LOOP;
      IF v_hp_sum_a >= v_hp_sum_b THEN
        v_winner_id := p_challenger_id;
      ELSE
        v_winner_id := p_opponent_id;
      END IF;
    END;
  END IF;

  v_you_won := (v_winner_id = p_challenger_id);

  --------------------------------------------------------------------------
  -- 12. ELO calculation (K=32, standard Elo formula)
  --------------------------------------------------------------------------
  v_exp_a   := 1.0 / (1.0 + power(10.0, (v_mmr_b - v_mmr_a) / 400.0));
  IF v_you_won THEN
    v_elo_a := ROUND(v_k * (1.0 - v_exp_a));
    v_elo_b := -ROUND(v_k * v_exp_a);
  ELSE
    v_elo_a := -ROUND(v_k * (1.0 - v_exp_a));
    v_elo_b := ROUND(v_k * v_exp_a);
  END IF;
  -- Minimum ELO floor: never drop below 100 MMR
  v_elo_a := GREATEST(v_elo_a, -(v_mmr_a - 100)::int);
  v_elo_b := GREATEST(v_elo_b, -(v_mmr_b - 100)::int);

  --------------------------------------------------------------------------
  -- 13. Build final_units for response
  --------------------------------------------------------------------------
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    v_final_units := v_final_units || jsonb_build_array(v_units_a->v_i);
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    v_final_units := v_final_units || jsonb_build_array(v_units_b->v_i);
  END LOOP;

  --------------------------------------------------------------------------
  -- 14. Insert pvp_match (authoritative record)
  --------------------------------------------------------------------------
  INSERT INTO public.pvp_matches (
    reference_id,
    player_a,
    player_b,
    winner,
    status,
    elo_change_a,
    elo_change_b,
    power_snapshot_a,
    power_snapshot_b,
    rewards_json,
    metadata,
    resolved_at
  ) VALUES (
    p_idempotency_key,
    p_challenger_id,
    p_opponent_id,
    v_winner_id,
    'resolved',
    v_elo_a,
    v_elo_b,
    jsonb_build_object('total_power', v_power_a),
    jsonb_build_object('total_power', v_power_b),
    jsonb_build_object(
      'winner_vex', CASE WHEN v_you_won THEN v_vex_winner ELSE v_vex_loser END,
      'loser_vex',  CASE WHEN v_you_won THEN v_vex_loser  ELSE v_vex_winner END
    ),
    jsonb_build_object(
      'total_turns',  v_turn_num,
      'turns',        v_turns,
      'final_units',  v_final_units,
      'engine',       'vexforge_battle_resolve_v1',
      'pure_bonus_a', v_same_faction_a,
      'pure_bonus_b', v_same_faction_b,
      'reserve_a',    v_reserve_a_count,
      'reserve_b',    v_reserve_b_count
    ),
    now()
  )
  RETURNING id INTO v_match_id;

  --------------------------------------------------------------------------
  -- 15. Upsert pvp_rankings for both players
  --------------------------------------------------------------------------
  IF v_season_id IS NOT NULL THEN
    INSERT INTO public.pvp_rankings (season_id, player_id, mmr, wins, losses, draws, updated_at)
    VALUES (
      v_season_id, p_challenger_id,
      GREATEST(100, v_mmr_a + v_elo_a),
      CASE WHEN v_you_won THEN 1 ELSE 0 END,
      CASE WHEN v_you_won THEN 0 ELSE 1 END,
      0,
      now()
    )
    ON CONFLICT (season_id, player_id) DO UPDATE
      SET mmr     = GREATEST(100, pvp_rankings.mmr + v_elo_a),
          wins    = pvp_rankings.wins    + CASE WHEN v_you_won THEN 1 ELSE 0 END,
          losses  = pvp_rankings.losses  + CASE WHEN v_you_won THEN 0 ELSE 1 END,
          updated_at = now();

    INSERT INTO public.pvp_rankings (season_id, player_id, mmr, wins, losses, draws, updated_at)
    VALUES (
      v_season_id, p_opponent_id,
      GREATEST(100, v_mmr_b + v_elo_b),
      CASE WHEN NOT v_you_won THEN 1 ELSE 0 END,
      CASE WHEN NOT v_you_won THEN 0 ELSE 1 END,
      0,
      now()
    )
    ON CONFLICT (season_id, player_id) DO UPDATE
      SET mmr     = GREATEST(100, pvp_rankings.mmr + v_elo_b),
          wins    = pvp_rankings.wins    + CASE WHEN NOT v_you_won THEN 1 ELSE 0 END,
          losses  = pvp_rankings.losses  + CASE WHEN NOT v_you_won THEN 0 ELSE 1 END,
          updated_at = now();
  END IF;

  --------------------------------------------------------------------------
  -- 16. Wallet rewards via wallet_tx helper (same pattern as T1-F, T1-G)
  --------------------------------------------------------------------------
  v_ref_a := 'pvp_' || p_idempotency_key || '_challenger';
  v_ref_b := 'pvp_' || p_idempotency_key || '_opponent';

  PERFORM public.wallet_tx(
    p_challenger_id,
    'vex_ingame',
    CASE WHEN v_you_won THEN v_vex_winner ELSE v_vex_loser END,
    'in',
    v_ref_a,
    'pvp_matches',
    v_match_id,
    jsonb_build_object(
      'match_id',  v_match_id,
      'outcome',   CASE WHEN v_you_won THEN 'win' ELSE 'loss' END,
      'elo_delta', v_elo_a
    )
  );

  PERFORM public.wallet_tx(
    p_opponent_id,
    'vex_ingame',
    CASE WHEN NOT v_you_won THEN v_vex_winner ELSE v_vex_loser END,
    'in',
    v_ref_b,
    'pvp_matches',
    v_match_id,
    jsonb_build_object(
      'match_id',  v_match_id,
      'outcome',   CASE WHEN NOT v_you_won THEN 'win' ELSE 'loss' END,
      'elo_delta', v_elo_b
    )
  );

  --------------------------------------------------------------------------
  -- 17. XP reward via player_progress update
  --------------------------------------------------------------------------
  -- Challenger XP
  INSERT INTO public.player_progress (
    player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
  ) VALUES (
    p_challenger_id, 1, 0, public.get_xp_required(1), 100, 100, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;

  SELECT level, xp INTO v_level_a, v_xp_a
    FROM public.player_progress
   WHERE player_id = p_challenger_id FOR UPDATE;
  v_xp_a   := v_xp_a + CASE WHEN v_you_won THEN v_xp_winner ELSE v_xp_loser END;
  v_xp_req_a := public.get_xp_required(v_level_a);
  WHILE v_xp_a >= v_xp_req_a LOOP
    v_xp_a   := v_xp_a - v_xp_req_a;
    v_level_a := v_level_a + 1;
    v_xp_req_a := public.get_xp_required(v_level_a);
  END LOOP;
  UPDATE public.player_progress
     SET level = v_level_a, xp = v_xp_a, xp_to_next = v_xp_req_a, updated_at = now()
   WHERE player_id = p_challenger_id;

  -- Opponent XP
  INSERT INTO public.player_progress (
    player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
  ) VALUES (
    p_opponent_id, 1, 0, public.get_xp_required(1), 100, 100, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;

  SELECT level, xp INTO v_level_b, v_xp_b
    FROM public.player_progress
   WHERE player_id = p_opponent_id FOR UPDATE;
  v_xp_b   := v_xp_b + CASE WHEN NOT v_you_won THEN v_xp_winner ELSE v_xp_loser END;
  v_xp_req_b := public.get_xp_required(v_level_b);
  WHILE v_xp_b >= v_xp_req_b LOOP
    v_xp_b   := v_xp_b - v_xp_req_b;
    v_level_b := v_level_b + 1;
    v_xp_req_b := public.get_xp_required(v_level_b);
  END LOOP;
  UPDATE public.player_progress
     SET level = v_level_b, xp = v_xp_b, xp_to_next = v_xp_req_b, updated_at = now()
   WHERE player_id = p_opponent_id;

  --------------------------------------------------------------------------
  -- 18. Achievements check for challenger
  --------------------------------------------------------------------------
  PERFORM public.fn_check_and_grant_achievements(p_challenger_id);

  --------------------------------------------------------------------------
  -- 19. Return RealBattleResult-compatible JSON
  --------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'ok',           true,
    'match_id',     v_match_id,
    'winner_id',    v_winner_id,
    'you_won',      v_you_won,
    'elo_change',   v_elo_a,
    'total_turns',  v_turn_num,
    'turns',        v_turns,
    'final_units',  v_final_units,
    'engine',       'vexforge_battle_resolve_v1',
    'challenger_name', v_challenger_name,
    'opponent_name',   v_opponent_name,
    'mmr_before_a',    v_mmr_a,
    'mmr_after_a',     GREATEST(100, v_mmr_a + v_elo_a),
    'mmr_before_b',    v_mmr_b,
    'mmr_after_b',     GREATEST(100, v_mmr_b + v_elo_b),
    'pure_bonus_a',    v_same_faction_a,
    'pure_bonus_b',    v_same_faction_b
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok',       false,
    'error',    SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$function$;

-- ─── GRANT permissions ────────────────────────────────────────────────────────
-- Only authenticated users can call vexforge_battle_resolve.
-- The identity check inside the function enforces p_challenger_id = auth.uid().
REVOKE ALL ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) TO service_role;

-- ─── pvp_rankings UNIQUE constraint (required for ON CONFLICT) ────────────────
-- Add only if it doesn't exist yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'pvp_rankings_season_player_unique'
       AND conrelid = 'public.pvp_rankings'::regclass
  ) THEN
    ALTER TABLE public.pvp_rankings
      ADD CONSTRAINT pvp_rankings_season_player_unique
      UNIQUE (season_id, player_id);
  END IF;
END;
$$;

-- ─── Helper: synthetic deck generator ────────────────────────────────────────
-- Used when a player has no cards in player_deck.
CREATE OR REPLACE FUNCTION public._vexforge_gen_synthetic_deck(
  p_mmr  numeric,
  p_side text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $syn$
DECLARE
  v_base_power int;
  v_units      jsonb := '[]'::jsonb;
  v_i          int;
  v_power      int;
  v_hp         int;
  v_atk        int;
  v_def        int;
  v_spd        int;
  v_rarity     text;
  v_factions   text[] := ARRAY['Guerrero','Mago','Pícaro','Paladín'];
  v_faction    text;
  v_guard      bool;
  v_is_champ   bool;
  v_names      text[] := ARRAY[
    'Forjador Gris','Centinela del Umbral','Guardián del Vórtice',
    'Maestro del Filo','Vidente de Ceniza'
  ];
BEGIN
  v_base_power := GREATEST(10, LEAST(300, (p_mmr / 1000.0 * 25 + 10)::int));
  FOR v_i IN 1..5 LOOP
    v_power   := v_base_power + (v_i - 1) * 5;
    v_hp      := v_power * 4 + 10;
    v_atk     := v_power + 5;
    v_def     := 5 + v_i;
    v_spd     := 4 + v_i;
    v_rarity  := CASE
      WHEN v_power >= 200 THEN 'Mythic'
      WHEN v_power >= 100 THEN 'Legendary'
      WHEN v_power >= 60  THEN 'Epic'
      WHEN v_power >= 30  THEN 'Rare'
      WHEN v_power >= 15  THEN 'Uncommon'
      ELSE 'Common'
    END;
    v_faction := v_factions[(v_i - 1) % array_length(v_factions, 1) + 1];
    v_guard   := (v_i = 1);  -- first unit in synthetic deck is the guard/vanguard
    v_is_champ := (v_i = 2); -- second unit is the champion
    v_units := v_units || jsonb_build_array(jsonb_build_object(
      'id',          gen_random_uuid(),
      'name',        v_names[v_i],
      'faction',     v_faction,
      'rarity',      v_rarity,
      'image_url',   '',
      'hp',          v_hp,
      'max_hp',      v_hp,
      'atk',         v_atk,
      'def',         v_def,
      'spd',         v_spd,
      'power',       v_power,
      'keywords',    CASE WHEN v_guard THEN '["Guard"]'::jsonb ELSE '[]'::jsonb END,
      'alive',       true,
      'guard',       v_guard,
      'lifesteal',   false,
      'shielded',    false,
      'side',        p_side,
      'is_champion', v_is_champ
    ));
  END LOOP;
  RETURN v_units;
END;
$syn$;

REVOKE ALL ON FUNCTION public._vexforge_gen_synthetic_deck(numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._vexforge_gen_synthetic_deck(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._vexforge_gen_synthetic_deck(numeric, text) TO service_role;
