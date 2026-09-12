-- VE-5-ASSET-MANIFEST-DATA
-- Unidad de datos: inscripción de los archivos individuales realmente
-- existentes en el bucket oficial `vexforge-assets` dentro de
-- `public.vexforge_official_asset_manifest`, y corrección de las 3 rutas
-- rotas del pack `progression` (registradas con acento `progresión/`, que no
-- corresponde a ningún objeto real de Storage).
--
-- Reglas aplicadas:
--   * Cero genéricos: los nombres visibles provienen del dato canónico vivo
--     (`cards.name`, `world_bosses.name`) o de la superficie que consume el
--     asset. No se inventa arte, ni se sustituye ninguna imagen.
--   * Idempotente y transaccional: se puede reejecutar sin duplicar filas.
--   * Reversible: los valores heredados quedan respaldados en
--     `public.vexforge_icon_legacy` y las filas nuevas son identificables por
--     `asset_code`.
--   * No toca esquema de juego, RLS, RPCs, economía ni resultados autoritativos.

BEGIN;

-- 1. Corrección de rutas rotas del pack `progression` (respaldo previo).
INSERT INTO public.vexforge_icon_legacy (source_table, source_column, row_key, legacy_value, canonical_value)
SELECT 'vexforge_official_asset_manifest', 'internal_path', m.asset_code, m.internal_path,
       replace(m.internal_path, 'progresión/', 'progression/')
FROM public.vexforge_official_asset_manifest m
WHERE m.internal_path LIKE 'progresión/%'
  AND NOT EXISTS (
    SELECT 1 FROM public.vexforge_icon_legacy l
    WHERE l.source_table = 'vexforge_official_asset_manifest'
      AND l.source_column = 'internal_path'
      AND l.row_key = m.asset_code
  );

UPDATE public.vexforge_official_asset_manifest m
SET internal_path = replace(m.internal_path, 'progresión/', 'progression/'),
    source_zip_url = replace(m.source_zip_url, '/progresi%C3%B3n/', '/progression/'),
    updated_at = now()
WHERE m.internal_path LIKE 'progresión/%';

-- 2. Arte de carta: una fila por imagen consumida por `public.cards`.
INSERT INTO public.vexforge_official_asset_manifest
  (asset_pack, asset_code, internal_path, file_name, semantic_role, display_name, source_zip_url, official, enabled)
SELECT DISTINCT ON (o.name)
  'cards',
  'cards_' || regexp_replace(split_part(o.name, '/', 2), '\.[A-Za-z0-9]+$', ''),
  o.name,
  split_part(o.name, '/', 2),
  'card_art',
  c.name,
  'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/' || o.name,
  true,
  true
FROM storage.objects o
JOIN public.cards c ON c.image_url LIKE '%/' || o.name
WHERE o.bucket_id = 'vexforge-assets'
  AND o.name LIKE 'cards/%'
  AND NOT EXISTS (
    SELECT 1 FROM public.vexforge_official_asset_manifest m WHERE m.internal_path = o.name
  )
ORDER BY o.name, c.name
ON CONFLICT (asset_code) DO NOTHING;

-- 3. Arte de jefe mundial: una fila por imagen consumida por `public.world_bosses`.
INSERT INTO public.vexforge_official_asset_manifest
  (asset_pack, asset_code, internal_path, file_name, semantic_role, display_name, source_zip_url, official, enabled)
SELECT DISTINCT ON (o.name)
  'bosses',
  'bosses_' || lower(regexp_replace(regexp_replace(split_part(o.name, '/', 2), '\.[A-Za-z0-9]+$', ''), '[^A-Za-z0-9]+', '_', 'g')),
  o.name,
  split_part(o.name, '/', 2),
  'world_boss_art',
  b.name,
  'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/' || o.name,
  true,
  true
FROM storage.objects o
JOIN public.world_bosses b ON b.image_url LIKE '%/' || o.name
WHERE o.bucket_id = 'vexforge-assets'
  AND o.name LIKE 'bosses/%'
  AND NOT EXISTS (
    SELECT 1 FROM public.vexforge_official_asset_manifest m WHERE m.internal_path = o.name
  )
ON CONFLICT (asset_code) DO NOTHING;

-- 4. Fondos de superficie y de facción consumidos por `src/lib/assetManifest.ts`.
INSERT INTO public.vexforge_official_asset_manifest
  (asset_pack, asset_code, internal_path, file_name, semantic_role, display_name, source_zip_url, official, enabled)
SELECT v.asset_pack, v.asset_code, v.internal_path, v.file_name, v.semantic_role, v.display_name,
       'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/' || v.internal_path,
       true, true
FROM (VALUES
  ('backgrounds', 'backgrounds_bg_achievements', 'backgrounds/bg_achievements.jpg', 'bg_achievements.jpg', 'route_background', 'Achievements Hall Background'),
  ('backgrounds', 'backgrounds_bg_leaderboard', 'backgrounds/bg_leaderboard.jpg', 'bg_leaderboard.jpg', 'route_background', 'Leaderboard Background'),
  ('backgrounds', 'backgrounds_bg_bosses', 'backgrounds/bg_bosses.jpg', 'bg_bosses.jpg', 'route_background', 'Raids & World Bosses Background'),
  ('factions', 'factions_bg_guerrero', 'factions/bg_guerrero.jpg', 'bg_guerrero.jpg', 'faction_background', 'Guerrero Faction Background'),
  ('factions', 'factions_bg_mago', 'factions/bg_mago.jpg', 'bg_mago.jpg', 'faction_background', 'Mago Faction Background'),
  ('factions', 'factions_bg_paladin', 'factions/bg_paladin.jpg', 'bg_paladin.jpg', 'faction_background', 'Paladín Faction Background'),
  ('factions', 'factions_bg_picaro', 'factions/bg_picaro.jpg', 'bg_picaro.jpg', 'faction_background', 'Pícaro Faction Background')
) AS v(asset_pack, asset_code, internal_path, file_name, semantic_role, display_name)
WHERE EXISTS (
    SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'vexforge-assets' AND o.name = v.internal_path
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.vexforge_official_asset_manifest m WHERE m.internal_path = v.internal_path
  )
ON CONFLICT (asset_code) DO NOTHING;

COMMIT;
