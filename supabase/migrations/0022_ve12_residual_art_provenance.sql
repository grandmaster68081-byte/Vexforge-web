-- VE-12-RESIDUAL-ART-PROVENANCE
-- Registra la decision canonica sobre el arte residual del manifiesto oficial
-- (boost_*, frame_*, icon_*, logo_variant_*, progression_*, reward_*,
-- chest_hero, cover_hero, lobby_hero, market_hero, tutorial_hero, wallet_hero
-- y las filas *_collection) y la baja de los emblemas locales public/factions/.
-- No modifica datos autoritativos, arte servido, Storage, esquema ni RLS.

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-12-RESIDUAL-ART-PROVENANCE',
  'assets',
  'Procedencia canonica del arte residual del manifiesto',
  'Auditoria con rol anon sobre Supabase vivo y el Storage oficial vexforge-assets: de las 237 filas del manifiesto, 186 ya estaban cubiertas por las guardas de jefes, cartas y superficie y 51 quedaban sin guarda. Esas 51 filas se reparten en 32 objetos reales (todos official = true, enabled = true y con HEAD 200 en Storage) y 19 filas *_collection que son marcadores de prefijo del bucket, no objetos servibles. Consumo real verificado: solo cover/main.jpg, lobby/main.jpg y logo/IMG_20260606_040509_906.jpg se sirven, siempre resueltos con storageAsset(). Decision canonica: el arte residual se resuelve unicamente desde el manifiesto oficial via VERIFIED_ASSETS/storageAsset(); las 19 filas de prefijo quedan declaradas en MANIFEST_BUNDLE_PREFIXES y nunca se referencian como imagen; los 29 objetos inscritos y sin consumo quedan como reserva declarada y reversible en RESERVED_RESIDUAL_ART, sin borrarse ni sustituirse, promovibles solo con una decision nueva registrada. Baja canonica ejecutada: los cuatro PNG locales de public/factions/ (guerrero, mago, paladin, picaro), sin consumo desde VE-11 y no inscritos en el manifiesto, se eliminan del repositorio porque el arte oficial de facción son las filas faction_icon del manifiesto. El cumplimiento se verifica con npm run verify:residual-art, encadenado en npm run verify:all, que ademas falla si aparece cualquier fila del manifiesto sin guarda o si resucita arte local de faccion.',
  'official',
  jsonb_build_object(
    'unit', 'VE-12-RESIDUAL-ART-PROVENANCE',
    'guard_command', 'npm run verify:residual-art',
    'manifest_rows_total', 237,
    'residual_rows', 51,
    'residual_objects', 32,
    'residual_consumed', 3,
    'residual_reserved', 29,
    'bundle_prefix_rows', 19,
    'storage_available', 32,
    'code_hardcoded_paths', 0,
    'local_art_removed', 'public/factions/{guerrero,mago,paladin,picaro}.png',
    'orphan_roles_after_unit', 0,
    'resolution_source', 'src/lib/assetManifest.ts sobre vexforge_official_asset_manifest',
    'reopen_condition', 'alta o baja de arte residual en Storage/manifiesto, o decision de promover una pieza en reserva a superficie consumida'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
