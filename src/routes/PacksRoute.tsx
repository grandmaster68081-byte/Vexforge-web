import { useState } from "react";
import { usePacks } from "../domains/packs/usePacks";
import type { OpenedCard } from "../domains/packs/repository";

const RARITY_COLOR: Record<string, string> = {
  Common: "#9A9AB0", Uncommon: "#3DC96B", Rare: "#4A9EFF",
  Epic: "#A855F7", Legendary: "#E8B84B", Mythic: "#FF4444",
};

const RARITY_EMOJI: Record<string, string> = {
  Common: "⬜", Uncommon: "🟩", Rare: "🟦", Epic: "🟣", Legendary: "🌟", Mythic: "🔴",
};

const PACK_VISUAL: Record<string, {
  icon: string; name: string; desc: string;
  color: string; glow: string; gradient: string; badge: string; price: number;
}> = {
  seed_pack: {
    icon: "🌱", name: "Seed Pack", badge: "BÁSICO",
    desc: "Cartas comunes y uncommon. Perfecto para comenzar tu colección.",
    color: "#9A9AB0", glow: "rgba(154,154,176,0.3)",
    gradient: "linear-gradient(135deg, #2a2a3a, #1a1a2a)", price: 10,
  },
  scout_pack: {
    icon: "🔍", name: "Scout Pack", badge: "EXPLORADOR",
    desc: "Mayor chance de raras. Para exploradores experimentados.",
    color: "#3DC96B", glow: "rgba(61,201,107,0.3)",
    gradient: "linear-gradient(135deg, #142a1a, #0f1f14)", price: 50,
  },
  expedition_pack: {
    icon: "⚔️", name: "Expedition Pack", badge: "ÉLITE",
    desc: "Garantiza al menos una carta Rara o superior. Recomendado.",
    color: "#4A9EFF", glow: "rgba(74,158,255,0.35)",
    gradient: "linear-gradient(135deg, #0f1f35, #091525)", price: 150,
  },
  forge_pack: {
    icon: "🔥", name: "Forge Pack", badge: "ÉPICO",
    desc: "Incluye cartas épicas garantizadas. Para forjadores serios.",
    color: "#A855F7", glow: "rgba(168,85,247,0.4)",
    gradient: "linear-gradient(135deg, #1f0f35, #150925)", price: 500,
  },
  founder_pack: {
    icon: "👑", name: "Founder Pack", badge: "LEGENDARIO",
    desc: "Acceso anticipado. Cartas founder exclusivas + Legendaria garantizada.",
    color: "#E8B84B", glow: "rgba(232,184,75,0.5)",
    gradient: "linear-gradient(135deg, #2a1f0a, #1a1205)", price: 2000,
  },
};

