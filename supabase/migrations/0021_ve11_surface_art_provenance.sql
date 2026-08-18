-- VE-11-SURFACE-ART-PROVENANCE
-- Registra la decision canonica sobre el arte de superficie (route_hero,
-- route_background, region_art, faction_icon, faction_background,
-- season_banner) y su reserva declarada.
-- No modifica datos autoritativos, arte servido, Storage, esquema ni RLS.

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-11-SURFACE-ART-PROVENANCE',
  'assets',
  'Procedencia canonica del arte de superficie',
  'Auditoria con rol anon sobre Supabase vivo y el Storage oficial vexforge-assets: 29 filas de arte de superficie inscritas (8 route_hero, 7 route_background, 5 region_art, 4 faction_icon, 4 faction_background, 1 season_banner), todas official = true, enabled = true y disponibles en Storage. Hallazgos corregidos: la portada consumia emblemas locales de public/factions/ que no estaban inscritos en el manifiesto, mientras las 4 filas faction_icon oficiales quedaban sin consumo; el tablero de batalla fijaba rutas de arena en literales crudos con la base de Storage interpolada. Decision canonica: todo arte de superficie se resuelve desde el manifiesto oficial mediante storageAsset() o los mapas FACTION_ICON, FACTION_BACKGROUND y SURFACE_BACKGROUND de src/lib/assetManifest.ts; ningun otro archivo puede fijar rutas de superficie en literales ni servir arte local no inscrito. El arte inscrito y aun sin superficie que lo consuma (5 heroes de ruta, 5 region_art y el season_banner) queda como reserva declarada y reversible en RESERVED_SURFACE_ART: no se elimina ni se sustituye, y solo se promueve con una decision nueva registrada. El cumplimiento se verifica con npm run verify:surface-art, encadenado en npm run verify:all.',
  'official',
  jsonb_build_object(
    'unit', 'VE-11-SURFACE-ART-PROVENANCE',
    'guard_command', 'npm run verify:surface-art',
    'roles', jsonb_build_array('route_hero','route_background','region_art','faction_icon','faction_background','season_banner'),
    'inscribed_count', 29,
    'consumed_count', 18,
    'reserved_count', 11,
    'storage_available', 29,
    'code_hardcoded_paths', 0,
    'local_art_removed_from_consumption', 'public/factions/*.png',
    'resolution_source', 'src/lib/assetManifest.ts sobre vexforge_official_asset_manifest',
    'reopen_condition', 'alta o baja de arte de superficie, o decision de promover una pieza en reserva a superficie consumida'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
