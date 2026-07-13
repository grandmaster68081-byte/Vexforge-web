import { useState } from "react";
import { useMarket } from "../domains/market/useMarket";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

export function MarketRoute() {
  const { listings, myCards, loading, error, actionError, pending, create, buy, cancel } = useMarket();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [price, setPrice] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCardId || !price) return;
    await create(selectedCardId, Number(price));
    setSelectedCardId("");
    setPrice("");
  }

  return (
    <section>
      <header className="route-header">
        <h1>Market</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading listings from Supabase…</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      <h2>Open listings</h2>
      {!loading && !error && listings.length === 0 && (
        <div className="empty-state">
          <p>No open listings right now.</p>
          <p className="muted">This is the real market_listings table -- it's just empty.</p>
        </div>
      )}
      <ul>
        {listings.map((l) => (
          <li key={l.id}>
            {l.price} VEX · fee {l.fee} · expires {l.expires_at ?? "never"}{" "}
            <button disabled={pending} onClick={() => buy(l.id)}>
              Buy
            </button>{" "}
            <button disabled={pending} onClick={() => cancel(l.id)}>
              Cancel (if mine)
            </button>
          </li>
        ))}
      </ul>

      <h2>Sell one of your cards</h2>
      {myCards.length === 0 ? (
        <p className="muted">
          Sign in and own an unlocked card to list it (see the Account page).
        </p>
      ) : (
        <form onSubmit={handleCreate}>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
          >
            <option value="">Select a card…</option>
            {myCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.card_id} (x{c.quantity})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Price (VEX)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button type="submit" disabled={pending || !selectedCardId || !price}>
            List for sale
          </button>
        </form>
      )}

      <p className="muted">
        Buying/selling goes through create_listing / buy_listing / cancel_listing RPCs
        (see src/domains/market/repository.ts) -- never a direct table write.
      </p>
    </section>
  );
}
