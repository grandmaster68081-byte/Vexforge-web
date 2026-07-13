import { useState } from "react";
import { usePacks } from "../domains/packs/usePacks";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

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
      <header className="route-header">
        <h1>Packs</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading pack catalog from Supabase…</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      <h2>Available packs</h2>
      {!loading && catalog.length === 0 && (
        <div className="empty-state">
          <p>No active packs right now.</p>
        </div>
      )}
      <ul>
        {catalog.map((p) => (
          <li key={p.pack_key}>
            {p.pack_name} — {p.price_usdt} USDT
            {p.notes && <span className="muted"> ({p.notes})</span>}
          </li>
        ))}
      </ul>

      <h2>Order a pack</h2>
      <form onSubmit={handleOrder}>
        <select value={selectedPack} onChange={(e) => setSelectedPack(e.target.value)}>
          <option value="">Select a pack…</option>
          {catalog.map((p) => (
            <option key={p.pack_key} value={p.pack_key}>
              {p.pack_name} ({p.price_usdt} USDT)
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Your payout wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button type="submit" disabled={pending || !selectedPack || !walletAddress}>
          Create order
        </button>
      </form>
      <p className="muted">
        This creates a pending order via vexforge_create_pack_order -- it does not move funds
        by itself. Actual USDT payment/confirmation flow is outside this frontend pass.
      </p>

      <h2>Your orders</h2>
      {orders.length === 0 ? (
        <p className="muted">
          Sign in to see your pack orders (see the Account page). None found yet either way.
        </p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>
              {o.pack_key} — {o.price_usdt} USDT — {o.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
