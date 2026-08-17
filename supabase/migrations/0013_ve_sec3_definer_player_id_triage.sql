-- VE-SEC-3-DEFINER-PLAYER-ID-TRIAGE
-- Segundo lote del triaje de funciones SECURITY DEFINER expuestas al rol publico.
-- Alcance: solo privilegios de EXECUTE. Sin cambios de esquema, cuerpo de RPC,
-- triggers, RLS, Storage, economia ni UI.
--
-- Grupo A - definer sin comprobacion de identidad que aceptan identificadores
-- arbitrarios y mutan estado autoritativo (ranking, economia de energia,
-- aprovisionamiento de jugadores). Ningun consumidor del cliente ni funcion
-- interna depende de estos grants: sus llamadores son definer con owner postgres.
REVOKE ALL ON FUNCTION public.apply_ranked_result(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ranked_result(uuid, uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.vexf_consume_energy(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vexf_consume_energy(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.initialize_player_full(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_player_full(uuid, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.initialize_player_full(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_player_full(text, text, text) TO service_role;

-- Grupo B - definer legitimos del jugador autenticado (resuelven identidad por
-- auth.uid() o via assert_caller_is_player). Se retira solo la superficie anon.
REVOKE ALL ON FUNCTION public.refresh_player_energy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_player_energy(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.ensure_player_row(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_player_row(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_starter_relics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_starter_relics() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.vexforge_assign_starter_deck() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vexforge_assign_starter_deck() TO authenticated, service_role;
