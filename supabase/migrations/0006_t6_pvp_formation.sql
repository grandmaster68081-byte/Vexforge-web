-- ─────────────────────────────────────────────────────────────────────────────
-- T6 — PvP competitivo: formation snapshots, forfeit, is_qa, leaderboard QA
-- Aplica sobre el esquema real del proyecto (columnas confirmadas vía REST API).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Formation snapshots + forfeit tracking en pvp_matches
ALTER TABLE pvp_matches
  ADD COLUMN IF NOT EXISTS formation_snapshot_a JSONB  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS formation_snapshot_b JSONB  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS forfeit_by           UUID   DEFAULT NULL;

-- 2. QA flag en players (filtra cuentas owner/admin del leaderboard público)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_qa BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar cuentas is_admin/is_super_admin como QA
UPDATE players
SET is_qa = TRUE
WHERE is_admin = TRUE OR is_super_admin = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. vexforge_pvp_store_formation
--    Almacena el snapshot de formación del challenger en pvp_matches después de
--    que vexforge_battle_resolve devuelve el match_id.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vexforge_pvp_store_formation(
  p_match_id   UUID,
  p_formation  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_player_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT p.id INTO v_player_id
  FROM players p WHERE p.auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  -- Only challenger (player_a) may write their own snapshot
  UPDATE pvp_matches
  SET formation_snapshot_a = p_formation
  WHERE id = p_match_id
    AND player_a = v_player_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'match_not_found_or_not_owner');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.vexforge_pvp_store_formation(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vexforge_pvp_store_formation(UUID, JSONB) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. vexforge_pvp_forfeit
--    Registra abandono del challenger (sale del ForgeFormationBoard sin terminar).
--    Challenger pierde ELO, oponente gana ELO por walkover.
--    Idempotente — misma key devuelve el resultado cacheado.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vexforge_pvp_forfeit(
  p_opponent_id      UUID,
  p_idempotency_key  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c_season_id    CONSTANT UUID := '87f315cd-5a14-4803-8b0f-9532dbfd6447';
  c_elo_floor    CONSTANT INT  := 100;

  v_challenger_id UUID;
  v_challenger_mmr INT;
  v_opponent_mmr   INT;
  v_elo_loss       INT := 15;
  v_elo_gain       INT := 10;
  v_match_id       UUID;
BEGIN
  -- Auth
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT p.id INTO v_challenger_id
  FROM players p WHERE p.auth_user_id = auth.uid();

  IF v_challenger_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  IF v_challenger_id = p_opponent_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_forfeit_self');
  END IF;

  -- Idempotencia
  SELECT id INTO v_match_id
  FROM pvp_matches
  WHERE reference_id = p_idempotency_key
  LIMIT 1;

  IF v_match_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'forfeit', true,
      'match_id', v_match_id::text, 'cached', true, 'elo_change', -v_elo_loss);
  END IF;

  -- MMR actual de ambos
  SELECT COALESCE(r.mmr, 1000) INTO v_challenger_mmr
  FROM pvp_rankings r
  WHERE r.player_id = v_challenger_id AND r.season_id = c_season_id
  LIMIT 1;

  SELECT COALESCE(r.mmr, 1000) INTO v_opponent_mmr
  FROM pvp_rankings r
  WHERE r.player_id = p_opponent_id AND r.season_id = c_season_id
  LIMIT 1;

  -- ELO dinámico según diferencia de MMR
  IF v_opponent_mmr > v_challenger_mmr + 200 THEN
    v_elo_loss := 8;
    v_elo_gain := 5;
  ELSIF v_challenger_mmr > v_opponent_mmr + 200 THEN
    v_elo_loss := 25;
    v_elo_gain := 15;
  END IF;

  -- Crear match (challenger = perdedor por abandono)
  INSERT INTO pvp_matches (
    reference_id, player_a, player_b, winner, status,
    elo_change_a, elo_change_b,
    power_snapshot_a, power_snapshot_b,
    rewards_json, forfeit_by, resolved_at
  ) VALUES (
    p_idempotency_key,
    v_challenger_id, p_opponent_id,
    p_opponent_id, 'resolved',
    -v_elo_loss, v_elo_gain,
    jsonb_build_object('total_power', v_challenger_mmr),
    jsonb_build_object('total_power', v_opponent_mmr),
    jsonb_build_object('forfeit', true, 'walkover_winner', p_opponent_id::text),
    v_challenger_id, NOW()
  )
  RETURNING id INTO v_match_id;

  -- Actualizar rankings — challenger (derrota)
  INSERT INTO pvp_rankings (season_id, player_id, mmr, wins, losses, rank_position)
  VALUES (c_season_id, v_challenger_id,
          GREATEST(c_elo_floor, v_challenger_mmr - v_elo_loss), 0, 1, 0)
  ON CONFLICT ON CONSTRAINT pvp_rankings_season_player_unique
  DO UPDATE SET
    mmr     = GREATEST(c_elo_floor, pvp_rankings.mmr - v_elo_loss),
    losses  = pvp_rankings.losses + 1,
    updated_at = NOW();

  -- Actualizar rankings — oponente (victoria por walkover)
  INSERT INTO pvp_rankings (season_id, player_id, mmr, wins, losses, rank_position)
  VALUES (c_season_id, p_opponent_id, v_opponent_mmr + v_elo_gain, 1, 0, 0)
  ON CONFLICT ON CONSTRAINT pvp_rankings_season_player_unique
  DO UPDATE SET
    mmr   = pvp_rankings.mmr + v_elo_gain,
    wins  = pvp_rankings.wins + 1,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'ok',         true,
    'forfeit',    true,
    'match_id',   v_match_id::text,
    'elo_change', -v_elo_loss
  );

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

REVOKE ALL ON FUNCTION public.vexforge_pvp_forfeit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vexforge_pvp_forfeit(UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. get_public_pvp_rankings
--    Versión QA-filtrada del leaderboard para vistas públicas.
--    Excluye jugadores con is_admin=true o is_qa=true.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_pvp_rankings(
  p_season_id UUID,
  p_limit     INT DEFAULT 50
)
RETURNS TABLE (
  player_id    UUID,
  display_name TEXT,
  mmr          INT,
  wins         INT,
  losses       INT,
  draws        INT,
  rank_position INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.player_id,
    COALESCE(p.display_name, 'Guerrero') AS display_name,
    r.mmr,
    COALESCE(r.wins, 0)   AS wins,
    COALESCE(r.losses, 0) AS losses,
    COALESCE(r.draws, 0)  AS draws,
    r.rank_position
  FROM pvp_rankings r
  JOIN players p ON p.id = r.player_id
  WHERE r.season_id = p_season_id
    AND COALESCE(p.is_admin, FALSE) = FALSE
    AND COALESCE(p.is_qa,    FALSE) = FALSE
  ORDER BY r.mmr DESC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_public_pvp_rankings(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_pvp_rankings(UUID, INT) TO anon, authenticated;
