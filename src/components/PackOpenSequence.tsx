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
    
    const sortedCards  = [...cards].sort((a,b) => (RARITY_RANK[b.rarity]??0)-(RARITY_RANK[a.rarity]??0));

    const tmuted = "#7a7a9a";

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
      const newConfetti: Confetto[] = Array.from({ length: count }, (_) => {
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
      // Ordenar de menor a mayor rareza para guardar las mejores para el final
      const unflipped = [...Array(cards.length).keys()]
        .filter(idx => !flipped.has(idx))
        .sort((a, b) => (RARITY_RANK[cards[a].rarity] ?? 0) - (RARITY_RANK[cards[b].rarity] ?? 0));
      const tick = () => {
        if (!autoRef.current || i >= unflipped.length) {
          autoRef.current = false;
          setAutoRunning(false);
          return;
        }
        const cardIdx = unflipped[i];
        const rarity = cards[cardIdx].rarity;
        flipCard(cardIdx);
        i++;
        // Pausa más larga para cartas épicas/legendarias/míticas — genera anticipación
        const rank = RARITY_RANK[rarity] ?? 0;
        const delay = rank >= 4 ? 900 : rank >= 3 ? 600 : rank >= 2 ? 420 : 320;
        setTimeout(tick, delay);
      };
      tick();
    }, [autoRunning, flipped, flipCard, cards]);

    useEffect(() => () => { autoRef.current = false; }, []);

    // ── SHAKING PHASE ───────────────────────────────────────────────────────
    if (phase === "shaking") {
      const c = packVisual.color;
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(10,10,24,0.98) 0%, rgba(3,3,10,0.99) 100%)",
          backdropFilter: "blur(12px)",
        }}>
          <style>{`
            #vf-pack-egg {
              animation: vfShake 0.5s ease-in-out infinite;
              cursor: pointer;
              transition: filter 0.15s;
            }
            #vf-pack-egg:hover { filter: brightness(1.22) drop-shadow(0 0 32px ${c}); }
            #vf-pack-egg:active { transform: scale(0.95); }
            @keyframes vf-ring-spin-cw  { to { transform: rotate(360deg); } }
            @keyframes vf-ring-spin-ccw { to { transform: rotate(-360deg); } }
            @keyframes vf-pack-pulse-shadow {
              0%,100% { box-shadow: 0 0 60px ${packVisual.glow}, 0 0 120px ${packVisual.glow}55; }
              50%      { box-shadow: 0 0 90px ${packVisual.glow}, 0 0 180px ${packVisual.glow}88; }
            }
            @keyframes vf-hint-blink {
              0%,90%,100% { opacity: 0.45; }
              45%          { opacity: 0.85; }
            }
          `}</style>

          {/* Nombre del pack */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{
              fontSize: 10, color: "#4a4a6a",
              fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.2em",
              textTransform: "uppercase", marginBottom: 10,
            }}>ABRIENDO PACK</div>
            <div style={{ fontSize: 24, fontFamily: "Cinzel,serif", color: c, fontWeight: 800, letterSpacing: "0.06em" }}>
              {packVisual.name}
            </div>
          </div>

          {/* Anillos orbitales + esfera central */}
          <div style={{ position: "relative", width: 220, height: 220 }}>
            {/* Anillo exterior */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: `1.5px solid ${c}44`,
              animation: "vf-ring-spin-cw 4s linear infinite",
            }} />
            {/* Anillo medio */}
            <div style={{
              position: "absolute", inset: 20, borderRadius: "50%",
              border: `1px solid ${c}28`,
              animation: "vf-ring-spin-ccw 3s linear infinite",
            }} />
            {/* Anillo interior */}
            <div style={{
              position: "absolute", inset: 40, borderRadius: "50%",
              border: `1px dashed ${c}18`,
              animation: "vf-ring-spin-cw 2s linear infinite",
            }} />
            {/* Esfera del pack */}
            <div id="vf-pack-egg" onClick={() => setPhase("burst")} style={{
              position: "absolute", inset: 30, borderRadius: "50%",
              background: packVisual.gradient,
              border: `3px solid ${c}88`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 64,
              animation: "vf-pack-pulse-shadow 2s ease-in-out infinite",
            }}>
              {packVisual.icon}
            </div>
          </div>

          {/* Instrucción con parpadeo */}
          <p style={{
            marginTop: 36, color: "#4a4a6a", fontSize: 12,
            fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.15em",
            textTransform: "uppercase",
            animation: "vf-hint-blink 2.2s ease-in-out infinite",
          }}>
            ✦ Toca para abrir ✦
          </p>

          {/* Cantidad de cartas */}
          <div style={{
            marginTop: 12, fontSize: 11, color: c + "88",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
            letterSpacing: "0.08em",
          }}>
            {cards.length} cartas dentro
          </div>
        </div>
      );
    }

    // ── BURST PHASE ─────────────────────────────────────────────────────────
    if (phase === "burst") {
      setTimeout(() => setPhase("reveal"), 1000);
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,13,0.97)",
          overflow: "hidden",
        }}>
          <style>{`
            @keyframes vf-burst-rings {
              0%   { opacity: 0.7; transform: scale(0.4); }
              100% { opacity: 0;   transform: scale(3.5); }
            }
            @keyframes vf-burst-icon {
              0%   { transform: scale(0.6); opacity: 0; }
              30%  { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `}</style>
          {/* Ondas de expansión */}
          {[0, 0.12, 0.25].map((delay, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 280, height: 280, borderRadius: "50%",
              border: `2px solid ${packVisual.color}`,
              animationDelay: `${delay}s`,
              animation: `vf-burst-rings 1s ${delay}s ease-out forwards`,
            }} />
          ))}
          {/* Icono central expandiéndose */}
          <div style={{
            fontSize: 100,
            animation: "vf-burst-icon 1s ease-out forwards",
            filter: `drop-shadow(0 0 40px ${packVisual.color})`,
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
                <div style={{ fontSize: 10, color: "#5a5a7a", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em" }}>REVELANDO</div>
                <div style={{ fontSize: 20, fontFamily: "Cinzel,serif", color: packVisual.color, fontWeight: 800 }}>{packVisual.name}</div>
              </div>
              {/* Progress counter */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontFamily: "Cinzel,serif", color: "#fff", fontWeight: 900, lineHeight: 1 }}>
                  <span style={{ color: packVisual.color }}>{flipped.size}</span>
                  <span style={{ color: "#4a4a6a", fontSize: 16 }}> / {cards.length}</span>
                </div>
                <div style={{ fontSize: 9, color: "#5a5a7a", fontFamily: '"IBM Plex Mono",monospace', marginTop: 3 }}>CARTAS REVELADAS</div>
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
                            <div style={{ fontSize: 9, color: tmuted, marginTop: 4, fontFamily: "Rajdhani,sans-serif" }}>
                              {card.faction}
                            </div>
                          )}
                        </div>
                        {/* Quantity badge */}
                        {(card.quantity_change ?? 0) > 1 && (
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            background: col, borderRadius: 10, padding: "2px 7px",
                            fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 800,
                            color: "#0a0a14",
                          }}>×{card.quantity_change}</div>
                        )}
                      </>
                    ) : (
                      /* Card back — con pulso y animación de hover */
                      <div style={{
                        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(160deg,#16162a,#0c0c1c)",
                        cursor: "pointer",
                      }}>
                        {/* Patrón de fondo sutil */}
                        <div style={{
                          position: "absolute", inset: 0,
                          backgroundImage: `repeating-linear-gradient(45deg, ${packVisual.color}06 0, ${packVisual.color}06 1px, transparent 0, transparent 50%)`,
                          backgroundSize: "10px 10px",
                        }} />
                        {/* Símbolo del pack pulsando */}
                        <div style={{
                          fontSize: 28, marginBottom: 10, position: "relative", zIndex: 1,
                          opacity: 0.5,
                          animation: "vfShake 2s ease-in-out infinite",
                          animationDelay: `${Math.random() * 1}s`,
                        }}>
                          {packVisual.icon}
                        </div>
                        {/* Separador decorativo */}
                        <div style={{
                          width: 36, height: 1, position: "relative", zIndex: 1,
                          background: `linear-gradient(90deg, transparent, ${packVisual.color}66, transparent)`,
                          marginBottom: 8,
                        }} />
                        {/* Texto */}
                        <div style={{
                          fontSize: 8, color: packVisual.color + "66", position: "relative", zIndex: 1,
                          fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}>
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
                  color: autoRunning ? "#7a7a9a" : "#0a0a14",
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
    // Agrupar cartas por rareza para el desglose rápido
    const rarityCounts: Record<string, number> = {};
    for (const c of cards) rarityCounts[c.rarity] = (rarityCounts[c.rarity] ?? 0) + 1;
    const bestRarity  = bestCard ? RARITY_RANK[bestCard.rarity] ?? 0 : 0;
    const headerEmoji = bestRarity >= 5 ? "🔥" : bestRarity >= 4 ? "✨" : bestRarity >= 3 ? "💎" : "📦";

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${packVisual.glow.replace("0.45","0.12").replace("0.55","0.12").replace("0.6","0.12")} 0%, rgba(3,3,10,0.99) 70%)`,
        display: "flex", flexDirection: "column", alignItems: "center",
        overflowY: "auto",
        backdropFilter: "blur(14px)",
      }}>
        <style>{`
          @keyframes vf-summary-appear {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
          @keyframes vf-row-in {
            from { opacity: 0; transform: translateX(-10px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes vf-best-shine {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>

        <div style={{
          maxWidth: 580, width: "100%", padding: "44px 20px 48px",
          animation: "vf-summary-appear 0.55s cubic-bezier(0.22,1,0.36,1) forwards",
        }}>
          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 38, marginBottom: 10, lineHeight: 1 }}>{headerEmoji}</div>
            <div style={{
              fontSize: 9, color: "#4a4a6a", fontFamily: '"IBM Plex Mono",monospace',
              letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10,
            }}>Pack Abierto — Resumen</div>
            <div style={{
              fontSize: 22, fontFamily: "Cinzel,serif", fontWeight: 900,
              color: packVisual.color, marginBottom: 8, letterSpacing: "0.04em",
            }}>{packVisual.name}</div>

            {/* Desglose rápido de rarezas */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {Object.entries(rarityCounts)
                .sort((a, b) => (RARITY_RANK[b[0]] ?? 0) - (RARITY_RANK[a[0]] ?? 0))
                .map(([rarity, count]) => (
                  <span key={rarity} style={{
                    padding: "3px 10px", borderRadius: 20,
                    background: `${RARITY_COLOR[rarity] ?? "#9a9ab0"}18`,
                    border: `1px solid ${RARITY_COLOR[rarity] ?? "#9a9ab0"}44`,
                    color: RARITY_COLOR[rarity] ?? "#9a9ab0",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 800, fontSize: 11,
                    letterSpacing: "0.06em",
                  }}>
                    {RARITY_LABEL[rarity] ?? rarity} ×{count}
                  </span>
                ))}
            </div>

            {/* Mejor carta destacada */}
            {isBestGood && bestCard && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 16px", borderRadius: 24,
                background: `linear-gradient(135deg, ${RARITY_COLOR[bestCard.rarity] ?? "#e8b84b"}18, ${RARITY_COLOR[bestCard.rarity] ?? "#e8b84b"}08)`,
                border: `1px solid ${RARITY_COLOR[bestCard.rarity] ?? "#e8b84b"}55`,
              }}>
                <span style={{
                  fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13,
                  background: `linear-gradient(90deg, ${RARITY_COLOR[bestCard.rarity] ?? "#e8b84b"}, #fff, ${RARITY_COLOR[bestCard.rarity] ?? "#e8b84b"})`,
                  backgroundSize: "200% auto",
                  animation: "vf-best-shine 3s linear infinite",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  ✦ {bestCard.name}
                </span>
                <span style={{ fontSize: 10, color: RARITY_COLOR[bestCard.rarity] ?? "#e8b84b", fontFamily: "Rajdhani,sans-serif", fontWeight: 700 }}>
                  ({RARITY_LABEL[bestCard.rarity] ?? bestCard.rarity})
                </span>
              </div>
            )}
          </div>

          {/* ── Lista de cartas ── */}
          <div style={{
            background: "rgba(10,10,22,0.85)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px", marginBottom: 22,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              fontSize: 9, color: "#4a4a6a", fontFamily: '"IBM Plex Mono",monospace',
              letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14,
            }}>
              {cards.length} Cartas Obtenidas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedCards.map((card, i) => {
                const col  = RARITY_COLOR[card.rarity] ?? "#9A9AB0";
                const rank = RARITY_RANK[card.rarity] ?? 0;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: `linear-gradient(90deg, ${col}12 0%, ${col}06 60%, transparent 100%)`,
                    border: `1px solid ${col}${rank >= 4 ? "44" : "1a"}`,
                    animation: `vf-row-in 0.3s ${i * 0.04}s ease-out both`,
                  }}>
                    {/* Rarity bar */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, background: col, flexShrink: 0,
                      boxShadow: rank >= 4 ? `0 0 8px ${col}` : undefined }} />
                    {/* Card thumbnail */}
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} style={{
                        width: 32, height: 44, objectFit: "cover", borderRadius: 4, flexShrink: 0,
                        border: `1px solid ${col}44`,
                      }} />
                    ) : (
                      <div style={{ width: 32, height: 44, borderRadius: 4, background: `${col}18`, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
                    )}
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "Cinzel,serif", fontSize: 13, color: "#e8e8f0",
                        fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{card.name}</div>
                      <div style={{ fontSize: 10, color: col, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, letterSpacing: "0.06em", marginTop: 2 }}>
                        {RARITY_LABEL[card.rarity] ?? card.rarity}{card.faction ? ` · ${card.faction}` : ""}
                      </div>
                    </div>
                    {/* Quantity / dupe badge */}
                    {(card.quantity_change ?? 1) > 1 && (
                      <div style={{
                        background: `${col}22`, border: `1px solid ${col}55`, borderRadius: 8,
                        padding: "3px 9px", fontSize: 11, color: col,
                        fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700, flexShrink: 0,
                      }}>×{card.quantity_change}</div>
                    )}
                    {/* NEW badge for non-dupes */}
                    {(card.quantity_change ?? 1) <= 1 && (
                      <div style={{
                        fontSize: 9, color: "#3ddc84", fontFamily: '"IBM Plex Mono",monospace',
                        fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0,
                      }}>NUEVA</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Botones de acción ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {onOpenAnother && (
              <button onClick={onOpenAnother} style={{
                background: `linear-gradient(135deg, ${packVisual.color}dd, ${packVisual.color}aa)`,
                border: `1px solid ${packVisual.color}`, borderRadius: 12, padding: "15px 24px",
                fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 15,
                color: "#0a0a14", cursor: "pointer", letterSpacing: "0.1em",
                width: "100%",
                boxShadow: `0 0 24px ${packVisual.glow}, 0 4px 16px rgba(0,0,0,0.5)`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
              >
                ✦ Abrir Otro Pack
              </button>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onInventory} style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "13px 16px",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14,
                color: "#c8c8e0", cursor: "pointer", letterSpacing: "0.06em",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                🃏 Ver Inventario
              </button>
              <button onClick={onDismiss} style={{
                flex: 1, background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 16px",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14,
                color: "#6a6a8a", cursor: "pointer", letterSpacing: "0.06em",
              }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    }
    