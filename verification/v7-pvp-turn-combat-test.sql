\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  v_created jsonb;
  v_create_retry jsonb;
  v_discovery jsonb;
  v_joined jsonb;
  v_join_retry jsonb;
  v_a_state jsonb;
  v_b_state jsonb;
  v_a_action jsonb;
  v_b_action jsonb;
  v_action_result jsonb;
  v_action_retry jsonb;
  v_outsider_result jsonb;
  v_session_id uuid;
  v_event_count integer;
  v_event_before integer;
  v_state jsonb;
  v_units jsonb;
  v_attack jsonb;
  v_events jsonb;
  v_count integer;
  v_min_seq bigint;
  v_max_seq bigint;
BEGIN
  v_created := public.vexforge_turn_v7_create_pvp_room('local-pvp-room-key-0001');
  IF COALESCE((v_created->>'ok')::boolean, false) IS NOT TRUE
     OR COALESCE((v_created->>'awaiting_opponent')::boolean, false) IS NOT TRUE
     OR v_created->>'mode' <> 'pvp'
     OR v_created->>'profile' <> 'pvp_no_rewards_v1'
     OR COALESCE((v_created->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'PvP room was not created as a no-reward waiting room: %', v_created;
  END IF;
  v_session_id := (v_created->>'session_id')::uuid;
  IF jsonb_array_length(v_created#>'{board,a}') <> 4
     OR jsonb_array_length(v_created#>'{board,b}') <> 0
     OR COALESCE((v_created->>'is_my_turn')::boolean, true)
     OR jsonb_array_length(v_created->'legal_actions') <> 0 THEN
    RAISE EXCEPTION 'Waiting room exposed an action or unexpected formation: %', v_created;
  END IF;

  v_create_retry := public.vexforge_turn_v7_create_pvp_room('local-pvp-room-key-0001');
  IF v_create_retry->>'session_id' <> v_created->>'session_id'
     OR COALESCE((v_create_retry->>'awaiting_opponent')::boolean, false) IS NOT TRUE
     OR (SELECT count(*) FROM public.vexforge_turn_sessions_v7
          WHERE player_a_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
            AND mode = 'pvp') <> 1 THEN
    RAISE EXCEPTION 'PvP room creation was not idempotent: %', v_create_retry;
  END IF;

  v_discovery := public.vexforge_turn_v7_discover_pvp_rooms(10);
  IF COALESCE((v_discovery->>'ok')::boolean, false) IS NOT TRUE
     OR jsonb_array_length(v_discovery->'rooms') <> 0 THEN
    RAISE EXCEPTION 'Room discovery exposed the caller''s own room: %', v_discovery;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
  v_a_state := public.vexforge_turn_v7_get_state(v_session_id);
  IF v_a_state->>'error' <> 'not_a_participant' THEN
    RAISE EXCEPTION 'A nonparticipant read an unjoined room: %', v_a_state;
  END IF;

  v_discovery := public.vexforge_turn_v7_discover_pvp_rooms(10);
  IF COALESCE((v_discovery->>'ok')::boolean, false) IS NOT TRUE
     OR jsonb_array_length(v_discovery->'rooms') <> 1
     OR v_discovery#>>'{rooms,0,session_id}' <> v_session_id::text
     OR COALESCE((v_discovery#>>'{rooms,0,rewards_granted}')::boolean, true) THEN
    RAISE EXCEPTION 'Authenticated player did not discover the open no-reward room: %', v_discovery;
  END IF;

  v_joined := public.vexforge_turn_v7_join_pvp_room(v_session_id, 'local-pvp-join-key-0001');
  IF COALESCE((v_joined->>'ok')::boolean, false) IS NOT TRUE
     OR COALESCE((v_joined->>'awaiting_opponent')::boolean, true)
     OR v_joined->>'you_are_side' <> 'b'
     OR COALESCE((v_joined->>'is_my_turn')::boolean, true)
     OR COALESCE((v_joined->>'rewards_granted')::boolean, true)
     OR jsonb_array_length(v_joined#>'{board,b}') <> 4
     OR (v_joined->>'event_seq')::bigint <> 2 THEN
    RAISE EXCEPTION 'Join did not attach the authenticated player''s formation: %', v_joined;
  END IF;

  v_join_retry := public.vexforge_turn_v7_join_pvp_room(v_session_id, 'local-pvp-join-key-0001');
  IF COALESCE((v_join_retry->>'idempotent')::boolean, false) IS NOT TRUE
     OR (v_join_retry->>'event_seq')::bigint <> 2
     OR (SELECT count(*) FROM public.vexforge_turn_events_v7
          WHERE session_id = v_session_id AND event_type = 'session_joined') <> 1 THEN
    RAISE EXCEPTION 'Room join retry created duplicate membership/events: %', v_join_retry;
  END IF;

  v_discovery := public.vexforge_turn_v7_discover_pvp_rooms(10);
  IF jsonb_array_length(v_discovery->'rooms') <> 0 THEN
    RAISE EXCEPTION 'A joined room remained discoverable: %', v_discovery;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
  v_a_state := public.vexforge_turn_v7_get_state(v_session_id);
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_a_state#>'{board,a}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_a_state#>'{board,b}') AS units(unit)
     WHERE unit->>'synergy_rules_version' <> 'card_synergy_rules_v1'
  ) THEN
    RAISE EXCEPTION 'PvP teams did not snapshot official card synergies';
  END IF;
  IF COALESCE((v_a_state->>'is_my_turn')::boolean, false) IS NOT TRUE
     OR COALESCE((v_a_state->>'awaiting_opponent')::boolean, true)
     OR v_a_state->>'current_actor_side' <> 'a' THEN
    RAISE EXCEPTION 'Room creator did not receive the first V7 turn: %', v_a_state;
  END IF;
  SELECT action INTO v_a_action
    FROM jsonb_array_elements(v_a_state->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'end_turn'
   LIMIT 1;
  IF v_a_action IS NULL THEN RAISE EXCEPTION 'Creator has no legal end-turn action'; END IF;
  v_action_result := public.vexforge_turn_v7_submit_action(
    v_session_id, (v_a_state->>'event_seq')::bigint,
    'local-pvp-a-end-turn-0001', v_a_action
  );
  IF COALESCE((v_action_result->>'ok')::boolean, false) IS NOT TRUE
     OR v_action_result->>'current_actor_side' <> 'b'
     OR COALESCE((v_action_result->>'rewards_granted')::boolean, true) THEN
    RAISE EXCEPTION 'Creator turn did not pass to the joining player: %', v_action_result;
  END IF;
  SELECT count(*) INTO v_event_count
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  v_action_retry := public.vexforge_turn_v7_submit_action(
    v_session_id, (v_a_state->>'event_seq')::bigint,
    'local-pvp-a-end-turn-0001', v_a_action
  );
  SELECT count(*) INTO v_event_before
    FROM public.vexforge_turn_events_v7 WHERE session_id = v_session_id;
  IF COALESCE((v_action_retry->>'idempotent')::boolean, false) IS NOT TRUE
     OR v_event_before <> v_event_count THEN
    RAISE EXCEPTION 'PvP action retry changed state or replay events: %', v_action_retry;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
  v_b_state := public.vexforge_turn_v7_get_state(v_session_id);
  IF COALESCE((v_b_state->>'is_my_turn')::boolean, false) IS NOT TRUE
     OR v_b_state->>'current_actor_side' <> 'b' THEN
    RAISE EXCEPTION 'Joining player did not receive the second V7 turn: %', v_b_state;
  END IF;
  SELECT action INTO v_b_action
    FROM jsonb_array_elements(v_b_state->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'end_turn'
   LIMIT 1;
  IF v_b_action IS NULL THEN RAISE EXCEPTION 'Joining player has no legal end-turn action'; END IF;
  v_action_result := public.vexforge_turn_v7_submit_action(
    v_session_id, (v_b_state->>'event_seq')::bigint,
    'local-pvp-b-end-turn-0001', v_b_action
  );
  IF COALESCE((v_action_result->>'ok')::boolean, false) IS NOT TRUE
     OR v_action_result->>'current_actor_side' <> 'a' THEN
    RAISE EXCEPTION 'Joining player turn did not alternate back to the creator: %', v_action_result;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);
  v_outsider_result := public.vexforge_turn_v7_get_state(v_session_id);
  IF v_outsider_result->>'error' <> 'not_a_participant' THEN
    RAISE EXCEPTION 'A third authenticated player read a private match: %', v_outsider_result;
  END IF;
  v_outsider_result := public.vexforge_turn_v7_submit_action(
    v_session_id, 4, 'local-pvp-outsider-action-1', '{"kind":"end_turn"}'::jsonb
  );
  IF v_outsider_result->>'error' <> 'not_a_participant' THEN
    RAISE EXCEPTION 'A third authenticated player submitted to a private match: %', v_outsider_result;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
  SELECT state INTO v_state
    FROM public.vexforge_turn_sessions_v7
   WHERE id = v_session_id;
  SELECT jsonb_agg(
           CASE WHEN unit->>'slot' = 'champion'
                THEN jsonb_set(unit, '{hp}', '1'::jsonb, true)
                ELSE jsonb_set(
                       jsonb_set(unit, '{hp}', '0'::jsonb, true),
                       '{alive}', 'false'::jsonb, true)
           END ORDER BY ord
         )
    INTO v_units
    FROM jsonb_array_elements(v_state#>'{teams,b}')
      WITH ORDINALITY AS items(unit, ord);
  v_state := jsonb_set(v_state, '{teams,b}', v_units, true);
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state, state_hash = md5(v_state::text)
   WHERE id = v_session_id;

  v_a_state := public.vexforge_turn_v7_get_state(v_session_id);
  SELECT action INTO v_attack
    FROM jsonb_array_elements(v_a_state->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'attack'
     AND action->>'target_id' = (
       SELECT unit->>'unit_id'
         FROM jsonb_array_elements(v_a_state#>'{board,b}') AS units(unit)
        WHERE unit->>'slot' = 'champion'
     )
   LIMIT 1;
  IF v_attack IS NULL THEN
    RAISE EXCEPTION 'PvP champion was not targetable after its guard line fell';
  END IF;
  v_action_result := public.vexforge_turn_v7_submit_action(
    v_session_id, (v_a_state->>'event_seq')::bigint,
    'local-pvp-complete-0001', v_attack
  );
  IF COALESCE((v_action_result->>'ok')::boolean, false) IS NOT TRUE
     OR v_action_result->>'status' <> 'active'
     OR v_action_result->>'phase' <> 'response'
     OR v_action_result->>'current_actor_side' <> 'b' THEN
    RAISE EXCEPTION 'PvP attack did not open the defender response window';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
  v_b_state := public.vexforge_turn_v7_get_state(v_session_id);
  SELECT action INTO v_attack
    FROM jsonb_array_elements(v_b_state->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'pass_priority'
   LIMIT 1;
  IF v_attack IS NULL THEN
    RAISE EXCEPTION 'PvP defender was not offered the server-defined response action';
  END IF;
  v_action_result := public.vexforge_turn_v7_submit_action(
    v_session_id, (v_b_state->>'event_seq')::bigint,
    'local-pvp-response-0001', v_attack
  );
  IF COALESCE((v_action_result->>'ok')::boolean, false) IS NOT TRUE
     OR v_action_result->>'status' <> 'completed'
     OR v_action_result#>>'{outcome,winner_side}' <> 'a'
     OR COALESCE((v_action_result->>'rewards_granted')::boolean, true)
     OR NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_action_result->'events') AS items(event)
        WHERE event->>'event_type' = 'combat_completed'
     ) THEN
    RAISE EXCEPTION 'PvP did not close authoritatively without rewards: %', v_action_result;
  END IF;

  SELECT count(*), min(event_seq), max(event_seq)
    INTO v_count, v_min_seq, v_max_seq
    FROM public.vexforge_turn_events_v7
   WHERE session_id = v_session_id;
  IF v_count <> v_max_seq OR v_min_seq <> 1 THEN
    RAISE EXCEPTION 'PvP event replay sequence is not contiguous: %, %, %',
      v_count, v_min_seq, v_max_seq;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.vexforge_turn_events_v7 AS e
     WHERE e.session_id = v_session_id
       AND e.state_hash <> md5(e.state_snapshot::text)
  ) THEN
    RAISE EXCEPTION 'PvP replay contains a mismatched state hash';
  END IF;
  SELECT events INTO v_events
    FROM (SELECT v_action_result->'events' AS events) AS result;
  IF jsonb_array_length(v_events) <> v_count
     OR v_events#>>'{1,event_type}' <> 'session_joined' THEN
    RAISE EXCEPTION 'PvP replay omitted the room join or event history: %', v_events;
  END IF;
  IF has_table_privilege('authenticated', 'public.vexforge_turn_sessions_v7', 'SELECT')
     OR has_table_privilege('authenticated', 'public.vexforge_turn_events_v7', 'SELECT')
     OR has_table_privilege('authenticated', 'public.vexforge_turn_idempotency_v7', 'SELECT')
     OR has_function_privilege('anon', 'public.vexforge_turn_v7_discover_pvp_rooms(integer)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.vexforge_turn_v7_discover_pvp_rooms(integer)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.vexforge_turn_v7_create_pvp_room(text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.vexforge_turn_v7_create_pvp_room(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.vexforge_turn_v7_join_pvp_room(uuid,text)', 'EXECUTE') IS FALSE THEN
    RAISE EXCEPTION 'V7 PvP room permissions are not least-privilege';
  END IF;

  RAISE NOTICE 'V7 local PvP room checks passed for session %', v_session_id;
END;
$$;
