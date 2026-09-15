-- VEXFORGE: cards-only visual Storage policy.
-- Visual objects were removed through the Supabase Storage API, never by
-- deleting storage.objects directly (the Storage trigger intentionally blocks that).
-- This migration keeps the cleanup reproducible for the live catalog and access policy.

DROP POLICY IF EXISTS "vexforge_control_admin_delete_visual_assets" ON storage.objects;
CREATE POLICY "vexforge_control_admin_delete_visual_assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vexforge-assets'
  AND public.vexforge_is_control_admin()
);

UPDATE public.world_bosses
SET image_url = NULL
WHERE image_url LIKE '%/storage/v1/object/public/vexforge-assets/%';

UPDATE public.vexforge_official_asset_manifest
SET enabled = FALSE, updated_at = now()
WHERE COALESCE(internal_path, '') NOT LIKE 'cards/%';

UPDATE public.vexforge_asset_manifest
SET enabled = FALSE
WHERE COALESCE(internal_path, '') NOT LIKE 'cards/%';

UPDATE public.vexforge_asset_files
SET enabled = FALSE
WHERE COALESCE(internal_path, '') NOT LIKE 'cards/%';

UPDATE public.vexforge_asset_packs
SET enabled = FALSE
WHERE asset_key <> 'cards';
