## 2026-08-19 — VE-17-ANON-AUTHED-CALL-GUARD — OPERATIONAL

- Tipo de sesión: Auditoría pública móvil + corrección de superficie. Sin cambios de datos autoritativos, RLS, RPCs ni economía.
- Motivo: ejecutar la siguiente acción verificable de VE-16 (repetir la comparación pública) y cerrar la deuda de QA móvil abierta tras `VE-1-LEADERBOARD-MOBILE-TABLE`.
- Auditoría pública (Chromium 390x844, rol anónimo, `https://vexforge-web.pages.dev`): 35 rutas públicas con HTTP 200, `scrollWidth == clientWidth` en las 35 (0 desbordamientos de documento; el arreglo de la tabla de ranking se mantiene). GitHub `main = 3c7fcdb3fe63cdfaf324d0d3c6f76ab1012655cd` idéntico al `sourceCommit` de `/build-manifest.json`.
- Hallazgo real: `/deposit` disparaba el RPC autenticado `vexforge_get_my_deposits` antes de conocer la sesión, produciendo HTTP 401 y error de consola para todo visitante anónimo; además la ruta quedaba en `PageLoader` indefinido para anónimos porque el estado bloqueado se evaluaba después de exigir wallets de tesorería.
- Decisión canónica: ninguna lectura autenticada se dispara sin sesión viva; el estado `BlockedAuthState` se resuelve antes que cualquier condición de carga de dato.
- Cambios: `src/routes/DepositRoute.tsx` (carga condicionada a `authed`, orden de estados corregido). Sin cambios de esquema, Storage, manifiesto ni arte.
- Evidencia: `npm run verify:all` verde (typecheck, build + verify-build, ui-identity 188 archivos/0 violaciones, identity-data 9 tablas/274 filas/0 violaciones, boss-art 15+15, card-art 127, surface-art 29/18/11, residual-art 51/32/29, manifest 218 HEAD/0 rotas, assets 21/21). Comprobación local con `vite preview` y Playwright en `/deposit` anónimo: 0 respuestas >= 400, 0 errores de consola y aviso "ACCESO REQUERIDO" visible.
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada continúa `BLOCKED` sin sesión normal autorizada; `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions.
- Condición de reapertura: nueva ruta que llame a un RPC autenticado sin comprobar sesión, o divergencia entre `main` y `build-manifest.json` público.
- Siguiente acción verificable: auditar el resto de rutas con dato autenticado (`/withdrawal`, `/profile`, `/account`, `/inventory`) bajo sesión real cuando se autorice una cuenta de QA, y valorar una guarda estática que impida llamadas autenticadas sin comprobación de sesión.

---

## 2026-08-18 — VE-16-CANONICAL-PUBLISH-RECONCILIATION — OPERATIONAL

- Tipo de sesión: Publicación canónica + verificación pública, sin cambios de datos autoritativos.
- Motivo: cerrar VE-15 después de corregir el método de autenticación Git y reconciliar GitHub `main` con Cloudflare Pages.
- Hallazgo: el PAT era válido; el intento anterior usó `Authorization: Bearer` para Git sobre HTTPS. GitHub aceptó el mismo token con autenticación `Basic`, usando `x-access-token` como usuario.
- Publicación: `main` oficial avanzó de `62c5221c8939e51d4668611e720add143855cd86` a `2ab87ad9b598f296f0a835de5cb09781926d502d`.
- Evidencia pública: `git ls-remote` confirma `main = 2ab87ad9b598f296f0a835de5cb09781926d502d`; `https://vexforge-web.pages.dev/` responde HTTP 200; `/build-manifest.json` declara el mismo `sourceCommit`.
- Estado: `OPERATIONAL`. El deploy automático de Cloudflare Pages propagó el commit canónico tras una espera de 60 segundos.
- Alcance no modificado: combate, economía autoritativa, recompensas, RPCs, RLS, autenticación, Storage y resultados del juego.
- Deuda restante: QA autenticada continúa `BLOCKED` sin una sesión normal autorizada de jugador. No se reutilizará `Bearer` para operaciones Git; se conservará el flujo `Basic` compatible sin exponer tokens.
- Condición de reapertura: divergencia entre GitHub `main` y `build-manifest.json` público, HTTP distinto de 200, o nuevo consumidor de iconos que omita `ForgeIcon`.
- Siguiente acción verificable: mantener la guarda de identidad y repetir la comparación pública después de cualquier publicación posterior.

