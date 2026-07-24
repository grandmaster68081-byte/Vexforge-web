import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Relic {
  id: string;
  code: string;
  name: string;
  effect_type: string | null;
  effect_value: number | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export async function listRelics(): Promise<DomainResult<Relic[]>> {
  const { data, error } = await supabase
    .from("relics")
    .select("id, code, name, effect_type, effect_value, metadata, created_at")
    .order("name", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as Relic[] };
}
