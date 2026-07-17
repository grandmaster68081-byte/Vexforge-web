import { useEconomy } from "../domains/economy/useEconomy";
import { SkeletonStatGrid, SkeletonTable } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_economy.jpg";

const ENTRY_COLOR: Record<string, string> = {
earn: "#3ddc84", spend: "#e3573f", receive: "#4a9eff", send: "#e8702a",
};

export function EconomyRoute() {
const { wallet, ledger, loading, reason, signedIn } = useEconomy();

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Economy</h1>
      </div>
    </div>

    {loading && (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkeletonStatGrid count={2} />
      <SkeletonTable cols={4} rows={6} />
    </div>
  )}

    {!loading && !signedIn && (
      <div className="empty-state">
        <p>You are not signed in.</p>
        <p className="muted"><Link to="/account">Go to Account</Link> to sign in.</p>
      </div>
    )}

    {!loading && signedIn && !wallet && reason && (
      <div className="empty-state"><p className="muted">{reason}</p></div>
    )}

    {!loading && wallet && (
      <>
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>In-Game VEX</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#e8702a" }}>{wallet.vex_ingame.toLocaleString()}</p>
            <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>Non-tradeable</p>
          </div>
          <div className="stat-card">
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Tradeable VEX</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#4a9eff" }}>{wallet.vex_tradeable.toLocaleString()}</p>
            <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>Withdrawable</p>
          </div>
        </div>

        {ledger.length > 0 ? (
          <>
            <h2 style={{ marginBottom: 12 }}>Recent Transactions</h2>
            <table className="data-table">
              <thead><tr><th>Type</th><th>Amount</th><th>Currency</th><th>Balance After</th></tr></thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id}>
                    <td><span style={{ color: ENTRY_COLOR[e.entry_type] ?? "#e8e8e8" }}>{e.entry_type}</span></td>
                    <td><strong>{e.amount}</strong></td>
                    <td className="muted">{e.currency}</td>
                    <td>{e.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="empty-state"><p className="muted">No transactions recorded yet.</p></div>
        )}
      </>
    )}
  </section>
);
}