---

## 2026-08-18 — VE-15-ICON-LANGUAGE-CONSUMER-CLOSURE — OPERATIONAL LOCAL / PUSH BLOCKED

- Tipo de sesión: Implementación + QA estática, sin cambios de datos autoritativos.
- Fuente canónica: `main`, `VEXFORGE_PROTOCOL_V2.md`, `ForgeIcon.tsx`, `verify:ui-identity`, `verify:surface-art` y `verify:residual-art`.
- Motivo: cerrar dos consumidores visibles que renderizaban nombres internos de `ForgeIconName` como texto en lugar del SVG oficial.
- Cambios: `ProfileRoute` ahora pinta el icono de cada acceso rápido con `ForgeIcon`; `EconomyRoute` pinta el icono de cada movimiento con `ForgeIcon`. No se promovió arte reservado.
- Alcance no modificado: combate, economía autoritativa, recompensas, RPCs, RLS, autenticación, Storage, manifiesto y resultados del juego.
- Estado: `IMPLEMENTED_UNVERIFIED` → `OPERATIONAL` en el checkout local. Nivel Q: `Q3` para este lote de identidad de interfaz.
- Evidencia: `npm run typecheck`, `npm run verify:build`, `npm run verify:ui-identity` (188 archivos / 0 violaciones), `npm run verify:identity-data` (9 tablas / 274 filas / 0 violaciones), `npm run verify:boss-art`, `npm run verify:card-art`, `npm run verify:surface-art` (29 inscritos / 18 consumidos / 11 reserva), `npm run verify:residual-art` (51 filas / 32 objetos / 29 reserva), `npm run verify:manifest` (218 HEAD / 0 referencias rotas) y `npm run verify:assets` (21/21) correctos. El primer `verify:assets` recibió dos HTTP 429 temporales después del barrido global y pasó al repetirlo tras la ventana de límite.
- Bloqueo: el PAT de GitHub fue rechazado por el proveedor. El repositorio se leyó por acceso público, pero no se pudo hacer push ni actualizar el deploy oficial. No se simula publicación.
- Deuda: publicar el commit con credencial GitHub de escritura y comparar el manifiesto público, `index.html` y hashes de assets contra el commit publicado. QA autenticada continúa `BLOCKED` sin sesión normal autorizada.
- Condición de reapertura: nuevo consumidor que renderice un nombre de icono como texto, cambio del contrato de `ForgeIcon` o contrato canónico nuevo para arte reservado.
- Siguiente acción verificable: reintentar push con acceso de escritura y, si se publica, comprobar `https://vexforge-web.pages.dev`.

---

## 2026-08-18 — VE-14-RESERVED-ART-RECONCILIATION — OPERATIONAL

- Tipo de sesión: Auditoría de procedencia y reserva de assets, sin cambios de código ni de dato autoritativo. Fuentes canónicas: código de main, vexforge_official_asset_manifest, Storage oficial vexforge-assets y decisiones VE-11/VE-12/VE-13.
- Motivo: ejecutar la siguiente acción verificable declarada por VE-13 y reconciliar el arte inscrito que todavía no tiene consumidor de superficie.
- Resultado: 11 piezas de superficie y 29 piezas residuales fueron comprobadas desde RESERVED_SURFACE_ART y RESERVED_RESIDUAL_ART; 40/40 objetos devolvieron HTTP HEAD 200 en Storage. Todos permanecen official = true y enabled = true.
- Decisión: no se promueve ningún asset. No existe una superficie, consumidor ni contrato canónico nuevo que lo justifique; el arte se conserva intacto y reversible. La discrepancia del pendiente histórico de chat34 queda resuelta a favor de main, Supabase vivo y las decisiones oficiales posteriores.
- Alcance no modificado: no se tocaron cartas, combate, economía, recompensas, RPCs, RLS, Storage, assets ni resultados autoritativos.
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (procedencia y reserva verificadas).
- Evidencia: manifiesto vivo con 40 archivos reservados; 40 comprobaciones HEAD, 40 disponibles, 0 fallos; decisión oficial registrada en Supabase con la misma unidad.
- Deuda y bloqueo: la promoción futura requiere seleccionar una superficie real y registrar una decisión nueva. QA autenticado continúa BLOCKED sin una sesión normal autorizada de jugador.
- Condición de reapertura: alta o baja en Storage/manifiesto, o definición canónica de un consumidor para una pieza reservada.
- Siguiente acción verificable: ninguna hasta que exista esa superficie y contrato; entonces auditar el vertical slice afectado antes de promover.

