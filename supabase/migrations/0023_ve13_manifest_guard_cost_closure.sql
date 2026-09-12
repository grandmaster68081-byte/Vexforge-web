-- VE-13-MANIFEST-GUARD-COST-CLOSURE
-- Cierra la deuda registrada desde VE-9: la guarda `verify:manifest` quedaba
-- fuera de `verify:all` por coste de ejecucion. No modifica datos autoritativos,
-- arte servido, Storage, esquema, RLS ni RPCs.

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-13-MANIFEST-GUARD-COST-CLOSURE',
  'quality',
  'La guarda global del manifiesto entra en verify:all',
  'La guarda scripts/verify-manifest.mjs comprobaba las 218 filas de archivo del manifiesto oficial contra el Storage publico con peticiones HEAD estrictamente en serie, lo que costaba unos 132 s por ejecucion y fue el unico motivo por el que quedo fuera de npm run verify:all desde VE-9. Decision canonica: la verificacion global del manifiesto es obligatoria en verify:all y su coste se reduce sin recortar cobertura. Las 218 comprobaciones HEAD pasan a ejecutarse con concurrencia acotada de 4 peticiones simultaneas y reintento con espera creciente ante 429 o 5xx, porque un 429 del Storage publico no significa objeto ausente; solo la ultima respuesta fallida cuenta como fallo. La cobertura y el criterio de fallo son identicos a los anteriores: toda ruta declarada en src/lib/assetManifest.ts debe estar inscrita, toda fila de archivo del manifiesto debe existir en Storage y todo arte de carta y de jefe mundial consumido debe estar inscrito. Tiempo medido tras el cambio: 59,3 s para las mismas 218 comprobaciones, 0 referencias rotas.',
  'official',
  jsonb_build_object(
    'unit', 'VE-13-MANIFEST-GUARD-COST-CLOSURE',
    'guard_command', 'npm run verify:manifest',
    'chained_in', 'npm run verify:all',
    'manifest_file_rows', 218,
    'code_paths_checked', 21,
    'head_concurrency', 4,
    'head_retries', 4,
    'seconds_before', 132,
    'seconds_after', 59,
    'coverage_change', 'ninguno: mismas comprobaciones y mismo criterio de fallo',
    'debt_closed', 'verify:manifest fuera de verify:all por coste',
    'reopen_condition', 'crecimiento del manifiesto que vuelva a hacer inviable la guarda en verify:all, o cambio de limites de peticion del Storage publico'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
