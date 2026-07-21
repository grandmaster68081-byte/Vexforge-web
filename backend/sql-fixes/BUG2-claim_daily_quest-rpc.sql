-- ============================================================
    -- BUG-2 FIX: Crear RPC claim_daily_quest
    -- Ejecutar en SQL Editor de Supabase
    -- Fecha: 2026-07-19 · Chat 48
    -- ============================================================

    CREATE OR REPLACE FUNCTION public.claim_daily_quest(p_player_quest_id uuid)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_quest    daily_quests%ROWTYPE;
    v_pq       player_daily_quests%ROWTYPE;
    v_player_id uuid;
    BEGIN
    -- 1. Verificar que la quest existe y está completada
    SELECT * INTO v_pq
    FROM player_daily_quests
    WHERE id = p_player_quest_id AND status = 'completed';

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'claimed', false,
        'reason', 'Quest not found or not completed'
      );
    END IF;

    -- 2. Evitar doble claim
    IF v_pq.claimed_at IS NOT NULL THEN
      RETURN jsonb_build_object(
        'claimed', false,
        'reason', 'Already claimed'
      );
    END IF;

    -- 3. Obtener datos de la quest (rewards)
    SELECT * INTO v_quest FROM daily_quests WHERE id = v_pq.quest_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Quest definition not found');
    END IF;

    v_player_id := v_pq.player_id;

    -- 4. Marcar como claimed
    UPDATE player_daily_quests
    SET status = 'claimed', claimed_at = now()
    WHERE id = p_player_quest_id;

    -- 5. Aplicar VEX al wallet
    IF v_quest.reward_vex_ingame > 0 THEN
      UPDATE wallets
      SET vex_ingame = vex_ingame + v_quest.reward_vex_ingame
      WHERE player_id = v_player_id;
    END IF;

    -- 6. Aplicar XP al progreso
    IF v_quest.reward_xp > 0 THEN
      UPDATE player_progress
      SET xp = xp + v_quest.reward_xp
      WHERE player_id = v_player_id;
    END IF;

    RETURN jsonb_build_object(
      'claimed', true,
      'xp_applied', v_quest.reward_xp,
      'vex_applied', v_quest.reward_vex_ingame
    );
    END;
    $$;

    -- Dar permisos
    GRANT EXECUTE ON FUNCTION public.claim_daily_quest(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.claim_daily_quest(uuid) TO service_role;

    -- Test (debe retornar 'Quest not found or not completed' con UUID falso)
    SELECT claim_daily_quest('00000000-0000-0000-0000-000000000000');
    