---
## 2026-08-18 — VE-13-MANIFEST-GUARD-COST-CLOSURE — OPERATIONAL

- Tipo de sesión: Implementación de guarda + registro de decisión (sin cambio de superficie ni de dato autoritativo). Fuentes canónicas: `scripts/verify-manifest.mjs`, `vexforge_official_asset_manifest`, Storage oficial `vexforge-assets`, código de `main`.
- Motivo: cerrar la deuda arrastrada desde `VE-9` y repetida en `VE-10`, `VE-11` y `VE-12` — la guarda global del manifiesto quedaba fuera de `npm run verify:all` únicamente por coste de ejecución.
- Auditoría: la guarda comprobaba las 218 filas de archivo del manifiesto contra el Storage público con peticiones HEAD estrictamente en serie; medición previa 2 min 11 s (132 s). Un primer intento con concurrencia 12 provocó 53 respuestas HTTP 429 del Storage público, falsos positivos de "objeto ausente": el límite de peticiones es la restricción real, no el ancho de banda.
- Decisión canónica registrada: la verificación global del manifiesto es obligatoria en `verify:all` y su coste se reduce sin recortar cobertura. Las 218 comprobaciones HEAD se ejecutan con concurrencia acotada de 4 y reintento con espera creciente ante 429 o 5xx; sólo la última respuesta fallida cuenta como fallo. Cobertura y criterio de fallo idénticos: toda ruta declarada en `src/lib/assetManifest.ts` inscrita, toda fila de archivo presente en Storage, todo arte de carta y de jefe consumido inscrito.
- Cambios: `scripts/verify-manifest.mjs` (concurrencia acotada, `headWithRetry`, tiempo reportado en la salida), `package.json` (`verify:manifest` encadenado en `verify:all` antes de `verify:assets`), `supabase/migrations/0023_ve13_manifest_guard_cost_closure.sql` aplicado a Supabase vivo (`vexforge_project_decisions.VE-13-MANIFEST-GUARD-COST-CLOSURE`, status `official`, verificado en catálogo).
- Alcance no modificado: no se tocó arte servido, Storage, esquema de juego, RLS, RPCs, economía ni resultados autoritativos. No se usó `service_role` para dato de juego.
- Evidencia: `npm run verify:manifest` → 218 archivos inscritos, 21 rutas del código presentes, 0 referencias rotas, 218 HEAD en 53–59 s (antes 132 s). `npm run verify:all` verde de extremo a extremo (typecheck, build + verify-build, ui-identity, identity-data 9 tablas/274 filas/0 violaciones, boss-art 15+15, card-art 127, surface-art 29, residual-art 51/32, manifest 218, assets 21/21).
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (manifiesto oficial bajo guarda obligatoria en la verificación completa).
- Deuda restante: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions; QA autenticado `BLOCKED` por ausencia de sesión de jugador autorizada. La deuda "verify:manifest fuera de verify:all por coste" queda CERRADA.
- Condición de reapertura: crecimiento del manifiesto que vuelva a hacer inviable la guarda en `verify:all`, o cambio de los límites de petición del Storage público.
- Siguiente acción verificable: auditar el arte en reserva (29 residuales + 11 de superficie) frente a las superficies sin arte propio (marcos de carta, iconos de recompensa, progresión y tutorial) y decidir promociones con guarda.

