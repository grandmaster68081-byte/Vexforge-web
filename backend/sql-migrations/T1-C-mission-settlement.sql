-- T1-C: authoritative and idempotent mission settlement.
--
-- Prerequisite: apply T1-C-mission-run-completed-status.sql first.
--
-- execute_mission reserves energy and creates a pending mission_run.
-- claim_mission_reward is the only completion boundary:
--   pending -> completed -> claimed
-- Completion hooks are intentionally triggered only at the completed state.
-- Wallet credits are made through the canonical ledger helper and are
-- protected by mission_runs.reward_reference_id plus the row lock below.

CREATE OR REPLACE FUNCTION public.mission_xp_hook()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public, pg_temp
AS $function$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    PERFORM public.add_player_xp(
      NEW.player_id,
      COALESCE(NEW.xp_reward, 0)::integer,
      'mission'
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_mission_xp ON public.mission_runs;
CREATE TRIGGER trg_mission_xp
  AFTER UPDATE OF status ON public.mission_runs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.mission_xp_hook();

CREATE OR REPLACE FUNCTION public.hook_mission_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public, pg_temp
AS $function$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    PERFORM public.emit_game_event(
      NEW.player_id,
      'mission_completed',
      'mission_runs',
      NEW.id::text,
      jsonb_build_object(
        'reward', NEW.ingame_reward,
        'tradeable_reward', NEW.tradeable_reward,
        'xp', NEW.xp_reward
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_mission_event ON public.mission_runs;
CREATE TRIGGER trg_mission_event
  AFTER UPDATE OF status ON public.mission_runs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.hook_mission_event();

CREATE OR REPLACE FUNCTION public.claim_mission_reward(
  p_player_id uuid,
  p_mission_run_id uuid,
  p_reference_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions, pg_temp
AS $function$
DECLARE
  v_run public.mission_runs%ROWTYPE;
  v_reference_id text;
  v_ingame numeric;
  v_tradeable numeric;
  v_xp bigint;
BEGIN
  PERFORM public.assert_caller_is_player(p_player_id);

  IF p_mission_run_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;

  v_reference_id := NULLIF(btrim(COALESCE(p_reference_id, '')), '');
  IF v_reference_id IS NULL THEN
    v_reference_id := 'mission:' || p_mission_run_id::text;
  END IF;

  SELECT *
  INTO v_run
  FROM public.mission_runs
  WHERE id = p_mission_run_id
    AND player_id = p_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;

  -- A retry after a committed settlement is successful and side-effect free.
  IF v_run.status = 'claimed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'claimed', true,
      'idempotent', true,
      'mission_run_id', v_run.id,
      'reference_id', COALESCE(v_run.reward_reference_id, v_reference_id),
      'xp_applied', COALESCE(v_run.xp_reward, 0),
      'ingame_applied', COALESCE(v_run.ingame_reward, 0),
      'tradeable_applied', COALESCE(v_run.tradeable_reward, 0)
    );
  END IF;

  IF v_run.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'mission_run_not_settleable',
      'status', v_run.status::text
    );
  END IF;

  v_ingame := GREATEST(COALESCE(v_run.ingame_reward, 0), 0);
  v_tradeable := GREATEST(COALESCE(v_run.tradeable_reward, 0), 0);
  v_xp := GREATEST(COALESCE(v_run.xp_reward, 0), 0);

  -- This transition activates the existing completion hooks exactly once.
  UPDATE public.mission_runs
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = v_run.id
    AND status = 'pending';

  -- The helper writes the canonical economy ledger while locking the wallet.
  -- Zero-value rewards do not create invalid ledger rows.
  IF v_ingame > 0 THEN
    PERFORM public.safe_wallet_transaction(
      p_player_id,
      'vex_ingame',
      v_ingame,
      'credit',
      v_reference_id || ':ingame',
      'mission_runs',
      v_run.id,
      jsonb_build_object('mission_run_id', v_run.id, 'settlement', 'mission')
    );
  END IF;

  IF v_tradeable > 0 THEN
    PERFORM public.safe_wallet_transaction(
      p_player_id,
      'vex_tradeable',
      v_tradeable,
      'credit',
      v_reference_id || ':tradeable',
      'mission_runs',
      v_run.id,
      jsonb_build_object('mission_run_id', v_run.id, 'settlement', 'mission')
    );
  END IF;

  UPDATE public.mission_runs
  SET status = 'claimed',
      reward_reference_id = v_reference_id,
      claimed_at = now(),
      updated_at = now()
  WHERE id = v_run.id
    AND status = 'completed';

  INSERT INTO public.mission_completion_log (
    id,
    mission_run_id,
    player_id,
    reward_vex,
    reward_xp,
    reward_gold,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_run.id,
    p_player_id,
    v_ingame,
    v_xp,
    NULL,
    now()
  );

  PERFORM public.log_event(
    p_player_id,
    'MISSION_CLAIMED',
    v_reference_id,
    'mission_runs',
    v_run.id::text,
    jsonb_build_object(
      'ingame_reward', v_ingame,
      'tradeable_reward', v_tradeable,
      'xp', v_xp
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'claimed', true,
    'idempotent', false,
    'mission_run_id', v_run.id,
    'reference_id', v_reference_id,
    'xp_applied', v_xp,
    'ingame_applied', v_ingame,
    'tradeable_applied', v_tradeable
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_mission_reward(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_mission_reward(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mission_reward(uuid, uuid, text) TO service_role;