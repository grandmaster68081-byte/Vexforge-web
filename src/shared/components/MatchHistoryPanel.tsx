import { useState, useEffect } from "react";
    import { getEnrichedMatchHistory } from "../../domains/pvp/repository";
    import type { EnrichedMatch } from "../../domains/pvp/repository";
    import { getRank } from "../../lib/rankUtils";

    const OUTCOME_CFG = {
    win:     { label: "VICTORIA", bg: "#0f2a1a", border: "#3ddc8444", color: "#3ddc84" },
    loss:    { label: "DERROTA",  bg: "#2a0f0f", border: "#ff6b6b44", color: "#ff6b6b" },
    draw:    { label: "EMPATE",   bg: "#1a1a1a", border: "#88888844", color: "#888" },
    pending: { label: "PENDIENTE",bg: "#1a1a2e", border: "#2a2a3a",   color: "#555" },
    };

    function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 2)   return "ahora mismo";
    if (m < 60)  return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `hace ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "ayer";
    if (d < 7)   return `hace ${d} días`;
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    }

    function PowerBar({ my, opp }: { my: number | null; opp: number | null }) {
    if (my == null && opp == null) return null;
    const total = (my ?? 0) + (opp ?? 0);
    const myPct = total > 0 ? Math.round(((my ?? 0) / total) * 100) : 50;
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#444",
          fontFamily: '"IBM Plex Mono",monospace', marginBottom: 3 }}>
          <span style={{ color: "#3ddc84" }}>⚡{my ?? "?"}</span>
          <span style={{ color: "#555", fontSize: 7 }}>PODER</span>
          <span style={{ color: "#ff6b6b" }}>⚡{opp ?? "?"}</span>
        </div>
        <div style={{ height: 3, borderRadius: 3, background: "#ff6b6b66", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${myPct}%`, background: "#3ddc84",
            borderRadius: 3, transition: "width 0.8s ease" }} />
        </div>
      </div>
    );
    }

    interface ReplayModalProps { match: EnrichedMatch; onClose: () => void; }

    function MatchReplayModal({ match, onClose }: ReplayModalProps) {
    const cfg = OUTCOME_CFG[match.outcome];
    const tier = getRank(match.opponent_mmr);
    const eloAbs = Math.abs(match.my_elo_change ?? 0);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,5,13,0.96)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }} onClick={onClose}>
        <div
          style={{
            background: "linear-gradient(160deg,#12121f,#0a0a16)",
            border: `1px solid ${cfg.border}`,
            borderRadius: 20, padding: "32px 28px", maxWidth: 400, width: "90%",
            textAlign: "center",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Outcome headline */}
          <div style={{
            fontSize: 36, fontFamily: "Cinzel,serif", fontWeight: 900,
            color: cfg.color, textShadow: `0 0 40px ${cfg.color}55`,
            letterSpacing: 4, marginBottom: 6,
          }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 12, color: "#555", fontFamily: '"IBM Plex Mono",monospace', marginBottom: 24 }}>
            {timeAgo(match.created_at)} · {new Date(match.created_at).toLocaleDateString("es-ES")}
          </div>

          {/* Opponent */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 20px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 22 }}>{tier.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14, color: "#e8e8f0" }}>
                vs {match.opponent_name}
              </div>
              <div style={{ fontSize: 9, color: tier.color, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                {tier.name} · {match.opponent_mmr} MMR
              </div>
            </div>
          </div>

          {/* ELO change */}
          {match.my_elo_change != null && match.my_elo_change !== 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: match.my_elo_change > 0 ? "#0f2a1a" : "#2a0f0f",
              border: `1px solid ${match.my_elo_change > 0 ? "#3ddc8444" : "#ff6b6b44"}`,
              borderRadius: 10, padding: "8px 20px", marginBottom: 20,
            }}>
              <span style={{ color: "#666", fontSize: 11 }}>MMR</span>
              <span style={{ color: match.my_elo_change > 0 ? "#3ddc84" : "#ff6b6b", fontSize: 22, fontWeight: 800 }}>
                {match.my_elo_change > 0 ? "+" : ""}{match.my_elo_change}
              </span>
            </div>
          )}

          {/* Power comparison */}
          {(match.my_power != null || match.opponent_power != null) && (
            <div style={{
              background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 16px", marginBottom: 20,
            }}>
              <PowerBar my={match.my_power} opp={match.opponent_power} />
            </div>
          )}

          {/* Rewards if any */}
          {match.rewards_json && Object.keys(match.rewards_json).length > 0 && (
            <div style={{
              fontSize: 10, color: "#e8b84b", fontFamily: "Rajdhani,sans-serif",
              marginBottom: 16, letterSpacing: "0.06em",
            }}>
              🎁 {Object.entries(match.rewards_json).map(([k, v]) => `${k}: ${v}`).join(" · ")}
            </div>
          )}

          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "11px 28px", color: "#888",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 13,
            cursor: "pointer", letterSpacing: "0.06em",
          }}>
            Cerrar
          </button>
        </div>
      </div>
    );
    }

    /** D.2 — Match History Panel (replaces basic historial in PvpRoute) */
    export function MatchHistoryPanel() {
    const [matches, setMatches] = useState<EnrichedMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<EnrichedMatch | null>(null);

    useEffect(() => {
      getEnrichedMatchHistory().then(res => {
        setMatches(res.data ?? []);
        setLoading(false);
      });
    }, []);

    const bg0 = "#12121f"; const bdim = "#2a2a3a";

    return (
      <div>
        <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 17, margin: "0 0 12px",
          display: "flex", alignItems: "center", gap: 10 }}>
          📜 Historial de Batallas
          {!loading && matches.length > 0 && (
            <span style={{ fontSize: 10, color: "#444", fontFamily: '"IBM Plex Mono",monospace',
              fontWeight: 400, letterSpacing: "0.08em" }}>
              {matches.length} partida{matches.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {loading && (
          <div style={{ color: "#333", fontSize: 12, fontFamily: '"IBM Plex Mono",monospace', padding: "12px 0" }}>
            Cargando historial…
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{
            background: bg0, border: `1px solid ${bdim}`, borderRadius: 12,
            padding: "28px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚔️</div>
            <div style={{ color: "#555", fontSize: 13, fontFamily: "Rajdhani,sans-serif" }}>
              Sin partidas aún. ¡Busca un oponente y entra en batalla!
            </div>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {matches.map(match => {
              const cfg  = OUTCOME_CFG[match.outcome];
              const tier = getRank(match.opponent_mmr);
              return (
                <div
                  key={match.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10,
                    background: bg0, border: `1px solid ${bdim}`,
                    transition: "border-color 0.15s",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelected(match)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.border)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = bdim)}
                >
                  {/* Outcome badge */}
                  <div style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.08em",
                    minWidth: 62, textAlign: "center", flexShrink: 0,
                  }}>
                    {cfg.label}
                  </div>

                  {/* Opponent info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{tier.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 13,
                        color: "#e8e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        vs {match.opponent_name}
                      </div>
                      <div style={{ fontSize: 8, color: "#444", fontFamily: '"IBM Plex Mono",monospace' }}>
                        {timeAgo(match.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Power diff (if available) */}
                  {match.my_power != null && (
                    <div style={{ fontSize: 9, color: "#555", fontFamily: '"IBM Plex Mono",monospace', flexShrink: 0 }}>
                      ⚡{match.my_power}
                    </div>
                  )}

                  {/* ELO change */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 48 }}>
                    {match.my_elo_change != null && match.my_elo_change !== 0 ? (
                      <span style={{
                        color: match.my_elo_change > 0 ? "#3ddc84" : "#ff6b6b",
                        fontSize: 12, fontWeight: 800, fontFamily: '"IBM Plex Mono",monospace',
                      }}>
                        {match.my_elo_change > 0 ? "+" : ""}{match.my_elo_change}
                      </span>
                    ) : (
                      <span style={{ color: "#333", fontSize: 10 }}>—</span>
                    )}
                    <div style={{ fontSize: 7, color: "#333", fontFamily: '"IBM Plex Mono",monospace', marginTop: 1 }}>
                      ELO
                    </div>
                  </div>

                  {/* Detail arrow */}
                  <div style={{ color: "#333", fontSize: 10, flexShrink: 0 }}>›</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Match replay modal */}
        {selected && (
          <MatchReplayModal match={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    );
    }
    