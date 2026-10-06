-- VEXFORGE V7 PvP rooms: private authenticated discovery, server-built
-- formations, alternating turns, and no settlement/rewards.
-- This migration is additive and must not be applied to live Supabase here.

ALTER TABLE public.vexforge_turn_events_v7
  DROP CONSTRAINT IF EXISTS vexforge_turn_events_v7_event_type_check;

ALTER TABLE public.vexforge_turn_events_v7
  ADD CONSTRAINT vexforge_turn_events_v7_event_type_check
  CHECK (event_type IN (
    'session_started', 'session_joined', 'attack_declared', 'attack_resolved',
    'formation_changed', 'turn_ended', 'combat_completed'
  ));

ALTER TABLE public.vexforge_turn_sessions_v7
  DROP CONSTRAINT IF EXISTS vexforge_turn_v7_controller_check;

ALTER TABLE public.vexforge_turn_sessions_v7
  ADD CONSTRAINT vexforge_turn_v7_controller_check
  CHECK (
    (controller_b = 'ai' AND player_b_id IS NULL) OR
    (controller_b = 'human' AND (
      (mode = 'pvp' AND player_b_id IS NULL) OR
      (player_b_id IS NOT NULL AND player_b_id <> player_a_id)
    ))
  );

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_create_pvp_room(
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
  v_existing public.vexforge_turn_sessions_v7%ROWTYPE;
  v_session_id uuid;
  v_units_a jsonb;
  v_state jsonb;
  v_hash text;
  v_response jsonb;
  v_key text := btrim(COALESCE(p_idempotency_key, ''));
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  IF length(v_key) < 8 OR length(v_key) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_idempotency_key');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = v_auth
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  SELECT * INTO v_existing
    FROM public.vexforge_turn_sessions_v7
   WHERE player_a_id = v_player_id
     AND start_idempotency_key = v_key;
  IF FOUND THEN
    IF v_existing.mode <> 'pvp' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN public._vexforge_turn_v7_project(
      v_existing.id, v_player_id, v_existing.state
    ) || jsonb_build_object(
      'awaiting_opponent', v_existing.player_b_id IS NULL,
      'rewards_granted', false
    );
  END IF;

  v_units_a := public._vexforge_turn_v7_build_side(v_player_id, 'a');
  IF jsonb_array_length(v_units_a) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active_deck_required');
  END IF;

  -- Side B remains empty until the invited participant joins. Setting the
  -- actor to B prevents the room creator from submitting actions in the lobby.
  v_state := jsonb_build_object(
    'schema_version', 7,
    'ruleset_version', 'vexforge_turn_v7_pvp_1',
    'base_rules_version', 'forge_formation_t2',
    'profile', 'pvp_no_rewards_v1',
    'mode', 'pvp',
    'status', 'active',
    'phase', 'main',
    'round', 1,
    'turn_index', 0,
    'event_seq', 0,
    'current_actor_side', 'b',
    'awaiting_opponent', true,
    'pending_attack', 'null'::jsonb,
    'winner_side', 'null'::jsonb,
    'completion_reason', 'null'::jsonb,
    'teams', jsonb_build_object('a', v_units_a, 'b', '[]'::jsonb)
  );

  INSERT INTO public.vexforge_turn_sessions_v7(
    player_a_id, player_b_id, controller_b, mode, ruleset_version, profile,
    status, current_actor_side, phase, state, state_hash, start_idempotency_key
  ) VALUES (
    v_player_id, NULL, 'human', 'pvp', 'vexforge_turn_v7_pvp_1',
    'pvp_no_rewards_v1', 'active', 'b', 'main', v_state,
    md5(v_state::text), v_key
  )
  ON CONFLICT (player_a_id, start_idempotency_key) DO NOTHING
  RETURNING id INTO v_session_id;

  IF v_session_id IS NULL THEN
    SELECT * INTO v_existing
      FROM public.vexforge_turn_sessions_v7
     WHERE player_a_id = v_player_id
       AND start_idempotency_key = v_key;
    IF NOT FOUND OR v_existing.mode <> 'pvp' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN public._vexforge_turn_v7_project(
      v_existing.id, v_player_id, v_existing.state
    ) || jsonb_build_object(
      'awaiting_opponent', v_existing.player_b_id IS NULL,
      'rewards_granted', false
    );
  END IF;

  v_state := jsonb_set(v_state, '{session_id}', to_jsonb(v_session_id::text), true);
  v_state := jsonb_set(v_state, '{event_seq}', '1'::jsonb, true);
  v_hash := md5(v_state::text);
  UPDATE public.vexforge_turn_sessions_v7
     SET state = v_state, state_hash = v_hash, event_seq = 1,
         updated_at = now()
   WHERE id = v_session_id;

  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type, event_payload,
    state_snapshot, state_hash
  ) VALUES (
    v_session_id, 1, 'system', 'session_started',
    jsonb_build_object(
      'mode', 'pvp',
      'profile', 'pvp_no_rewards_v1',
      'status', 'waiting_for_opponent',
      'rewards_granted', false
    ),
    v_state, v_hash
  );

  v_response := public._vexforge_turn_v7_project(
    v_session_id, v_player_id, v_state
  );
  RETURN v_response || jsonb_build_object(
    'awaiting_opponent', true,
    'rewards_granted', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_discover_pvp_rooms(
  p_limit integer DEFAULT 16
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_player_id uuid;
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 16), 32));
  v_rooms jsonb;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = v_auth
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'session_id', rooms.id,
      'created_at', rooms.created_at,
      'ruleset_version', rooms.ruleset_version,
      'rewards_granted', false
    ) ORDER BY rooms.created_at DESC, rooms.id
  ), '[]'::jsonb)
    INTO v_rooms
    FROM (
      SELECT s.id, s.created_at, s.ruleset_version
        FROM public.vexforge_turn_sessions_v7 AS s
       WHERE s.mode = 'pvp'
         AND s.controller_b = 'human'
         AND s.status = 'active'
         AND s.player_b_id IS NULL
         AND s.player_a_id <> v_player_id
       ORDER BY s.created_at DESC, s.id
       LIMIT v_limit
    ) AS rooms;

  RETURN jsonb_build_object(
    'ok', true,
    'rooms', v_rooms,
    'count', jsonb_array_length(v_rooms)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_join_pvp_room(
  p_session_id uuid,
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
  v_session public.vexforge_turn_sessions_v7%ROWTYPE;
  v_existing public.vexforge_turn_idempotency_v7%ROWTYPE;
  v_units_b jsonb;
  v_state jsonb;
  v_seq bigint;
  v_hash text;
  v_fingerprint text;
  v_response jsonb;
  v_key text := btrim(COALESCE(p_idempotency_key, ''));
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  IF p_session_id IS NULL OR length(v_key) < 8 OR length(v_key) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_request');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = v_auth
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  SELECT * INTO v_session
    FROM public.vexforge_turn_sessions_v7
   WHERE id = p_session_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  IF v_session.mode <> 'pvp' OR v_session.controller_b <> 'human' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'room_not_joinable');
  END IF;
  IF v_player_id = v_session.player_a_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_join_own_room');
  END IF;

  v_fingerprint := md5('v7-pvp-join|' || p_session_id::text);
  SELECT * INTO v_existing
    FROM public.vexforge_turn_idempotency_v7
   WHERE session_id = p_session_id
     AND player_id = v_player_id
     AND idempotency_key = v_key;
  IF FOUND THEN
    IF v_existing.request_fingerprint <> v_fingerprint THEN
      RETURN jsonb_build_object('ok', false, 'error', 'idempotency_key_reused');
    END IF;
    RETURN v_existing.response_json || jsonb_build_object('idempotent', true);
  END IF;

  IF v_session.player_b_id = v_player_id THEN
    RETURN public._vexforge_turn_v7_project(
      p_session_id, v_player_id, v_session.state
    ) || jsonb_build_object(
      'awaiting_opponent', false,
      'already_joined', true,
      'rewards_granted', false
    );
  END IF;
  IF v_session.player_b_id IS NOT NULL OR v_session.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'room_not_joinable');
  END IF;

  v_units_b := public._vexforge_turn_v7_build_side(v_player_id, 'b');
  IF jsonb_array_length(v_units_b) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active_deck_required');
  END IF;

  v_state := jsonb_set(v_session.state, '{teams,b}', v_units_b, true);
  v_state := jsonb_set(v_state, '{current_actor_side}', '"a"'::jsonb, true);
  v_state := jsonb_set(v_state, '{awaiting_opponent}', 'false'::jsonb, true);
  v_seq := v_session.event_seq + 1;
  v_state := jsonb_set(v_state, '{event_seq}', to_jsonb(v_seq), true);
  v_hash := md5(v_state::text);

  UPDATE public.vexforge_turn_sessions_v7
     SET player_b_id = v_player_id,
         state = v_state,
         state_hash = v_hash,
         event_seq = v_seq,
         current_actor_side = 'a',
         updated_at = now()
   WHERE id = p_session_id;

  INSERT INTO public.vexforge_turn_events_v7(
    session_id, event_seq, actor_side, event_type, event_payload,
    state_snapshot, state_hash
  ) VALUES (
    p_session_id, v_seq, 'b', 'session_joined',
    jsonb_build_object('participant_side', 'b', 'rewards_granted', false),
    v_state, v_hash
  );

  v_response := public._vexforge_turn_v7_project(
    p_session_id, v_player_id, v_state
  ) || jsonb_build_object(
    'awaiting_opponent', false,
    'rewards_granted', false
  );
  INSERT INTO public.vexforge_turn_idempotency_v7(
    session_id, player_id, idempotency_key, request_fingerprint, response_json
  ) VALUES (
    p_session_id, v_player_id, v_key, v_fingerprint, v_response
  );
  RETURN v_response;
