import { supabase } from "../../lib/supabase";

export interface DailyCard {
  id:        string;
  code:      string;
  name:      string;
  rarity:    string;
  faction:   string;
  power:     number;
  lore:      string | null;
  image_url: string | null;
}

export interface ActivityItem {
  id:   string;
  type: "mission";
  icon: string;
  text: string;
  time: string;
}

/**
 * Picks one Legendary or Mythic card per day deterministically (day-of-year mod count).
 * Cards ordered by id (stable) so the rotation is consistent across clients.
 */
export async function getDailyFeaturedCard(): Promise<DailyCard | null> {
  const { data } = await supabase
    .from("cards")
    .select("id, code, name, rarity, faction, power, lore, image_url")
    .eq("active", true)
    .in("rarity", ["Legendary", "Mythic"])
    .order("id");

  if (!data || data.length === 0) return null;

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return data[dayOfYear % data.length] as DailyCard;
}

/**
 * Recent claimed missions — mission_runs has public read_all RLS policy.
 *
 * FIX chat57/bloque-5.23: players_self RLS blocks direct FK join to players table
 * for display_name of other users (join returns null → shows "Un forjador" for all).
 * Solution: two-step approach — fetch player_id from mission_runs, then resolve
 * display names via get_public_player_names SECURITY DEFINER RPC.
 */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  // Step 1: fetch runs with player_id (no players FK join — bypasses RLS limitation)
  const { data } = await supabase
    .from("mission_runs")
    .select("id, updated_at, player_id, missions(name)")
    .eq("status", "claimed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // Step 2: batch-resolve display names via SECURITY DEFINER RPC
  const playerIds = [...new Set((data as any[]).map((m: any) => m.player_id).filter(Boolean))];
  let nameMap: Record<string, string> = {};
  if (playerIds.length > 0) {
    const { data: names } = await supabase.rpc("get_public_player_names", { p_player_ids: playerIds });
    if (names) {
      nameMap = Object.fromEntries(
        (names as Array<{ id: string; display_name: string }>).map((r) => [r.id, r.display_name])
      );
    }
  }

  return (data as any[]).map((m: any) => ({
    id:   m.id,
    type: "mission" as const,
    icon: "📜",
    text: `${nameMap[m.player_id] ?? "Un forjador"} completó "${(m as any).missions?.name ?? "una misión"}"`,
    time: m.updated_at,
  }));
}