---

## 2026-08-18 — VE-12-RESIDUAL-ART-PROVENANCE — OPERATIONAL

- Tipo de sesión: Auditoría + Implementación (dato público, código de superficie y guarda automatizada). Fuentes canónicas: `vexforge_official_asset_manifest`, Storage oficial `vexforge-assets`, código de `main`.
- Motivo: ejecutar la siguiente acción verificable declarada en el cierre de `VE-11-SURFACE-ART-PROVENANCE` — decidir la baja o inscripción de los emblemas locales `public/factions/*.png` y auditar el resto de roles del manifiesto aún sin guarda (`*_collection`, `frame_*`, `icon_*`, `logo_*`, `boost_*`, `progression_*`, `reward_*`).
- Auditoría (rol anon, sin `service_role`): de las 237 filas del manifiesto, 186 ya cubiertas por las guardas de jefes, cartas y superficie y 51 sin guarda; esas 51 son 32 objetos reales (todos `official = true`, `enabled = true`, HEAD 200 en Storage) y 19 filas `*_collection` que son marcadores de prefijo del bucket, no objetos servibles (HEAD 400). Consumo real: sólo `cover/main.jpg`, `lobby/main.jpg` y `logo/IMG_20260606_040509_906.jpg`, siempre resueltos con `storageAsset()`; 0 rutas residuales fijadas en literales crudos.
- Decisión canónica registrada: el arte residual se resuelve únicamente desde el manifiesto vía `VERIFIED_ASSETS`/`storageAsset()`; las 19 filas de prefijo quedan declaradas en `MANIFEST_BUNDLE_PREFIXES` y nunca se referencian como imagen; los 29 objetos inscritos sin consumo quedan como reserva declarada y reversible en `RESERVED_RESIDUAL_ART`, sin borrarse ni sustituirse, promovibles sólo con decisión nueva.
- Baja canónica ejecutada: los cuatro PNG locales de `public/factions/` (`guerrero`, `mago`, `paladin`, `picaro`), sin consumo desde VE-11 y no inscritos en el manifiesto, se eliminan del repositorio; el arte oficial de facción son las filas `faction_icon`. La guarda falla si resucitan.
- Cambios: `scripts/verify-residual-art.mjs` (guarda nueva, cubre todo rol sin guarda propia y falla ante cualquier fila huérfana), `src/lib/assetManifest.ts` (`RESERVED_RESIDUAL_ART`, `MANIFEST_BUNDLE_PREFIXES`), `package.json` (`verify:residual-art` encadenado en `verify:all`), baja de `public/factions/*.png`, `supabase/migrations/0022_ve12_residual_art_provenance.sql` aplicado a Supabase vivo (`vexforge_project_decisions.VE-12-RESIDUAL-ART-PROVENANCE`, status `official`, verificado en catálogo con `residual_reserved = 29` y `orphan_roles_after_unit = 0`).
- Alcance no modificado: no se tocó Storage, esquema de juego, RLS, RPCs, economía ni resultados autoritativos. No se usó `service_role` para dato de juego.
- Evidencia: `npm run verify:residual-art` → 51 filas, 32 objetos, 3 consumidos, 29 en reserva, 19 prefijos, 237 filas de manifiesto, OK. `npm run verify:all` verde (typecheck, build + verify-build, ui-identity, identity-data 9 tablas/274 filas/0 violaciones, boss-art 15+15, card-art 127, surface-art 29, residual-art OK, assets 21/21).
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (todo el manifiesto oficial bajo guarda de procedencia, sin roles huérfanos).
- Deuda restante: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions; `verify:manifest` sigue fuera de `verify:all` por coste; QA autenticado `BLOCKED`.
- Condición de reapertura: alta o baja de arte residual en Storage/manifiesto, o decisión de promover una pieza en reserva a superficie consumida.
- Siguiente acción verificable: auditar el arte en reserva frente a las superficies sin arte propio (marcos de carta, iconos de recompensa, progresión y tutorial) y decidir promociones con guarda, o cerrar la deuda de `verify:manifest` fuera de `verify:all`.

