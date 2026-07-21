import { useCollectionScore } from "../../domains/collection/useCollectionScore";
    import { AnimatedProgressBar }  from "./AnimatedProgressBar";

    const RARITY_COLORS: Record<string, string> = {
    Common: "#9ca3af", Uncommon: "#22c55e", Rare: "#60a5fa",
    Epic: "#a78bfa", Legendary: "#f59e0b", Mythic: "#ef4444",
    };
    const RARITY_LABELS: Record<string, string> = {
    Common: "Común", Uncommon: "Infrecuente", Rare: "Rara",
    Epic: "Épica", Legendary: "Legendaria", Mythic: "Mítica",
    };
    const RARITIES_ORDER = ["Common","Uncommon","Rare","Epic","Legendary","Mythic"];

    /** C.5 — Collection Score Panel  */
    export function CollectionScorePanel() {
    const { score, loading, status } = useCollectionScore();
    if (loading || status === "blocked_auth" || !score) return null;

    const scorePct = score.maxScore > 0
      ? Math.min(100, Math.round((score.score / score.maxScore) * 100)) : 0;

    return (
      <div style={{
        background: "linear-gradient(135deg,#0d0d1a 0%,#12121f 50%,#0a0a14 100%)",
        border: `1px solid ${score.scoreRankColor}30`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        {/* ambient glow */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${score.scoreRankColor}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
          {/* score + rank */}
          <div>
            <div style={{ fontSize: 10, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em", marginBottom: 6 }}>
              COLLECTION SCORE
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 42, fontWeight: 900, fontFamily: "Cinzel,serif",
                color: score.scoreRankColor,
                textShadow: `0 0 32px ${score.scoreRankColor}55`,
                lineHeight: 1,
              }}>
                {score.score.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: "#444", fontFamily: '"IBM Plex Mono",monospace' }}>
                / {score.maxScore.toLocaleString()} pts
              </span>
            </div>
            <div style={{
              marginTop: 5, fontSize: 13, fontFamily: "Rajdhani,sans-serif",
              fontWeight: 800, letterSpacing: "0.12em",
              color: score.scoreRankColor,
              textTransform: "uppercase",
            }}>
              {score.scoreRank}
            </div>
          </div>

          {/* circular completion ring */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <svg width="76" height="76" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="38" cy="38" r="32"
                  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle cx="38" cy="38" r="32"
                  fill="none" stroke={score.scoreRankColor} strokeWidth="5"
                  strokeDasharray={`${201.1 * scorePct / 100} 201.1`}
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 5px ${score.scoreRankColor}88)`,
                    transition: "stroke-dasharray 1s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: "Cinzel,serif", lineHeight: 1 }}>
                  {score.completionPct}%
                </span>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 5, fontFamily: '"IBM Plex Mono",monospace' }}>
              {score.totalOwned}/{score.totalCards} cartas
            </div>
          </div>
        </div>

        {/* score progress bar */}
        <div style={{ marginBottom: 18 }}>
          <AnimatedProgressBar
            current={score.score} max={score.maxScore}
            color={score.scoreRankColor} height={5}
          />
        </div>

        {/* rarity breakdown grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 20px" }}>
          {RARITIES_ORDER.map(rarity => {
            const r = score.byRarity[rarity];
            if (!r) return null;
            const col = RARITY_COLORS[rarity] ?? "#9ca3af";
            return (
              <div key={rarity}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: col, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                    {RARITY_LABELS[rarity]}
                  </span>
                  <span style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace' }}>
                    {r.owned}/{r.total}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, width: `${r.pct}%`,
                    background: col, boxShadow: `0 0 4px ${col}55`,
                    transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    }
    