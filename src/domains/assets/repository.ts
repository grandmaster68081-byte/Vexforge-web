import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface GameAsset {
id: string;
display_name: string;
image_url: string;
folder: string;
}

// Folders confirmed present in vexforge-assets (audited 2026-07-16).
// Ordered to match PACK_ORDER in AssetsRoute.
const FOLDERS = [
"cards", "factions", "backgrounds", "boosts",
"chests", "icons", "heroes", "logo", "lobby",
];

/**
* Lists all image files from each Storage folder, grouped by folder name.
* vexforge_official_asset_manifest tracks ZIP bundles only, not individual
* files — so we list directly from Storage instead of querying the manifest.
* The vexforge-assets bucket is public; no auth required.
*/
export async function listAssetsGrouped(): Promise<DomainResult<Record<string, GameAsset[]>>> {
const entries = await Promise.all(
  FOLDERS.map(async (folder) => {
    const { data, error } = await supabase.storage
      .from("vexforge-assets")
      .list(folder, { limit: 200, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [folder, []] as [string, GameAsset[]];
    const assets: GameAsset[] = data
      .filter((f) => f.id && f.name)
      .map((f) => ({
        id: `${folder}/${f.name}`,
        display_name: f.name.replace(/\\.[^.]+$/, "").replace(/_/g, " "),
        image_url: `https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/${folder}/${f.name}`,
        folder,
      }));
    return [folder, assets] as [string, GameAsset[]];
  })
);

const gallery: Record<string, GameAsset[]> = {};
for (const [folder, assets] of entries) {
  if (assets.length > 0) gallery[folder] = assets;
}
return { status: "ready", data: gallery };
}
