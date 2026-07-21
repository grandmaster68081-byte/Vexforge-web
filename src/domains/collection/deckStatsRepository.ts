import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export interface DeckStats {
    total_cards:      number;
    unique_cards:     number;
    total_power:      number;
    avg_power:        number;
    faction_counts:   Record<string, number>;
    rarity_counts:    Record<string, number>;
    top_power_cards:  Array<{ name: string; power: number; rarity: string; faction: string | null }>;
    completion_pct:   number;   // unique / 127 total
    }

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data } = await supabase.from("players")
      .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
    return data?.id ?? null;
    }

    const TOTAL_CARDS_IN_GAME = 127;

    export async function getDeckStats(): Promise<DomainResult<DeckStats>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus estadísticas." };

    // Fetch player's cards with joined card metadata
    const { data: playerCards, error } = await supabase
      .from("player_cards")
      .select("card_id, quantity, cards(id, name, rarity, faction, power)")
      .eq("player_id", playerId)
      .gt("quantity", 0);

    if (error) return { status: "ready", data: null, reason: error.message };

    const cards = playerCards ?? [];
    const faction_counts: Record<string, number> = {};
    const rarity_counts:  Record<string, number> = {};
    let total_power = 0;
    let total_cards = 0;
    const power_list: Array<{ name: string; power: number; rarity: string; faction: string | null }> = [];

    for (const pc of cards as any[]) {
      const card = pc.cards;
      if (!card) continue;
      const qty = pc.quantity ?? 1;
      total_cards += qty;
      const power = (card.power ?? 0) * qty;
      total_power += power;
      if (card.faction) faction_counts[card.faction] = (faction_counts[card.faction] ?? 0) + qty;
      if (card.rarity) rarity_counts[card.rarity] = (rarity_counts[card.rarity] ?? 0) + qty;
      power_list.push({ name: card.name ?? "?", power: card.power ?? 0, rarity: card.rarity ?? "Common", faction: card.faction ?? null });
    }

    power_list.sort((a, b) => b.power - a.power);

    return {
      status: "ready",
      data: {
        total_cards,
        unique_cards:    cards.length,
        total_power,
        avg_power:       cards.length > 0 ? Math.round(total_power / total_cards) : 0,
        faction_counts,
        rarity_counts,
        top_power_cards: power_list.slice(0, 5),
        completion_pct:  Math.round((cards.length / TOTAL_CARDS_IN_GAME) * 100),
      },
    };
    }
    