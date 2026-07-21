import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export const RARITY_WEIGHTS: Record<string, number> = {
    Common: 1, Uncommon: 3, Rare: 10, Epic: 25, Legendary: 60, Mythic: 150,
    };
    export const RARITY_TOTALS: Record<string, number> = {
    Common: 40, Uncommon: 35, Rare: 25, Epic: 15, Legendary: 8, Mythic: 4,
    };
    export const TOTAL_CARDS = 127;
    export const MAX_SCORE = Object.entries(RARITY_TOTALS).reduce(
    (acc, [r, n]) => acc + n * (RARITY_WEIGHTS[r] ?? 1), 0
    ); // 1850

    export interface CollectionScore {
    totalOwned:     number;
    totalCards:     number;
    completionPct:  number;
    score:          number;
    maxScore:       number;
    scoreRank:      string;
    scoreRankColor: string;
    byRarity: Record<string, { owned: number; total: number; pct: number }>;
    }

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data } = await supabase.from("players")
      .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
    return data?.id ?? null;
    }

    function getScoreRank(s: number): { rank: string; color: string } {
    if (s >= 1600) return { rank: "Trascendente", color: "#ef4444" };
    if (s >= 1100) return { rank: "Eterno",       color: "#f59e0b" };
    if (s >= 700)  return { rank: "Legendario",   color: "#a78bfa" };
    if (s >= 400)  return { rank: "Gran Maestro", color: "#60a5fa" };
    if (s >= 200)  return { rank: "Maestro",      color: "#22c55e" };
    if (s >= 80)   return { rank: "Artesano",     color: "#34d399" };
    if (s >= 30)   return { rank: "Forjador",     color: "#e8b84b" };
    if (s >= 10)   return { rank: "Iniciado",     color: "#9ca3af" };
    return           { rank: "Aprendiz",          color: "#6b7280" };
    }

    export async function getCollectionScore(): Promise<DomainResult<CollectionScore>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your Collection Score." };

    const [{ data: allCards, error: cardsErr }, { data: owned, error: ownedErr }] = await Promise.all([
      supabase.from("cards").select("id, rarity").limit(500),
      supabase.from("player_cards").select("card_id").eq("player_id", playerId).gt("quantity", 0),
    ]);

    if (cardsErr)  return { status: "ready", data: null, reason: cardsErr.message };
    if (ownedErr)  return { status: "ready", data: null, reason: ownedErr.message };

    const ownedIds = new Set((owned ?? []).map((r: any) => r.card_id as string));
    const cardMap  = new Map((allCards ?? []).map((c: any) => [c.id as string, c.rarity as string]));

    const byRarity: Record<string, { owned: number; total: number; pct: number }> = {};
    for (const rarity of Object.keys(RARITY_TOTALS)) {
      byRarity[rarity] = { owned: 0, total: RARITY_TOTALS[rarity], pct: 0 };
    }
    for (const cardId of ownedIds) {
      const rarity = cardMap.get(cardId) ?? "Common";
      if (byRarity[rarity]) byRarity[rarity].owned += 1;
    }
    for (const rarity of Object.keys(byRarity)) {
      const { owned: o, total: t } = byRarity[rarity];
      byRarity[rarity].pct = t > 0 ? Math.round((o / t) * 100) : 0;
    }

    const totalOwned    = ownedIds.size;
    const totalCards    = allCards?.length ?? TOTAL_CARDS;
    const completionPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0;

    let score = 0;
    for (const cardId of ownedIds) {
      score += RARITY_WEIGHTS[cardMap.get(cardId) ?? "Common"] ?? 1;
    }

    const { rank, color } = getScoreRank(score);
    return {
      status: "ready",
      data: { totalOwned, totalCards, completionPct, score, maxScore: MAX_SCORE, scoreRank: rank, scoreRankColor: color, byRarity },
    };
    }
    