---

## 2026-08-18 — VE-11-SURFACE-ART-PROVENANCE — OPERATIONAL

- Tipo de sesión: Auditoría + Implementación (dato público, código de superficie y guarda automatizada). Fuentes canónicas: `vexforge_official_asset_manifest`, Storage oficial `vexforge-assets`, código de `main`.
- Motivo: ejecutar la siguiente acción verificable declarada en el cierre de `VE-10-CARD-ART-PROVENANCE` — auditar los roles de manifiesto aún sin guarda propia (`route_hero`, `route_background`, `region_art`, `faction_icon`, `faction_background`, `season_banner`) y decidir si se unifican en una guarda única de procedencia de superficie.
- Auditoría (rol anon, sin `service_role`): 29 filas de arte de superficie inscritas — 8 `route_hero`, 7 `route_background`, 5 `region_art`, 4 `faction_icon`, 4 `faction_background`, 1 `season_banner` — todas `official = true`, `enabled = true`, bajo prefijo canónico y con HEAD 200 en Storage.
- Hallazgos reales corregidos: (1) la portada consumía emblemas locales `public/factions/*.png` no inscritos en el manifiesto mientras las 4 filas oficiales `faction_icon` quedaban sin consumo; (2) `InteractiveBattleBoard.tsx` fijaba las arenas de facción en literales crudos interpolando la base de Storage, saltándose el manifiesto.
- Decisión canónica registrada: todo arte de superficie se resuelve desde el manifiesto oficial vía `storageAsset()` o los mapas `FACTION_ICON`, `FACTION_BACKGROUND` y `SURFACE_BACKGROUND` de `src/lib/assetManifest.ts`; ningún otro archivo puede fijar rutas de superficie ni servir arte local no inscrito. El arte inscrito sin superficie que lo consuma (5 héroes de ruta, 5 `region_art` y el `season_banner`) queda como reserva declarada y reversible en `RESERVED_SURFACE_ART`, sin borrarse ni sustituirse, promovible sólo con decisión nueva.
- Cambios: `scripts/verify-surface-art.mjs` (guarda nueva, unificada para los seis roles), `src/lib/assetManifest.ts` (emblemas oficiales inscritos, `FACTION_ICON`, `FACTION_BACKGROUND`, `RESERVED_SURFACE_ART`), `src/routes/HomeRoute.tsx` (emblemas oficiales en lugar de PNG locales), `src/components/battle/InteractiveBattleBoard.tsx` (arenas resueltas desde el manifiesto), `package.json` (`verify:surface-art` encadenado en `verify:all`), `supabase/migrations/0021_ve11_surface_art_provenance.sql` aplicado a Supabase vivo (`vexforge_project_decisions.VE-11-SURFACE-ART-PROVENANCE`, status `official`, verificado en catálogo).
- Alcance no modificado: no se tocó Storage, esquema de juego, RLS, RPCs, economía ni resultados autoritativos. No se usó `service_role` para dato de juego.
- Evidencia: `npm run verify:surface-art` → 29 inscritos, 18 consumidos, 11 en reserva, OK. `npm run verify:all` verde (typecheck, build + verify-build, ui-identity, identity-data 9 tablas/274 filas/0 violaciones, boss-art 15+15, card-art 127, surface-art OK, assets 21/21).
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (identidad de arte de superficie con procedencia y guarda automatizada).
- Deuda restante: los PNG de `public/factions/` quedan en el repositorio sin consumo, pendientes de baja o de inscripción con decisión propia; publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions; `verify:manifest` sigue fuera de `verify:all` por coste; QA autenticado `BLOCKED`.
- Condición de reapertura: alta o baja de arte de superficie, o decisión de promover una pieza en reserva a superficie consumida.
- Siguiente acción verificable: decidir la baja o inscripción canónica de los emblemas locales `public/factions/*.png` y auditar el resto de roles del manifiesto sin guarda (`*_collection`, `frame_*`, `icon_*`, `logo_*`, `boost_*`, `progression_*`, `reward_*`).

