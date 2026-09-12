import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface EvoPath {
  id: string; card_id: string; evolves_to_card_id: string;
  cost_json: { vex_ingame: number; copies_required: number };
  requirements_json: { level_required: number; pvp_wins: number; description: string };
  from_name: string; from_rarity: string; from_faction: string;
  to_name: string; to_rarity: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getEvolutionPaths(): Promise<DomainResult<EvoPath[]>> {
  const { data, error } = await supabase.from("card_evolution_paths").select(
    "id, card_id, evolves_to_card_id, cost_json, requirements_json," +
    "from_card:cards!card_id(name, rarity, faction)," +
    "to_card:cards!evolves_to_card_id(name, rarity)"
  );
  if (error) return { status: "ready", data: null, reason: error.message };
  const mapped = (data ?? []).map((r: any) => ({
    id:                 r.id,
    card_id:            r.card_id,
    evolves_to_card_id: r.evolves_to_card_id,
    cost_json:          r.cost_json ?? {},
    requirements_json:  r.requirements_json ?? {},
    from_name:    r.from_card?.name    ?? "",
    from_rarity:  r.from_card?.rarity  ?? "",
    from_faction: r.from_card?.faction ?? "",
    to_name:      r.to_card?.name      ?? "",
    to_rarity:    r.to_card?.rarity    ?? "",
  })) as EvoPath[];
  return { status: "ready", data: mapped };
}

export async function evolveCard(cardId: string): Promise<DomainResult<{ ok: boolean; message?: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para evolucionar cartas." };
  const { data: res, error } = await supabase.rpc("vexforge_evolve_card", {
    p_card_id: cardId, p_player_id: playerId,
  });
  if (error) return { status: "ready", data: { ok: false, message: error.message }, reason: error.message };
  const ok      = (res as any)?.ok !== false;
  const message = (res as any)?.message ?? (ok ? "Carta evolucionada!" : "No se pudo evolucionar.");
  return { status: "ready", data: { ok, message } };
}