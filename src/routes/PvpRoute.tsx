import { usePvp } from "../domains/pvp/usePvp";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

export function PvpRoute() {
  const { seasons, rankings, matches, loading, error, actionError, pending, resolve } = usePvp();

  return (
    <section>
      <header className="route-header">
        <h1>PvP</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading PvP data from Supabase…</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      <h2>Active season</h2>
      {!loading && seasons.length === 0 && (
        <div className="empty-state">
          <p>No active season right now.</p>
        </div>
      )}
      {seasons.map((s) => (
        <p key={s.id}>
          {s.name} — ends {new Date(s.ends_at).toLocaleDateString()}
        </p>
      ))}

      <h2>Leaderboard</h2>
      {rankings.length === 0 ? (
        <p className="muted">No rankings yet for the current season.</p>
      ) : (
        <ol>
          {rankings.map((r) => (
            <li key={r.id}>
              MMR {r.mmr} — {r.wins}W / {r.losses}L / {r.draws}D
            </li>
          ))}
        </ol>
      )}

      <h2>Your matches</h2>
      {matches.length === 0 ? (
        <p className="muted">
          Sign in to see your matches (see the Account page). None found yet either way.
        </p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              {m.status} · created {new Date(m.created_at).toLocaleString()}{" "}
              {m.status === "pending" && (
                <button disabled={pending} onClick={() => resolve(m.id)}>
                  Resolve match
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="muted">
        Match resolution goes through the resolve_pvp_match RPC (see
        src/domains/pvp/repository.ts) -- never a direct table write.
      </p>
    </section>
  );
}
