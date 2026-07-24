import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export interface PublicGameStats {
  active_players: number;
  total_cards: number;
  total_battles: number;
  packs_opened: number;
  season_name: string | null;
  season_ends_at: string | null;
  active_event_name: string | null;
  active_bosses: number;
  total_missions: number;
  top3: { display_name: string; mmr: number; rank: number; wins: number }[];
}

/**
 * U.1 — Dashboard público de métricas del juego.
 * No requiere autenticación. Usa get_home_stats RPC + consultas públicas.
 * Chat 79.
 */
export function usePublicStats() {
  const [stats, setStats] = useState<PublicGameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.rpc("get_home_stats"),
      supabase
        .from("world_bosses")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("production_ready", true),
    ]).then(([{ data: homeData }, { count: bossCount }, { count: missionCount }]) => {
      if (cancelled) return;
      if (homeData) {
        setStats({
          active_players:    homeData.active_players ?? 0,
          total_cards:       homeData.total_cards    ?? 0,
          total_battles:     homeData.total_battles  ?? 0,
          packs_opened:      homeData.packs_opened   ?? 0,
          season_name:       homeData.season?.name   ?? null,
          season_ends_at:    homeData.season?.ends_at ?? null,
          active_event_name: homeData.active_event?.name ?? null,
          active_bosses:     bossCount    ?? 15,
          total_missions:    missionCount ?? 5,
          top3:              homeData.top3 ?? [],
        });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { stats, loading };
}