function CardRevealScreen({ cards, onDismiss }: { cards: OpenedCard[]; onDismiss: () => void }) {
  return (
    <div className="pack-reveal-overlay">
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(201,144,31,0.08) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div className="pack-reveal-title">⚡ Pack Abierto!</div>
      <p style={{
        color: "var(--fg-muted)", fontFamily: '"Rajdhani", sans-serif',
        fontSize: 15, marginBottom: 4, textAlign: "center",
      }}>{cards.length} cartas recibidas</p>

      {/* Rarity summary */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
        {Object.entries(
          cards.reduce((acc, c) => { acc[c.rarity] = (acc[c.rarity] || 0) + 1; return acc; }, {} as Record<string, number>)
        ).map(([rarity, count]) => (
          <span key={rarity} style={{
            padding: "3px 12px", borderRadius: 20,
            background: `${RARITY_COLOR[rarity] || "#888"}18`,
            border: `1px solid ${RARITY_COLOR[rarity] || "#888"}50`,
            color: RARITY_COLOR[rarity] || "#888",
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 700,
          }}>
            {RARITY_EMOJI[rarity] || "•"} {count}× {rarity}
          </span>
        ))}
      </div>

      <div className="pack-reveal-cards">
        {cards.map((card, i) => {
          const rc = RARITY_COLOR[card.rarity] ?? "#888";
          return (
            <div
              key={i}
              className="pack-reveal-card"
              style={{
                border: `1.5px solid ${rc}55`,
                boxShadow: `0 0 20px ${rc}25`,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div style={{
                height: 3, background: rc,
                boxShadow: `0 0 8px ${rc}`,
                borderRadius: "2px 2px 0 0",
                margin: "-16px -14px 12px",
              }} />
              <div style={{
                color: rc, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                fontFamily: '"IBM Plex Mono", monospace', marginBottom: 8,
              }}>
                {card.rarity.toUpperCase()}
              </div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🃏</div>
              <div style={{
                color: "var(--fg-primary)", fontWeight: 700, fontSize: 12,
                fontFamily: '"Cinzel", serif', marginBottom: 4, lineHeight: 1.3,
              }}>{card.name}</div>
              <div style={{ color: "var(--fg-muted)", fontSize: 10 }}>{card.faction}</div>
              <div style={{ color: "var(--ember-gold-lt)", fontSize: 12, marginTop: 6, fontWeight: 700 }}>
                ⚡ {card.power}
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-primary" onClick={onDismiss} style={{ marginTop: 8 }}>
        ✅ Añadir a colección
      </button>
    </div>
  );
}

export function PacksRoute() {
  const { orders, openPackById: openOrder, openedCards, dismissReveal: clearOpenedCards, loading } = usePacks();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpen = async (orderId: string) => {
    setOpeningId(orderId);
    await openOrder(orderId);
    setOpeningId(null);
  };

  const pendingOrders = (orders ?? []).filter((o: any) => o.status === "pending");

  return (
    <div>
      {/* Reveal overlay */}
      {openedCards && openedCards.length > 0 && (
        <CardRevealScreen cards={openedCards} onDismiss={clearOpenedCards} />
      )}

      <div className="content">
        {/* Header */}
        <div className="route-header">
          <h2>Packs de Cartas</h2>
          <span className="route-badge">
            5 tipos · Probabilidades reales
          </span>
        </div>

        {/* Pack catalog */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label left">Tienda de Packs</div>
        </div>

        <div className="pack-grid">
          {Object.entries(PACK_VISUAL).map(([key, v]) => (
            <div
              key={key}
              className="pack-card"
              style={{
                "--pack-color": v.color,
                "--pack-glow": v.glow,
                background: v.gradient,
              } as React.CSSProperties}
            >
              {/* Badge */}
              <div style={{
                position: "absolute", top: 16, right: 12,
                padding: "3px 8px", borderRadius: 20,
                background: `${v.color}18`,
                border: `1px solid ${v.color}50`,
                color: v.color,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
              }}>{v.badge}</div>

              <span className="pack-icon">{v.icon}</span>
              <div className="pack-name">{v.name}</div>
              <div className="pack-desc">{v.desc}</div>
              <div className="pack-price">
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, opacity: 0.6, alignSelf: "flex-end", marginBottom: 2 }}>⚡</span>
                {v.price}
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, opacity: 0.6, alignSelf: "flex-end", marginBottom: 2 }}>VEX</span>
              </div>
              <button
                className="pack-open-btn"
                style={{ background: v.color, color: "#05050D" }}
                disabled={true}
              >
                Próximamente
              </button>
            </div>
          ))}
        </div>

        {/* Pending orders */}
        {pendingOrders.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div className="section-label left" style={{ marginBottom: 20 }}>
              Packs pendientes · {pendingOrders.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingOrders.map((order: any) => {
                const v = PACK_VISUAL[order.pack_key] ?? PACK_VISUAL.seed_pack;
                return (
                  <div
                    key={order.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 16,
                      background: "var(--layer-2)",
                      border: `1px solid ${v.color}30`,
                      borderRadius: 12, padding: "14px 20px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{v.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: '"Cinzel", serif', fontSize: 14,
                        color: "var(--fg-primary)", fontWeight: 700, marginBottom: 2,
                      }}>{v.name}</div>
                      <div style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 10, color: "var(--fg-dim)",
                      }}>
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ padding: "9px 24px", fontSize: 12 }}
                      onClick={() => handleOpen(order.id)}
                      disabled={openingId !== null || openingId === order.id}
                    >
                      {openingId === order.id ? "⏳ Abriendo..." : "📦 Abrir"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && pendingOrders.length === 0 && (
          <div style={{ marginTop: 48 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12, marginBottom: 8 }} />
            ))}
          </div>
        )}

        {!loading && pendingOrders.length === 0 && (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">Sin packs pendientes</div>
            <div className="empty-state-desc">
              Cuando compres un pack, aparecerá aquí para abrirlo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}