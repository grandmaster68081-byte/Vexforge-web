-- VE-SEC-5-RLS-NO-POLICY-DEFAULT-DENY
-- Contexto: cuatro tablas tienen RLS activa sin ninguna politica
-- (public.vexforge_system_config, public.vexforge_icon_legacy,
--  econ_sim.events, econ_sim.players). RLS sin politicas ya niega
--  filas a los roles de API, pero los grants de tabla siguen
--  exponiendo la superficie (la tabla existe y responde 200 vacio a la
--  clave publicable) y contradicen el modelo de acceso real:
--  ninguna de estas tablas tiene consumidor cliente. Las dos tablas
--  public.* son de configuracion/auditoria interna leidas por
--  funciones definer propiedad de `postgres`; las econ_sim.* son de
--  simulacion interna y su esquema no concede USAGE a los roles de API.
--
-- Cambio: recorte de grants a `service_role` (y al propietario), sin
-- crear politicas nuevas: el estado canonico de estas tablas es
-- DENEGACION POR DEFECTO para anon y authenticated.
-- No se modifica esquema, datos, cuerpos de funciones, triggers ni UI.
-- Idempotente y transaccional.

BEGIN;

-- 1) Tablas internas de public: quitar toda superficie de API.
REVOKE ALL ON TABLE public.vexforge_system_config FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vexforge_icon_legacy   FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.vexforge_system_config TO service_role;
GRANT ALL ON TABLE public.vexforge_icon_legacy   TO service_role;

ALTER TABLE public.vexforge_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_icon_legacy   ENABLE ROW LEVEL SECURITY;

-- 2) Simulacion economica: sin USAGE de esquema ni grants para los
--    roles de API; el acceso queda restringido a service_role.
REVOKE ALL ON SCHEMA econ_sim FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE econ_sim.events  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE econ_sim.players FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA econ_sim TO service_role;
GRANT ALL ON TABLE econ_sim.events  TO service_role;
GRANT ALL ON TABLE econ_sim.players TO service_role;

ALTER TABLE econ_sim.events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE econ_sim.players ENABLE ROW LEVEL SECURITY;

COMMIT;
