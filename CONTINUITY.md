## 2026-08-21 — VE-CI-1-WORKFLOW-HANDOFF — OPERATIONAL

- Tipo de sesion: cierre de verificacion visual autenticada de VE-QA-1 sobre el deploy vivo + entrega ejecutable del CI bloqueado. Sin cambios de esquema, RLS, economia autoritativa, Storage ni arte.
- Verificacion pendiente de VE-QA-1 resuelta: el deploy de Cloudflare ya propago `sourceCommit=4617f44` (`build-manifest.json`) y los chunks publicos coinciden bit a bit con el build local por SHA-256 (`DepositRoute-CIBCojdg.js`, `AdminDepositsRoute-COl6Hq54.js`, `index-FI4daHK-.js`, los tres `match=YES`).
- Evidencia visual autenticada (Chromium, sesion real de `pavilo20.qa@vexforge.test` inyectada en el sitio publicado): `/deposit` ya renderiza la pantalla completa "Obtener VEX" — saldos (VEX ingame 210 / tradeable 0), selector de red `BNB Chain (USDT BEP-20)`, direccion de tesoro `0x29B2907d6E10BeB2becb9bA82f2b6af04815c403` con boton Copiar, formulario de registro (monto/TX hash/wallet origen) y tabla de referencia de precios. Sin loader eterno. Barrido de `/deposit`, `/withdraw`, `/economy`, `/profile`, `/missions`, `/pvp`: 0 errores de consola y 0 respuestas HTTP >= 400.
- Estado de VE-QA-1: `IMPLEMENTED_UNVERIFIED` -> `VERIFIED/OPERATIONAL` con evidencia de navegador real sobre el deploy publico.
- CI: bloqueo diagnosticado con evidencia, no supuesto. `PUT /repos/grandmaster68081-byte/Vexforge-web/contents/.github/workflows/verify.yml` devuelve `404 Not Found` con el `GITHUB_PAT` actual, comportamiento documentado de GitHub cuando el token carece del scope `workflow`.
- Cambios: `ci/verify.workflow.yml` (workflow `verify` completo y listo para copiar: checkout, Node 20 con cache npm, `npm ci --ignore-scripts`, `tsc --noEmit -p tsconfig.app.json`, `npm run verify:all`, con `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` publicos como respaldo y sobreescribibles por *Repository variables*) y `docs/CI_ACTIVATION.md` (dos vias de desbloqueo: commit del archivo desde la web de GitHub, que ignora el limite de scope, o reemisar `GITHUB_PAT` con scope `workflow`).
- Verify: `npm run verify:all` verde de extremo a extremo (typecheck, build, ui-identity, identity-data, artes, manifest 218, assets 21/21, auth-guard, table-docs 216/216, column-docs 536/536, support-column-docs 528/528). El workflow no se encadena en `verify:all` porque vive fuera de `.github/workflows/` y no es ejecutable hasta activarse.
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: CI sigue `BLOCKED` en ejecucion real hasta que se cree `.github/workflows/verify.yml` (accion humana de un paso, ya documentada); cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado; limpieza Unicode en motores de batalla; 942 columnas de tablas publicas legado sin describir.
- Condicion de reapertura: cambio en los scripts de `verify:all` que invalide el workflow entregado, o activacion del CI con fallo en la primera ejecucion.
- Siguiente accion verificable: tras activar `.github/workflows/verify.yml`, leer la primera ejecucion de `Actions` y ajustar el workflow con la evidencia del log; en paralelo, mutaciones economicas reales con jugador QA (deposito pendiente -> aprobacion admin -> acreditacion VEX).

---

## 2026-08-21 — VE-QA-1-AUTHENTICATED-SURFACE-SWEEP — OPERATIONAL

- Tipo de sesion: QA autenticada de superficie sobre el deploy vivo + correccion del hallazgo real medido. Sin cambios de economia autoritativa, Storage ni arte.
- Motivo: levantar la deuda historica "QA autenticada BLOCKED" emitiendo una sesion de jugador real y barriendo la superficie completa contra el sitio publicado.
- Sesion QA: `pavilo20.qa@vexforge.test` emitida via Admin API (magic link -> OTP -> tokens) e inyectada en Playwright contra `vexforge-web.pages.dev`. Credenciales solo en el entorno de ejecucion: nunca en el repositorio ni en el chat.
- Evidencia del barrido: 32 rutas autenticadas con 0 errores de consola y 0 respuestas HTTP >= 400, contenido real renderizado por pantalla, y `/admin` en "Acceso Denegado" para jugador sin privilegios (gate confirmado). Flujos interactivos verificados: tutorial descartable, PvP -> Forge Formation (Campeon/Vanguardia/Centinela), quests diarias con progreso real y packs en "VEX insuficiente" con saldo 0 (comportamiento correcto).
- Hallazgo real corregido: `/deposit` colgado en "CARGANDO..." indefinidamente. Causa raiz medida en el catalogo vivo: `public.vexforge_treasury` tenia RLS con una unica politica `TO service_role`; `authenticated` tenia GRANT de columnas pero ninguna politica, por lo que el `select` devolvia 0 filas sin error y `chains.length === 0` bloqueaba el loader.
- Cambios: `supabase/migrations/0029_ve_qa_1_treasury_deposit_read.sql` (politica de minimo privilegio `authenticated_read_active_project_treasury`, solo `active = true and purpose = 'project_treasury'`; `anon` sigue sin lectura) y `src/routes/DepositRoute.tsx` (estado `chainsLoaded` que separa "cargando" de "sin wallets" y muestra estado vacio en vez de loader eterno).
- Aplicacion: migracion ya aplicada en produccion contra `rscuzqnfccqvltkdcdny` via Management API y confirmada en `pg_policy`. Verificado por REST: `authenticated` -> 1 wallet (BSC/USDT/BEP20), `anon` -> `[]`.
- Verify: `npx tsc` limpio y `npm run verify:all` verde de extremo a extremo (manifest 218, assets 21/21, auth-guard, table-docs 216/216, column-docs 536/536, support-column-docs 528/528).
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3. Deuda "QA autenticada: BLOCKED" -> RESUELTA.
- Deuda restante: CI sigue `BLOCKED` (`GITHUB_PAT` sin scope `workflow`, `.github/workflows/verify.yml` no activable); cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado; limpieza Unicode en `NotFoundRoute`/`PvpRoute`/motores de batalla.
- Condicion de reapertura: nueva ruta autenticada sin barrido, revocacion de la politica de lectura del tesoro, o perdida de la sesion QA.
- Siguiente accion verificable: extender el barrido autenticado a mutaciones economicas reales (deposito pendiente -> aprobacion admin -> acreditacion VEX) con un jugador QA y saldo controlado.

