-- VE-9-BOSS-ART-VARIANT-DECISION
-- Registra la decisión canónica sobre el arte duplicado de jefes mundiales:
-- el arte canónico es la fila world_boss_art (official/enabled) referenciada por
-- world_bosses.image_url; las 15 filas world_boss_art_variant quedan inscritas y
-- oficiales pero deshabilitadas, como arte alternativo en reserva reversible.
-- No modifica datos autoritativos, arte servido, Storage ni RLS.

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-9-BOSS-ART-VARIANT-DECISION',
  'assets',
  'Arte canonico de jefes mundiales y variantes en reserva',
  'El bucket oficial contiene dos conjuntos de arte de jefe: 15 archivos canonicos en mayusculas (BOSS-001..BOSS-010, BOSS_CINDERDRAKE, BOSS_IRONLORD, BOSS_SHADOWREAVER, BOSS_FORGEMASTER, BOSS_WARBOUND_TITAN) y 15 archivos alternativos en minusculas nombrados por jefe. No son copias byte a byte: son artes distintos, por lo que no se borran. Decision canonica: el arte canonico de cada jefe es la fila world_boss_art con official = true y enabled = true, y es la unica que puede aparecer en world_bosses.image_url. Las filas world_boss_art_variant permanecen inscritas, oficiales y con enabled = false como arte alternativo en reserva; no se consumen desde el dato ni desde el codigo y no sustituyen al arte canonico sin una decision nueva registrada aqui. El cumplimiento se verifica con npm run verify:boss-art, que lee con rol anon y falla si un jefe consume una variante, si una variante se habilita, si un arte canonico se deshabilita o si un archivo inscrito falta en Storage.',
  'official',
  jsonb_build_object(
    'unit', 'VE-9-BOSS-ART-VARIANT-DECISION',
    'guard_command', 'npm run verify:boss-art',
    'canonical_role', 'world_boss_art',
    'reserve_role', 'world_boss_art_variant',
    'canonical_count', 15,
    'reserve_count', 15,
    'byte_identical_duplicates', 0,
    'deletion_policy', 'no se elimina arte inscrito; la reserva es reversible',
    'reopen_condition', 'alta o baja de arte de jefe en Storage, o decision de promover una variante a canonica'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
