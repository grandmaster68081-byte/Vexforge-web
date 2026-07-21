import { useState, useEffect, useRef, useCallback } from "react";
    import type { OpenedCard } from "../domains/packs/repository";

    export interface PackVisualData {
    icon: string; name: string; color: string; glow: string; gradient: string;
    }

    const RARITY_COLOR: Record<string, string> = {
    Common: "#9A9AB0", Uncommon: "#3DC96B", Rare: "#4A9EFF",
    Epic: "#A855F7", Legendary: "#E8B84B", Mythic: "#FF4444",
    };
    const RARITY_RANK: Record<string, number> = {
    Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5,
    };
    const RARITY_LABEL: Record<string, string> = {
    Common: "Común", Uncommon: "Infrecuente", Rare: "Rara",
    Epic: "Épica", Legendary: "Legendaria", Mythic: "Mítica",
    };

    const CONFETTI_COLORS = ["#E8B84B","#FF4444","#A855F7","#4A9EFF","#3DC96B","#fff","#FFD700","#FF69B4"];

    const KEYFRAMES = `
    @keyframes vfShake {
    0%,100%{transform:translateX(0) rotate(0deg)}
    15%{transform:translateX(-10px) rotate(-4deg)}
    30%{transform:translateX(10px) rotate(4deg)}
    45%{transform:translateX(-7px) rotate(-2deg)}
    60%{transform:translateX(7px) rotate(2deg)}
    75%{transform:translateX(-3px) rotate(-1deg)}
    90%{transform:translateX(3px)}
    }
    @keyframes vfPulse {
    0%,100%{opacity:0.55;transform:scale(1)}
    50%{opacity:1;transform:scale(1.1)}
    }
    @keyframes vfBurst {
    0%{opacity:0}20%{opacity:1}100%{opacity:0}
    }
    @keyframes vfCardIn {
    from{opacity:0;transform:translateY(48px) scale(0.75)}
    to{opacity:1;transform:translateY(0) scale(1)}
    }
    @keyframes vfRarityPop {
    0%{transform:scale(0.5);opacity:0}
    65%{transform:scale(1.15);opacity:1}
    100%{transform:scale(1);opacity:1}
    }
    @keyframes vfFloat {
    from{opacity:1;transform:translateY(0) scale(1)}
    to{opacity:0;transform:translateY(-28px) scale(0.8)}
    }
    @keyframes vfSummaryIn {
    from{opacity:0;transform:translateY(16px)}
    to{opacity:1;transform:translateY(0)}
    }
    @keyframes vfGlowPulse {
    0%,100%{box-shadow:0 0 20px var(--glow-color,#E8B84B55)}
    50%{box-shadow:0 0 48px var(--glow-color,#E8B84B99)}
    }
    @keyframes vfFlash {
    0%{opacity:0}15%{opacity:0.45}100%{opacity:0}
    }
    @keyframes vfConfetti {
    0%   {opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}
    80%  {opacity:0.8}
    100% {opacity:0;transform:translate(var(--cx,20px),var(--cy,80px)) rotate(var(--cr,360deg)) scale(0.4)}
    }
    @keyframes vfPulseRing {
    0%   {opacity:0.8;transform:scale(0.6)}
    100% {opacity:0;transform:scale(2.2)}
    }
    `;

    type Phase = "shaking" | "burst" | "reveal" | "summary";

    interface FloatLabel { id: number; rarity: string; x: number; y: number; }
    interface Confetto { id: number; x: number; y: number; color: string; size: number; cx: number; cy: number; cr: number; dur: number; }

    interface Props {
    cards: OpenedCard[];
    packVisual: PackVisualData;
    packKey: string;
    onDismiss: () => void;
    onInventory: () => void;
    onOpenAnother?: () => void;  // C.6 — "Abrir Otro" button
    }

    /** C.6 — Pack Opening Sequence 2.0 */
    export function PackOpenSequence({ cards, packVisual, onDismiss, onInventory, onOpenAnother }: Props) {
    const [phase, setPhase]           = useState<Phase>("shaking");
    const [flipped, setFlipped]       = useState<Set<number>>(new Set());
    const [autoRunning, setAutoRunning] = useState(false);
    const [floats, setFloats]         = useState<FloatLabel[]>([]);
    const [confetti, setConfetti]     = useState<Confetto[]>([]);
    const [flashColor, setFlashColor] = useState<string | null>(null);
    const floatId                     = useRef(0);
    const confettoId                  = useRef(0);
    const autoRef                     = useRef(false);

    useEffect(() => {
      const id = "vf-pack-kf";
      if (!document.getElementById(id)) {
        const s = document.createElement("style");
        s.id = id; s.textContent = KEYFRAMES;
        document.head.appendChild(s);
      }
    }, []);

    const allFlipped   = flipped.size >= cards.length;
    const bestCard     = [...cards].sort((a,b) => (RARITY_RANK[b.rarity]??0)-(RARITY_RANK[a.rarity]??0))[0];
    const isBestGood   = (RARITY_RANK[bestCard?.rarity]??0) >= 2;
    const rarityCounts = cards.reduce((acc,c) => ({ ...acc, [c.rarity]: (acc[c.rarity]||0)+1 }), {} as Record<string,number>);
    const sortedCards  = [...cards].sort((a,b) => (RARITY_RANK[b.rarity]??0)-(RARITY_RANK[a.rarity]??0));

    const bg0 = "#0d0d14"; const bg1 = "#12121f"; const bdim = "#2a2a3a"; const tmuted = "#7a7a9a";

    const spawnFloat = useCallback((rarity: string) => {
      floatId.current++;
      const fid = floatId.current;
      const x = Math.random() * 60 + 20;
      const y = Math.random() * 30 + 30;
      setFloats(p => [...p, { id: fid, rarity, x, y }]);
      setTimeout(() => setFloats(p => p.filter(f => f.id !== fid)), 850);
    }, []);

    const spawnConfetti = useCallback((rarityColor: string) => {
      const count = 28;
      const newConfetti: Confetto[] = Array.from({ length: count }, (_, i) => {
        confettoId.current++;
        return {
          id: confettoId.current,
          x: Math.random() * 80 + 10,   // % from left
          y: Math.random() * 40 + 20,   // % from top
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 8 + 4,
          cx: (Math.random() - 0.5) * 320,  // px trajectory x
          cy: Math.random() * 200 + 60,     // px trajectory y (downward)
          cr: (Math.random() - 0.5) * 720,  // rotation deg
          dur: Math.random() * 600 + 900,   // ms
        };
      });
      setConfetti(p => [...p, ...newConfetti]);
      setTimeout(() => {
        const ids = new Set(newConfetti.map(c => c.id));
        setConfetti(p => p.filter(c => !ids.has(c.id)));
      }, 1600);

      // Screen flash
      setFlashColor(rarityColor);
      setTimeout(() => setFlashColor(null), 700);
    }, []);

    const flipCard = useCallback((i: number) => {
      setFlipped(prev => {
        if (prev.has(i)) return prev;
        const next = new Set([...prev, i]);
        const rarity = cards[i].rarity;
        spawnFloat(rarity);
        if ((RARITY_RANK[rarity] ?? 0) >= 4) {
          // Legendary or Mythic — spawn confetti
          setTimeout(() => spawnConfetti(RARITY_COLOR[rarity] ?? "#E8B84B"), 120);
        }
        if (next.size >= cards.length) {
          setTimeout(() => setPhase("summary"), 800);
        }
        return next;
      });
    }, [cards, spawnFloat, spawnConfetti]);

    const autoReveal = useCallback(() => {
      if (autoRunning) return;
      setAutoRunning(true);
      autoRef.current = true;
      let i = 0;
      const unflipped = [...Array(cards.length).keys()].filter(idx => !flipped.has(idx));
      const tick = () => {
        if (!autoRef.current || i >= unflipped.length) {
          autoRef.current = false;
          setAutoRunning(false);
          return;
        }
        flipCard(unflipped[i]);
        i++;
        setTimeout(tick, 320);
      };
      tick();
    }, [autoRunning, flipped, flipCard, cards.length]);

    useEffect(() => () => { autoRef.current = false; }, []);

    // ── SHAKING PHASE ───────────────────────────────────────────────────────
    if (phase === "shaking") {
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,13,0.96)",
          backdropFilter: "blur(12px)",
        }}>
          <style>{`#vf-pack-egg{animation:vfShake 0.55s ease-in-out infinite;cursor:pointer;}
            #vf-pack-egg:hover{filter:brightness(1.15);}`}</style>

          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.14em", marginBottom: 8 }}>ABRIENDO</div>
            <div style={{ fontSize: 22, fontFamily: "Cinzel,serif", color: packVisual.color, fontWeight: 800 }}>{packVisual.name}</div>
          </div>

          <div id="vf-pack-egg" onClick={() => setPhase("burst")} style={{
            width: 160, height: 160, borderRadius: "50%",
            background: packVisual.gradient,
            border: `3px solid ${packVisual.color}88`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64,
            boxShadow: `0 0 60px ${packVisual.glow}, 0 0 120px ${packVisual.glow}55`,
          }}>
            {packVisual.icon}
          </div>

          <p style={{ marginTop: 32, color: tmuted, fontSize: 13, fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.1em" }}>
            Haz clic para abrir
          </p>
        </div>
      );
    }

    // ── BURST PHASE ─────────────────────────────────────────────────────────
    if (phase === "burst") {
      setTimeout(() => setPhase("reveal"), 900);
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,13,0.97)",
        }}>
          <div style={{
            width: 240, height: 240, borderRadius: "50%",
            background: packVisual.gradient,
            animation: "vfBurst 0.9s ease-out forwards",
            boxShadow: `0 0 120px ${packVisual.glow}, 0 0 220px ${packVisual.glow}88`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 80,
          }}>
            {packVisual.icon}
          </div>
        </div>
      );
    }

    // ── REVEAL PHASE ────────────────────────────────────────────────────────
    if (phase === "reveal") {
      const unflippedCount = cards.length - flipped.size;
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5,5,13,0.97)",
          overflowY: "auto",
          backdropFilter: "blur(8px)",
        }}>
          {/* Screen flash for Legendary/Mythic */}
          {flashColor && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 10001, pointerEvents: "none",
              background: `radial-gradient(circle at center, ${flashColor}44 0%, transparent 70%)`,
              animation: "vfFlash 0.7s ease-out forwards",
            }} />
          )}

          {/* Confetti particles */}
          {confetti.map(c => (
            <div key={c.id} style={{
              position: "fixed",
              left: c.x + "%", top: c.y + "%",
              width: c.size, height: c.size,
              borderRadius: 2,
              background: c.color,
              zIndex: 10002, pointerEvents: "none",
              // @ts-ignore
              '--cx': c.cx + 'px', '--cy': c.cy + 'px', '--cr': c.cr + 'deg',
              animation: `vfConfetti ${c.dur}ms cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
            }} />
          ))}

          {/* Float labels */}
          {floats.map(f => (
            <div key={f.id} style={{
              position: "fixed", left: f.x + "%", top: f.y + "%",
              zIndex: 10003, pointerEvents: "none",
              fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 13,
              color: RARITY_COLOR[f.rarity] ?? "#fff",
              letterSpacing: "0.1em",
              animation: "vfFloat 0.85s ease-out forwards",
            }}>
              +{RARITY_LABEL[f.rarity] ?? f.rarity}
            </div>
          ))}

          <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 80px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em" }}>REVELANDO</div>
                <div style={{ fontSize: 20, fontFamily: "Cinzel,serif", color: packVisual.color, fontWeight: 800 }}>{packVisual.name}</div>
              </div>
              {/* Progress counter */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontFamily: "Cinzel,serif", color: "#fff", fontWeight: 900, lineHeight: 1 }}>
                  <span style={{ color: packVisual.color }}>{flipped.size}</span>
                  <span style={{ color: "#333", fontSize: 16 }}> / {cards.length}</span>
                </div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace', marginTop: 3 }}>CARTAS REVELADAS</div>
              </div>
            </div>

            {/* Cards grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: cards.length <= 3 ? `repeat(${cards.length}, 1fr)` : "repeat(auto-fill,minmax(150px,1fr))",
              gap: 16, marginBottom: 28,
            }}>
              {cards.map((card, i) => {
                const isFlipped = flipped.has(i);
                const col  = RARITY_COLOR[card.rarity] ?? "#9A9AB0";
                const rank = RARITY_RANK[card.rarity] ?? 0;
                const isHighRarity = rank >= 4;
                return (
                  <div
                    key={i}
                    onClick={() => !isFlipped && flipCard(i)}
                    style={{
                      borderRadius: 12,
                      border: isFlipped ? `2px solid ${col}88` : "2px solid #2a2a3a",
                      background: isFlipped
                        ? `linear-gradient(160deg, #12121f, #0a0a14)`
                        : "linear-gradient(160deg,#1a1a2e,#0e0e1e)",
                      boxShadow: isFlipped
                        ? isHighRarity
                          ? `0 0 24px ${col}66, 0 0 48px ${col}33`
                          : `0 0 12px ${col}44`
                        : "none",
                      cursor: isFlipped ? "default" : "pointer",
                      overflow: "hidden",
                      position: "relative",
                      aspectRatio: "2/3",
                      transition: "box-shadow 0.4s ease",
                      animation: isFlipped ? "vfCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                    }}
                  >
                    {isFlipped ? (
                      <>
                        {/* Rarity glow pulse ring for high rarity */}
                        {isHighRarity && (
                          <div style={{
                            position: "absolute", inset: -4, borderRadius: 14, zIndex: 0,
                            border: `2px solid ${col}`,
                            animation: "vfPulseRing 1.2s ease-out 0.1s 3",
                          }} />
                        )}
                        {/* Card image */}
                        {card.image_url ? (
                          <img
                            src={card.image_url} alt={card.name}
                            style={{ width: "100%", height: "60%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{
                            height: "60%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: `linear-gradient(160deg, ${col}22, #0a0a14)`,
                            fontSize: 40,
                          }}>✦</div>
                        )}
                        {/* Card info */}
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{
                            fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 800,
                            color: col, letterSpacing: "0.1em", marginBottom: 3,
                            textTransform: "uppercase",
                            animation: "vfRarityPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                          }}>
                            {RARITY_LABEL[card.rarity] ?? card.rarity}
                          </div>
                          <div style={{
                            fontSize: 12, fontFamily: "Cinzel,serif", color: "#e8e8f0",
                            fontWeight: 700, lineHeight: 1.2,
                          }}>{card.name}</div>
                          {card.faction && (
                            <div style={{ fontSize: 9, color: "#555", marginTop: 4, fontFamily: "Rajdhani,sans-serif" }}>
                              {card.faction}
                            </div>
                          )}
                        </div>
                        {/* Quantity badge */}
                        {card.quantity_change > 1 && (
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            background: col, borderRadius: 10, padding: "2px 7px",
                            fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 800,
                            color: "#0a0a14",
                          }}>×{card.quantity_change}</div>
                        )}
                      </>
                    ) : (
                      /* Card back */
                      <div style={{
                        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(160deg,#1a1a2e,#0e0e1e)",
                      }}>
                        <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 8 }}>⚔</div>
                        <div style={{
                          width: 40, height: 2,
                          background: `linear-gradient(90deg, transparent, ${packVisual.color}66, transparent)`,
                        }} />
                        <div style={{ fontSize: 9, color: "#333", marginTop: 8, fontFamily: '"IBM Plex Mono",monospace' }}>
                          TAP
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!allFlipped && (
                <button onClick={autoReveal} disabled={autoRunning} style={{
                  background: autoRunning ? "#1e1e30" : `linear-gradient(135deg,${packVisual.color}cc,${packVisual.color})`,
                  border: "none", borderRadius: 10, padding: "14px 32px",
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 15,
                  color: autoRunning ? "#555" : "#0a0a14",
                  cursor: autoRunning ? "not-allowed" : "pointer",
                  letterSpacing: "0.1em",
                }}>
                  {autoRunning ? "Revelando..." : unflippedCount === cards.length ? "Revelar Todo" : `Revelar ${unflippedCount} restante${unflippedCount !== 1 ? "s" : ""}`}
                </button>
              )}
              {allFlipped && (
                <button onClick={() => setPhase("summary")} style={{
                  background: `linear-gradient(135deg,${packVisual.color}cc,${packVisual.color})`,
                  border: "none", borderRadius: 10, padding: "14px 32px",
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 15,
                  color: "#0a0a14", cursor: "pointer", letterSpacing: "0.1em",
                }}>
                  Ver Resumen →
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── SUMMARY PHASE ───────────────────────────────────────────────────────
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(5,5,13,0.97)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 560, width: "100%", margin: "0 auto", padding: "40px 24px",
          animation: "vfSummaryIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 10, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.14em", marginBottom: 8 }}>RESUMEN</div>
            <div style={{ fontSize: 24, fontFamily: "Cinzel,serif", color: packVisual.color, fontWeight: 900, marginBottom: 4 }}>
              {packVisual.name}
            </div>
            {isBestGood && bestCard && (
              <div style={{
                fontSize: 12, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, letterSpacing: "0.08em",
                color: RARITY_COLOR[bestCard.rarity] ?? "#fff",
              }}>
                ✦ Mejor carta: {bestCard.name} ({RARITY_LABEL[bestCard.rarity] ?? bestCard.rarity})
              </div>
            )}
          </div>

          {/* Rarity breakdown */}
          <div style={{
            background: "#12121f", border: "1px solid #2a2a3a", borderRadius: 12,
            padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 10, color: "#444", fontFamily: '"IBM Plex Mono",monospace', marginBottom: 16, letterSpacing: "0.1em" }}>
              CARTAS OBTENIDAS ({cards.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedCards.map((card, i) => {
                const col = RARITY_COLOR[card.rarity] ?? "#9A9AB0";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 12px", borderRadius: 8,
                    background: `linear-gradient(90deg, ${col}0a, transparent)`,
                    border: `1px solid ${col}22`,
                  }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: "#e8e8f0", fontWeight: 700 }}>
                        {card.name}
                      </div>
                      <div style={{ fontSize: 9, color: col, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                        {RARITY_LABEL[card.rarity] ?? card.rarity}
                        {card.faction ? ` · ${card.faction}` : ""}
                      </div>
                    </div>
                    {(card.quantity_change ?? 1) > 1 && (
                      <div style={{
                        background: `${col}22`, border: `1px solid ${col}44`, borderRadius: 8,
                        padding: "2px 8px", fontSize: 11, color: col, fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700,
                      }}>×{card.quantity_change}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {onOpenAnother && (
              <button onClick={onOpenAnother} style={{
                background: `linear-gradient(135deg,${packVisual.color}cc,${packVisual.color})`,
                border: "none", borderRadius: 10, padding: "15px 24px",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 16,
                color: "#0a0a14", cursor: "pointer", letterSpacing: "0.1em",
                width: "100%",
              }}>
                ✦ Abrir Otro Pack
              </button>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onInventory} style={{
                flex: 1, background: "#12121f", border: "1px solid #2a2a3a",
                borderRadius: 10, padding: "13px 16px",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14,
                color: "#e8e8f0", cursor: "pointer", letterSpacing: "0.06em",
              }}>
                Ver Inventario
              </button>
              <button onClick={onDismiss} style={{
                flex: 1, background: "#0d0d18", border: "1px solid #1a1a28",
                borderRadius: 10, padding: "13px 16px",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14,
                color: "#555", cursor: "pointer", letterSpacing: "0.06em",
              }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    }
    