---

## 2026-08-21 — VE-DOC-5-SUPPORT-COLUMN-COMMENTS — OPERATIONAL

- Tipo de sesion: higiene documental de columnas de soporte interno. Solo metadatos: sin cambios de esquema, datos, RLS, grants, RPCs, economia autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente accion verificable declarada en VE-DOC-4 (extender la cobertura documental de columnas a las tablas de soporte interno `vexforge_*` con dependencia en funciones o vistas del catalogo vivo). CI sigue BLOCKED por `GITHUB_PAT` sin scope `workflow`.
- Estado previo medido en vivo: 24 tablas `vexforge_*` con dependencia en funciones o vistas; 17 de ellas con 181 columnas sin `col_description`.
- Cambios: `supabase/migrations/0027_ve_doc_5_support_column_comments.sql` (181 `comment on column` generados desde evidencia real del catalogo: tipo, clave primaria, referencia foranea, obligatoriedad y valor por defecto), `scripts/verify-support-column-docs.mjs` (nuevo, alcance declarado por el repositorio: toda tabla `vexforge_*` con `comment on column` en `supabase/migrations/`, leido contra la sonda `vexforge_column_doc_coverage` con el rol anon) y `package.json` (`verify:support-column-docs` encadenado en `verify:all`).
- Aplicacion: migracion aplicada contra `rscuzqnfccqvltkdcdny` via Management API. Reutiliza la sonda existente; no se creo ninguna funcion nueva.
- Evidencia: recuento en vivo => 24/24 tablas de soporte con 0 columnas sin describir. `npm run verify:all` verde de extremo a extremo, incluido `verify:support-column-docs — OK: 287/287 columnas documentadas en 28 tabla(s) de soporte interno`, `verify:column-docs — OK: 536/536` y `verify:table-docs — OK: 216/216`.
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesion normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado; columnas de tablas de soporte sin dependencia detectada en funciones o vistas todavia sin describir.
- Condicion de reapertura: nueva columna en las tablas `vexforge_*` de alcance sin `comment on column`, o revocacion del `execute` de la sonda a `anon`.
- Siguiente accion verificable: completar la cobertura documental de las columnas publicas restantes fuera de alcance (tablas de soporte sin consumidor ni dependencia detectada) y volver a medir `1900` columnas del catalogo publico.

---

## 2026-08-21 — VE-DOC-6-RESIDUAL-SUPPORT-COLUMN-COMMENTS — OPERATIONAL

- Tipo de sesion: higiene documental de columnas. Solo metadatos: sin cambios de esquema, datos, RLS, grants, RPCs, economia autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente accion verificable declarada en VE-DOC-5 (cerrar la cobertura de las tablas de soporte `vexforge_*` sin consumidor ni dependencia detectada y volver a medir el catalogo publico de 1900 columnas).
- Estado previo medido en vivo: 27 tablas `vexforge_*` con 241 columnas sin `col_description`.
- Cambios: `supabase/migrations/0028_ve_doc_6_residual_support_column_comments.sql` (241 `comment on column` generados desde evidencia real del catalogo: tipo, clave primaria, referencia foranea, obligatoriedad y valor por defecto). Sin scripts nuevos: la guarda existente `verify:support-column-docs` amplia su alcance sola porque lo declara el repositorio.
- Aplicacion: migracion aplicada contra `rscuzqnfccqvltkdcdny` via Management API.
- Evidencia: recuento en vivo => 0 columnas `vexforge_*` sin describir. `npm run verify:all` verde de extremo a extremo, incluido `verify:support-column-docs — OK: 528/528 columnas documentadas en 55 tabla(s) de soporte interno`, `verify:column-docs — OK: 536/536` y `verify:table-docs — OK: 216/216`. Catalogo publico: 1900 columnas totales, 942 sin describir (todas en tablas legado no `vexforge_*`).
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesion normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado; 942 columnas de tablas publicas legado (`tg_*`, `player_state`, `wallet_transactions`, `daily_quests`, ...) sin describir.
- Condicion de reapertura: nueva columna en cualquier tabla `vexforge_*` sin `comment on column`.
- Siguiente accion verificable: documentar las columnas de las tablas publicas legado consumidas por el cliente y por RPCs autoritativas (empezando por `player_state`, `wallet_transactions` y `daily_quests`) y extender la guarda a ese alcance.

---
