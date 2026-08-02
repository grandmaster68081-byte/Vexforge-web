-- T1-G: authoritative and idempotent raid lifecycle.
-- Reuses the live raid_runs / raid_participants / raid_rewards schema.

CREATE OR REPLACE FUNCTION public.vexforge_join_raid(p_raid_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
  v_raid record;
  v_participant_id uuid;
  v_max_players integer;
  v_current_count integer;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Lock the raid before checking capacity so concurrent joins cannot
  -- exceed max_participants.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid not found');
  END IF;
  IF v_raid.status NOT IN ('pending', 'active') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is not open for joining',
      'status', v_raid.status
    );
  END IF;

  SELECT id INTO v_participant_id
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND player_id = v_player_id
     AND status != 'left'
   LIMIT 1;
  IF v_participant_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_joined', true,
      'participant_id', v_participant_id
    );
  END IF;

  v_max_players := COALESCE(
    (v_raid.metadata->>'max_participants')::integer,
    public.vexforge_get_policy_numeric('raid_max_participants', 20)::integer
  );
  SELECT count(*) INTO v_current_count
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND status != 'left';

  IF v_current_count >= v_max_players THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is full',
      'max', v_max_players,
      'current', v_current_count
    );
  END IF;

  INSERT INTO public.raid_participants (
    raid_run_id, player_id, contribution, status, metadata
  ) VALUES (
    p_raid_run_id, v_player_id, 0, 'joined',
    jsonb_build_object('joined_at', now())
  )
  ON CONFLICT (raid_run_id, player_id) DO UPDATE
    SET status = CASE
      WHEN public.raid_participants.status = 'left' THEN 'joined'
      ELSE public.raid_participants.status
    END,
    updated_at = now()
  RETURNING id INTO v_participant_id;

  IF v_raid.status = 'pending' THEN
    UPDATE public.raid_runs
       SET status = 'active', started_at = COALESCE(started_at, now()), updated_at = now()
     WHERE id = p_raid_run_id;
  END IF;

  PERFORM public.emit_game_event(
    v_player_id,
    'raid_joined',
    p_raid_run_id::text,
    jsonb_build_object(
      'raid_code', v_raid.raid_code,
      'participant_id', v_participant_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'participant_id', v_participant_id,
    'raid_code', v_raid.raid_code,
    'raid_status', CASE WHEN v_raid.status = 'pending' THEN 'active' ELSE v_raid.status END,
    'participants', v_current_count + 1
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.vexforge_contribute_raid(
  p_raid_run_id uuid,
  p_contribution bigint DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
  v_participant record;
  v_raid record;
  v_total_contrib bigint;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  IF p_contribution IS NULL OR p_contribution <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Invalid contribution');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Lock the raid and participant so completion or another contribution
  -- cannot interleave with this update.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL OR v_raid.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid is not active');
  END IF;

  SELECT * INTO v_participant
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND player_id = v_player_id
     AND status = 'joined'
   FOR UPDATE;
  IF v_participant.id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Not a participant in this raid. Join first.'
    );
  END IF;

  p_contribution := LEAST(p_contribution, 10000);

  UPDATE public.raid_participants
     SET contribution = contribution + p_contribution,
         metadata = metadata || jsonb_build_object('last_contribution_at', now()),
         updated_at = now()
   WHERE id = v_participant.id
  RETURNING contribution INTO v_total_contrib;

  PERFORM public.emit_game_event(
    v_player_id,
    'raid_contribution',
    p_raid_run_id::text,
    jsonb_build_object(
      'contribution', p_contribution,
      'total', v_total_contrib
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'contribution_added', p_contribution,
    'total_contribution', v_total_contrib,
    'raid_code', v_raid.raid_code
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.vexforge_complete_raid(p_raid_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_raid record;
  v_participant record;
  v_reward_vex numeric;
  v_reward_xp numeric;
  v_reference_id text;
  v_rewarded integer := 0;
  v_total_contrib bigint;
  v_total_vex_distributed numeric := 0;
  v_total_xp_distributed bigint := 0;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  -- Manual completion is an admin operation. service_role is allowed for
  -- trusted automation; browser users must be an admin player.
  IF auth.role() <> 'service_role' THEN
    SELECT id, (is_admin OR is_super_admin)
      INTO v_caller_id, v_is_admin
      FROM public.players
     WHERE auth_user_id = auth.uid()
     LIMIT 1;
    IF v_caller_id IS NULL OR NOT COALESCE(v_is_admin, false) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Admin access required');
    END IF;
  END IF;

  -- The row lock makes completion a single transaction. A retry after the
  -- first completion returns success without issuing rewards again.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid not found');
  END IF;
  IF v_raid.status = 'completed' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_completed', true,
      'raid_code', v_raid.raid_code,
      'players_rewarded', 0,
      'status', 'completed'
    );
  END IF;
  IF v_raid.status <> 'active' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is not active',
      'status', v_raid.status
    );
  END IF;

  SELECT COALESCE(SUM(contribution), 1)
    INTO v_total_contrib
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND status = 'joined';

  v_reward_vex := public.vexforge_get_policy_numeric('raid_completion_vex_reward', 100);
  v_reward_xp := public.vexforge_get_policy_numeric('raid_completion_xp_reward', 50);

  FOR v_participant IN
    SELECT id, player_id, contribution
      FROM public.raid_participants
     WHERE raid_run_id = p_raid_run_id
       AND status = 'joined'
     FOR UPDATE
  LOOP
    DECLARE
      v_share numeric := GREATEST(0.1, v_participant.contribution::numeric / v_total_contrib);
      v_player_reward_vex numeric := ROUND(v_reward_vex * v_share, 2);
      v_player_reward_xp integer := GREATEST(0, ROUND(v_reward_xp * v_share)::integer);
      v_level integer;
      v_xp bigint;
      v_xp_required integer;
    BEGIN
      v_player_reward_vex := GREATEST(
        v_player_reward_vex,
        public.vexforge_get_policy_numeric('boss_attack_min_reward', 1)
      );
      v_reference_id := 'raid_reward_' || p_raid_run_id::text || '_' ||
        v_participant.player_id::text;

      PERFORM public.wallet_tx(
        v_participant.player_id,
        'vex_ingame',
        v_player_reward_vex,
        'in',
        v_reference_id,
        'raid_participants',
        v_participant.id,
        jsonb_build_object(
          'raid_code', v_raid.raid_code,
          'contribution_share', v_share,
          'contribution', v_participant.contribution
        )
      );

      INSERT INTO public.raid_rewards (
        raid_run_id, player_id, reward_type, reward_currency, amount, metadata
      ) VALUES (
        p_raid_run_id,
        v_participant.player_id,
        'completion',
        'vex_ingame',
        v_player_reward_vex,
        jsonb_build_object(
          'share', v_share,
          'contribution', v_participant.contribution
        )
      );

      -- Apply XP atomically without using the legacy add_player_xp helper,
      -- whose live event-log call has an incompatible signature.
      INSERT INTO public.player_progress (
        player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
      ) VALUES (
        v_participant.player_id,
        1,
        0,
        public.get_xp_required(1),
        100,
        100,
        now(),
        now()
      )
      ON CONFLICT (player_id) DO NOTHING;

      SELECT level, xp
        INTO v_level, v_xp
        FROM public.player_progress
       WHERE player_id = v_participant.player_id
       FOR UPDATE;

      v_xp := v_xp + v_player_reward_xp;
      v_xp_required := public.get_xp_required(v_level);
      WHILE v_xp >= v_xp_required LOOP
        v_xp := v_xp - v_xp_required;
        v_level := v_level + 1;
        v_xp_required := public.get_xp_required(v_level);
      END LOOP;

      UPDATE public.player_progress
         SET level = v_level,
             xp = v_xp,
             xp_to_next = v_xp_required,
             updated_at = now()
       WHERE player_id = v_participant.player_id;

      INSERT INTO public.raid_rewards (
        raid_run_id, player_id, reward_type, reward_currency, amount, metadata
      ) VALUES (
        p_raid_run_id,
        v_participant.player_id,
        'completion',
        'xp',
        v_player_reward_xp,
        jsonb_build_object(
          'share', v_share,
          'contribution', v_participant.contribution,
          'level_after', v_level,
          'xp_after', v_xp
        )
      );

      UPDATE public.raid_participants
         SET status = 'rewarded', updated_at = now()
       WHERE id = v_participant.id;

      PERFORM public.emit_game_event(
        v_participant.player_id,
        'raid_completed',
        p_raid_run_id::text,
        jsonb_build_object(
          'reward_vex', v_player_reward_vex,
          'reward_xp', v_player_reward_xp,
          'share', v_share,
          'raid_code', v_raid.raid_code
        )
      );

      v_rewarded := v_rewarded + 1;
      v_total_vex_distributed := v_total_vex_distributed + v_player_reward_vex;
      v_total_xp_distributed := v_total_xp_distributed + v_player_reward_xp;
    END;
  END LOOP;

  UPDATE public.raid_runs
     SET status = 'completed', ended_at = now(), updated_at = now()
   WHERE id = p_raid_run_id;

  RETURN jsonb_build_object(
    'ok', true,
    'raid_code', v_raid.raid_code,
    'players_rewarded', v_rewarded,
    'total_vex_distributed', v_total_vex_distributed,
    'total_xp_distributed', v_total_xp_distributed,
    'status', 'completed'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.vexforge_join_raid(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vexforge_join_raid(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.vexforge_join_raid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_join_raid(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.vexforge_contribute_raid(uuid, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vexforge_contribute_raid(uuid, bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.vexforge_contribute_raid(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_contribute_raid(uuid, bigint) TO service_role;

REVOKE ALL ON FUNCTION public.vexforge_complete_raid(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vexforge_complete_raid(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.vexforge_complete_raid(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_complete_raid(uuid) TO service_role;