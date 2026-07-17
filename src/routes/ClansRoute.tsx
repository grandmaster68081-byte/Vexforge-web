import { useClans } from "../domains/clans/useClans";
import { SkeletonTable } from "../shared/components/Skeleton";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_clans.jpg";

export function ClansRoute() {
const { clans, members, wars, selectedClanId, status, reason, loading, selectClan } = useClans();

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Clans</h1>
      </div>
    </div>

    {loading && <SkeletonTable cols={4} rows={6} />}
    {!loading && reason && status !== "ready" && <p className="muted">{reason}</p>}

    {!loading && clans.length === 0 && status === "ready" && (
      <div className="empty-state"><p>No clans registered yet.</p></div>
    )}

    {!loading && clans.length > 0 && (
      <div>
        <h2 style={{ marginBottom: 12 }}>Top Clans by Prestige</h2>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Code</th><th>Prestige</th><th>Contributions</th><th></th></tr>
          </thead>
          <tbody>
            {clans.map((clan) => (
              <tr key={clan.id} className={selectedClanId === clan.id ? "selected" : ""}>
                <td><strong>{clan.name}</strong></td>
                <td><code>{clan.code}</code></td>
                <td>{clan.prestige.toLocaleString()}</td>
                <td>{clan.contribution_total.toLocaleString()}</td>
                <td>
                  <button className="btn-small" onClick={() => selectClan(clan.id)}>
                    {selectedClanId === clan.id ? "Viewing ▾" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {selectedClanId && members.length > 0 && (
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 12 }}>
          Members — {clans.find((c) => c.id === selectedClanId)?.name}
        </h2>
        <table className="data-table">
          <thead>
            <tr><th>Player</th><th>Role</th><th>Contribution</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, background: "#ffffff09", border: "1px solid #ffffff18", borderRadius: 4, padding: "1px 6px", color: "#c4c4d4" }}>
                    {m.display_name ?? "#" + m.player_id.slice(0, 6).toUpperCase()}
                  </span>
                </td>
                <td>{m.role}</td>
                <td>{m.contribution_accumulated.toLocaleString()}</td>
                <td>{new Date(m.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {wars.length > 0 && (
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 12 }}>My Clan Wars</h2>
        <table className="data-table">
          <thead>
            <tr><th>Reference</th><th>Status</th><th>Created</th><th>Resolved</th></tr>
          </thead>
          <tbody>
            {wars.map((w) => (
              <tr key={w.id}>
                <td><code style={{ fontSize: 11 }}>{w.reference_id.substring(0, 10)}…</code></td>
                <td>{w.status}</td>
                <td>{new Date(w.created_at).toLocaleDateString()}</td>
                <td>{w.resolved_at ? new Date(w.resolved_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div style={{ marginTop: 36 }}>
      <h2 style={{ marginBottom: 14 }}>Clan Actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {[
          { label: "Create a Clan", desc: "Found your own clan and recruit members.", icon: "⚔️" },
          { label: "Join a Clan", desc: "Request membership in an existing clan.", icon: "🤝" },
          { label: "Leave Clan", desc: "Step down from your current clan.", icon: "🚪" },
        ].map((action) => (
          <div key={action.label} style={{ background: "#ffffff06", border: "1px solid #ffffff10", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{action.icon}</div>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{action.label}</p>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{action.desc}</p>
            <button className="btn-small" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>Coming Soon</button>
          </div>
        ))}
      </div>
    </div>
  </section>
);
}
