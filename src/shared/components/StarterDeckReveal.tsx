import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface StarterCard {
  id: string;
  name: string;
  faction: string;
  rarity: string;
  power: number;
  affinity: number;
  prestige: number;
  image_url: string;
}

const FACTION_COLORS: Record<string, string> = {
  Guerrero: "#E84040",
  Mago:     "#8B5CF6",
  Paladín:  "#E8B84B",
  Pícaro:   "#3DC96B",
};

const FACTION_ICONS: Record<string, string> = {
  Guerrero: "⚔️",
  Mago:     "🔮",
  Paladín:  "🛡️",
  Pícaro:   "🗡️",
};

const LS_KEY = "vex_starter_deck_seen";

export function StarterDeckReveal() {
  const [show, setShow]   = useState(false);
  const [cards, setCards] = useState<StarterCard[]>([]);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return;
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data: progress } = await supabase
        .from("player_progress")
        .select("tutorial_step")
        .maybeSingle();

      if (!progress || progress.tutorial_step < 3 || progress.tutorial_step === 99) return;

      const { data: result, error } = await supabase.rpc("vexforge_assign_starter_deck");
      if (error || !result?.cards?.length) return;

      if (!cancelled) {
        setCards(result.cards as StarterCard[]);
        setShow(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  function handleDismiss() {
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  }

  if (!show || cards.length === 0) return null;

  const factions = ["Guerrero", "Mago", "Paladín", "Pícaro"];
  const byFaction: Record<string, StarterCard[]> = {};
  factions.forEach(f => { byFaction[f] = []; });
  cards.forEach(c => { if (byFaction[c.faction]) byFaction[c.faction].push(c); });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tu mazo inicial"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(3, 3, 12, 0.94)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        overflowY: "auto",
        padding: "28px 16px 40px",
        animation: "sdr-fadeIn 0.4s ease",
      }}
    >
      <style>{`
        @keyframes sdr-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sdr-card {
          from { opacity: 0; transform: translateY(24px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes sdr-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,184,75,0); }
          50%     { box-shadow: 0 0 32px 6px rgba(232,184,75,0.2); }
        }
        .sdr-cta:hover { filter: brightness(1.12); transform: translateY(-2px); }
        .sdr-cta       { transition: filter 0.2s, transform 0.2s; }
      `}</style>

      <div style={{ maxWidth: 780, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>⚔️</div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 30, fontWeight: 900, letterSpacing: "0.02em",
            color: "#E8B84B", margin: "0 0 10px",
            textShadow: "0 0 32px rgba(232,184,75,0.45)",
            animation: "sdr-glow 3s ease-in-out infinite",
          }}>¡Tu mazo inicial está listo!</h2>
          <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            16 cartas — 4 de cada facción — seleccionadas para ti.<br />
            Son tuyas para siempre. Úsalas en batallas y misiones.
          </p>
        </div>

        {factions.map((faction) => {
          const fCards = byFaction[faction] ?? [];
          if (!fCards.length) return null;
          const color = FACTION_COLORS[faction] ?? "#888";
          return (
            <div key={faction} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 20, background: color, borderRadius: 2 }} />
                <span style={{ fontSize: 16 }}>{FACTION_ICONS[faction]}</span>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 14, fontWeight: 800,
                  color, letterSpacing: "0.12em", textTransform: "uppercase",
                }}>{faction}</span>
                <span style={{ color: "#555", fontSize: 12, marginLeft: 4 }}>×{fCards.length}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(156px, 1fr))",
                gap: 10,
              }}>
                {fCards.map((card, i) => (
                  <div key={card.id} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${color}30`,
                    borderRadius: 10, overflow: "hidden",
                    animation: `sdr-card 0.45s ease ${i * 0.07 + 0.1}s both`,
                  }}>
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", background: `${color}12`, position: "relative" }}>
                      {card.image_url ? (
                        <img src={card.image_url} alt={card.name} loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, opacity: 0.3 }}>
                          {FACTION_ICONS[faction]}
                        </div>
                      )}
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "1px 6px",
                        fontSize: 9, fontWeight: 700, color: "#ccc",
                        fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em",
                      }}>Common</div>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12, fontWeight: 800,
                        color: "#e0e0e0", marginBottom: 5, lineHeight: 1.2,
                      }}>{card.name}</div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                        <span style={{ color: "#E84040" }} title="Poder">⚡ {card.power}</span>
                        <span style={{ color: "#8B5CF6" }} title="Afinidad">✨ {card.affinity}</span>
                        <span style={{ color: "#E8B84B" }} title="Prestigio">👑 {card.prestige}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>
            Ve al Deck Builder para armar tu mazo de batalla.
          </p>
          <button onClick={handleDismiss} className="sdr-cta" style={{
            background: "linear-gradient(135deg, #E8B84B 0%, #c9901f 100%)",
            color: "#000", fontFamily: "'Rajdhani', sans-serif",
            fontSize: 17, fontWeight: 900, border: "none", borderRadius: 10,
            padding: "14px 52px", cursor: "pointer", letterSpacing: "0.06em",
            boxShadow: "0 4px 28px rgba(232,184,75,0.4)",
          }}>¡A jugar! ⚔️</button>
        </div>
      </div>
    </div>
  );
}
