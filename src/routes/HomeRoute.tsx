import { Link } from "react-router-dom";
import { useHome } from "../domains/home/useHome";
import { SkeletonStatGrid, SkeletonList } from "../shared/components/Skeleton";

const LOBBY_URL =
"https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/lobby/main.jpg";

export function HomeRoute() {
const { profile, progress, wallet, nextMissions, signedIn, loading } = useHome();

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${LOBBY_URL})`, height: 220 }}>
      <div className="hero-banner-overlay">
        <div>
          <h1 style={{ fontSize: 30, marginBottom: 4 }}>
            {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Welcome to VEXFORGE"}
          </h1>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {signedIn ? "Your forge status is live." : "Sign in to access your full game dashboard."}
          </p>
        </div>
      </div>
    </div>

    {loading && (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkeletonStatGrid count={3} />
      <SkeletonList rows={4} />
    </div>
  )}

    {!loading && !signedIn && (
      <div className="home-cta">
        <div className="home-cta-body">
          <h2>Start Your Journey</h2>
          <p className="muted">
            The card catalog and market are open without signing in.{" "}
            <Link to="/account">Sign in</Link> to unlock your full dashboard — progress,
            economy, PvP, and missions.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link to="/cards"><button>Browse Cards</button></Link>
            <Link to="/market"><button style={{ background: "#ffffff10", border: "1px solid #ffffff18" }}>View Market</button></Link>
            <Link to="/account"><button style={{ background: "#e8702a" }}>Sign In</button></Link>
          </div>
        </div>
      </div>
    )}

    {!loading && signedIn && (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── XP / Level quick stat ── */}
        {progress && (
          <div>
            <div className="dashboard-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card home-stat-card">
                <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Level</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: "#e8702a", lineHeight: 1 }}>{progress.level}</p>
                <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>{progress.xp.toLocaleString()} / {progress.xp_to_next.toLocaleString()} XP</p>
                <div style={{ height: 3, background: "#ffffff10", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((progress.xp / progress.xp_to_next) * 100, 100)}%`, background: "#e8702a", borderRadius: 2 }} />
                </div>
                <Link to="/progress" className="stat-card-link">Progress →</Link>
              </div>

              <div className="stat-card home-stat-card">
                <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Energy</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: "#3ddc84", lineHeight: 1 }}>{progress.energy}</p>
                <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>of {progress.max_energy} max</p>
                <div style={{ height: 3, background: "#ffffff10", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((progress.energy / progress.max_energy) * 100, 100)}%`, background: "#3ddc84", borderRadius: 2 }} />
                </div>
                <Link to="/missions" className="stat-card-link">Go to Missions →</Link>
              </div>

              <div className="stat-card home-stat-card">
                <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>In-Game VEX</p>
                {wallet ? (
                  <>
                    <p style={{ fontSize: 28, fontWeight: 700, color: "#e8702a" }}>{wallet.vex_ingame.toLocaleString()}</p>
                    <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>{wallet.vex_tradeable.toLocaleString()} tradeable</p>
                  </>
                ) : (
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Wallet not found.</p>
                )}
                <Link to="/economy" className="stat-card-link">Economy →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Next Missions ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2>Next Missions</h2>
            <Link to="/missions" className="muted" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          {nextMissions.length === 0 ? (
            <div className="empty-state"><p className="muted">No active missions right now.</p></div>
          ) : (
            <ul className="mission-list">
              {nextMissions.slice(0, 4).map((m) => (
                <li key={m.id} className="mission-item">
                  <div className="mission-meta">
                    <strong>{m.name}</strong>
                    <span className="mission-tags">
                      <span className="mission-tag">{m.energy_cost} ⚡</span>
                      <span className="mission-tag">+{m.reward_xp} XP</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Quick navigation ── */}
        <div>
          <h2 style={{ marginBottom: 12 }}>Domains</h2>
          <div className="quick-nav-grid">
            {[
              { to: "/cards",    label: "Cards",    color: "#4a9eff" },
              { to: "/market",   label: "Market",   color: "#3ddc84" },
              { to: "/pvp",      label: "PvP",      color: "#e3573f" },
              { to: "/packs",    label: "Packs",    color: "#e8b339" },
              { to: "/clans",    label: "Clans",    color: "#a855f7" },
              { to: "/fusion",   label: "Fusion",   color: "#e8702a" },
              { to: "/assets",   label: "Assets",   color: "#8a8a9e" },
              { to: "/profile",  label: "Profile",  color: "#e8702a" },
            ].map(({ to, label, color }) => (
              <Link key={to} to={to} className="quick-nav-card" style={{ borderColor: color + "30" }}>
                <span style={{ color, fontWeight: 700, fontSize: 14 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    )}
  </section>
);
}
