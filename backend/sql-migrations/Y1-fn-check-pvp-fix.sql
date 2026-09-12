-- Y.1 — CHAT 81 — FIX fn_check_and_grant_achievements (pvp_50 + pvp_100)
-- Fecha: 2026-07-22
-- Bug: pvp_50 (Campeón, 100pts) y pvp_100 (Leyenda de Arena, 250pts) existían en
-- tabla achievements pero NO estaban cubiertos por fn_check_and_grant_achievements.
-- Fix: añadir dos IFs al bloque de PvP de la función.
-- Ejecutado via Supabase Management API en chat 81.

CREATE OR REPLACE FUNCTION public.fn_check_and_grant_achievements(p_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
-- [body completo en pg_proc — ver SELECT prosrc FROM pg_proc WHERE proname='fn_check_and_grant_achievements']
-- Cambio clave en sección PvP:
--   IF v_pvp_wins >= 1   THEN PERFORM grant_achievement(p_player_id,'first_win'); END IF;
--   IF v_pvp_wins >= 10  THEN PERFORM grant_achievement(p_player_id,'pvp_10');    END IF;
--   IF v_pvp_wins >= 50  THEN PERFORM grant_achievement(p_player_id,'pvp_50');    END IF; -- NUEVO
--   IF v_pvp_wins >= 100 THEN PERFORM grant_achievement(p_player_id,'pvp_100');   END IF; -- NUEVO
$$;
-- Cobertura posterior: 25/25 logros.
