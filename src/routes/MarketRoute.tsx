import { useState } from "react";
import { useMarket } from "../domains/market/useMarket";
import { SkeletonTable } from "../shared/components/Skeleton";
import { useSession } from "../providers/AuthProvider";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_market.jpg";

const RARITY_COLOR: Record<string, string> = {
  "Común": "#8a8a9e", Common: "#8a8a9e",
  Raro: "#4a9eff",   Rare: "#4a9eff",
  "Épico": "#a855f7", Epic: "#a855f7",
  Legendario: "#e8702a", Legendary: "#e8702a",
};

function rarityColor(r: string | null): string {
  if (!r) return "#8a8a9e";
  for (const [k, v] of Object.entries(RARITY_COLOR)) {
    if (r.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "#8a8a9e";
}

export function MarketRoute() {
  const { listings, myCards, currentPlayerId, loading, error, actionError, pending, create, buy, cancel } = useMarket();
  const { session } = useSession();

  const [selectedCardId, setSelectedCardId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [listSuccess, setListSuccess] = useState(false);

  async function handleCreate() {
    const p = Number(listPrice);
    if (!selectedCardId || !p || p <= 0) { setListError("Select a card and enter a valid price."); return; }
    setListError(null); setListSuccess(false);
    const result = await create(selectedCardId, p);
    if (result.reason) { setListError(result.reason); }
    else { setListSuccess(true); setSelectedCardId(""); setListPrice(""); }
  }

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Market</h1>
          <p style={{ color: "#c4c4d4", fontSize: 13, marginTop: 4 }}>
            {listings.length} listing{listings.length !== 1 ? "s" : ""} open
          </p>
        </div>
      </div>

      {loading && <SkeletonTable cols={6} rows={6} />}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      <h2 style={{ marginBottom: 12 }}>Open Listings</h2>
      {!loading && !error && listings.length === 0 && (
        <div className="empty-state">
          <p>No open listings right now.</p>
          <p className="muted">Be the first to list a card for sale below.</p>
        </div>
      )}

      {listings.length > 0 && (
        <table className="data-table">
          <thead>
            <tr><th>Card</th><th>Rarity</th><th>Price (VEX)</th><th>Fee</th><th>Expires</th><th></th></tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const isOwner = !!currentPlayerId && currentPlayerId === l.player_id;
              return (
                <tr key={l.id}>
                  <td><strong>{l.card_name ?? `#${l.player_card_id.slice(0, 8)}`}</strong></td>
                  <td>
                    {l.card_rarity
                      ? <span style={{ color: rarityColor(l.card_rarity), fontSize: 12, fontWeight: 600 }}>{l.card_rarity}</span>
                      : <span className="muted">—</span>}
                  </td>
                  <td style={{ color: "#e8702a", fontWeight: 600 }}>{Number(l.price).toLocaleString()}</td>
                  <td className="muted">{l.fee > 0 ? l.fee : "—"}</td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isOwner ? (
                      <button className="btn-small" disabled={pending} onClick={() => cancel(l.id)}
                        style={{ background: "#e3573f18", borderColor: "#e3573f44", color: "#e3573f" }}>
                        {pending ? "…" : "Cancel"}
                      </button>
                    ) : (
                      <button className="btn-small" disabled={pending || !currentPlayerId} onClick={() => buy(l.id)}
                        style={{ background: "#e8702a18", borderColor: "#e8702a44", color: "#e8702a" }}>
                        {!currentPlayerId ? "Sign in" : pending ? "…" : "Buy"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ── Sell a Card ───────────────────────────────────── */}
      <div style={{ marginTop: 36 }}>
        <h2 style={{ marginBottom: 12 }}>Sell a Card</h2>
        {!session ? (
          <div className="coming-soon-panel">
            <p className="muted">
              <Link to="/account" style={{ color: "#e8702a" }}>Sign in</Link> to list your cards for sale.
            </p>
          </div>
        ) : loading ? null : myCards.length === 0 ? (
          <div className="coming-soon-panel">
            <p className="muted" style={{ marginBottom: 8 }}>
              You have no unlisted cards available right now.
            </p>
            <p className="muted" style={{ fontSize: 12 }}>
              Open <Link to="/packs" style={{ color: "#e8702a" }}>Packs</Link> to acquire new cards, or check <Link to="/cards" style={{ color: "#e8702a" }}>Cards</Link> for your collection.
            </p>
          </div>
        ) : (
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
            <div>
              <label style={{ fontSize: 12, color: "#8a8a9e", display: "block", marginBottom: 6 }}>Card to list</label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                style={{
                  width: "100%", background: "#12121e", border: "1px solid #ffffff18",
                  color: "#e8e8f0", borderRadius: 6, padding: "8px 12px", fontSize: 14,
                }}>
                <option value="">— Select a card —</option>
                {myCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.card_name ?? c.card_id.slice(0, 12)} · qty: {c.quantity}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "#8a8a9e", display: "block", marginBottom: 6 }}>Price (VEX)</label>
                <input
                  type="number" min={1} value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="e.g. 50"
                  style={{
                    width: "100%", background: "#12121e", border: "1px solid #ffffff18",
                    color: "#e8e8f0", borderRadius: 6, padding: "8px 12px", fontSize: 14, boxSizing: "border-box",
                  }} />
              </div>
              <button
                className="btn-small"
                onClick={handleCreate}
                disabled={pending || !selectedCardId || !listPrice}
                style={{ height: 36, padding: "0 16px", flexShrink: 0 }}>
                {pending ? "Listing…" : "List for Sale"}
              </button>
            </div>
            {listError && <p className="error" style={{ margin: 0 }}>{listError}</p>}
            {listSuccess && <p style={{ color: "#3ddc84", margin: 0, fontSize: 13 }}>✓ Card listed successfully!</p>}
          </div>
        )}
      </div>
    </section>
  );
}
