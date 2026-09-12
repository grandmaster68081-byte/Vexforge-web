-- T1-B: canonical player energy regeneration.
--
-- Energy already lives in player_progress. This migration adds only the
-- persistent timestamp needed to make passive regeneration authoritative and
-- replayable; it does not create a parallel energy table.

ALTER TABLE public.player_progress
  ADD COLUMN IF NOT EXISTS energy_last_regen timestamptz NOT NULL DEFAULT now();

-- Existing rows intentionally start their regeneration clock at migration
-- time. Backfilling from updated_at could retroactively grant energy based on
-- unrelated XP/profile writes.

ALTER TABLE public.player_progress
  DROP CONSTRAINT IF EXISTS player_progress_energy_cap_check;

ALTER TABLE public.player_progress
  ADD CONSTRAINT player_progress_energy_cap_check
  CHECK (energy >= 0 AND energy <= max_energy);

CREATE OR REPLACE FUNCTION public.refresh_player_energy(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_progress public.player_progress%ROWTYPE;
  v_now timestamptz := now();
  v_elapsed_seconds bigint;
  v_regen_units integer;
  v_energy integer;
  v_last_regen timestamptz;
BEGIN
  PERFORM public.assert_caller_is_player(p_player_id);

  SELECT *
  INTO v_progress
  FROM public.player_progress
  WHERE player_id = p_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_progress');
  END IF;

  v_energy := LEAST(GREATEST(v_progress.energy, 0), v_progress.max_energy);
  v_last_regen := COALESCE(v_progress.energy_last_regen, v_now);

  IF v_energy >= v_progress.max_energy THEN
    IF v_progress.energy <> v_progress.max_energy
       OR v_progress.energy_last_regen IS DISTINCT FROM v_now THEN
      UPDATE public.player_progress
      SET energy = v_progress.max_energy,
          energy_last_regen = v_now
      WHERE player_id = p_player_id;
    END IF;
    RETURN jsonb_build_object(
      'ok', true,
      'energy', v_progress.max_energy,
      'max_energy', v_progress.max_energy,
      'energy_last_regen', v_now
    );
  END IF;

  v_elapsed_seconds := GREATEST(
    0,
    FLOOR(EXTRACT(EPOCH FROM (v_now - v_last_regen)))::bigint
  );
  v_regen_units := FLOOR(v_elapsed_seconds / 600)::integer;

  IF v_regen_units > 0 THEN
    v_energy := LEAST(
      v_progress.max_energy,
      v_energy + v_regen_units
    );

    IF v_energy >= v_progress.max_energy THEN
      v_last_regen := v_now;
    ELSE
      v_last_regen := v_last_regen + make_interval(mins => v_regen_units * 10);
    END IF;

    UPDATE public.player_progress
    SET energy = v_energy,
        energy_last_regen = v_last_regen
    WHERE player_id = p_player_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'energy', v_energy,
    'max_energy', v_progress.max_energy,
    'energy_last_regen', v_last_regen
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_player_energy(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.sync_player_energy()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT id
  INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_player');
  END IF;

  RETURN public.refresh_player_energy(v_player_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.sync_player_energy() TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_init_player_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.player_progress (
    id, player_id, level, xp, xp_to_next,
    energy, max_energy, energy_last_regen, tutorial_step, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), NEW.id, 1, 0, 100,
    100, 100, now(), 1, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_mission(p_player uuid, p_mission uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_mission public.missions%ROWTYPE;
  v_energy integer;
  v_max_energy integer;
  v_cost integer;
  v_cooldown integer;
  v_last_started timestamptz;
  v_cooldown_ends timestamptz;
  v_run_id uuid;
  v_idem text;
  v_now timestamptz := now();
BEGIN
  PERFORM public.assert_caller_is_player(p_player);
  PERFORM public.refresh_player_energy(p_player);

  SELECT *
  INTO v_mission
  FROM public.missions
  WHERE id = p_mission
    AND active = true
    AND COALESCE(production_ready, true) = true
    AND COALESCE(system_locked, false) = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_mission');
  END IF;

  v_cost := GREATEST(COALESCE(v_mission.energy_cost, 0), 0);
  v_cooldown := GREATEST(COALESCE(v_mission.cooldown_seconds, 0), 0);

  SELECT energy, max_energy
  INTO v_energy, v_max_energy
  FROM public.player_progress
  WHERE player_id = p_player
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_progress');
  END IF;

  SELECT started_at
  INTO v_last_started
  FROM public.mission_runs
  WHERE player_id = p_player
    AND mission_id = p_mission
    AND status::text NOT IN ('failed', 'cancelled')
  ORDER BY started_at DESC NULLS LAST
  LIMIT 1;

  IF v_cooldown > 0
     AND v_last_started IS NOT NULL
     AND v_last_started + make_interval(secs => v_cooldown) > v_now THEN
    v_cooldown_ends := v_last_started + make_interval(secs => v_cooldown);
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'mission_cooldown',
      'energy', v_energy,
      'max_energy', v_max_energy,
      'cooldown_ends_at', v_cooldown_ends,
      'remaining_seconds',
        GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_cooldown_ends - v_now)))::integer)
    );
  END IF;

  IF v_energy < v_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_energy',
      'energy', v_energy,
      'max_energy', v_max_energy,
      'required', v_cost
    );
  END IF;

  UPDATE public.player_progress
  SET energy = energy - v_cost
  WHERE player_id = p_player;

  v_idem := 'web-' || extract(epoch FROM v_now)::bigint || '-' ||
    substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO public.mission_runs (
    mission_id,
    player_id,
    idempotency_key,
    status,
    energy_spent,
    xp_reward,
    ingame_reward,
    tradeable_reward,
    metadata,
    started_at
  )
  VALUES (
    p_mission,
    p_player,
    v_idem,
    'pending',
    v_cost,
    COALESCE(v_mission.reward_xp, 0),
    COALESCE(v_mission.reward_vex_ingame, 0),
    COALESCE(v_mission.reward_vex_tradeable, 0),
    jsonb_build_object(
      'mission_code', v_mission.code,
      'mission_name', v_mission.name,
      'cooldown_seconds', v_cooldown,
      'energy_before', v_energy,
      'energy_after', v_energy - v_cost
    ),
    v_now
  )
  RETURNING id INTO v_run_id;

  RETURN jsonb_build_object(
    'success', true,
    'run_id', v_run_id,
    'energy', v_energy - v_cost,
    'max_energy', v_max_energy,
    'energy_spent', v_cost,
    'xp_reward', COALESCE(v_mission.reward_xp, 0),
    'ingame_reward', COALESCE(v_mission.reward_vex_ingame, 0),
    'tradeable_reward', COALESCE(v_mission.reward_vex_tradeable, 0)
  );
END;
$function$;