END;
$$;

-- Preserve the existing participant check and project the lobby state without
-- exposing session rows or creating a direct table-read path.
CREATE OR REPLACE FUNCTION public.vexforge_turn_v7_get_state(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_player_id uuid;
  v_session public.vexforge_turn_sessions_v7%ROWTYPE;
  v_response jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;
  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;
  SELECT * INTO v_session
    FROM public.vexforge_turn_sessions_v7
   WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  v_response := public._vexforge_turn_v7_project(
    p_session_id, v_player_id, v_session.state
  );
  IF COALESCE((v_response->>'ok')::boolean, false) IS NOT TRUE THEN
    RETURN v_response;
  END IF;
  RETURN v_response || jsonb_build_object(
    'awaiting_opponent',
    v_session.mode = 'pvp' AND v_session.player_b_id IS NULL
  );
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
  v_result jsonb;
BEGIN
  v_result := public.vexforge_turn_v7_get_state(p_session_id);
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE THEN
    RETURN v_result;
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'event_seq', v_result->'event_seq',
    'state_hash', v_result->'state_hash',
    'awaiting_opponent', v_result->'awaiting_opponent',
    'legal_actions', v_result->'legal_actions'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.vexforge_turn_v7_create_pvp_room(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_discover_pvp_rooms(integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_join_pvp_room(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_get_state(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vexforge_turn_v7_legal_actions(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_create_pvp_room(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_discover_pvp_rooms(integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_join_pvp_room(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_get_state(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_turn_v7_legal_actions(uuid)
  TO authenticated;