---

## 2026-08-18 — VE-10-CARD-ART-PROVENANCE — OPERATIONAL

- Tipo de sesión: Auditoría + Implementación (dato público y guarda automatizada). Fuentes canónicas: `cards`, `vexforge_official_asset_manifest`, Storage oficial `vexforge-assets`, código de `main`.
- Motivo: ejecutar la siguiente acción verificable declarada en el cierre de `VE-9-BOSS-ART-VARIANT-DECISION` — auditar el arte de carta con el mismo criterio de procedencia y consumo y decidir si merece una guarda equivalente a `verify:boss-art`.
- Auditoría (rol anon, sin `service_role`): 127 filas en `cards`, todas con `image_url`; 127 filas `card_art` en el manifiesto, todas `official = true`, `enabled = true` y bajo el prefijo `cards/`; correspondencia biyectiva carta ↔ arte (127 consumos únicos, 0 arte compartido); 0 referencias fuera del manifiesto; 0 arte inscrito sin consumir; 0 `asset_code` duplicado; 127/127 objetos disponibles en Storage (HEAD 200).
- Hallazgo: el arte de carta no tiene conjunto alternativo — no existe `semantic_role = 'card_art_variant'` —, por lo que no hay decisión de reserva análoga a la de jefes. La superficie es sana y lo único ausente era la guarda que impidiera degradarla en silencio.
- Decisión canónica registrada: el arte de cada carta es la fila `card_art` inscrita, oficial y habilitada referenciada por `cards.image_url`; el código no fija rutas `cards/` literales y resuelve el arte siempre desde el dato.
- Cambios: `scripts/verify-card-art.mjs` (guarda nueva), `package.json` (`verify:card-art` añadido y encadenado en `verify:all`), `supabase/migrations/0020_ve10_card_art_provenance.sql` aplicado a Supabase vivo (`vexforge_project_decisions.VE-10-CARD-ART-PROVENANCE`, status `official`).
- Alcance no modificado: no se tocó arte servido, Storage, esquema de juego, RLS, RPCs, economía ni resultados autoritativos. No se usó `service_role`.
- Evidencia: `npm run verify:card-art` → 127 inscritos, 127 cartas verificadas, 127 consumos únicos, OK. `npm run verify:all` verde (typecheck, build + verify-build, ui-identity 0 violaciones, identity-data 9 tablas/274 filas/0 violaciones, boss-art 15+15 OK, card-art OK, assets 17/17).
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (identidad de arte de cartas con procedencia y guarda automatizada).
- Deuda restante: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions; `verify:manifest` sigue fuera de `verify:all` por coste; QA autenticado `BLOCKED` por ausencia de sesión de jugador autorizada.
- Condición de reapertura: alta o baja de cartas o de arte de carta, o aparición de un conjunto alternativo `card_art_variant`.
- Siguiente acción verificable: auditar con el mismo criterio el resto de roles del manifiesto aún sin guarda propia (`route_hero`, `route_background`, `region_art`, `faction_*`, `season_banner`) y decidir si se unifican en una guarda de procedencia de superficie única.

---

## 2026-08-18 — VE-9-BOSS-ART-VARIANT-DECISION — OPERATIONAL

