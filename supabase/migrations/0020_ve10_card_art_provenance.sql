-- VE-10-CARD-ART-PROVENANCE
-- Registra la decisión canónica sobre el arte de cartas: correspondencia
-- biyectiva entre las 127 filas de public.cards y las 127 filas card_art del
-- manifiesto oficial, resuelta siempre desde el dato (cards.image_url).
-- No modifica datos autoritativos, arte servido, Storage, esquema ni RLS.

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-10-CARD-ART-PROVENANCE',
  'assets',
  'Procedencia canonica del arte de cartas',
  'Auditoria con rol anon sobre Supabase vivo y el Storage oficial vexforge-assets: 127 filas en public.cards, 127 filas card_art inscritas en vexforge_official_asset_manifest (todas official = true y enabled = true, todas bajo el prefijo cards/), correspondencia biyectiva sin arte compartido entre cartas, 0 referencias fuera del manifiesto, 0 arte inscrito sin consumir, 0 asset_code duplicado y 127 de 127 objetos disponibles en Storage. A diferencia del arte de jefes, el arte de carta NO tiene conjunto alternativo: no existe semantic_role card_art_variant, por lo que no hay decision de reserva que registrar. Decision canonica: el arte de cada carta es la fila card_art inscrita, oficial y habilitada referenciada por cards.image_url; el codigo no fija rutas cards/ literales y resuelve el arte siempre desde el dato. El cumplimiento se verifica con npm run verify:card-art, encadenado en npm run verify:all, que falla si una carta pierde arte, si aparece arte fuera del manifiesto, si dos cartas comparten arte, si sobra arte inscrito sin consumo, si un objeto inscrito falta en Storage o si el codigo fija una ruta de carta.',
  'official',
  jsonb_build_object(
    'unit', 'VE-10-CARD-ART-PROVENANCE',
    'guard_command', 'npm run verify:card-art',
    'canonical_role', 'card_art',
    'variant_role', null,
    'cards_count', 127,
    'card_art_count', 127,
    'mapping', 'biyectiva carta <-> arte',
    'storage_available', 127,
    'code_hardcoded_paths', 0,
    'resolution_source', 'cards.image_url',
    'reopen_condition', 'alta o baja de cartas o de arte de carta, o aparicion de un conjunto alternativo card_art_variant'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
