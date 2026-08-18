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

