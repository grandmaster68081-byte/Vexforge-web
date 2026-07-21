-- ============================================================
-- BUG-4 FIX: get_player_stats — column player_a_id → player_a
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-07-19 · Bloque 5.30
-- Error original: column "pvp_matches.player_a_id" does not exist
-- Fix: renombrar a pvp_matches.player_a (nombre correcto de la columna)
-- Impacto: ProfileRoute stats + AchievementsRoute stats muestran 0 sin este fix
-- ============================================================

-- PASO 1: Verificar el schema actual de pvp_matches
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pvp_matches' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: Ver la definición actual del function (para copiar antes de sobreescribir)
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_player_stats';

-- PASO 3: Aplicar el fix reemplazando player_a_id por player_a
-- (Ejecutar DESPUÉS de verificar la definición actual en el paso 2)
-- La forma más segura es copiar el output del paso 2,
-- reemplazar todas las instancias de "player_a_id" por "player_a",
-- y re-ejecutar el CREATE OR REPLACE FUNCTION completo.

-- Alternativamente, si la función es simple, el fix directo es:
DO $$
DECLARE
  v_src text;
  v_fixed text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_src
  FROM pg_proc
  WHERE proname = 'get_player_stats' AND pronamespace = 'public'::regnamespace;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'Function get_player_stats not found';
  END IF;

  v_fixed := replace(v_src, 'player_a_id', 'player_a');

  IF v_fixed = v_src THEN
    RAISE NOTICE 'No instances of player_a_id found — function may already be fixed or column name differs';
  ELSE
    EXECUTE v_fixed;
    RAISE NOTICE 'get_player_stats fixed successfully — player_a_id replaced with player_a';
  END IF;
END;
$$;

-- PASO 4: Verificar que el fix funcionó
SELECT get_player_stats('00000000-0000-0000-0000-000000000000'::uuid);
-- Debe retornar: {"pvp_wins": 0, "boss_kills": 0, "cards_owned": 0, ...}
-- (sin error de columna)
