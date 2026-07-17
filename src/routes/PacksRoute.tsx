import { useState } from "react";
import { usePacks } from "../domains/packs/usePacks";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_packs.jpg";

import { SkeletonCardGrid } from "../shared/components/Skeleton";

export function PacksRoute() {
  const { catalog, orders, loading, error, actionError, pending, order } = usePacks();
  const [selectedPack, setSelectedPack] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPack || !walletAddress) return;
    await order(selectedPack, walletAddress);
  }

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Packs</h1>
        </div>
      </div>

      {loading && <SkeletonCardGrid count={4} minWidth={200} />}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      <h2 style={{ marginBottom: 12 }}>Available Packs</h2>
      {!loading && catalog.length === 0 && (
        <div className="empty-state">
          <p>No active packs right now.</p>
        </div>
      )}

      <div className="pack-grid">
        {catalog.map((p) => (
          <div
            key={p.pack_key}
            className={`pack-card ${selectedPack === p.pack_key ? "selected" : ""}`}
            onClick={() => setSelectedPack(p.pack_key)}
          >
            <div className="pack-card-glow" />
            <div className="pack-card-body">
              <h3>{p.pack_name}</h3>
              <p className="stat-row">{p.price_usdt} USDT</p>
              {p.notes && (
                <p className="muted">{p.notes}</p>
              )}
              {p.active === false && <p className="muted">Inactive</p>}
            </div>
            {selectedPack === p.pack_key && (
              <div className="pack-selected-badge">Selected</div>
            )}
          </div>
        ))}
      </div>

      <form className="pack-order-form" onSubmit={handleOrder} style={{ marginTop: 24 }}>
        <h2>Order a Pack</h2>
        {catalog.length > 0 && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>Pack</span>
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              style={{ background: "#1a1a2e", color: "#e8e8e8", border: "1px solid #333", borderRadius: 4, padding: "6px 8px" }}
            >
              <option value="">— Select a pack —</option>
              {catalog.map((p) => (
                <option key={p.pack_key} value={p.pack_key}>
                  {p.pack_name} ({p.price_usdt} USDT)
                </option>
              ))}
            </select>
          </label>
        )}
        <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 12 }}>Wallet address</span>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Your wallet address"
            style={{ background: "#1a1a2e", color: "#e8e8e8", border: "1px solid #333", borderRadius: 4, padding: "6px 8px" }}
          />
        </label>
        <button type="submit" disabled={pending || !selectedPack || !walletAddress} style={{ marginTop: 12 }}>
          {pending ? "Ordering…" : "Order pack"}
        </button>
      </form>

      {orders.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>Your Orders</h2>
          <table className="data-table">
            <thead><tr><th>Pack</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.pack_key}</td>
                  <td>{o.status}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
