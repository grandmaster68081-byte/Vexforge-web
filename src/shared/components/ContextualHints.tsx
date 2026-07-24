// TU.2 — Contextual Hints (chat99)
// Lightweight tooltips that appear on first visit to key pages.
// Uses localStorage to track which hints have been shown.

import { useState, useEffect, useCallback } from "react";

const HINTS_STORAGE_KEY = "vexforge_seen_hints_v2";

export type HintId =
  | "cards_filter" | "inventory_collection" | "deck_builder_limit"
  | "pvp_modes" | "market_fee" | "fusion_shard" | "packs_pity"
  | "bosses_energy" | "quests_daily_reset";

interface HintDefinition {
  id: HintId;
  title: string;
  body: string;
  icon: string;
  page: string;
  accentColor: string;
}

const HINTS: HintDefinition[] = [
  { id:"cards_filter",         page:"/cards",     icon:"🃏", accentColor:"#4a9eff",
    title:"Filtra por facción", body:"Usa los botones de facción para ver solo las cartas de tu estrategia preferida." },
  { id:"inventory_collection", page:"/inventory", icon:"📦", accentColor:"#a855f7",
    title:"Tu puntuación", body:"El panel de colección calcula hasta 1850 puntos según tus cartas de mayor rareza." },
  { id:"deck_builder_limit",   page:"/deck",      icon:"⚔️", accentColor:"#f59e0b",
    title:"Límite de mazo", body:"Un mazo tiene entre 10 y 20 cartas. Las cartas con sinergias de facción dan bonificaciones en batalla." },
  { id:"pvp_modes",            page:"/pvp",       icon:"🔥", accentColor:"#ef4444",
    title:"Modos de batalla", body:"vs IA es instantáneo. vs Jugador entra en la cola de matchmaking. Práctica no otorga recompensas." },
  { id:"market_fee",           page:"/market",    icon:"🏪", accentColor:"#3dc96b",
    title:"Comisión del mercado", body:"Cada venta cobra un 5% de comisión. El comprador paga el precio marcado completo." },
  { id:"fusion_shard",         page:"/fusion",    icon:"⚗️", accentColor:"#e8b84b",
    title:"Shard de fusión", body:"Necesitas 3 cartas + Shards para fusionar. Las cartas de mayor rareza requieren más Shards." },
  { id:"packs_pity",           page:"/packs",     icon:"📦", accentColor:"#818cf8",
    title:"Sistema de pity", body:"Cada 10 packs sin Épica o superior estás garantizado a recibir una carta Épica o mejor." },
  { id:"bosses_energy",        page:"/bosses",    icon:"🐉", accentColor:"#5b8bf5",
    title:"Energía de ataque", body:"Cada ataque a un boss consume 1 punto de energía. Se regenera con el tiempo o usando items." },
  { id:"quests_daily_reset",   page:"/quests",    icon:"📜", accentColor:"#34d399",
    title:"Reinicio diario", body:"Las quests diarias se reinician a las 00:00 UTC. Completa las 3 para el bonus de VEX diario." },
];

function getSeenHints(): Set<HintId> {
  try {
    const raw = localStorage.getItem(HINTS_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markHintSeen(id: HintId): void {
  try {
    const seen = getSeenHints();
    seen.add(id);
    localStorage.setItem(HINTS_STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* silent */ }
}

/** Hook: returns the hint to show for the current page, if unseen */
export function useContextualHint(page: string): {
  hint: HintDefinition | null;
  dismiss: () => void;
} {
  const [hint, setHint] = useState<HintDefinition | null>(null);

  useEffect(() => {
    const seen = getSeenHints();
    const match = HINTS.find(h => h.page === page && !seen.has(h.id));
    if (match) {
      // Small delay so page loads first
      const t = setTimeout(() => setHint(match), 1800);
      return () => clearTimeout(t);
    }
  }, [page]);

  const dismiss = useCallback(() => {
    if (hint) { markHintSeen(hint.id); setHint(null); }
  }, [hint]);

  return { hint, dismiss };
}

/** Renders a contextual hint tooltip */
export function ContextualHint({ page }: { page: string }) {
  const { hint, dismiss } = useContextualHint(page);
  if (!hint) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 20, zIndex: 8000,
      background: "rgba(10,10,28,0.97)",
      border: `1px solid ${hint.accentColor}55`,
      borderRadius: 14, padding: "14px 18px",
      maxWidth: 300, boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${hint.accentColor}22`,
      animation: "hintSlideIn 0.3s ease",
    }}>
      <style>{`
        @keyframes hintSlideIn {
          from { opacity:0; transform:translateX(16px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:22, lineHeight:1 }}>{hint.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color: hint.accentColor, marginBottom:4 }}>
            {hint.title}
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5 }}>
            {hint.body}
          </div>
        </div>
        <button onClick={dismiss} style={{
          background:"none", border:"none", color:"#475569", cursor:"pointer",
          fontSize:16, lineHeight:1, padding:0, marginLeft:4,
        }}>✕</button>
      </div>
      <div style={{ marginTop:10, textAlign:"right" }}>
        <button onClick={dismiss} style={{
          background:"none", border:`1px solid ${hint.accentColor}44`,
          borderRadius:8, color: hint.accentColor, fontSize:11,
          padding:"4px 12px", cursor:"pointer",
        }}>Entendido</button>
      </div>
    </div>
  );
}
