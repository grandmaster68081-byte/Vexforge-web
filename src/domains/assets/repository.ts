import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface OfficialAsset {
  id: string;
  asset_pack: string;
  asset_code: string;
  internal_path: string;
  file_name: string;
  semantic_role: string;
  display_name: string;
  enabled: boolean | null;
}

/**
 * Verified real read path (chat 21): table vexforge_official_asset_manifest,
 * RLS policy read_all, SELECT, public, qual = true.
 * This is the SINGLE official asset source. Do not use the deprecated
 * vexforge_asset_manifest / vexforge_asset_packs / vexforge_asset_files tables.
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
  return { status: "ready", data: data as OfficialAsset[] };
}
