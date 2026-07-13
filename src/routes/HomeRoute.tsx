import { Link } from "react-router-dom";
import { useHome } from "../domains/home/useHome";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

const LOBBY_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/lobby/main.jpg";

export function HomeRoute() {
  const { profile, progress, wallet, nextMissions, signedIn, loading } = useHome();

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${LOBBY_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
          <DomainStatusBadge status="ready" />
        </div>
      </div>

      {loading && <p className="muted">Loading your status from Supabase…</p>}

      {!loading && !signedIn && (
        <div className="empty-state">
          <p>You are not signed in yet.</p>
          <p className="muted">
            <Link to="/account">Sign in on the Account page</Link> to see your progress, wallet
            and next missions here. The card catalog and market are open without signing in.
          </p>
        </div>
      )}

      {!loading && signedIn && (
        <div className="dashboard-grid">
          <div className="stat-card">
            <h2>Progress</h2>
            {progress ? (
              <>
                <p>Level {progress.level}</p>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((progress.xp / Math.max(1, progress.xp_to_next)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <p className="muted">
                  {progress.xp} / {progress.xp_to_next} XP
                </p>
                <p className="muted">
                  Energy {progress.energy} / {progress.max_energy}
                </p>
              </>
            ) : (
              <p className="muted">No progress row yet.</p>
            )}
            <Link to="/progress">View progress →</Link>
          </div>

          <div className="stat-card">
            <h2>Wallet</h2>
            {wallet ? (
              <>
                <p>{wallet.vex_ingame} VEX (in-game)</p>
                <p className="muted">{wallet.vex_tradeable} VEX (tradeable)</p>
              </>
            ) : (
              <p className="muted">No wallet row yet.</p>
            )}
            <Link to="/economy">View economy →</Link>
          </div>

          <div className="stat-card">
            <h2>Next missions</h2>
            {nextMissions.length === 0 ? (
              <p className="muted">No active missions right now.</p>
            ) : (
              <ul>
                {nextMissions.map((m) => (
                  <li key={m.id}>
                    {m.name} · {m.energy_cost} energy · +{m.reward_xp} XP
                  </li>
                ))}
              </ul>
            )}
            <Link to="/missions">View all missions →</Link>
          </div>
        </div>
      )}

      <p className="muted">
        This dashboard only composes data already exposed by the profile, progress, economy and
        missions domains -- no new tables or queries were added for it.
      </p>
    </section>
  );
}
