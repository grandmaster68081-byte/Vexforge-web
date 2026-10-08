# SUPABASE LIVE STATE

## Estado verificado actualmente — 2026-10-08

- Proyecto `rscuzqnfccqvltkdcdny`: `ACTIVE_HEALTHY`, región `us-west-2`.
- Las cuatro migraciones V7 (`20261006220000`, `20261006230000`,
  `20261007010000`, `20261007140000`) se aplicaron en una transacción mediante
  la Supabase Management API tras autorización explícita. Sus archivos SQL ya
  estaban en GitHub `main` (`20d11c936f1a1f327dcc8dc7550282f1603350d0`).
- El postflight confirmó las cuatro filas de historial, las tres tablas V7 con
  RLS activo y vacías, cero privilegios directos de tabla/columna para
  `anon`/`authenticated`, RPC de juego ejecutables por `authenticated` pero no
  `anon`, helpers revocados, trigger PvE habilitado y 20 reglas de sinergia
  compatibles.
- No se creó ninguna sesión de combate ni se alteraron filas de jugadores o
  economía durante la migración. Las RPC PvE sí llaman los contratos live de
  energía y settlement al usarse; no se ejecutaron partidas autenticadas.
- No hay compilación Unity ni prueba de dispositivo. La verificación es de
  esquema, ACL, historial y contratos.
- La ruta SQL de la Management API usada para aplicar DDL está documentada como
  beta/experimental; para futuras migraciones, revalidar la ruta soportada.

## Snapshot histórico — 2026-09-19

Los puntos siguientes describen el inventario inicial de septiembre, no el
estado actual posterior a la activación V7.

- `SUPABASE_LIVE` project inventory was read through the Supabase Management API.
- `SUPABASE_LIVE` project identity summary: ref `rscuzqnfccqvltkdcdny`, region `us-west-2`, status `ACTIVE_HEALTHY`, database `17` / version `17.6.1.127`.
- `SUPABASE_LIVE` Management API database metadata query returned HTTP `201` for read-only SELECT statements.
- `SUPABASE_LIVE` project listing returned HTTP `200`.
- `BLOCKED` direct PostgREST/Storage request using the supplied service-role key returned HTTP `401`; the exact response is in `snapshots/continuity-20260919T062954Z/supabase-rest-openapi.status` and `storage-inventory.txt`.
- `BLOCKED` Supabase CLI is unavailable in the execution environment; no `supabase link` was attempted.
- `SUPABASE_LIVE` no INSERT, UPDATE, DELETE, TRUNCATE, ALTER, deploy, upload or auth mutation was executed.
- `SUPABASE_LIVE` no player rows, emails, addresses or account PII were queried.

Management API evidence is in `supabase-management-projects.json`, `supabase-management-query-probe.txt`, and the `remote_*.json` snapshots.
