-- T10: cierre autoritativo de un Battle Run cuando el jugador abandona el tablero.
-- No liquida recompensas ni daño; sólo evita dejar ejecuciones en estado started.

CREATE OR REPLACE FUNCTION public.abandon_battle_run(
  p_battle_run_id uuid,
  p_result_snapshot jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
  v_battle public.battle_runs%ROWTYPE;
  v_snapshot jsonb := COALESCE(p_result_snapshot, '{}'::jsonb);
BEGIN
  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  PERFORM public.assert_caller_is_player(v_player_id);

  SELECT * INTO v_battle
  FROM public.battle_runs
  WHERE id = p_battle_run_id
    AND player_id = v_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'battle_run_not_found');
  END IF;

  IF v_battle.status IN ('completed', 'defeated', 'abandoned') THEN
    RETURN COALESCE(v_battle.result_snapshot, '{}'::jsonb)
      || jsonb_build_object(
        'ok', true,
        'battle_run_id', v_battle.id,
        'status', v_battle.status,
        'won', COALESCE(v_battle.outcome, false),
        'idempotent', true
      );
  END IF;

  IF v_battle.status <> 'started' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'battle_run_not_abandonable');
  END IF;

  v_snapshot := v_snapshot || jsonb_build_object(
    'won', false,
    'mode', v_battle.mode,
    'rules_version', v_battle.rules_version,
    'outcome', 'abandoned'
  );

  UPDATE public.battle_runs
  SET status = 'abandoned',
      outcome = false,
      result_snapshot = v_snapshot,
      completed_at = now(),
      updated_at = now()
  WHERE id = v_battle.id;

  RETURN jsonb_build_object(
    'ok', true,
    'battle_run_id', v_battle.id,
    'status', 'abandoned',
    'won', false,
    'idempotent', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.abandon_battle_run(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.abandon_battle_run(uuid, jsonb) TO authenticated, service_role;