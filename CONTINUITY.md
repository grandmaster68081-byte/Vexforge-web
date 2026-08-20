## 2026-08-20 — VE-DOC-3-DOC-COVERAGE-PROBE — OPERATIONAL

- Tipo de sesion: endurecimiento de verificacion documental. Sin cambios de esquema de negocio, RLS de datos de jugador, economia autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente accion verificable de VE-DOC-2 (verificador que falle si aparece una tabla publica sin descripcion).
- Cambios: `supabase/migrations/0025_ve_doc_3_doc_coverage_probe.sql` (sonda `public.vexforge_doc_coverage()`, `security definer`, `search_path` fijado, solo metadatos de catalogo), `scripts/verify-table-docs.mjs` (nuevo) y `package.json` (`verify:table-docs` encadenado en `verify:all`).
- Aplicacion: migracion ya aplicada en vivo contra `rscuzqnfccqvltkdcdny`; hoy verificado en catalogo vivo que la funcion existe con la definicion de la migracion (paridad repo/base).
- Evidencia: `node scripts/verify-table-docs.mjs` => `OK: 216/216 tablas publicas documentadas`.
- Estado: IMPLEMENTED_UNVERIFIED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesion normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado.
- Condicion de reapertura: cambio de la sonda o revocacion del `execute` a `anon`.
- Siguiente accion verificable: publicar `.github/workflows/verify.yml` con un PAT con scope `workflow` y confirmar `verify:all` verde en CI.

---

## 2026-08-19 — VE-DOC-2-CATALOG-COMMENTS — OPERATIONAL

- Tipo de sesion: higiene documental de catalogo. Solo metadatos: sin cambios de esquema, datos, RLS, grants, RPCs, economia autoritativa, Storage ni arte.
- Motivo: cerrar la deuda declarada en VE-18/VE-19 (higiene documental) ya que el CI sigue BLOCKED por `GITHUB_PAT` sin scope `workflow` (verificado hoy: scopes = `repo`).
- Estado previo medido en vivo: 216 tablas publicas, 149 sin `obj_description` (las `vexforge_*` ya documentadas por VE-DOC-1).
- Cambio: `supabase/migrations/0024_ve_doc_2_catalog_comments.sql` con 149 `comment on table`, generados desde evidencia real: consumidores de cliente detectados por `from("<tabla>")` en `src/`, dependencias en funciones/vistas del catalogo vivo y estado de RLS + numero de politicas.
- Clasificacion aplicada: `runtime de cliente` (36 tablas), `soporte interno de base` (dependencia en funciones o vistas) y `soporte interno sin consumidor detectado`.
- Aplicacion: ejecutada contra `rscuzqnfccqvltkdcdny` via Management API.
- Evidencia: `select count(*) filter (where obj_description is null)` => 0 sobre 216 tablas publicas. Cobertura documental 100%.
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesion normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado.
- Condicion de reapertura: creacion de tablas publicas nuevas sin `comment on table`.
- Siguiente accion verificable: script `verify:table-docs` (ejecucion periodica, fuera de `verify:all` como `verify:manifest`) que falle si aparece una tabla publica sin descripcion.

---

## 2026-08-19 — VE-19-AUTH-GUARD-STATIC-VERIFIER — OPERATIONAL

- Tipo de sesión: endurecimiento de verificación. Sin cambios de esquema, RLS, RPCs, economía autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente acción verificable declarada en VE-18 (verificador estático `verify:auth-guard`).
- Cambios: `scripts/verify-auth-guard.mjs` (nuevo) y `package.json` (`verify:auth-guard` añadido y encadenado en `verify:all`).
- Regla aplicada: falla el build si un módulo invoca `supabase.rpc("vexforge_get_my_*")` sin `supabase.auth.getSession()`/`getUser()` en ese mismo módulo.
- Evidencia: `npm run verify:auth-guard` verde — 4 llamadas autenticadas en 4 módulos (`season`, `economy`, `deposit`, `ShopRoute`), todas con comprobación de sesión.
- Alcance declarado: detecta ausencia de comprobación, no su colocación lógica exacta; no sustituye revisión humana.
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesión normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; higiene documental de tablas `vexforge_*`; artes duplicados del bucket pendientes de autorización de listado.
- Condición de reapertura: aparición de un consumidor autenticado que evada la heurística (RPC construido dinámicamente o guarda en módulo distinto).
- Siguiente acción verificable: cablear `verify:all` en CI cuando exista `GITHUB_PAT` con scope `workflow`.

---

## 2026-08-19 — VE-18-AUTHED-RPC-SESSION-GUARD-EXTENSION — OPERATIONAL

- Tipo de sesión: Auditoría estática de llamadas autenticadas + corrección mínima. Sin cambios de esquema, RLS, RPCs, economía autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente acción verificable de VE-17 (extender la guarda de sesión al resto de consumidores de RPC autenticado).
- Verificación previa: GitHub `main = 69c5849c588431aa74744dda3d97f547021d20fe` idéntico al `sourceCommit` de `/build-manifest.json`; HTTP 200 en `/`, `/leaderboard`, `/season-rankings`, `/raids`, `/world-bosses` y `/achievements`.
- Auditoría: cuatro consumidores de RPC `vexforge_get_my_*`. `ShopRoute.tsx:101` sólo se dispara dentro de la rama con sesión viva (correcto) y `season/repository.ts:134` ya quedó guardado en VE-17. Dos quedaban sin comprobación previa de sesión: `economy/repository.ts:71` (`vexforge_get_my_economy_stats`) y `deposit/repository.ts:61` (`vexforge_get_my_deposits`), ambos capaces de producir 401 anónimo si un consumidor futuro los invoca sin sesión.
- Decisión canónica reafirmada: ninguna lectura autenticada se dispara sin sesión viva; la comprobación vive en el repositorio de dominio, no sólo en la ruta.
- Cambios: `src/domains/economy/repository.ts` (devuelve `blocked_auth` sin sesión, alineado con `getLedgerEntries`) y `src/domains/deposit/repository.ts` (devuelve lista vacía sin sesión, coherente con su contrato actual).
- Evidencia: `npm run typecheck` verde y `npm run build` verde en el checkout limpio.
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada continúa `BLOCKED` sin sesión normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; higiene documental de tablas `vexforge_*`; artes duplicados del bucket pendientes de autorización de listado.
- Condición de reapertura: nuevo repositorio de dominio que llame a un RPC autenticado sin comprobar sesión, o divergencia entre `main` y `build-manifest.json` público.
- Siguiente acción verificable: valorar un verificador estático (`verify:auth-guard`) que falle el build si un `supabase.rpc("vexforge_get_my_*")` aparece sin `getSession` previo en su mismo módulo.

---

