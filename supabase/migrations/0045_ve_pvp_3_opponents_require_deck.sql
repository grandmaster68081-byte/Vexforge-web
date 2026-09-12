-- VE-PVP-3-OPPONENTS-REQUIRE-DECK
-- Deuda declarada en VE-PVP-2: get_pvp_opponents listaba cuentas sin mazo
-- (solo las ordenaba al final), por lo que Arena ofrecia rivales con los que
-- vexforge_battle_resolve no puede resolver un combate (minimo 5 cartas segun
-- validate_deck). Ademas excluia por is_qa a cuentas reales con mazo valido,
-- dejando la lista efectiva vacia.
--
-- Correccion:
--   * Solo se devuelven jugadores con mazo jugable (>= 5 cartas).
--   * Se mantienen fuera el propio llamante, los admins y los registros de
--     sistema (VEXFORGE_%, SIM_BOT_%).
--   * Se elimina el filtro is_qa: una cuenta real con mazo valido es un rival
--     valido; la exclusion de sistema/admin sigue vigente.
-- No se altera el motor de combate, la economia, RLS ni ningun dato de jugador.

CREATE OR REPLACE FUNCTION public.get_pvp_opponents(p_limit integer DEFAULT 20)
 RETURNS TABLE(player_id uuid, display_name text, mmr integer, wins integer, losses integer, draws integer, deck_size integer, has_deck boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid;
BEGIN
  SELECT id INTO v_caller FROM public.players
   WHERE auth_user_id = auth.uid() LIMIT 1;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.display_name, 'Guerrero #' || left(p.id::text, 6))::text,
    COALESCE(pr.mmr, 1000)::integer,
    COALESCE(pr.wins, 0)::integer,
    COALESCE(pr.losses, 0)::integer,
    COALESCE(pr.draws, 0)::integer,
    dk.deck_size::integer,
    true
  FROM public.players p
  LEFT JOIN public.pvp_rankings pr
    ON pr.player_id = p.id
   AND pr.season_id = (SELECT s.id FROM public.pvp_seasons s WHERE s.active ORDER BY s.starts_at DESC LIMIT 1)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS deck_size
      FROM public.player_deck d
     WHERE d.player_id = p.id
  ) dk ON true
  WHERE (v_caller IS NULL OR p.id <> v_caller)
    AND COALESCE(p.is_admin, false) = false
    AND COALESCE(p.display_name, '') NOT ILIKE 'VEXFORGE\_%' ESCAPE '\'
    AND COALESCE(p.display_name, '') NOT ILIKE 'SIM\_BOT\_%' ESCAPE '\'
    AND COALESCE(dk.deck_size, 0) >= 5
  ORDER BY COALESCE(pr.mmr, 1000) DESC
  LIMIT p_limit;
END;
$function$;
