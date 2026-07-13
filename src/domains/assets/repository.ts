import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

const STORAGE_BASE =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/";

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];

export interface OfficialAsset {
  id: string;
  asset_pack: string;
  asset_code: string;
  internal_path: string | null;
  file_name: string;
  semantic_role: string;
  display_name: string;
  enabled: boolean | null;
  image_url: string | null;
  is_image: boolean;
}

function toImageUrl(internal_path: string | null): string | null {
  if (!internal_path) return null;
  return `${STORAGE_BASE}${internal_path}`;
}

function isImageFile(file_name: string): boolean {
  const lower = file_name.toLowerCase();
  return IMAGE_EXT.some((ext) => lower.endsWith(ext));
}

/**
 * Verified real read path: table vexforge_official_asset_manifest,
 * RLS policy read_all, SELECT, public, qual = true.
 * This is the SINGLE official asset source.
 *
 * As of this pass, the table holds two kinds of rows:
 * - bundle rows (file_name ending in .zip) -- archive-level, not renderable
 * - individual image rows (real files verified against storage.objects) --
 *   these are the ones the UI should ever render as <img>.
 * Both are returned here; callers should filter on is_image before rendering.
 */
export async function listEnabledAssets(pack?: string): Promise<DomainResult<OfficialAsset[]>> {
  let query = supabase
    .from("vexforge_official_asset_manifest")
    .select("id, asset_pack, asset_code, internal_path, file_name, semantic_role, display_name, enabled")
    .eq("enabled", true);

  if (pack) query = query.eq("asset_pack", pack);

  const { data, error } = await query.order("asset_code", { ascending: true });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }

  const rows = (data ?? []).map((row) => ({
    ...row,
    image_url: toImageUrl(row.internal_path),
    is_image: isImageFile(row.file_name),
  })) as OfficialAsset[];

  return { status: "ready", data: rows };
}

/**
 * Same source, grouped by asset_pack and restricted to real renderable
 * images (excludes the .zip bundle rows). This is what the visual gallery
 * should use -- one entry per pack that currently has zero individual
 * images means that pack is still pending generation (see docs/asset-gap.md).
 */
export async function listImageAssetsByPack(): Promise<
  DomainResult<Record<string, OfficialAsset[]>>
> {
  const result = await listEnabledAssets();
  if (!result.data) return result as DomainResult<Record<string, OfficialAsset[]>>;

  const grouped: Record<string, OfficialAsset[]> = {};
  for (const asset of result.data) {
    if (!asset.is_image) continue;
    if (!grouped[asset.asset_pack]) grouped[asset.asset_pack] = [];
    grouped[asset.asset_pack].push(asset);
  }
  return { status: "ready", data: grouped };
}
