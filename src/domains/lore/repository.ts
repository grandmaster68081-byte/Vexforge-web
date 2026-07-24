import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface LoreEntry {
  id: string;
  entry_code: string | null;
  title: string | null;
  content: string | null;
  category: string | null;
  related_entity: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export async function listLoreEntries(): Promise<DomainResult<LoreEntry[]>> {
  const { data, error } = await supabase
    .from("lore_codex")
    .select("id, entry_code, title, content, category, related_entity, metadata, created_at")
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as LoreEntry[] };
}
