-- ============================================================
-- R.3 FIX: execute_mission — descuento real de energía en player_progress
-- Ejecutar en SQL Editor de Supabase
-- Fecha: 2026-07-21 · Chat 78
-- ============================================================

-- 1. Fix vexf_consume_energy: ahora hace UPDATE real en player_progress
CREATE OR REPLACE FUNCTION public.vexf_consume_energy(p_player_id uuid, p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_energy integer;
  v_max    integer;
BEGIN
  SELECT energy, max_energy INTO v_energy, v_max
  FROM player_progress
  WHERE player_id = p_player_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_progress');
  END IF;

  IF v_energy < p_amount THEN
    RETURN jsonb_build_object(
      'success',  false,
      'reason',   'insufficient_energy',
      'energy',   v_energy,
      'required', p_amount
    );
  END IF;

  UPDATE player_progress
  SET energy = energy - p_amount, updated_at = NOW()
  WHERE player_id = p_player_id;

  RETURN jsonb_build_object(
    'success',    true,
    'energy',     v_energy - p_amount,
    'max_energy', v_max
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.vexf_consume_energy(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexf_consume_energy(uuid, integer) TO service_role;


-- 2. Fix execute_mission: chequeo + descuento de energía antes de crear el run
CREATE OR REPLACE FUNCTION public.execute_mission(p_player uuid, p_mission uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission missions%ROWTYPE;
  v_energy  integer;
  v_cost    integer;
  v_run_id  uuid;
  v_idem    text;
BEGIN
  -- 1. Obtener misión activa
  SELECT * INTO v_mission
  FROM missions
  WHERE id = p_mission AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_mission');
  END IF;

  v_cost := COALESCE(v_mission.energy_cost, 0);

  -- 2. Verificar energía actual del jugador
  SELECT energy INTO v_energy
  FROM player_progress
  WHERE player_id = p_player;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_progress');
  END IF;

  IF v_energy < v_cost THEN
    RETURN jsonb_build_object(
      'success',  false,
      'reason',   'insufficient_energy',
      'energy',   v_energy,
      'required', v_cost
    );
  END IF;

  -- 3. Descontar energía de player_progress
  UPDATE player_progress
  SET energy = energy - v_cost, updated_at = NOW()
  WHERE player_id = p_player;

  -- 4. Crear registro de mission run
  v_idem := 'web-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO mission_runs (
    mission_id, player_id, idempotency_key,
    status, energy_spent,
    xp_reward, ingame_reward, tradeable_reward,
    metadata, started_at
  )
  VALUES (
    p_mission, p_player, v_idem,
    'pending', v_cost,
    COALESCE(v_mission.reward_xp, 0),
    COALESCE(v_mission.reward_vex_ingame, 0),
    COALESCE(v_mission.reward_vex_tradeable, 0),
    jsonb_build_object(
      'mission_code', v_mission.code,
      'mission_name', v_mission.name
    ),
    NOW()
  )
  RETURNING id INTO v_run_id;

  RETURN jsonb_build_object(
    'success',          true,
    'run_id',           v_run_id,
    'xp_reward',        COALESCE(v_mission.reward_xp, 0),
    'ingame_reward',    COALESCE(v_mission.reward_vex_ingame, 0),
    'tradeable_reward', COALESCE(v_mission.reward_vex_tradeable, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_mission(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_mission(uuid, uuid) TO service_role;


-- ============================================================
-- Verificación (debe retornar reason='invalid_mission' con UUIDs falsos):
-- SELECT execute_mission('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
-- ============================================================
