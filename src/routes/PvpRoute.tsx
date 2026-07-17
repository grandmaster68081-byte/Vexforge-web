import { usePvp } from "../domains/pvp/usePvp";
import { SkeletonTable } from "../shared/components/Skeleton";

const BG_URL     = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_pvp.jpg";
const EVENTS_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/events/events_season_hero.jpg";

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_COLOR = ["#e8702a", "#8a8a9e", "#e8b339"];

function PlayerBadge({ playerId }: { playerId: string }) {
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "'Courier New', monospace",
      fontSize: 11,
      background: "#ffffff09",
      border: "1px solid #ffffff18",
      borderRadius: 4,
      padding: "1px 6px",
      letterSpacing: "0.04em",
      color: "#c4c4d4",
    }}>
      #{playerId.slice(0, 6).toUpperCase()}
    </span>
  );
}

export function PvpRoute() {
  const { seasons, rankings, matches, loading, error, resolve, pending, activeSeasonId, setActiveSeasonId } = usePvp();

  const activeSeason = seasons.find((s) => s.id === activeSeasonId) ?? seasons[0];

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>PvP</h1>
        </div>
      </div>

      {seasons.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {seasons.map((s) => (
            <button
              key={s.id}
              className={`btn-small ${activeSeasonId === s.id ? "active" : ""}`}
              style={activeSeasonId === s.id ? { borderColor: "#e8702a", color: "#e8702a", background: "#e8702a18" } : {}}
              onClick={() => setActiveSeasonId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {activeSeason && (
        <div className="stat-card" style={{ marginBottom: 24, display: "inline-flex", gap: 24, padding: "12px 20px" }}>
          <div>
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Season</p>
            <p style={{ fontWeight: 600 }}>{activeSeason.name}</p>
          </div>
          <div>
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Ends</p>
            <p style={{ fontSize: 13 }}>{new Date(activeSeason.ends_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {loading && <SkeletonTable cols={6} rows={8} />}
      {error && <p className="error">{error}</p>}

      <h2 style={{ marginBottom: 12 }}>Leaderboard</h2>
      {!loading && rankings.length === 0 && (
        <div className="empty-state">
          <p>No rankings yet for this season.</p>
          <p className="muted">Play matches to appear on the leaderboard.</p>
        </div>
      )}

      {rankings.length > 0 && (
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Player</th><th>MMR</th><th>W</th><th>L</th><th>D</th></tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.id}>
                <td style={{ color: RANK_COLOR[i], fontWeight: i < 3 ? 700 : 400, fontSize: i < 3 ? 16 : 14 }}>
                  {i < 3 ? MEDAL[i] : i + 1}
                </td>
                <td><PlayerBadge playerId={r.player_id} /></td>
                <td><strong>{r.mmr}</strong></td>
                <td style={{ color: "#3ddc84" }}>{r.wins}</td>
                <td style={{ color: "#e3573f" }}>{r.losses}</td>
                <td className="muted">{r.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 28, marginBottom: 12 }}>Your Matches</h2>
      {matches.length === 0 ? (
        <div className="empty-state">
          <p className="muted">Sign in on the Account page to see your match history.</p>
        </div>
      ) : (
        <ul className="mission-list">
          {matches.map((m) => {
            const eloA = m.elo_change_a != null
              ? (m.elo_change_a >= 0 ? `+${m.elo_change_a}` : String(m.elo_change_a))
              : null;
            const eloB = m.elo_change_b != null
              ? (m.elo_change_b >= 0 ? `+${m.elo_change_b}` : String(m.elo_change_b))
              : null;
            return (
              <li key={m.id} className="mission-item">
                <div className="mission-region-stripe" style={{
                  background: m.status === "pending" ? "#e8b339" : m.status === "finished" ? "#3ddc84" : "#8a8a9e"
                }} />
                <div className="mission-meta">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <PlayerBadge playerId={m.player_a} />
                      <span className="muted" style={{ fontSize: 11 }}>vs</span>
                      <PlayerBadge playerId={m.player_b} />
                    </span>
                    <span className="muted" style={{ fontSize: 11 }}>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: m.status === "pending" ? "#e8b339" : m.status === "finished" ? "#3ddc84" : "#8a8a9e"
                    }}>
                      {m.status === "pending" ? "⏳ Pending" : m.status === "finished" ? "✓ Finished" : m.status}
                    </span>
                    {m.winner && (
                      <span className="muted" style={{ fontSize: 11 }}>
                        Winner: <PlayerBadge playerId={m.winner} />
                      </span>
                    )}
                    {eloA && (
                      <span style={{ fontSize: 11, color: (m.elo_change_a ?? 0) >= 0 ? "#3ddc84" : "#e3573f" }}>
                        Δ {eloA} / {eloB}
                      </span>
                    )}
                  </div>
                  {m.status === "pending" && (
                    <button
                      className="btn-small"
                      disabled={pending}
                      onClick={() => resolve(m.id)}
                      style={{ marginTop: 8, alignSelf: "flex-start", background: "#e8702a18", borderColor: "#e8702a44", color: "#e8702a" }}
                    >
                      {pending ? "Resolving…" : "Resolve match"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="hero-banner" style={{ backgroundImage: `url(${EVENTS_URL})`, marginTop: 28, height: 120, borderRadius: 8 }}>
        <div className="hero-banner-overlay" style={{ borderRadius: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Season Events</p>
          <p className="muted" style={{ fontSize: 12 }}>Tournaments and special PvP events announced here.</p>
        </div>
      </div>
    </section>
  );
}
