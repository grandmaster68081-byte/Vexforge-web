\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  v_start jsonb;
  v_result jsonb;
  v_replay jsonb;
  v_action jsonb;
  v_session_id uuid;
  v_seq bigint;
  v_event_count integer;
  v_before integer;
  v_after integer;
  v_idem_before integer;
  v_idem_after integer;
  v_champion jsonb;
  v_guard_id text;
  v_second_start jsonb;
  v_death_start jsonb;
  v_death_state jsonb;
  v_death_units jsonb;
BEGIN
  v_start := public.vexforge_turn_v7_start_training('local-test-start-0001');
  IF COALESCE((v_start->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'start training failed: %', v_start;
  END IF;
  v_session_id := (v_start->>'session_id')::uuid;
  IF v_start->>'mode' <> 'training_mirror'
     OR v_start->>'ruleset_version' <> 'vexforge_turn_v7_mirror_1'
     OR COALESCE((v_start->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'unexpected training profile or reward behavior: %', v_start;
  END IF;
  IF jsonb_array_length(v_start#>'{board,a}') <> 4
     OR jsonb_array_length(v_start#>'{board,b}') <> 4 THEN
    RAISE EXCEPTION 'mirror board did not use the same formation size';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_start#>'{board,b}') AS units(unit)
     WHERE unit->>'slot' = 'reserve'
       AND (unit->>'hidden')::boolean IS DISTINCT FROM true
  ) THEN
    RAISE EXCEPTION 'opponent reserve was not hidden in the player projection';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_start#>'{board,a}') AS units(unit)
     WHERE unit->>'slot' = 'champion'
       AND (unit->'stat_breakdown'->'formation'->>'same_faction_percent')::integer = 15
  ) THEN
    RAISE EXCEPTION 'V6 same-faction stat breakdown was not applied';
  END IF;
  SELECT unit INTO v_champion
    FROM jsonb_array_elements(v_start#>'{board,a}') AS units(unit)
   WHERE unit->>'slot' = 'champion';
  IF (v_champion#>>'{stat_breakdown,base_stats,hp}')::integer <> 88
     OR (v_champion#>>'{stat_breakdown,base_stats,atk}')::integer <> 22
     OR (v_champion#>>'{stat_breakdown,base_stats,def}')::integer <> 17
     OR (v_champion#>>'{stat_breakdown,base_stats,spd}')::integer <> 20 THEN
    RAISE EXCEPTION 'V6 base stat formula breakdown mismatch: %', v_champion;
  END IF;
  SELECT unit->>'unit_id' INTO v_guard_id
    FROM jsonb_array_elements(v_start#>'{board,b}') AS units(unit)
   WHERE unit->>'slot' = 'vanguard' AND (unit->>'guard')::boolean;
  IF v_guard_id IS NULL THEN RAISE EXCEPTION 'mirror vanguard guard is missing'; END IF;
  IF jsonb_array_length(v_start->'legal_actions') < 4 THEN
    RAISE EXCEPTION 'server did not return attack, formation, and end-turn actions';
  END IF;
  SELECT action INTO v_action
    FROM jsonb_array_elements(v_start->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'attack'
   LIMIT 1;
  IF v_action IS NULL OR v_action->>'target_id' <> v_guard_id THEN
    RAISE EXCEPTION 'server did not honor V6 guard targeting: %', v_action;
  END IF;
  IF has_table_privilege('authenticated', 'public.vexforge_turn_sessions_v7', 'SELECT')
     OR has_table_privilege('authenticated', 'public.vexforge_turn_events_v7', 'SELECT')
     OR has_table_privilege('authenticated', 'public.vexforge_turn_idempotency_v7', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated role can read private V7 storage directly';
  END IF;
  IF has_function_privilege('anon', 'public.vexforge_turn_v7_start_training(text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.vexforge_turn_v7_start_training(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public._vexforge_turn_v7_build_side(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'V7 function execute grants are not least-privilege';
  END IF;

  v_seq := (v_start->>'event_seq')::bigint;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-test-action-0001', v_action
  );
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'legal attack was rejected: %', v_result;
  END IF;
  IF (v_result->>'event_seq')::bigint <= v_seq
     OR jsonb_array_length(v_result->'events') < 3 THEN
    RAISE EXCEPTION 'player, AI, and response transitions were not evented: %', v_result;
  END IF;
  IF v_result->>'current_actor_side' <> 'a'
     OR v_result->>'phase' <> 'main' THEN
    RAISE EXCEPTION 'mirror turn did not return to the player after the AI response';
  END IF;
  IF COALESCE((v_result->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'training unexpectedly granted rewards';
  END IF;

  SELECT count(*) INTO v_event_count
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  SELECT count(*) INTO v_idem_before
    FROM public.vexforge_turn_idempotency_v7 WHERE session_id = v_session_id;
  v_replay := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-test-action-0001', v_action
  );
  IF COALESCE((v_replay->>'idempotent')::boolean, false) IS NOT TRUE
     OR (v_replay->>'event_seq')::bigint <> (v_result->>'event_seq')::bigint THEN
    RAISE EXCEPTION 'retry did not return the stored idempotent result';
  END IF;
  SELECT count(*) INTO v_after
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  IF v_after <> v_event_count THEN RAISE EXCEPTION 'idempotent retry appended events'; END IF;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-test-action-0001',
    v_action || jsonb_build_object('kind', 'forged_action')
  );
  IF v_result->>'error' <> 'idempotency_key_reused' THEN
    RAISE EXCEPTION 'reused idempotency key accepted a changed request: %', v_result;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
  v_result := public.vexforge_turn_v7_get_state(v_session_id);
  IF v_result->>'error' <> 'not_a_participant' THEN
    RAISE EXCEPTION 'foreign player read the training session: %', v_result;
  END IF;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'foreign-player-action-01', v_action
  );
  IF v_result->>'error' <> 'not_a_participant' THEN
    RAISE EXCEPTION 'foreign player submitted to the training session: %', v_result;
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-test-stale-0001', v_action
  );
  IF v_result->>'error' <> 'stale_event_seq' THEN
    RAISE EXCEPTION 'stale action was not rejected: %', v_result;
  END IF;
  SELECT count(*) INTO v_before
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  IF v_before <> v_event_count THEN RAISE EXCEPTION 'stale action changed the event log'; END IF;
  SELECT count(*) INTO v_idem_after
    FROM public.vexforge_turn_idempotency_v7 WHERE session_id = v_session_id;
  IF v_idem_after <> v_idem_before THEN
    RAISE EXCEPTION 'stale action created an idempotency result';
  END IF;

  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id,
    (public.vexforge_turn_v7_get_state(v_session_id)->>'event_seq')::bigint,
    'local-test-illegal-0001',
    '{"kind":"declare_winner","winner_side":"a"}'::jsonb
  );
  IF v_result->>'error' <> 'illegal_action' THEN
    RAISE EXCEPTION 'illegal client action was not rejected: %', v_result;
  END IF;
  SELECT count(*) INTO v_after
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  IF v_after <> v_event_count THEN RAISE EXCEPTION 'illegal action changed the event log'; END IF;

  v_second_start := public.vexforge_turn_v7_start_training('local-test-formation-0001');
  v_session_id := (v_second_start->>'session_id')::uuid;
  SELECT action INTO v_action
    FROM jsonb_array_elements(v_second_start->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'move'
   LIMIT 1;
  IF v_action IS NULL THEN RAISE EXCEPTION 'no legal movement action was offered'; END IF;
  v_seq := (v_second_start->>'event_seq')::bigint;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-test-move-0001', v_action
  );
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE
     OR NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_result->'events') AS events(event)
        WHERE event->>'event_type' = 'formation_changed'
     ) THEN
    RAISE EXCEPTION 'legal movement did not produce a formation event: %', v_result;
  END IF;
  SELECT action INTO v_action
    FROM jsonb_array_elements(v_result->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'replace'
   LIMIT 1;
  IF v_action IS NULL THEN RAISE EXCEPTION 'reserve replacement was not offered'; END IF;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id,
    (v_result->>'event_seq')::bigint,
    'local-test-replace-0001',
    v_action
  );
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE
     OR NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_result->'events') AS events(event)
        WHERE event->>'event_type' = 'formation_changed'
          AND event->'event_payload'->>'kind' = 'replace'
     ) THEN
    RAISE EXCEPTION 'legal reserve replacement did not produce its event: %', v_result;
  END IF;

  v_death_start := public.vexforge_turn_v7_start_training('local-test-champion-death-0001');
  v_session_id := (v_death_start->>'session_id')::uuid;
  SELECT state INTO v_death_state
    FROM public.vexforge_turn_sessions_v7 WHERE id = v_session_id;
  SELECT jsonb_agg(
           CASE WHEN unit->>'slot' = 'champion'
                THEN jsonb_set(unit, '{hp}', '1'::jsonb, true)
                ELSE jsonb_set(
                       jsonb_set(unit, '{hp}', '0'::jsonb, true),
                       '{alive}', 'false'::jsonb, true)
           END ORDER BY ord
         )
    INTO v_death_units
    FROM jsonb_array_elements(v_death_state#>'{teams,b}') WITH ORDINALITY AS items(unit, ord);
  v_death_state := jsonb_set(v_death_state, '{teams,b}', v_death_units, true);
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_death_state, state_hash = md5(v_death_state::text)
   WHERE id = v_session_id;
  v_death_start := public.vexforge_turn_v7_get_state(v_session_id);
  SELECT action INTO v_action
    FROM jsonb_array_elements(v_death_start->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'attack'
     AND action->>'target_id' = (
       SELECT unit->>'unit_id'
         FROM jsonb_array_elements(v_death_start#>'{board,b}') AS units(unit)
        WHERE unit->>'slot' = 'champion'
     )
   LIMIT 1;
  IF v_action IS NULL THEN RAISE EXCEPTION 'champion was not targetable after its guard line fell'; END IF;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id,
    (v_death_start->>'event_seq')::bigint,
    'local-test-champion-death-action-01',
    v_action
  );
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE
     OR v_result->>'status' <> 'completed'
     OR v_result#>>'{outcome,winner_side}' <> 'a'
     OR COALESCE((v_result->>'rewards_granted')::boolean, true)
     OR NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_result->'events') AS events(event)
        WHERE event->>'event_type' = 'combat_completed'
     ) THEN
    RAISE EXCEPTION 'champion death did not end the mirror combat authoritatively: %', v_result;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.vexforge_turn_sessions_v7 s
      JOIN public.vexforge_turn_events_v7 e
        ON e.session_id = s.id AND e.event_seq = s.event_seq
      WHERE s.id = v_session_id
       AND s.state_hash = md5(s.state::text)
       AND e.state_hash = s.state_hash
       AND e.state_snapshot = s.state
  ) THEN
    RAISE EXCEPTION 'final snapshot and stored event hash do not match';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.vexforge_turn_events_v7 e
     WHERE e.session_id = v_session_id
       AND e.state_hash <> md5(e.state_snapshot::text)
  ) THEN
    RAISE EXCEPTION 'event state hash mismatch';
  END IF;
  IF (SELECT count(*) FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id)
     <> (SELECT max(event_seq) FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id) THEN
    RAISE EXCEPTION 'event sequence is not contiguous from 1';
  END IF;

  RAISE NOTICE 'V7 local combat checks passed for session %', v_session_id;
END;
$$;
