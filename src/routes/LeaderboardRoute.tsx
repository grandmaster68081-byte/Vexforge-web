import { useLeaderboard } from "../domains/leaderboard/useLeaderboard";
import { SkeletonTable } from "../shared/components/Skeleton";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";

interface RankTier { name: string; color: string; icon: string; }

function getRank(mmr: number): RankTier {
  if (mmr >= 3000) return { name: "Mythic",   color: "#ff4444", icon: "💎" };
  if (mmr >= 2400) return { name: "Legend",   color: "#e8b84b", icon: "👑" };
  if (mmr >= 1800) return { name: "Diamond",  color: "#4a9eff", icon: "💠" };
  if (mmr >= 1200) return { name: "Platinum", color: "#3ddc84", icon: "🏅" };
  if (mmr >= 600)  return { name: "Gold",     color: "#f59e0b", icon: "🥇" };
  if (mmr >= 200)  return { name: "Silver",   color: "#8b8b9e", icon: "🥈" };
  return           { name: "Bronze",          color: "#cd7f32", icon: "🥉" };
}

const MEDAL = ["🥇", "🥈", "🥉"];
const TIER_THRESHOLDS = [
  { name: "Mythic",   min: 3000, color: "#ff4444", icon: "💎" },
  { name: "Legend",   min: 2400, color: "#e8b84b", icon: "👑" },
  { name: "Diamond",  min: 1800, color: "#4a9eff", icon: "💠" },
  { name: "Platinum", min: 1200, color: "#3ddc84", icon: "🏅" },
  { name: "Gold",     min: 600,  color: "#f59e0b", icon: "🥇" },
  { name: "Silver",   min: 200,  color: "#8b8b9e", icon: "🥈" },
  { name: "Bronze",   min: 0,    color: "#cd7f32", icon: "🥉" },
];

export function LeaderboardRoute() {
  const { status, data, myPlayerId: myId, reload } = useLeaderboard(100);
  const rows   = data ?? [];
  const loading = status === "loading";
  const error   = status === "ready" && !data ? "Error al cargar el clasificatorio" : null;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Clasificatorio ───</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: 0 }}>🏆 Leaderboard</h1>
          <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
        </div>
        <p style={{ color: "#666", margin: "4px 0 0", fontSize: 12 }}>Clasificación global por MMR. Los mejores 100 jugadores.</p>
      </div>

      {/* Tier legend */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {TIER_THRESHOLDS.map(t => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 4, background: "#12121a", border: `1px solid ${t.color}33`, borderRadius: 8, padding: "4px 10px" }}>
            <span style={{ fontSize: 12 }}>{t.icon}</span>
            <span style={{ color: t.color, fontSize: 10, fontWeight: 700 }}>{t.name}</span>
            <span style={{ color: "#444", fontSize: 9 }}>{t.min}+</span>
          </div>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <SkeletonTable cols={5} rows={7} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="⚔️"
          title="Sin clasificados aún"
          description="Todavía no hay jugadores clasificados. ¡Sé el primero en jugar PvP para aparecer aquí!"
        />
      )}

      {/* Rankings table */}
      {!loading && !error && rows.length > 0 && (
        <div style={{ background: "#12121a", border: "1px solid #2a2a3a", borderRadius: 12, overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 100px 120px 60px", padding: "8px 16px", borderBottom: "1px solid #1a1a2e" }}>
            <div style={{ color: "#444", fontSize: 9, fontWeight: 700 }}>#</div>
            <div style={{ color: "#444", fontSize: 9, fontWeight: 700 }}>JUGADOR</div>
            <div style={{ color: "#444", fontSize: 9, fontWeight: 700, textAlign: "right" }}>MMR</div>
            <div style={{ color: "#444", fontSize: 9, fontWeight: 700, textAlign: "center" }}>W / L</div>
            <div style={{ color: "#444", fontSize: 9, fontWeight: 700, textAlign: "right" }}>WIN%</div>
          </div>
          {rows.map((row, i) => {
            const tier = getRank(row.mmr);
            const isMe = row.player_id === myId;
            return (
              <div key={row.player_id} style={{
                display: "grid", gridTemplateColumns: "48px 1fr 100px 120px 60px", alignItems: "center",
                padding: "12px 16px", borderBottom: i < rows.length - 1 ? "1px solid #1a1a2e" : "none",
                background: isMe ? "#1a2a1a22" : i % 2 === 0 ? "transparent" : "#0f0f1a22",
                boxShadow: isMe ? "inset 0 0 0 1px #3ddc8433" : "none",
              }}>
                <div style={{ fontFamily: "Cinzel,serif", fontWeight: 800, color: i < 3 ? "#e8b84b" : "#555", fontSize: i < 3 ? 16 : 13 }}>
                  {i < 3 ? MEDAL[i] : `#${row.rank_position}`}
                </div>
                <div>
                  <span style={{ color: isMe ? "#3ddc84" : "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{row.display_name}</span>
                  {isMe && <span style={{ color: "#3ddc84", fontSize: 9, marginLeft: 6 }}>TÚ</span>}
                  <div style={{ color: tier.color, fontSize: 10 }}>{tier.icon} {tier.name}</div>
                </div>
                <div style={{ color: "#e8b84b", fontWeight: 700, fontSize: 14, textAlign: "right" }}>{row.mmr}</div>
                <div style={{ color: "#555", fontSize: 11, textAlign: "center" }}>
                  <span style={{ color: "#3ddc84" }}>{row.wins}W</span> · <span style={{ color: "#ff6b6b" }}>{row.losses}L</span>
                </div>
                <div style={{ color: "#888", fontSize: 11, textAlign: "right" }}>{row.win_rate}%</div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
