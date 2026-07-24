-- ============================================================
    -- IA.2 — DAILY AI CHALLENGE CLAIM RPC
    -- Bloque: IA.2 | Fecha: 2026-07-24 | Estado: PENDING OWNER REVIEW (A2)
    -- ─────────────────────────────────────────────────────────────────────
    -- INSTRUCCIONES PARA EL OWNER:
    -- 1. Revisar la lógica del RPC abajo (seguridad, montos, ventana de claim).
    -- 2. Ejecutar TODO el script en SQL Editor de Supabase.
    -- 3. El frontend ya está conectado — una vez ejecutado, los VEX
    --    se acreditarán automáticamente tras cada victoria del Desafío Diario.
    -- 4. Marcar A2 como RESUELTO en vexforge_project_decisions.
    -- Recompensas: easy=50 VEX · normal=100 VEX · expert=200 VEX (vex_ingame)
    -- ============================================================

    -- ─── PASO 1: Tabla de tracking (idempotencia) ────────────────────────────────
    CREATE TABLE IF NOT EXISTS public.player_daily_ai_claims (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id   uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    date_key    text        NOT NULL,   -- YYYY-MM-DD (UTC)
    difficulty  text        NOT NULL CHECK (difficulty IN ('easy','normal','expert')),
    vex_awarded integer     NOT NULL DEFAULT 0,
    claimed_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(player_id, date_key)          -- 1 claim por jugador por día
    );

    ALTER TABLE public.player_daily_ai_claims ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "player_daily_ai_claims_select_own"
    ON public.player_daily_ai_claims FOR SELECT
    USING (player_id = auth.uid());

    CREATE INDEX IF NOT EXISTS idx_daily_ai_claims_player_date
    ON public.player_daily_ai_claims(player_id, date_key);

    -- ─── PASO 2: RPC claim_daily_ai_challenge ────────────────────────────────────
    CREATE OR REPLACE FUNCTION public.claim_daily_ai_challenge(
    p_date_key  text,    -- YYYY-MM-DD
    p_difficulty text    -- 'easy' | 'normal' | 'expert'
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_player_id  uuid;
    v_vex_reward integer;
    v_rows       integer;
    BEGIN
    -- 1. Verificar sesión autenticada
    v_player_id := auth.uid();
    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Not authenticated');
    END IF;

    -- 2. Validar formato date_key y que no sea futuro
    IF p_date_key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Invalid date format');
    END IF;
    IF p_date_key > to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Cannot claim future date');
    END IF;

    -- 3. Ventana de seguridad: máximo 1 día atrás (anti-retroclam)
    IF p_date_key < to_char((now() AT TIME ZONE 'UTC' - interval '1 day')::date, 'YYYY-MM-DD') THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Claim window expired');
    END IF;

    -- 4. Calcular recompensa VEX según dificultad
    v_vex_reward := CASE p_difficulty
      WHEN 'easy'   THEN 50
      WHEN 'normal' THEN 100
      WHEN 'expert' THEN 200
      ELSE 50
    END;

    -- 5. Insertar claim (UNIQUE constraint previene doble claim)
    INSERT INTO player_daily_ai_claims(player_id, date_key, difficulty, vex_awarded)
    VALUES (v_player_id, p_date_key, p_difficulty, v_vex_reward)
    ON CONFLICT (player_id, date_key) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Already claimed for this date');
    END IF;

    -- 6. Acreditar VEX al wallet
    UPDATE player_wallet
    SET vex_ingame = vex_ingame + v_vex_reward,
        updated_at = now()
    WHERE player_id = v_player_id;

    -- 7. Registrar en economy_ledger
    INSERT INTO economy_ledger(
      player_id, currency, entry_type, amount,
      source_table, reference_id, metadata, is_final
    ) VALUES (
      v_player_id, 'vex_ingame', 'credit', v_vex_reward,
      'player_daily_ai_claims', p_date_key,
      jsonb_build_object('difficulty', p_difficulty, 'date_key', p_date_key, 'source', 'daily_ai_challenge'),
      true
    );

    RETURN jsonb_build_object(
      'claimed',     true,
      'vex_awarded', v_vex_reward,
      'difficulty',  p_difficulty,
      'date_key',    p_date_key
    );
    END;
    $$;

    -- Permisos: solo jugadores autenticados y service_role
    GRANT EXECUTE ON FUNCTION public.claim_daily_ai_challenge(text, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.claim_daily_ai_challenge(text, text) TO service_role;

    -- Verificación anon (debe retornar 'Not authenticated'):
    -- SELECT claim_daily_ai_challenge('2026-07-24', 'normal');
    