-- VEXFORGE V7 PvE adapters.
-- This migration stays additive and is not applied to the live Supabase project
-- by this implementation. Mission energy/rewards and boss rewards remain owned
-- by the existing server-side contracts; enemy rosters only use active cards.

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_build_official_side(
  p_region text,
  p_seed text,
  p_unit_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_region_label text;
  v_card record;
  v_keywords text[];
  v_units jsonb := '[]'::jsonb;
  v_unit jsonb;
  v_power integer;
  v_affinity integer;
  v_prestige integer;
  v_charge integer;
  v_hp integer;
  v_atk integer;
  v_def integer;
  v_spd integer;
  v_index integer := 0;
  v_vanguard_index integer := -1;
  v_sentinel_index integer := -1;
BEGIN
  IF p_unit_count IS NULL OR p_unit_count < 1 OR p_unit_count > 8 THEN
    RAISE EXCEPTION 'invalid V7 official profile size';
  END IF;

  SELECT COALESCE(NULLIF(r.world_alignment, ''), NULLIF(r.name, ''), p_region)
    INTO v_region_label
    FROM public.regions r
   WHERE lower(r.code) = lower(COALESCE(p_region, ''))
   ORDER BY r.code
   LIMIT 1;
  v_region_label := COALESCE(NULLIF(v_region_label, ''), p_region);

  FOR v_card IN
    SELECT c.id AS card_id,
           c.name,
           c.faction::text AS faction,
           c.rarity::text AS rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10) AS power,
           COALESCE(c.affinity, 2) AS affinity,
           COALESCE(c.prestige, 1) AS prestige,
           COALESCE(c.charge, 1) AS charge,
           COALESCE(c.synergy_json, '{}'::jsonb) AS synergy_json
      FROM public.cards c
     WHERE c.active IS TRUE
     ORDER BY
       CASE
         WHEN NULLIF(v_region_label, '') IS NOT NULL
          AND regexp_replace(lower(trim(COALESCE(c.region_id, ''))), '[^[:alnum:]]', '', 'g')
              = regexp_replace(lower(trim(v_region_label)), '[^[:alnum:]]', '', 'g')
         THEN 0 ELSE 1
       END,
       COALESCE(c.power, 0) DESC,
       md5(COALESCE(p_seed, '') || ':' || c.id::text),
       c.id
     LIMIT p_unit_count
  LOOP
    v_keywords := ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(v_card.synergy_json->'keywords', '[]'::jsonb)
      )
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
      'unit_id', 'b:' || v_index::text || ':' || v_card.card_id::text,
      'card_id', v_card.card_id,
      'slot_number', v_index,
      'side', 'b',
      'name', v_card.name,
      'faction', v_card.faction,
      'rarity', v_card.rarity,
      'image_url', v_card.image_url,
      'slot', 'reserve',
      'is_champion', v_index = 0,
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
      'base_stats', jsonb_build_object(
        'hp', v_hp,
        'atk', v_power + v_affinity / 4,
        'def', v_prestige * 2 + v_affinity / 8,
        'spd', v_charge * 4 + v_affinity / 10,
        'power', v_power
      ),
      'stat_breakdown', '{}'::jsonb
    ));
    v_index := v_index + 1;
  END LOOP;

  IF jsonb_array_length(v_units) = 0 THEN RETURN v_units; END IF;

  FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    v_unit := v_units->v_index;
    IF v_index = 0 THEN
      v_unit := jsonb_set(v_unit, '{slot}', '"champion"'::jsonb, true);
      v_unit := jsonb_set(v_unit, '{is_champion}', 'true'::jsonb, true);
    ELSIF v_vanguard_index < 0 THEN
      v_vanguard_index := v_index;
      v_unit := jsonb_set(v_unit, '{slot}', '"vanguard"'::jsonb, true);
    ELSIF v_sentinel_index < 0 THEN
      v_sentinel_index := v_index;
      v_unit := jsonb_set(v_unit, '{slot}', '"sentinel"'::jsonb, true);
    ELSE
      v_unit := jsonb_set(v_unit, '{slot}', '"reserve"'::jsonb, true);
    END IF;
    v_units := jsonb_set(v_units, ARRAY[v_index::text], v_unit, true);
  END LOOP;

  RETURN public._vexforge_turn_v7_recompute_side(v_units);
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_create_profile_session(
  p_player_id uuid,
  p_mode text,
  p_profile text,
  p_ruleset_version text,
  p_session_key text,
  p_units_a jsonb,
  p_units_b jsonb,
  p_context jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_state jsonb;
  v_hash text;
  v_existing public.vexforge_turn_sessions_v7%ROWTYPE;
BEGIN
  IF p_mode NOT IN ('mission', 'boss')
     OR jsonb_typeof(p_context) <> 'object'
     OR jsonb_array_length(COALESCE(p_units_a, '[]'::jsonb)) = 0
     OR jsonb_array_length(COALESCE(p_units_b, '[]'::jsonb)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_pve_profile');
  END IF;

  v_state := jsonb_build_object(
    'schema_version', 7,
    'ruleset_version', p_ruleset_version,
    'base_rules_version', 'forge_formation_t2',
    'profile', p_profile,
    'mode', p_mode,
    'status', 'active',
    'phase', 'main',
    'round', 1,
    'turn_index', 0,
    'event_seq', 0,
    'current_actor_side', 'a',
    'pending_attack', 'null'::jsonb,
    'winner_side', 'null'::jsonb,
    'completion_reason', 'null'::jsonb,
    'teams', jsonb_build_object('a', p_units_a, 'b', p_units_b),
    'pve_context', p_context
  );

  INSERT INTO public.vexforge_turn_sessions_v7(
    player_a_id, controller_b, mode, ruleset_version, profile,
    state, state_hash, start_idempotency_key
  ) VALUES (
    p_player_id, 'ai', p_mode, p_ruleset_version, p_profile,
    v_state, md5(v_state::text), p_session_key
  )
  ON CONFLICT (player_a_id, start_idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT * INTO v_existing
      FROM public.vexforge_turn_sessions_v7
     WHERE player_a_id = p_player_id
       AND start_idempotency_key = p_session_key;
    IF NOT FOUND
       OR v_existing.mode <> p_mode
       OR v_existing.state->'pve_context' IS DISTINCT FROM p_context THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN public._vexforge_turn_v7_project(
      v_existing.id, p_player_id, v_existing.state
    );
  END IF;

  v_state := jsonb_set(v_state, '{session_id}', to_jsonb(v_id::text), true);
  v_state := jsonb_set(v_state, '{event_seq}', '1'::jsonb, true);
  v_hash := md5(v_state::text);

  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = 1,
         updated_at = now()
   WHERE id = v_id;

  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type, event_payload,
    state_snapshot, state_hash
  ) VALUES (
    v_id, 1, 'system', 'session_started',
    jsonb_build_object(
      'mode', p_mode,
      'profile', p_profile,
      'ruleset_version', p_ruleset_version,
      'pve_context', p_context,
      'rewards_granted', false
    ),
    v_state, v_hash
  );

  RETURN public._vexforge_turn_v7_project(v_id, p_player_id, v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_start_mission(
  p_mission_id uuid,
  p_idempotency_key text
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
  v_session_key text;
  v_mission_run_key text;
  v_reward_reference text;
  v_mission record;
  v_existing public.vexforge_turn_sessions_v7%ROWTYPE;
  v_units_a jsonb;
  v_units_b jsonb;
  v_unit_count integer;
  v_mission_run_id uuid;
  v_recorded_mission_id uuid;
  v_error text;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  IF p_mission_id IS NULL
     OR p_idempotency_key IS NULL
     OR length(btrim(p_idempotency_key)) < 8
     OR length(p_idempotency_key) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_request');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = v_auth
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_player_id::text || ':' || btrim(p_idempotency_key), 0)
  );
  v_session_key := 'v7pve:mission:' ||
    md5(v_player_id::text || ':' || btrim(p_idempotency_key));
  v_mission_run_key := 'v7mission:' ||
    md5(v_player_id::text || ':' || btrim(p_idempotency_key));
  v_reward_reference := 'v7mission-reward:' ||
    md5(v_player_id::text || ':' || btrim(p_idempotency_key));

  SELECT * INTO v_existing
    FROM public.vexforge_turn_sessions_v7
   WHERE player_a_id = v_player_id
     AND start_idempotency_key = v_session_key;
  IF FOUND THEN
    IF v_existing.mode <> 'mission'
       OR v_existing.state#>>'{pve_context,mission_id}' <> p_mission_id::text THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN public._vexforge_turn_v7_project(
      v_existing.id, v_player_id, v_existing.state
    );
  END IF;

  SELECT m.id, m.code, m.name, m.region_id, m.difficulty, m.mission_group,
         m.energy_cost
    INTO v_mission
    FROM public.missions m
   WHERE m.id = p_mission_id
     AND m.active IS TRUE
     AND m.system_locked IS FALSE
     AND m.production_ready IS TRUE
     AND lower(COALESCE(m.region_id, '')) <> 'telegram'
     AND lower(COALESCE(m.mission_group, '')) <> 'telegram_contract';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'mission_not_eligible');
  END IF;

  v_units_a := public._vexforge_turn_v7_build_side(v_player_id, 'a');
  IF jsonb_array_length(v_units_a) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active_deck_required');
  END IF;

  v_unit_count := CASE lower(COALESCE(v_mission.difficulty, ''))
    WHEN 'easy' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'hard' THEN 4
    WHEN 'epic' THEN 5
    WHEN 'legendary' THEN 6
    ELSE 4
  END;
  v_units_b := public._vexforge_turn_v7_build_official_side(
    v_mission.region_id,
    'mission:' || v_mission.id::text || ':' || COALESCE(v_mission.code, ''),
    v_unit_count
  );
  IF jsonb_array_length(v_units_b) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'official_card_profile_unavailable');
  END IF;

  BEGIN
    v_mission_run_id := public.start_mission(
      v_player_id, p_mission_id, v_mission_run_key, v_reward_reference
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    IF v_error = 'insufficient_energy' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_energy');
    ELSIF v_error IN (
      'mission_not_found', 'player_progress_not_found',
      'invalid_idempotency_key', 'invalid_reward_reference_id'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', v_error);
    ELSE
      RAISE;
    END IF;
  END;

  SELECT mission_id INTO v_recorded_mission_id
    FROM public.mission_runs
   WHERE id = v_mission_run_id
     AND player_id = v_player_id;
  IF v_recorded_mission_id IS DISTINCT FROM p_mission_id THEN
    RAISE EXCEPTION 'mission_run_contract_mismatch';
  END IF;

  RETURN public._vexforge_turn_v7_create_profile_session(
    v_player_id,
    'mission',
    'mission_card_profile_v1',
    'vexforge_turn_v7_mission_1',
    v_session_key,
    v_units_a,
    v_units_b,
    jsonb_build_object(
      'target_id', p_mission_id,
      'mission_id', p_mission_id,
      'mission_run_id', v_mission_run_id,
      'mission_code', v_mission.code,
      'mission_name', v_mission.name,
      'region_id', v_mission.region_id,
      'difficulty', v_mission.difficulty,
      'mission_group', v_mission.mission_group
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_start_boss(
  p_world_boss_id uuid,
  p_idempotency_key text
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
  v_session_key text;
  v_battle_run_key text;
  v_boss record;
  v_existing public.vexforge_turn_sessions_v7%ROWTYPE;
  v_units_a jsonb;
  v_units_b jsonb;
  v_unit_count integer;
  v_battle_run_id uuid;
  v_card_ids jsonb;
  v_champion_id text;
  v_seed bigint;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  IF p_world_boss_id IS NULL
     OR p_idempotency_key IS NULL
     OR length(btrim(p_idempotency_key)) < 8
     OR length(p_idempotency_key) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_request');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = v_auth
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_player_id::text || ':' || btrim(p_idempotency_key), 0)
  );
  v_session_key := 'v7pve:boss:' ||
    md5(v_player_id::text || ':' || btrim(p_idempotency_key));
  v_battle_run_key := 'v7boss:' ||
    md5(v_player_id::text || ':' || btrim(p_idempotency_key));

  SELECT * INTO v_existing
    FROM public.vexforge_turn_sessions_v7
   WHERE player_a_id = v_player_id
     AND start_idempotency_key = v_session_key;
  IF FOUND THEN
    IF v_existing.mode <> 'boss'
       OR v_existing.state#>>'{pve_context,boss_id}' <> p_world_boss_id::text THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN public._vexforge_turn_v7_project(
      v_existing.id, v_player_id, v_existing.state
    );
  END IF;

  SELECT b.id, b.boss_code, b.name, b.region_id, b.tier, b.power_level, b.hp
    INTO v_boss
    FROM public.world_bosses b
   WHERE b.id = p_world_boss_id
     AND b.active IS TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'world_boss_not_available');
  END IF;

  v_units_a := public._vexforge_turn_v7_build_side(v_player_id, 'a');
  IF jsonb_array_length(v_units_a) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active_deck_required');
  END IF;

  v_unit_count := CASE upper(COALESCE(v_boss.tier, ''))
    WHEN 'T1' THEN 2
    WHEN 'T2' THEN 3
    WHEN 'T3' THEN 4
    WHEN 'T4' THEN 5
    WHEN 'T5' THEN 6
    WHEN 'T6' THEN 7
    WHEN 'RARE' THEN 3
    WHEN 'EPIC' THEN 5
    WHEN 'LEGENDARY' THEN 7
    ELSE 4
  END;
  v_units_b := public._vexforge_turn_v7_build_official_side(
    v_boss.region_id,
    'boss:' || v_boss.id::text || ':' || COALESCE(v_boss.boss_code, ''),
    v_unit_count
  );
  IF jsonb_array_length(v_units_b) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'official_card_profile_unavailable');
  END IF;

  SELECT COALESCE(
           jsonb_agg(unit->>'card_id' ORDER BY (unit->>'slot_number')::integer),
           '[]'::jsonb
         )
    INTO v_card_ids
    FROM jsonb_array_elements(v_units_a) AS rows(unit);
  SELECT unit->>'card_id' INTO v_champion_id
    FROM jsonb_array_elements(v_units_a) AS rows(unit)
   WHERE COALESCE((unit->>'is_champion')::boolean, false)
   LIMIT 1;

  v_seed := hashtextextended(v_player_id::text || ':boss:' || btrim(p_idempotency_key), 0);
  INSERT INTO public.battle_runs(
    player_id, idempotency_key, mode, rules_version, seed, status,
    formation_snapshot, world_boss_id
  ) VALUES (
    v_player_id, v_battle_run_key, 'boss', 'vexforge_turn_v7_boss_1',
    v_seed, 'started',
    jsonb_build_object(
      'engine', 'vexforge_turn_v7',
      'champion_id', v_champion_id,
      'card_ids', v_card_ids
    ),
    p_world_boss_id
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_battle_run_id;

  IF v_battle_run_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'battle_run_idempotency_conflict');
  END IF;

  RETURN public._vexforge_turn_v7_create_profile_session(
    v_player_id,
    'boss',
    'boss_card_profile_v1',
    'vexforge_turn_v7_boss_1',
    v_session_key,
    v_units_a,
    v_units_b,
    jsonb_build_object(
      'target_id', p_world_boss_id,
      'boss_id', p_world_boss_id,
      'battle_run_id', v_battle_run_id,
      'boss_code', v_boss.boss_code,
      'boss_name', v_boss.name,
      'region_id', v_boss.region_id,
      'tier', v_boss.tier,
      'power_level', v_boss.power_level,
      'hp', v_boss.hp
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_settle_pve_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_context jsonb;
  v_won boolean;
  v_rewards_granted boolean := false;
  v_mission_run_id uuid;
  v_battle_run_id uuid;
  v_boss_id uuid;
  v_damage bigint := 0;
  v_snapshot jsonb;
  v_settlement jsonb;
BEGIN
  IF OLD.status <> 'active'
     OR NEW.status <> 'completed'
     OR NEW.mode NOT IN ('mission', 'boss') THEN
    RETURN NEW;
  END IF;

  v_context := COALESCE(NEW.state->'pve_context', '{}'::jsonb);
  v_won := NEW.state->>'winner_side' = 'a';

  IF NEW.mode = 'mission' THEN
    v_mission_run_id := NULLIF(v_context->>'mission_run_id', '')::uuid;
    IF v_mission_run_id IS NULL THEN
      RAISE EXCEPTION 'V7 mission session is missing its canonical mission run';
    END IF;

    v_settlement := public.vexforge_resolve_mission_run(
      NEW.player_a_id,
      v_mission_run_id,
      CASE WHEN v_won THEN 'won' ELSE 'defeated' END,
      jsonb_build_object(
        'engine', 'vexforge_turn_v7',
        'rules_version', NEW.ruleset_version,
        'winner_side', NEW.state->>'winner_side',
        'you_won', v_won,
        'champion_died', NOT v_won,
        'total_turns', COALESCE((NEW.state->>'turn_index')::integer, 0)
      )
    );
    IF COALESCE((v_settlement->>'success')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'V7 mission settlement failed: %',
        COALESCE(v_settlement->>'reason', 'unknown');
    END IF;
    v_rewards_granted := v_won
      AND COALESCE((v_settlement->>'claimed')::boolean, false);

  ELSIF NEW.mode = 'boss' THEN
    v_battle_run_id := NULLIF(v_context->>'battle_run_id', '')::uuid;
    v_boss_id := NULLIF(v_context->>'boss_id', '')::uuid;
    IF v_battle_run_id IS NULL OR v_boss_id IS NULL THEN
      RAISE EXCEPTION 'V7 boss session is missing its canonical encounter';
    END IF;

    SELECT COALESCE(SUM(NULLIF(event_payload->>'damage', '')::bigint), 0)
      INTO v_damage
      FROM public.vexforge_turn_events_v7
     WHERE session_id = NEW.id
       AND actor_side = 'a'
       AND event_type = 'attack_resolved';

    v_snapshot := jsonb_build_object(
      'engine', 'vexforge_turn_v7',
      'rules_version', NEW.ruleset_version,
      'session_id', NEW.id,
      'damage', v_damage,
      'total_turns', COALESCE((NEW.state->>'turn_index')::integer, 0),
      'winner_side', NEW.state->>'winner_side'
    );

    IF v_won THEN
      UPDATE public.battle_runs
         SET status = 'completed',
             outcome = true,
             result_snapshot = v_snapshot,
             completed_at = now(),
             updated_at = now()
       WHERE id = v_battle_run_id
         AND player_id = NEW.player_a_id
         AND mode = 'boss'
         AND world_boss_id = v_boss_id
         AND status = 'started';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'V7 boss battle run is not startable for settlement';
      END IF;

      IF v_damage > 0 THEN
        v_settlement := public.vexforge_attack_world_boss(
          v_boss_id, v_damage, v_battle_run_id
        );
        v_rewards_granted := COALESCE((v_settlement->>'ok')::boolean, false);
      ELSE
        v_settlement := jsonb_build_object(
          'ok', false, 'reason', 'no_server_recorded_boss_damage'
        );
      END IF;
    ELSE
      UPDATE public.battle_runs
         SET status = 'defeated',
             outcome = false,
             result_snapshot = v_snapshot,
             completed_at = now(),
             updated_at = now()
       WHERE id = v_battle_run_id
         AND player_id = NEW.player_a_id
         AND mode = 'boss'
         AND world_boss_id = v_boss_id
         AND status = 'started';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'V7 boss battle run is not startable';
      END IF;
      v_settlement := jsonb_build_object(
        'ok', true, 'rewards_granted', false, 'reason', 'boss_battle_defeated'
      );
    END IF;
  END IF;

  UPDATE public.vexforge_turn_sessions_v7
     SET outcome = COALESCE(outcome, '{}'::jsonb) || jsonb_build_object(
       'rewards_granted', v_rewards_granted,
       'settlement', COALESCE(v_settlement, '{}'::jsonb)
     )
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vexforge_turn_v7_settle_pve_session
  ON public.vexforge_turn_sessions_v7;
CREATE TRIGGER vexforge_turn_v7_settle_pve_session
AFTER UPDATE OF status, state ON public.vexforge_turn_sessions_v7
FOR EACH ROW
WHEN (OLD.status = 'active' AND NEW.status = 'completed')
EXECUTE FUNCTION public._vexforge_turn_v7_settle_pve_session();

REVOKE ALL ON FUNCTION public._vexforge_turn_v7_build_official_side(text, text, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_create_profile_session(
  uuid, text, text, text, text, jsonb, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_settle_pve_session()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_start_mission(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_start_boss(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_start_mission(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_start_boss(uuid, text)
  TO authenticated;
