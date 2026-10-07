\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  v_player_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_mission_id uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  v_telegram_id uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  v_blocked_mission_id uuid := 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  v_boss_id uuid := '99999999-9999-4999-8999-999999999999';
  v_inactive_boss_id uuid := '88888888-8888-4888-8888-888888888888';
  v_start jsonb;
  v_retry jsonb;
  v_wrong_target jsonb;
  v_result jsonb;
  v_session_id uuid;
  v_mission_run_id uuid;
  v_battle_run_id uuid;
  v_state jsonb;
  v_hash text;
  v_status text;
  v_energy integer;
  v_regional_cards integer;
  v_boss_start jsonb;
  v_boss_loss jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.vexforge_turn_v7_start_mission(uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.vexforge_turn_v7_start_boss(uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.vexforge_turn_v7_start_mission(uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.vexforge_turn_v7_start_boss(uuid,text)', 'EXECUTE')
     OR has_function_privilege(
       'authenticated',
       'public._vexforge_turn_v7_build_official_side(text,text,integer)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'V7 PvE function grants are not least-privilege';
  END IF;

  v_result := public.vexforge_turn_v7_start_mission(
    v_telegram_id, 'telegram-mission-key-0001'
  );
  IF v_result->>'error' <> 'mission_not_eligible' THEN
    RAISE EXCEPTION 'Telegram contract incorrectly entered V7 combat: %', v_result;
  END IF;
  v_result := public.vexforge_turn_v7_start_mission(
    v_blocked_mission_id, 'blocked-mission-key-0001'
  );
  IF v_result->>'error' <> 'mission_not_eligible' THEN
    RAISE EXCEPTION 'Non-production mission incorrectly entered V7 combat: %', v_result;
  END IF;

  v_start := public.vexforge_turn_v7_start_mission(
    v_mission_id, 'local-v7-mission-start-0001'
  );
  IF COALESCE((v_start->>'ok')::boolean, false) IS NOT TRUE
     OR v_start->>'mode' <> 'mission'
     OR v_start->>'ruleset_version' <> 'vexforge_turn_v7_mission_1'
     OR COALESCE((v_start->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'V7 mission start returned an invalid profile: %', v_start;
  END IF;
  v_session_id := (v_start->>'session_id')::uuid;
  SELECT state INTO v_state
    FROM public.vexforge_turn_sessions_v7
   WHERE id = v_session_id;
  v_mission_run_id := (v_state#>>'{pve_context,mission_run_id}')::uuid;
  IF jsonb_array_length(v_state#>'{teams,a}') <> 4
     OR jsonb_array_length(v_state#>'{teams,b}') <> 4
     OR v_state#>>'{pve_context,mission_id}' <> v_mission_id::text
     OR v_mission_run_id IS NULL THEN
    RAISE EXCEPTION 'Mission session did not bind the active deck and canonical run: %', v_state;
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_state#>'{teams,a}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_state#>'{teams,b}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) THEN
    RAISE EXCEPTION 'Mission teams did not snapshot official card synergies';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM jsonb_array_elements(v_state#>'{teams,b}') AS units(unit)
     WHERE NOT EXISTS (
       SELECT 1
         FROM public.cards c
        WHERE c.id = (unit->>'card_id')::uuid
          AND c.active IS TRUE
     )
  ) THEN
    RAISE EXCEPTION 'Mission opponent included a card outside the active official catalog';
  END IF;
  SELECT count(*) INTO v_regional_cards
    FROM jsonb_array_elements(v_state#>'{teams,b}') AS units(unit)
    JOIN public.cards c ON c.id = (unit->>'card_id')::uuid
   WHERE c.region_id = 'Catedral del Alba';
  IF v_regional_cards <> 2 THEN
    RAISE EXCEPTION 'Mission profile did not prioritize its region cards: %', v_regional_cards;
  END IF;

  SELECT energy INTO v_energy
    FROM public.player_progress
   WHERE player_id = v_player_id;
  IF v_energy <> 93 THEN
    RAISE EXCEPTION 'Canonical mission start did not reserve exactly its energy cost: %', v_energy;
  END IF;
  v_retry := public.vexforge_turn_v7_start_mission(
    v_mission_id, 'local-v7-mission-start-0001'
  );
  IF v_retry->>'session_id' <> v_start->>'session_id' THEN
    RAISE EXCEPTION 'Mission start retry did not return the original session: %', v_retry;
  END IF;
  SELECT energy INTO v_energy
    FROM public.player_progress
   WHERE player_id = v_player_id;
  IF v_energy <> 93 THEN
    RAISE EXCEPTION 'Idempotent mission start spent energy twice: %', v_energy;
  END IF;
  v_wrong_target := public.vexforge_turn_v7_start_mission(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'local-v7-mission-start-0001'
  );
  IF v_wrong_target->>'error' <> 'idempotency_key_reused' THEN
    RAISE EXCEPTION 'Mission idempotency key was accepted for a different target: %', v_wrong_target;
  END IF;

  -- Complete the server session. The AFTER trigger must invoke the existing
  -- mission resolver and persist its confirmed result in the session outcome.
  v_state := v_state || jsonb_build_object(
    'status', 'completed',
    'phase', 'finished',
    'winner_side', 'a',
    'completion_reason', 'opponent_defeated',
    'turn_index', 6,
    'event_seq', 2
  );
  v_hash := md5(v_state::text);
  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type,
    event_payload, state_snapshot, state_hash
  ) VALUES (
    v_session_id, 2, 'a', 'attack_resolved',
    '{"damage":42}'::jsonb, v_state, v_hash
  );
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = 2,
         status = 'completed',
         phase = 'finished',
         round_index = 3,
         completed_at = now(),
         outcome = jsonb_build_object('winner_side', 'a', 'rewards_granted', false)
   WHERE id = v_session_id;
  SELECT status INTO v_status
    FROM public.mission_runs
   WHERE id = v_mission_run_id;
  IF v_status <> 'claimed'
     OR NOT COALESCE((
       SELECT (outcome->>'rewards_granted')::boolean
         FROM public.vexforge_turn_sessions_v7 WHERE id = v_session_id
     ), false) THEN
    RAISE EXCEPTION 'Winning mission did not settle through its canonical contract';
  END IF;

  v_start := public.vexforge_turn_v7_start_mission(
    v_mission_id, 'local-v7-mission-loss-0001'
  );
  IF COALESCE((v_start->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Second mission start failed: %', v_start;
  END IF;
  v_session_id := (v_start->>'session_id')::uuid;
  SELECT state INTO v_state
    FROM public.vexforge_turn_sessions_v7
   WHERE id = v_session_id;
  v_mission_run_id := (v_state#>>'{pve_context,mission_run_id}')::uuid;
  v_state := v_state || jsonb_build_object(
    'status', 'completed',
    'phase', 'finished',
    'winner_side', 'b',
    'completion_reason', 'player_defeated',
    'turn_index', 4,
    'event_seq', 2
  );
  v_hash := md5(v_state::text);
  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type,
    event_payload, state_snapshot, state_hash
  ) VALUES (
    v_session_id, 2, 'system', 'combat_completed',
    '{"winner_side":"b"}'::jsonb, v_state, v_hash
  );
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = 2,
         status = 'completed',
         phase = 'finished',
         completed_at = now(),
         outcome = jsonb_build_object('winner_side', 'b', 'rewards_granted', false)
   WHERE id = v_session_id;
  IF (SELECT status FROM public.mission_runs WHERE id = v_mission_run_id) <> 'failed'
     OR COALESCE((
       SELECT (outcome->>'rewards_granted')::boolean
         FROM public.vexforge_turn_sessions_v7 WHERE id = v_session_id
     ), true) THEN
    RAISE EXCEPTION 'Defeated mission incorrectly granted a reward';
  END IF;

  v_boss_start := public.vexforge_turn_v7_start_boss(
    v_boss_id, 'local-v7-boss-win-0001'
  );
  IF COALESCE((v_boss_start->>'ok')::boolean, false) IS NOT TRUE
     OR v_boss_start->>'mode' <> 'boss'
     OR v_boss_start->>'ruleset_version' <> 'vexforge_turn_v7_boss_1'
     OR COALESCE((v_boss_start->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'V7 boss start returned an invalid profile: %', v_boss_start;
  END IF;
  v_session_id := (v_boss_start->>'session_id')::uuid;
  SELECT state INTO v_state
    FROM public.vexforge_turn_sessions_v7
   WHERE id = v_session_id;
  v_battle_run_id := (v_state#>>'{pve_context,battle_run_id}')::uuid;
  IF v_battle_run_id IS NULL
     OR (SELECT status FROM public.battle_runs WHERE id = v_battle_run_id) <> 'started'
     OR (SELECT mode FROM public.battle_runs WHERE id = v_battle_run_id) <> 'boss'
     OR jsonb_array_length(v_state#>'{teams,b}') <> 3 THEN
    RAISE EXCEPTION 'Boss session did not create its authoritative battle run and profile';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_state#>'{teams,a}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_state#>'{teams,b}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) THEN
    RAISE EXCEPTION 'Boss teams did not snapshot official card synergies';
  END IF;

  v_state := v_state || jsonb_build_object(
    'status', 'completed',
    'phase', 'finished',
    'winner_side', 'a',
    'completion_reason', 'boss_defeated',
    'turn_index', 8,
    'event_seq', 2
  );
  v_hash := md5(v_state::text);
  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type,
    event_payload, state_snapshot, state_hash
  ) VALUES (
    v_session_id, 2, 'a', 'attack_resolved',
    '{"damage":73}'::jsonb, v_state, v_hash
  );
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = 2,
         status = 'completed',
         phase = 'finished',
         completed_at = now(),
         outcome = jsonb_build_object('winner_side', 'a', 'rewards_granted', false)
   WHERE id = v_session_id;
  IF (SELECT status FROM public.battle_runs WHERE id = v_battle_run_id) <> 'completed'
     OR (SELECT outcome FROM public.battle_runs WHERE id = v_battle_run_id) IS NOT TRUE
     OR (SELECT damage FROM public.world_boss_encounters WHERE battle_run_id = v_battle_run_id) <> 73
     OR COALESCE((
       SELECT (outcome->>'rewards_granted')::boolean
         FROM public.vexforge_turn_sessions_v7 WHERE id = v_session_id
     ), false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Winning boss did not settle only its server-recorded damage';
  END IF;

  v_result := public.vexforge_turn_v7_start_boss(
    v_inactive_boss_id, 'local-v7-inactive-boss-0001'
  );
  IF v_result->>'error' <> 'world_boss_not_available' THEN
    RAISE EXCEPTION 'Inactive world boss entered combat: %', v_result;
  END IF;

  v_boss_loss := public.vexforge_turn_v7_start_boss(
    v_boss_id, 'local-v7-boss-loss-0001'
  );
  IF COALESCE((v_boss_loss->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Second boss start failed: %', v_boss_loss;
  END IF;
  v_session_id := (v_boss_loss->>'session_id')::uuid;
  SELECT state INTO v_state
    FROM public.vexforge_turn_sessions_v7
   WHERE id = v_session_id;
  v_battle_run_id := (v_state#>>'{pve_context,battle_run_id}')::uuid;
  v_state := v_state || jsonb_build_object(
    'status', 'completed',
    'phase', 'finished',
    'winner_side', 'b',
    'completion_reason', 'player_defeated',
    'turn_index', 5,
    'event_seq', 2
  );
  v_hash := md5(v_state::text);
  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type,
    event_payload, state_snapshot, state_hash
  ) VALUES (
    v_session_id, 2, 'system', 'combat_completed',
    '{"winner_side":"b"}'::jsonb, v_state, v_hash
  );
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state,
         state_hash = v_hash,
         event_seq = 2,
         status = 'completed',
         phase = 'finished',
         completed_at = now(),
         outcome = jsonb_build_object('winner_side', 'b', 'rewards_granted', false)
   WHERE id = v_session_id;
  IF (SELECT status FROM public.battle_runs WHERE id = v_battle_run_id) <> 'defeated'
     OR EXISTS (
       SELECT 1 FROM public.world_boss_encounters WHERE battle_run_id = v_battle_run_id
     ) THEN
    RAISE EXCEPTION 'Defeated boss incorrectly produced damage or a reward settlement';
  END IF;
END;
$$;

SELECT 'V7 local mission and boss settlement verification passed.' AS result;
