## 2026-08-18 — VE-CI-02-MANIFEST-SWEEP — OPERATIONAL

- Tipo de sesión: QA de dato público (lectura, sin cambio de código). Fuente canónica: `scripts/verify-manifest.mjs` sobre Supabase vivo con rol anon y Storage oficial `vexforge-assets`.
- Motivo: `verify:manifest` era la única puerta canónica que quedaba fuera del barrido ejecutado en `VE-CI-01-VERIFY-GATE`; se ejecuta ahora para cerrarla sin dejar cobertura parcial.
- Resultado: 218 archivos inscritos en `vexforge_official_asset_manifest`, 17 rutas de assets referenciadas por el código todas inscritas, 0 objetos del manifiesto ausentes en Storage y 0 referencias rotas en las tablas de dato público.
- Decisión operativa: `verify:manifest` se mantiene FUERA de `verify:all` y del gate por push. Su barrido hace una petición HEAD por cada uno de los 218 objetos y supera con holgura los tiempos de una puerta por commit; su lugar es una verificación de release o programada, no de cada cambio.
- Alcance no modificado: no se tocó código, esquema, datos, Storage, RLS ni resultados autoritativos. No se usó `service_role`.
- Deuda registrada sin cambios: publicación de `.github/workflows/verify.yml` pendiente de un `GITHUB_PAT` con scope `workflow`; ausencia de cron autoritativo y Edge Functions; artes duplicados del bucket sin decisión canónica; QA autenticado sigue `BLOCKED`.
- Condición de reapertura: cualquier fallo de `verify:manifest`, alta o baja de assets en el bucket o cambio del inventario inscrito.

---

