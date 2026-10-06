-- VEXFORGE V7: additive, server-authoritative, sequential combat.
-- This migration is intentionally not applied to production as part of this
-- implementation. V6 tables, RPCs, settlement, and client paths remain intact.
--
-- The first enabled profile is a no-reward mirror-training battle. It reuses
-- the V6 card stat formulas, keywords, ForgeFormation slots, targeting,
-- damage, reserve promotion, and 30-round limit. A V7 session pins both its
-- ruleset and profile so later rule changes cannot alter an in-progress game.

CREATE TABLE IF NOT EXISTS public.vexforge_turn_sessions_v7 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_b_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  controller_b text NOT NULL CHECK (controller_b IN ('ai', 'human')),
  mode text NOT NULL CHECK (mode IN ('training_mirror', 'pvp', 'mission', 'boss', 'raid')),
  ruleset_version text NOT NULL,
  profile text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_actor_side text NOT NULL DEFAULT 'a' CHECK (current_actor_side IN ('a', 'b')),
  phase text NOT NULL DEFAULT 'main' CHECK (phase IN ('main', 'response', 'finished')),
  round_index integer NOT NULL DEFAULT 1 CHECK (round_index > 0),
  event_seq bigint NOT NULL DEFAULT 0 CHECK (event_seq >= 0),
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  state_hash text NOT NULL,
  start_idempotency_key text NOT NULL,
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(outcome) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT vexforge_turn_v7_controller_check
    CHECK ((controller_b = 'ai' AND player_b_id IS NULL) OR
           (controller_b = 'human' AND player_b_id IS NOT NULL AND player_b_id <> player_a_id)),
  CONSTRAINT vexforge_turn_v7_start_idempotency_unique
    UNIQUE (player_a_id, start_idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.vexforge_turn_events_v7 (
  session_id uuid NOT NULL REFERENCES public.vexforge_turn_sessions_v7(id) ON DELETE CASCADE,
  event_seq bigint NOT NULL CHECK (event_seq > 0),
  actor_side text NOT NULL CHECK (actor_side IN ('system', 'a', 'b')),
  event_type text NOT NULL CHECK (event_type IN (
    'session_started', 'attack_declared', 'attack_resolved',
    'formation_changed', 'turn_ended', 'combat_completed'
  )),
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(event_payload) = 'object'),
  state_snapshot jsonb NOT NULL CHECK (jsonb_typeof(state_snapshot) = 'object'),
  state_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, event_seq)
);

