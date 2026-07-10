import { useCards } from "../domains/cards/useCards";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

export function CardsRoute() {
  const { cards, loading, error } = useCards();

  return (
    <section>
      <header className="route-header">
        <h1>Cards</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading cards from Supabase…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && cards.length === 0 && (
        <div className="empty-state">
          <p>No active cards yet.</p>
          <p className="muted">This is the real table, not a placeholder — it's just empty right now.</p>
        </div>
      )}

      <div className="card-grid">
        {cards.map((c) => (
          <article key={c.id} className="card-tile">
            <h3>{c.name}</h3>
            <p className="muted">{c.faction} · {c.rarity}</p>
            <p className="stat-row">PWR {c.power} · AFF {c.affinity} · PRE {c.prestige}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