- Tipo de sesión: Auditoría + Implementación (dato público y guarda automatizada). Fuentes canónicas: `vexforge_official_asset_manifest`, `world_bosses`, Storage oficial `vexforge-assets`, código de `main`.
- Motivo: cerrar la deuda registrada "artes duplicados del bucket sin decisión canónica" heredada de `VE-7-BOSS-ART-VARIANT-MANIFEST` y `VE-CI-02-MANIFEST-SWEEP`.
- Auditoría (rol anon, sin service_role): 237 filas de manifiesto, 218 archivos; 0 grupos de contenido byte a byte duplicado sobre el conjunto completo; único choque de nombre base (`main.jpg` en chests/cover/lobby/market/wallet) es falso positivo, son 5 héroes de superficie distintos; 0 `asset_code` con más de un archivo; 127 cartas sin `image_url` compartida.
- Hallazgo real: el bucket contiene dos conjuntos de arte de jefe — 15 canónicos en mayúsculas (`BOSS-001..BOSS-010`, `BOSS_CINDERDRAKE`, `BOSS_IRONLORD`, `BOSS_SHADOWREAVER`, `BOSS_FORGEMASTER`, `BOSS_WARBOUND_TITAN`) y 15 alternativos en minúsculas nombrados por jefe, inscritos como `world_boss_art_variant` con `enabled = false`. No son copias: son artes distintos, por lo que no se eliminan.
- Decisión canónica registrada: el arte canónico de cada jefe es la fila `world_boss_art` con `official = true` y `enabled = true`, y es la única admitida en `world_bosses.image_url`; las 15 variantes quedan como arte alternativo en reserva reversible, sin consumo desde dato ni código, y sólo se promueven con una decisión nueva registrada.
- Cambios: `scripts/verify-boss-art.mjs` (guarda nueva), `package.json` (`verify:boss-art` añadido y encadenado en `verify:all`), `supabase/migrations/0019_ve9_boss_art_variant_decision.sql` aplicado a Supabase vivo (`vexforge_project_decisions.VE-9-BOSS-ART-VARIANT-DECISION`, status `official`).
- Alcance no modificado: no se tocó arte servido, Storage, esquema de juego, RLS, RPCs, economía ni resultados autoritativos. No se usó `service_role`.
- Evidencia: `npm run verify:boss-art` → 15 canónicos, 15 variantes en reserva, 15 jefes verificados, 30 HEAD contra Storage en 200. `npm run verify:all` verde (typecheck, build + verify-build, ui-identity 188 archivos/0 violaciones, identity-data 9 tablas/274 filas/0 violaciones, boss-art OK, assets 17/17).
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3 (identidad de arte de jefes con procedencia y guarda automatizada).
- Deuda restante: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; sin cron autoritativo ni Edge Functions; `verify:manifest` sigue fuera de `verify:all` por coste; QA autenticado `BLOCKED` por ausencia de sesión de jugador autorizada.
- Condición de reapertura: alta o baja de arte de jefe en Storage/manifiesto, o decisión de promover una variante a canónica.
- Siguiente acción verificable: auditar el arte de carta (`card_art`, 127 filas) con el mismo criterio de procedencia y consumo, y decidir si merece una guarda equivalente a `verify:boss-art`.

---

## 2026-08-18 — VE-CI-02-MANIFEST-SWEEP — OPERATIONAL

- Tipo de sesión: QA de dato público (lectura, sin cambio de código). Fuente canónica: `scripts/verify-manifest.mjs` sobre Supabase vivo con rol anon y Storage oficial `vexforge-assets`.
- Motivo: `verify:manifest` era la única puerta canónica que quedaba fuera del barrido ejecutado en `VE-CI-01-VERIFY-GATE`; se ejecuta ahora para cerrarla sin dejar cobertura parcial.
- Resultado: 218 archivos inscritos en `vexforge_official_asset_manifest`, 17 rutas de assets referenciadas por el código todas inscritas, 0 objetos del manifiesto ausentes en Storage y 0 referencias rotas en las tablas de dato público.
- Decisión operativa: `verify:manifest` se mantiene FUERA de `verify:all` y del gate por push. Su barrido hace una petición HEAD por cada uno de los 218 objetos y supera con holgura los tiempos de una puerta por commit; su lugar es una verificación de release o programada, no de cada cambio.
- Alcance no modificado: no se tocó código, esquema, datos, Storage, RLS ni resultados autoritativos. No se usó `service_role`.
- Deuda registrada sin cambios: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; ausencia de cron autoritativo y Edge Functions; artes duplicados del bucket sin decisión canónica; QA autenticado sigue `BLOCKED`.
- Condición de reapertura: cualquier fallo de `verify:manifest`, alta o baja de assets en el bucket o cambio del inventario inscrito.

---