CREATE TABLE IF NOT EXISTS public.vexforge_turn_idempotency_v7 (
  session_id uuid NOT NULL REFERENCES public.vexforge_turn_sessions_v7(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL,
  response_json jsonb NOT NULL CHECK (jsonb_typeof(response_json) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, player_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS vexforge_turn_v7_player_a_recent
  ON public.vexforge_turn_sessions_v7 (player_a_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS vexforge_turn_v7_player_b_recent
  ON public.vexforge_turn_sessions_v7 (player_b_id, updated_at DESC)
  WHERE player_b_id IS NOT NULL;

ALTER TABLE public.vexforge_turn_sessions_v7 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_turn_events_v7 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_turn_idempotency_v7 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.vexforge_turn_sessions_v7 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vexforge_turn_events_v7 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vexforge_turn_idempotency_v7 FROM PUBLIC, anon, authenticated;

-- Build an initial side using the same active-deck ordering and stat inputs as
-- vexforge_battle_resolve. No client-provided card IDs or stats are accepted.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_build_side(
  p_player_id uuid,
  p_side text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := '[]'::jsonb;
  v_card record;
  v_keywords text[];
  v_power integer;
  v_affinity integer;
  v_prestige integer;
  v_charge integer;
  v_hp integer;
  v_atk integer;
  v_def integer;
  v_spd integer;
  v_champion_index integer := -1;
  v_vanguard_index integer := -1;
  v_sentinel_index integer := -1;
  v_i integer;
  v_unit jsonb;
BEGIN
  IF p_side NOT IN ('a', 'b') THEN
    RAISE EXCEPTION 'invalid V7 side';
  END IF;

  FOR v_card IN
    SELECT c.id AS card_id, c.name, c.faction::text AS faction, c.rarity::text AS rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10) AS power,
           COALESCE(c.affinity, 2) AS affinity,
           COALESCE(c.prestige, 1) AS prestige,
           COALESCE(c.charge, 1) AS charge,
           COALESCE(c.synergy_json, '{}'::jsonb) AS synergy_json,
           pd.slot_number, pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_player_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC, pd.slot_number ASC
     LIMIT 8
  LOOP
    v_keywords := ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_card.synergy_json->'keywords', '[]'::jsonb))
    );
    v_power := v_card.power;
    v_affinity := v_card.affinity;
    v_prestige := v_card.prestige;
    v_charge := v_card.charge;
    v_hp := v_power * 4 + v_affinity;
    v_atk := v_power + v_affinity / 4;
    v_def := v_prestige * 2 + v_affinity / 8;
    v_spd := v_charge * 4 + v_affinity / 10;

    IF 'Guard' = ANY(v_keywords) THEN v_def := v_def + 5; END IF;
    IF 'Surge' = ANY(v_keywords) THEN v_spd := v_spd + 20; END IF;

    v_units := v_units || jsonb_build_array(jsonb_build_object(
      'unit_id', p_side || ':' || v_card.slot_number::text || ':' || v_card.card_id::text,
      'card_id', v_card.card_id,
      'slot_number', v_card.slot_number,
      'side', p_side,
      'name', v_card.name,
      'faction', v_card.faction,
      'rarity', v_card.rarity,
      'image_url', v_card.image_url,
      'slot', 'reserve',
      'is_champion', COALESCE(v_card.is_champion, false),
      'in_reserve', true,
      'alive', true,
      'hp', v_hp,
      'max_hp', v_hp,
      'atk', v_atk,
      'def', v_def,
      'spd', v_spd,
      'power', v_power,
      'guard', 'Guard' = ANY(v_keywords),
      'lifesteal', 'Drain' = ANY(v_keywords),
      'shielded', 'Veil' = ANY(v_keywords),
      'keywords', to_jsonb(v_keywords),
      'base_stats', jsonb_build_object('hp', v_hp, 'atk', v_power + v_affinity / 4,
                                       'def', v_prestige * 2 + v_affinity / 8,
                                       'spd', v_charge * 4 + v_affinity / 10,
                                       'power', v_power),
      'stat_breakdown', '{}'::jsonb
    ));
  END LOOP;

  IF jsonb_array_length(v_units) = 0 THEN
    RETURN v_units;
  END IF;

  FOR v_i IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    IF COALESCE((v_units->v_i->>'is_champion')::boolean, false) THEN
      v_champion_index := v_i;
      EXIT;
    END IF;
  END LOOP;
  IF v_champion_index < 0 THEN v_champion_index := 0; END IF;

  FOR v_i IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    v_unit := v_units->v_i;
    IF v_i = v_champion_index THEN
      v_unit := jsonb_set(v_unit, '{slot}', '"champion"'::jsonb, true);
      v_unit := jsonb_set(v_unit, '{is_champion}', 'true'::jsonb, true);
    ELSIF v_vanguard_index < 0 THEN
      v_vanguard_index := v_i;
      v_unit := jsonb_set(v_unit, '{slot}', '"vanguard"'::jsonb, true);
    ELSIF v_sentinel_index < 0 THEN
      v_sentinel_index := v_i;
      v_unit := jsonb_set(v_unit, '{slot}', '"sentinel"'::jsonb, true);
    ELSE
      v_unit := jsonb_set(v_unit, '{slot}', '"reserve"'::jsonb, true);
    END IF;
    v_units := jsonb_set(v_units, ARRAY[v_i::text], v_unit, true);
  END LOOP;

  RETURN public._vexforge_turn_v7_recompute_side(v_units);
END;
$$;

-- Recalculate V6 formation effects after every slot change. Current HP keeps
-- its damage deficit when max HP changes; no formation action grants a heal.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_recompute_side(p_units jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := p_units;
  v_count integer := jsonb_array_length(p_units);
  v_champion jsonb;
  v_champion_faction text;
  v_champion_index integer := -1;
  v_reserve_count integer := 0;
  v_active_count integer := 0;
  v_same_faction boolean := true;
  v_unit jsonb;
  v_base jsonb;
  v_keywords jsonb;
  v_slot text;
  v_base_hp integer;
  v_base_atk integer;
  v_base_def integer;
  v_base_spd integer;
  v_hp_bonus integer;
  v_atk_bonus integer;
  v_def_bonus integer;
  v_def_effect integer;
  v_spd_effect integer;
  v_hp_before_faction integer;
  v_atk_before_faction integer;
  v_def_before_faction integer;
  v_spd_after_effect integer;
  v_new_max_hp integer;
  v_new_hp integer;
  v_old_hp integer;
  v_old_max integer;
  v_missing_hp integer;
  v_i integer;
  v_active boolean;
  v_guard_keyword boolean;
BEGIN
  IF v_count = 0 THEN RETURN '[]'::jsonb; END IF;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    IF COALESCE((v_unit->>'is_champion')::boolean, false) THEN
      v_champion_index := v_i;
      v_champion := v_unit;
      EXIT;
    END IF;
  END LOOP;
  IF v_champion_index < 0 THEN
    RAISE EXCEPTION 'V7 formation has no resolved Champion';
  END IF;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    v_slot := COALESCE(v_unit->>'slot', 'reserve');
    IF v_slot = 'reserve' AND COALESCE((v_unit->>'alive')::boolean, false) THEN
      v_reserve_count := v_reserve_count + 1;
    END IF;
    IF v_slot NOT IN ('reserve', 'fallen')
       AND COALESCE((v_unit->>'alive')::boolean, false) THEN
      v_active_count := v_active_count + 1;
      IF COALESCE(v_unit->>'faction', '') IS DISTINCT FROM
         COALESCE(v_champion->>'faction', '') THEN
        v_same_faction := false;
      END IF;
    END IF;
  END LOOP;
  v_same_faction := v_same_faction AND v_active_count >= 2;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    v_base := v_unit->'base_stats';
    v_keywords := COALESCE(v_unit->'keywords', '[]'::jsonb);
    v_slot := COALESCE(v_unit->>'slot', 'reserve');
    v_base_hp := (v_base->>'hp')::integer;
    v_base_atk := (v_base->>'atk')::integer;
    v_base_def := (v_base->>'def')::integer;
    v_base_spd := (v_base->>'spd')::integer;
    v_guard_keyword := v_keywords ? 'Guard';
    v_def_effect := CASE WHEN v_guard_keyword THEN 5 ELSE 0 END;
    v_spd_effect := CASE WHEN v_keywords ? 'Surge' THEN 20 ELSE 0 END;
    v_hp_bonus := 0;
    v_atk_bonus := 0;
    v_def_bonus := 0;
    IF COALESCE((v_unit->>'is_champion')::boolean, false) THEN
      v_hp_bonus := v_reserve_count * 5;
      v_atk_bonus := floor(v_reserve_count * 1.2)::integer;
      v_def_bonus := floor(v_reserve_count * 0.8)::integer;
    END IF;

    v_hp_before_faction := v_base_hp + v_hp_bonus;
    v_atk_before_faction := v_base_atk + v_atk_bonus;
    v_def_before_faction := v_base_def + v_def_effect + v_def_bonus;
    v_spd_after_effect := v_base_spd + v_spd_effect;
    v_active := v_slot NOT IN ('reserve', 'fallen')
      AND COALESCE((v_unit->>'alive')::boolean, false);
    IF v_same_faction AND v_active THEN
      v_new_max_hp := round(v_hp_before_faction * 1.15)::integer;
      v_atk_before_faction := round(v_atk_before_faction * 1.15)::integer;
      v_def_before_faction := round(v_def_before_faction * 1.15)::integer;
    ELSE
      v_new_max_hp := v_hp_before_faction;
    END IF;

    v_old_hp := COALESCE((v_unit->>'hp')::integer, v_new_max_hp);
    v_old_max := COALESCE((v_unit->>'max_hp')::integer, v_new_max_hp);
    v_missing_hp := greatest(0, v_old_max - v_old_hp);
    v_new_hp := greatest(0, least(v_new_max_hp, v_new_max_hp - v_missing_hp));

    v_unit := jsonb_set(v_unit, '{hp}', to_jsonb(v_new_hp), true);
    v_unit := jsonb_set(v_unit, '{max_hp}', to_jsonb(v_new_max_hp), true);
    v_unit := jsonb_set(v_unit, '{atk}', to_jsonb(v_atk_before_faction), true);
    v_unit := jsonb_set(v_unit, '{def}', to_jsonb(v_def_before_faction), true);
    v_unit := jsonb_set(v_unit, '{spd}', to_jsonb(v_spd_after_effect), true);
    v_unit := jsonb_set(v_unit, '{in_reserve}', to_jsonb(v_slot = 'reserve'), true);
    v_unit := jsonb_set(v_unit, '{guard}', to_jsonb(v_guard_keyword OR v_slot = 'vanguard'), true);
    v_unit := jsonb_set(v_unit, '{stat_breakdown}', jsonb_build_object(
      'base_stats', v_base,
      'formation', jsonb_build_object(
        'reserve_count', CASE WHEN COALESCE((v_unit->>'is_champion')::boolean, false)
                              THEN v_reserve_count ELSE 0 END,
        'reserve_hp', v_hp_bonus,
        'reserve_atk', v_atk_bonus,
        'reserve_def', v_def_bonus,
        'same_faction_percent', CASE WHEN v_same_faction AND v_active THEN 15 ELSE 0 END
      ),
      'effects', jsonb_build_object(
        'guard_def', v_def_effect,
        'surge_speed', v_spd_effect,
        'guard_active', v_guard_keyword OR v_slot = 'vanguard',
        'drain', v_keywords ? 'Drain',
        'veil', v_keywords ? 'Veil'
      ),
      'effective', jsonb_build_object(
        'hp', v_new_hp, 'max_hp', v_new_max_hp,
        'atk', v_atk_before_faction, 'def', v_def_before_faction,
        'spd', v_spd_after_effect
      )
    ), true);
    v_units := jsonb_set(v_units, ARRAY[v_i::text], v_unit, true);
  END LOOP;
  RETURN v_units;
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_mirror_units(p_units jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_set(
      jsonb_set(unit, '{unit_id}', to_jsonb(regexp_replace(unit->>'unit_id', '^a:', 'b:')), true),
      '{side}', '"b"'::jsonb, true
    ) ORDER BY ord
  ), '[]'::jsonb)
  FROM jsonb_array_elements(p_units) WITH ORDINALITY AS items(unit, ord);
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_target(p_state jsonb, p_attacking_side text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_defending_side text := CASE WHEN p_attacking_side = 'a' THEN 'b' ELSE 'a' END;
  v_target text;
BEGIN
  SELECT unit->>'unit_id' INTO v_target
    FROM jsonb_array_elements(p_state->'teams'->v_defending_side)
         WITH ORDINALITY AS items(unit, ord)
   WHERE COALESCE((unit->>'alive')::boolean, false)
     AND COALESCE((unit->>'slot') NOT IN ('reserve', 'fallen'), false)
     AND COALESCE((unit->>'guard')::boolean, false)
   ORDER BY ord
   LIMIT 1;
  IF v_target IS NOT NULL THEN RETURN v_target; END IF;

  SELECT unit->>'unit_id' INTO v_target
    FROM jsonb_array_elements(p_state->'teams'->v_defending_side)
         WITH ORDINALITY AS items(unit, ord)
   WHERE COALESCE((unit->>'alive')::boolean, false)
     AND COALESCE((unit->>'slot') NOT IN ('reserve', 'fallen'), false)
     AND NOT COALESCE((unit->>'is_champion')::boolean, false)
   ORDER BY (unit->>'hp')::integer, ord
   LIMIT 1;
  IF v_target IS NOT NULL THEN RETURN v_target; END IF;

  SELECT unit->>'unit_id' INTO v_target
    FROM jsonb_array_elements(p_state->'teams'->v_defending_side) AS items(unit)
   WHERE COALESCE((unit->>'alive')::boolean, false)
     AND COALESCE((unit->>'is_champion')::boolean, false)
   LIMIT 1;
  RETURN v_target;
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_legal_actions(
  p_session_id uuid,
  p_state jsonb,
  p_side text
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actions jsonb := '[]'::jsonb;
  v_target text;
  v_unit jsonb;
  v_other jsonb;
  v_unit_id text;
  v_target_id text;
  v_i integer;
  v_seq bigint := COALESCE((p_state->>'event_seq')::bigint, 0);
BEGIN
  IF p_side NOT IN ('a', 'b') OR p_state->>'status' <> 'active' THEN
    RETURN v_actions;
  END IF;

  IF p_state->>'phase' = 'response' THEN
    IF p_state#>>'{pending_attack,attacker_side}' = p_side THEN
      RETURN v_actions;
    END IF;
    RETURN jsonb_build_array(jsonb_build_object(
      'action_id', md5(p_session_id::text || '|' || v_seq::text || '|' || p_side || '|pass_priority'),
      'kind', 'pass_priority'
    ));
  END IF;

  v_target := public._vexforge_turn_v7_target(p_state, p_side);
  FOR v_unit IN
    SELECT unit
      FROM jsonb_array_elements(p_state->'teams'->p_side) WITH ORDINALITY AS items(unit, ord)
     WHERE COALESCE((unit->>'alive')::boolean, false)
       AND COALESCE((unit->>'slot') NOT IN ('reserve', 'fallen'), false)
     ORDER BY (unit->>'spd')::integer DESC, ord
  LOOP
    v_unit_id := v_unit->>'unit_id';
    IF v_target IS NOT NULL THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'action_id', md5(p_session_id::text || '|' || v_seq::text || '|' || p_side ||
                         '|attack|' || v_unit_id || '|' || v_target),
        'kind', 'attack',
        'unit_id', v_unit_id,
        'target_id', v_target
      ));
    END IF;
  END LOOP;

  SELECT unit->>'unit_id' INTO v_unit_id
    FROM jsonb_array_elements(p_state->'teams'->p_side) AS items(unit)
   WHERE unit->>'slot' = 'vanguard'
     AND COALESCE((unit->>'alive')::boolean, false)
   LIMIT 1;
  SELECT unit->>'unit_id' INTO v_target_id
    FROM jsonb_array_elements(p_state->'teams'->p_side) AS items(unit)
   WHERE unit->>'slot' = 'sentinel'
     AND COALESCE((unit->>'alive')::boolean, false)
   LIMIT 1;
  IF v_unit_id IS NOT NULL AND v_target_id IS NOT NULL THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action_id', md5(p_session_id::text || '|' || v_seq::text || '|' || p_side ||
                       '|move|' || v_unit_id || '|' || v_target_id),
      'kind', 'move',
      'source_unit_id', v_unit_id,
      'target_unit_id', v_target_id
    ));
  END IF;

  FOR v_unit IN
    SELECT unit FROM jsonb_array_elements(p_state->'teams'->p_side) AS items(unit)
     WHERE unit->>'slot' IN ('vanguard', 'sentinel')
       AND COALESCE((unit->>'alive')::boolean, false)
  LOOP
    v_target_id := v_unit->>'unit_id';
    FOR v_other IN
      SELECT unit FROM jsonb_array_elements(p_state->'teams'->p_side) AS items(unit)
       WHERE unit->>'slot' = 'reserve'
         AND COALESCE((unit->>'alive')::boolean, false)
    LOOP
      v_unit_id := v_other->>'unit_id';
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'action_id', md5(p_session_id::text || '|' || v_seq::text || '|' || p_side ||
                         '|replace|' || v_unit_id || '|' || v_target_id),
        'kind', 'replace',
        'source_unit_id', v_unit_id,
        'target_unit_id', v_target_id
      ));
    END LOOP;
  END LOOP;

  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'action_id', md5(p_session_id::text || '|' || v_seq::text || '|' || p_side || '|end_turn'),
    'kind', 'end_turn'
  ));
  RETURN v_actions;
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_apply_action(
  p_session_id uuid,
  p_state jsonb,
  p_side text,
  p_action jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_legal jsonb;
  v_state jsonb := p_state;
  v_events jsonb := '[]'::jsonb;
  v_kind text := p_action->>'kind';
  v_actor_side text;
  v_defender_side text;
  v_pending jsonb;
  v_attacker_id text;
  v_target_id text;
  v_units jsonb;
  v_unit jsonb;
  v_other jsonb;
  v_attacker jsonb;
  v_defender jsonb;
  v_index integer;
  v_attacker_index integer := -1;
  v_defender_index integer := -1;
  v_replacement_index integer := -1;
  v_replacement_score integer := -1;
  v_score integer;
  v_slot text;
  v_replacement_id text;
  v_damage integer;
  v_attack integer;
  v_defense integer;
  v_heal integer := 0;
  v_new_hp integer;
  v_critical boolean := false;
  v_killed boolean := false;
  v_round integer;
  v_winner text;
  v_hp_a integer := 0;
  v_hp_b integer := 0;
  v_max_rounds integer := 30;
BEGIN
  v_legal := public._vexforge_turn_v7_legal_actions(
    p_session_id, p_state, p_side
  );
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_legal) AS item(action)
     WHERE item.action = p_action
  ) THEN
    RAISE EXCEPTION 'V7 action is not in the server legal-action list';
  END IF;

  IF v_kind = 'attack' THEN
    v_state := jsonb_set(v_state, '{phase}', '"response"'::jsonb, true);
    v_state := jsonb_set(v_state, '{current_actor_side}',
      to_jsonb(CASE WHEN p_side = 'a' THEN 'b' ELSE 'a' END), true);
    v_state := jsonb_set(v_state, '{pending_attack}', jsonb_build_object(
      'attacker_side', p_side,
      'attacker_id', p_action->>'unit_id',
      'target_id', p_action->>'target_id',
      'round', (p_state->>'round')::integer
    ), true);
    v_events := jsonb_build_array(jsonb_build_object(
      'actor_side', p_side,
      'event_type', 'attack_declared',
      'event_payload', jsonb_build_object(
        'attacker_id', p_action->>'unit_id',
        'target_id', p_action->>'target_id',
        'round', (p_state->>'round')::integer
      )
    ));
    RETURN jsonb_build_object('state', v_state, 'events', v_events);
  END IF;

  IF v_kind = 'pass_priority' THEN
    v_pending := v_state->'pending_attack';
    v_actor_side := v_pending->>'attacker_side';
    v_defender_side := CASE WHEN v_actor_side = 'a' THEN 'b' ELSE 'a' END;
    v_attacker_id := v_pending->>'attacker_id';
    v_target_id := v_pending->>'target_id';
    v_units := v_state->'teams'->v_actor_side;
    FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
      IF v_units->v_index->>'unit_id' = v_attacker_id THEN
        v_attacker_index := v_index;
        v_attacker := v_units->v_index;
        EXIT;
      END IF;
    END LOOP;
    v_units := v_state->'teams'->v_defender_side;
    FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
      IF v_units->v_index->>'unit_id' = v_target_id THEN
        v_defender_index := v_index;
        v_defender := v_units->v_index;
        EXIT;
      END IF;
    END LOOP;
    IF v_attacker_index < 0 OR v_defender_index < 0
       OR NOT COALESCE((v_attacker->>'alive')::boolean, false)
       OR NOT COALESCE((v_defender->>'alive')::boolean, false) THEN
      RAISE EXCEPTION 'V7 pending attack no longer matches the board';
    END IF;

    v_attack := (v_attacker->>'atk')::integer;
    v_defense := (v_defender->>'def')::integer;
    v_round := (v_pending->>'round')::integer;
    IF v_actor_side = 'a' THEN
      v_critical := ((v_round * 7 + (v_attacker->>'power')::integer * 3) % 10) >= 8;
    ELSE
      v_critical := ((v_round * 11 + (v_attacker->>'power')::integer * 5) % 10) >= 8;
    END IF;
    IF v_critical THEN v_attack := round(v_attack * 1.5)::integer; END IF;
    IF COALESCE((v_defender->>'shielded')::boolean, false) THEN
      v_damage := 0;
      v_defender := jsonb_set(v_defender, '{shielded}', 'false'::jsonb, true);
    ELSE
      v_damage := greatest(1, v_attack - v_defense);
    END IF;
    IF COALESCE((v_attacker->>'lifesteal')::boolean, false) AND v_damage > 0 THEN
      v_heal := greatest(1, round(v_damage * 0.3)::integer);
      v_new_hp := least((v_attacker->>'max_hp')::integer,
        (v_attacker->>'hp')::integer + v_heal);
      v_attacker := jsonb_set(v_attacker, '{hp}', to_jsonb(v_new_hp), true);
    END IF;

    v_new_hp := greatest(0, (v_defender->>'hp')::integer - v_damage);
    v_killed := v_new_hp = 0;
    v_defender := jsonb_set(v_defender, '{hp}', to_jsonb(v_new_hp), true);
    IF v_killed THEN v_defender := jsonb_set(v_defender, '{alive}', 'false'::jsonb, true); END IF;
    v_units := jsonb_set(v_state->'teams'->v_actor_side,
      ARRAY[v_attacker_index::text], v_attacker, true);
    v_state := jsonb_set(v_state, ARRAY['teams', v_actor_side], v_units, true);
    v_units := jsonb_set(v_state->'teams'->v_defender_side,
      ARRAY[v_defender_index::text], v_defender, true);

    v_replacement_id := NULL;
    IF v_killed AND NOT COALESCE((v_defender->>'is_champion')::boolean, false)
       AND v_defender->>'slot' IN ('vanguard', 'sentinel') THEN
      v_slot := v_defender->>'slot';
      FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
        v_other := v_units->v_index;
        IF v_other->>'slot' = 'reserve'
           AND COALESCE((v_other->>'alive')::boolean, false) THEN
          IF v_slot = 'vanguard' THEN
            v_score := (v_other->>'def')::integer * 100
              + CASE WHEN COALESCE((v_other->>'guard')::boolean, false) THEN 10 ELSE 0 END;
          ELSE
            v_score := (v_other->>'atk')::integer * 100 + (v_other->>'spd')::integer;
          END IF;
          IF v_score > v_replacement_score THEN
            v_replacement_score := v_score;
            v_replacement_index := v_index;
          END IF;
        END IF;
      END LOOP;
      IF v_replacement_index >= 0 THEN
        v_other := v_units->v_replacement_index;
        v_replacement_id := v_other->>'unit_id';
        v_other := jsonb_set(v_other, '{slot}', to_jsonb(v_slot), true);
        v_other := jsonb_set(v_other, '{in_reserve}', 'false'::jsonb, true);
        v_defender := jsonb_set(v_defender, '{slot}', '"fallen"'::jsonb, true);
        v_defender := jsonb_set(v_defender, '{in_reserve}', 'false'::jsonb, true);
        v_units := jsonb_set(v_units, ARRAY[v_replacement_index::text], v_other, true);
        v_units := jsonb_set(v_units, ARRAY[v_defender_index::text], v_defender, true);
      END IF;
    END IF;
    v_units := public._vexforge_turn_v7_recompute_side(v_units);
    v_state := jsonb_set(v_state, ARRAY['teams', v_defender_side], v_units, true);
    v_state := jsonb_set(v_state, '{pending_attack}', 'null'::jsonb, true);
    v_state := jsonb_set(v_state, '{phase}', '"main"'::jsonb, true);
    v_state := jsonb_set(v_state, '{current_actor_side}', to_jsonb(v_defender_side), true);
    v_state := jsonb_set(v_state, '{turn_index}',
      to_jsonb(COALESCE((v_state->>'turn_index')::integer, 0) + 1), true);

    IF v_killed AND COALESCE((v_defender->>'is_champion')::boolean, false) THEN
      v_state := jsonb_set(v_state, '{status}', '"completed"'::jsonb, true);
      v_state := jsonb_set(v_state, '{phase}', '"finished"'::jsonb, true);
      v_state := jsonb_set(v_state, '{winner_side}', to_jsonb(v_actor_side), true);
      v_state := jsonb_set(v_state, '{completion_reason}', '"champion_defeated"'::jsonb, true);
    ELSIF v_actor_side = 'b' THEN
      v_state := jsonb_set(v_state, '{round}',
        to_jsonb(COALESCE((v_state->>'round')::integer, 1) + 1), true);
      IF (v_state->>'round')::integer > v_max_rounds THEN
        FOR v_unit IN SELECT unit FROM jsonb_array_elements(v_state#>'{teams,a}') AS rows(unit)
        LOOP
          IF COALESCE((v_unit->>'alive')::boolean, false)
             AND v_unit->>'slot' NOT IN ('reserve', 'fallen') THEN
            v_hp_a := v_hp_a + (v_unit->>'hp')::integer;
          END IF;
        END LOOP;
        FOR v_unit IN SELECT unit FROM jsonb_array_elements(v_state#>'{teams,b}') AS rows(unit)
        LOOP
          IF COALESCE((v_unit->>'alive')::boolean, false)
             AND v_unit->>'slot' NOT IN ('reserve', 'fallen') THEN
            v_hp_b := v_hp_b + (v_unit->>'hp')::integer;
          END IF;
        END LOOP;
        v_winner := CASE WHEN v_hp_a >= v_hp_b THEN 'a' ELSE 'b' END;
        v_state := jsonb_set(v_state, '{status}', '"completed"'::jsonb, true);
        v_state := jsonb_set(v_state, '{phase}', '"finished"'::jsonb, true);
        v_state := jsonb_set(v_state, '{winner_side}', to_jsonb(v_winner), true);
        v_state := jsonb_set(v_state, '{completion_reason}', '"round_limit"'::jsonb, true);
      END IF;
    END IF;

    v_events := jsonb_build_array(jsonb_build_object(
      'actor_side', v_actor_side,
      'event_type', CASE WHEN v_state->>'status' = 'completed'
                         THEN 'combat_completed' ELSE 'attack_resolved' END,
      'event_payload', jsonb_build_object(
        'attacker_id', v_attacker_id,
        'target_id', v_target_id,
        'damage', v_damage,
        'critical', v_critical,
        'shield_blocked', v_damage = 0 AND COALESCE((v_defender->>'shielded')::boolean, false) = false,
        'healing', v_heal,
        'target_defeated', v_killed,
        'reserve_activated', v_replacement_id,
        'response_side', p_side,
        'response', 'pass_priority',
        'round', v_round,
        'winner_side', v_state->>'winner_side',
        'completion_reason', v_state->>'completion_reason'
      )
    ));
    RETURN jsonb_build_object('state', v_state, 'events', v_events);
  END IF;

  IF v_kind = 'move' THEN
    v_units := v_state->'teams'->p_side;
    FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
      IF v_units->v_index->>'unit_id' = p_action->>'source_unit_id' THEN
        v_attacker_index := v_index;
        v_attacker := v_units->v_index;
      ELSIF v_units->v_index->>'unit_id' = p_action->>'target_unit_id' THEN
        v_defender_index := v_index;
        v_defender := v_units->v_index;
      END IF;
    END LOOP;
    v_attacker := jsonb_set(v_attacker, '{slot}', to_jsonb(v_defender->>'slot'), true);
    v_defender := jsonb_set(v_defender, '{slot}', to_jsonb(v_units->v_attacker_index->>'slot'), true);
    v_units := jsonb_set(v_units, ARRAY[v_attacker_index::text], v_attacker, true);
    v_units := jsonb_set(v_units, ARRAY[v_defender_index::text], v_defender, true);
    v_units := public._vexforge_turn_v7_recompute_side(v_units);
    v_state := jsonb_set(v_state, ARRAY['teams', p_side], v_units, true);
    v_events := jsonb_build_array(jsonb_build_object(
      'actor_side', p_side, 'event_type', 'formation_changed',
      'event_payload', jsonb_build_object('kind', 'move',
        'unit_id', p_action->>'source_unit_id',
        'other_unit_id', p_action->>'target_unit_id')
    ));
  ELSIF v_kind = 'replace' THEN
    v_units := v_state->'teams'->p_side;
    FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
      IF v_units->v_index->>'unit_id' = p_action->>'source_unit_id' THEN
        v_attacker_index := v_index;
        v_attacker := v_units->v_index;
      ELSIF v_units->v_index->>'unit_id' = p_action->>'target_unit_id' THEN
        v_defender_index := v_index;
        v_defender := v_units->v_index;
      END IF;
    END LOOP;
    v_slot := v_defender->>'slot';
    v_attacker := jsonb_set(v_attacker, '{slot}', to_jsonb(v_slot), true);
    v_defender := jsonb_set(v_defender, '{slot}', '"reserve"'::jsonb, true);
    v_units := jsonb_set(v_units, ARRAY[v_attacker_index::text], v_attacker, true);
    v_units := jsonb_set(v_units, ARRAY[v_defender_index::text], v_defender, true);
    v_units := public._vexforge_turn_v7_recompute_side(v_units);
    v_state := jsonb_set(v_state, ARRAY['teams', p_side], v_units, true);
    v_events := jsonb_build_array(jsonb_build_object(
      'actor_side', p_side, 'event_type', 'formation_changed',
      'event_payload', jsonb_build_object('kind', 'replace',
        'deployed_unit_id', p_action->>'source_unit_id',
        'replaced_unit_id', p_action->>'target_unit_id',
        'slot', v_slot)
    ));
  ELSIF v_kind = 'end_turn' THEN
    v_events := jsonb_build_array(jsonb_build_object(
      'actor_side', p_side, 'event_type', 'turn_ended',
      'event_payload', jsonb_build_object('round', (v_state->>'round')::integer)
    ));
  ELSE
    RAISE EXCEPTION 'unsupported V7 action kind';
  END IF;

  v_state := jsonb_set(v_state, '{current_actor_side}',
    to_jsonb(CASE WHEN p_side = 'a' THEN 'b' ELSE 'a' END), true);
  v_state := jsonb_set(v_state, '{turn_index}',
    to_jsonb(COALESCE((v_state->>'turn_index')::integer, 0) + 1), true);
  IF p_side = 'b' THEN
    v_state := jsonb_set(v_state, '{round}',
      to_jsonb(COALESCE((v_state->>'round')::integer, 1) + 1), true);
    IF (v_state->>'round')::integer > v_max_rounds THEN
      FOR v_unit IN SELECT unit FROM jsonb_array_elements(v_state#>'{teams,a}') AS rows(unit)
      LOOP
        IF COALESCE((v_unit->>'alive')::boolean, false)
           AND v_unit->>'slot' NOT IN ('reserve', 'fallen') THEN
          v_hp_a := v_hp_a + (v_unit->>'hp')::integer;
        END IF;
      END LOOP;
      FOR v_unit IN SELECT unit FROM jsonb_array_elements(v_state#>'{teams,b}') AS rows(unit)
      LOOP
        IF COALESCE((v_unit->>'alive')::boolean, false)
           AND v_unit->>'slot' NOT IN ('reserve', 'fallen') THEN
          v_hp_b := v_hp_b + (v_unit->>'hp')::integer;
        END IF;
      END LOOP;
      v_winner := CASE WHEN v_hp_a >= v_hp_b THEN 'a' ELSE 'b' END;
      v_state := jsonb_set(v_state, '{status}', '"completed"'::jsonb, true);
      v_state := jsonb_set(v_state, '{phase}', '"finished"'::jsonb, true);
      v_state := jsonb_set(v_state, '{winner_side}', to_jsonb(v_winner), true);
      v_state := jsonb_set(v_state, '{completion_reason}', '"round_limit"'::jsonb, true);
      v_events := jsonb_build_array(jsonb_build_object(
        'actor_side', p_side, 'event_type', 'combat_completed',
        'event_payload', jsonb_build_object('winner_side', v_winner,
          'completion_reason', 'round_limit', 'active_hp_a', v_hp_a, 'active_hp_b', v_hp_b)
      ));
    END IF;
  END IF;
  RETURN jsonb_build_object('state', v_state, 'events', v_events);
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_project_side(
  p_units jsonb,
  p_is_owner boolean,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_out jsonb := '[]'::jsonb;
  v_unit jsonb;
  v_i integer := 0;
BEGIN
  FOR v_unit IN SELECT unit FROM jsonb_array_elements(p_units) AS rows(unit)
  LOOP
    IF NOT p_is_owner AND p_status = 'active'
       AND v_unit->>'slot' = 'reserve' THEN
      v_out := v_out || jsonb_build_array(jsonb_build_object(
        'unit_id', 'hidden_reserve_' || v_i::text,
        'slot', 'reserve',
        'hidden', true,
        'alive', COALESCE((v_unit->>'alive')::boolean, false)
      ));
    ELSE
      v_out := v_out || jsonb_build_array(v_unit);
    END IF;
    v_i := v_i + 1;
  END LOOP;
  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_project(
  p_session_id uuid,
  p_player_id uuid,
  p_state jsonb,
  p_event_rows jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session public.vexforge_turn_sessions_v7%ROWTYPE;
  v_side text;
  v_legal jsonb := '[]'::jsonb;
  v_events jsonb := p_event_rows;
BEGIN
  SELECT * INTO v_session FROM public.vexforge_turn_sessions_v7
   WHERE id = p_session_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_found'); END IF;
  IF p_player_id = v_session.player_a_id THEN
    v_side := 'a';
  ELSIF v_session.player_b_id IS NOT NULL AND p_player_id = v_session.player_b_id THEN
    v_side := 'b';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_participant');
  END IF;
  IF v_session.current_actor_side = v_side THEN
    v_legal := public._vexforge_turn_v7_legal_actions(
      v_session.id, p_state, v_side
    );
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'event_seq', event_seq,
    'actor_side', actor_side,
    'event_type', event_type,
    'event_payload', event_payload,
    'state_hash', state_hash,
    'state', jsonb_build_object(
      'status', state_snapshot->>'status',
      'phase', state_snapshot->>'phase',
      'round', state_snapshot->>'round',
      'turn_index', state_snapshot->>'turn_index',
      'current_actor_side', state_snapshot->>'current_actor_side',
      'board', jsonb_build_object(
        'a', public._vexforge_turn_v7_project_side(
          state_snapshot#>'{teams,a}', v_side = 'a', state_snapshot->>'status'),
        'b', public._vexforge_turn_v7_project_side(
          state_snapshot#>'{teams,b}', v_side = 'b', state_snapshot->>'status')
      ),
      'winner_side', state_snapshot->>'winner_side'
    )
  ) ORDER BY event_seq), '[]'::jsonb)
    INTO v_events
    FROM public.vexforge_turn_events_v7
   WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'ok', true,
    'session_id', v_session.id,
    'mode', v_session.mode,
    'ruleset_version', v_session.ruleset_version,
    'profile', v_session.profile,
    'status', v_session.status,
    'phase', v_session.phase,
    'round', v_session.round_index,
    'turn_index', COALESCE((p_state->>'turn_index')::integer, 0),
    'event_seq', v_session.event_seq,
    'state_hash', v_session.state_hash,
    'current_actor_side', v_session.current_actor_side,
    'you_are_side', v_side,
    'is_my_turn', v_session.current_actor_side = v_side,
    'board', jsonb_build_object(
      'a', public._vexforge_turn_v7_project_side(
        p_state#>'{teams,a}', v_side = 'a', v_session.status),
      'b', public._vexforge_turn_v7_project_side(
        p_state#>'{teams,b}', v_side = 'b', v_session.status)
    ),
    'legal_actions', v_legal,
    'outcome', v_session.outcome,
    'events', v_events,
    'rewards_granted', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_start_training(p_idempotency_key text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_player_id uuid;
  v_id uuid;
  v_units_a jsonb;
  v_units_b jsonb;
  v_state jsonb;
  v_hash text;
BEGIN
  IF v_auth IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'authentication_required'); END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8
     OR length(p_idempotency_key) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_idempotency_key');
  END IF;
  SELECT id INTO v_player_id FROM public.players WHERE auth_user_id = v_auth LIMIT 1;
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'player_not_found'); END IF;

  SELECT id INTO v_id FROM public.vexforge_turn_sessions_v7
   WHERE player_a_id = v_player_id AND start_idempotency_key = btrim(p_idempotency_key);
  IF v_id IS NOT NULL THEN
    RETURN public._vexforge_turn_v7_project(
      v_id, v_player_id,
      (SELECT state FROM public.vexforge_turn_sessions_v7 WHERE id = v_id)
    );
  END IF;

  v_units_a := public._vexforge_turn_v7_build_side(v_player_id, 'a');
  IF jsonb_array_length(v_units_a) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active_deck_required');
  END IF;
  v_units_b := public._vexforge_turn_v7_mirror_units(v_units_a);
  v_state := jsonb_build_object(
    'schema_version', 7,
    'ruleset_version', 'vexforge_turn_v7_mirror_1',
    'base_rules_version', 'forge_formation_t2',
    'profile', 'training_mirror_v1',
    'mode', 'training_mirror',
    'status', 'active',
    'phase', 'main',
    'round', 1,
    'turn_index', 0,
    'event_seq', 0,
    'current_actor_side', 'a',
    'pending_attack', 'null'::jsonb,
    'winner_side', 'null'::jsonb,
    'completion_reason', 'null'::jsonb,
    'teams', jsonb_build_object('a', v_units_a, 'b', v_units_b)
  );

  INSERT INTO public.vexforge_turn_sessions_v7(
    player_a_id, controller_b, mode, ruleset_version, profile,
    state, state_hash, start_idempotency_key
  ) VALUES (
    v_player_id, 'ai', 'training_mirror', 'vexforge_turn_v7_mirror_1',
    'training_mirror_v1', v_state, md5(v_state::text), btrim(p_idempotency_key)
  )
  ON CONFLICT (player_a_id, start_idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.vexforge_turn_sessions_v7
     WHERE player_a_id = v_player_id AND start_idempotency_key = btrim(p_idempotency_key);
    RETURN public._vexforge_turn_v7_project(
      v_id, v_player_id,
      (SELECT state FROM public.vexforge_turn_sessions_v7 WHERE id = v_id)
    );
  END IF;

  v_state := jsonb_set(v_state, '{session_id}', to_jsonb(v_id::text), true);
  v_state := jsonb_set(v_state, '{event_seq}', '1'::jsonb, true);
  v_hash := md5(v_state::text);
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state, state_hash = v_hash, event_seq = 1,
         updated_at = now()
   WHERE id = v_id;
  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type, event_payload, state_snapshot, state_hash
  ) VALUES (
    v_id, 1, 'system', 'session_started',
    jsonb_build_object('mode', 'training_mirror',
      'ruleset_version', 'vexforge_turn_v7_mirror_1',
      'base_rules_version', 'forge_formation_t2',
      'rewards_granted', false),
    v_state, v_hash
  );
  RETURN public._vexforge_turn_v7_project(v_id, v_player_id, v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_get_state(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_player_id uuid;
  v_state jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'authentication_required'); END IF;
  SELECT id INTO v_player_id FROM public.players WHERE auth_user_id = auth.uid() LIMIT 1;
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'player_not_found'); END IF;
  SELECT state INTO v_state FROM public.vexforge_turn_sessions_v7 WHERE id = p_session_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_found'); END IF;
  RETURN public._vexforge_turn_v7_project(p_session_id, v_player_id, v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_legal_actions(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_state jsonb;
  v_result jsonb;
BEGIN
  v_result := public.vexforge_turn_v7_get_state(p_session_id);
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE THEN RETURN v_result; END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'event_seq', v_result->'event_seq',
    'state_hash', v_result->'state_hash',
    'legal_actions', v_result->'legal_actions'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_submit_action(
  p_session_id uuid,
  p_expected_event_seq bigint,
  p_idempotency_key text,
  p_action jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_player_id uuid;
  v_side text;
  v_session public.vexforge_turn_sessions_v7%ROWTYPE;
  v_state jsonb;
  v_action jsonb := p_action;
  v_legal jsonb;
  v_output jsonb;
  v_events jsonb;
  v_event jsonb;
  v_event_payload jsonb;
  v_event_type text;
  v_actor_side text;
  v_seq bigint;
  v_hash text;
  v_fingerprint text;
  v_existing public.vexforge_turn_idempotency_v7%ROWTYPE;
  v_response jsonb;
  v_auto_action jsonb;
  v_auto_side text;
  v_auto_loops integer := 0;
BEGIN
  IF v_auth IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'authentication_required'); END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8
     OR length(p_idempotency_key) > 160 OR jsonb_typeof(p_action) <> 'object' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_request');
  END IF;
  SELECT id INTO v_player_id FROM public.players WHERE auth_user_id = v_auth LIMIT 1;
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'player_not_found'); END IF;

  SELECT * INTO v_session FROM public.vexforge_turn_sessions_v7
   WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_found'); END IF;
  IF v_player_id = v_session.player_a_id THEN
    v_side := 'a';
  ELSIF v_session.player_b_id IS NOT NULL AND v_player_id = v_session.player_b_id THEN
    v_side := 'b';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_participant');
  END IF;

  v_fingerprint := md5(p_expected_event_seq::text || '|' || p_action::text);
  SELECT * INTO v_existing FROM public.vexforge_turn_idempotency_v7
   WHERE session_id = p_session_id AND player_id = v_player_id
     AND idempotency_key = btrim(p_idempotency_key);
  IF FOUND THEN
    IF v_existing.request_fingerprint <> v_fingerprint THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN v_existing.response_json || jsonb_build_object('idempotent', true);
  END IF;

  IF v_session.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_finished',
      'event_seq', v_session.event_seq);
  END IF;
  IF p_expected_event_seq <> v_session.event_seq THEN
    RETURN jsonb_build_object('ok', false, 'error', 'stale_event_seq',
      'event_seq', v_session.event_seq);
  END IF;
  IF v_session.current_actor_side <> v_side THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_your_turn',
      'event_seq', v_session.event_seq);
  END IF;

  v_state := v_session.state;
  v_legal := public._vexforge_turn_v7_legal_actions(p_session_id, v_state, v_side);
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_legal) AS item(action)
     WHERE item.action = v_action
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'illegal_action',
      'event_seq', v_session.event_seq, 'legal_actions', v_legal);
  END IF;

  v_seq := v_session.event_seq;
  v_output := public._vexforge_turn_v7_apply_action(p_session_id, v_state, v_side, v_action);
  v_state := v_output->'state';
  v_events := v_output->'events';
  FOR v_event IN SELECT value FROM jsonb_array_elements(v_events)
  LOOP
    v_seq := v_seq + 1;
    v_state := jsonb_set(v_state, '{event_seq}', to_jsonb(v_seq), true);
    v_hash := md5(v_state::text);
    INSERT INTO public.vexforge_turn_events_v7(
      session_id, event_seq, actor_side, event_type, event_payload, state_snapshot, state_hash
    ) VALUES (
      p_session_id, v_seq, v_event->>'actor_side', v_event->>'event_type',
      COALESCE(v_event->'event_payload', '{}'::jsonb), v_state, v_hash
    );
  END LOOP;

  -- The AI follows the same legal-action list and transition kernel. In the
  -- mirror profile the player's response window is an explicit server pass:
  -- no client-side damage, target, winner, or reward calculation is accepted.
  LOOP
    EXIT WHEN v_state->>'status' <> 'active';
    v_auto_side := v_state->>'current_actor_side';
    IF v_session.controller_b = 'ai' AND v_auto_side = 'b' THEN
      v_legal := public._vexforge_turn_v7_legal_actions(p_session_id, v_state, 'b');
      SELECT action INTO v_auto_action
        FROM jsonb_array_elements(v_legal) WITH ORDINALITY AS items(action, ord)
       ORDER BY CASE action->>'kind'
                  WHEN 'attack' THEN 1 WHEN 'replace' THEN 2
                  WHEN 'move' THEN 3 WHEN 'pass_priority' THEN 4 ELSE 5 END,
                ord
       LIMIT 1;
    ELSIF v_session.controller_b = 'ai' AND v_session.mode = 'training_mirror'
       AND v_auto_side = 'a' AND v_state->>'phase' = 'response' THEN
      v_legal := public._vexforge_turn_v7_legal_actions(p_session_id, v_state, 'a');
      SELECT action INTO v_auto_action
        FROM jsonb_array_elements(v_legal) AS items(action)
       WHERE action->>'kind' = 'pass_priority'
       LIMIT 1;
    ELSE
      EXIT;
    END IF;
    EXIT WHEN v_auto_action IS NULL;
    v_auto_loops := v_auto_loops + 1;
    IF v_auto_loops > 4 THEN RAISE EXCEPTION 'V7 internal actor exceeded transition bound'; END IF;

    v_output := public._vexforge_turn_v7_apply_action(
      p_session_id, v_state, v_auto_side, v_auto_action
    );
    v_state := v_output->'state';
    v_events := v_output->'events';
    FOR v_event IN SELECT value FROM jsonb_array_elements(v_events)
    LOOP
      v_seq := v_seq + 1;
      v_state := jsonb_set(v_state, '{event_seq}', to_jsonb(v_seq), true);
      v_hash := md5(v_state::text);
      INSERT INTO public.vexforge_turn_events_v7(
        session_id, event_seq, actor_side, event_type, event_payload, state_snapshot, state_hash
      ) VALUES (
        p_session_id, v_seq, v_event->>'actor_side', v_event->>'event_type',
        COALESCE(v_event->'event_payload', '{}'::jsonb), v_state, v_hash
      );
    END LOOP;
    v_auto_action := NULL;
  END LOOP;

  v_hash := md5(v_state::text);
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = v_seq,
         status = v_state->>'status',
         phase = v_state->>'phase',
         current_actor_side = v_state->>'current_actor_side',
         round_index = COALESCE((v_state->>'round')::integer, 1),
         outcome = CASE WHEN v_state->>'status' = 'completed'
                        THEN jsonb_build_object(
                          'winner_side', v_state->>'winner_side',
                          'completion_reason', v_state->>'completion_reason',
                          'rewards_granted', false)
                        ELSE '{}'::jsonb END,
         completed_at = CASE WHEN v_state->>'status' = 'completed'
                              THEN now() ELSE NULL END,
         updated_at = now()
   WHERE id = p_session_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'event_seq', event_seq, 'actor_side', actor_side, 'event_type', event_type,
    'event_payload', event_payload, 'state_hash', state_hash,
    'state', jsonb_build_object(
      'status', state_snapshot->>'status',
      'phase', state_snapshot->>'phase',
      'round', state_snapshot->>'round',
      'turn_index', state_snapshot->>'turn_index',
      'current_actor_side', state_snapshot->>'current_actor_side',
      'board', jsonb_build_object(
        'a', public._vexforge_turn_v7_project_side(
          state_snapshot#>'{teams,a}', v_side = 'a', state_snapshot->>'status'),
        'b', public._vexforge_turn_v7_project_side(
          state_snapshot#>'{teams,b}', v_side = 'b', state_snapshot->>'status')
      ),
      'winner_side', state_snapshot->>'winner_side'
    )
  ) ORDER BY event_seq), '[]'::jsonb)
    INTO v_events
    FROM public.vexforge_turn_events_v7
   WHERE session_id = p_session_id AND event_seq > v_session.event_seq;

  v_response := public._vexforge_turn_v7_project(p_session_id, v_player_id, v_state, v_events);
  INSERT INTO public.vexforge_turn_idempotency_v7(
    session_id, player_id, idempotency_key, request_fingerprint, response_json
  ) VALUES (
    p_session_id, v_player_id, btrim(p_idempotency_key), v_fingerprint, v_response
  );
  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION public._vexforge_turn_v7_build_side(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_recompute_side(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_mirror_units(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_target(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_legal_actions(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_apply_action(uuid, jsonb, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_project_side(jsonb, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_project(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_start_training(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_get_state(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_legal_actions(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_submit_action(uuid, bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_start_training(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_get_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_legal_actions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_submit_action(uuid, bigint, text, jsonb) TO authenticated;
