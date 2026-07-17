import { useState } from "react";
import { useCards } from "../domains/cards/useCards";
import { SkeletonCardGrid } from "../shared/components/Skeleton";

const FACTION_ICONS: Record<string, string> = {
Guerrero: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_guerrero.png",
Mago:     "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_mago.png",
Paladin:  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_paladin.png",
"Paladín": "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_paladin.png",
Picaro:   "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_picaro.png",
"Pícaro": "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_picaro.png",
};

const RARITY_COLOR: Record<string, string> = {
Común: "#8b8b9e", Common: "#8b8b9e",
Raro:    "#4a9eff",  Rare:    "#4a9eff",
Épico:   "#a855f7",  Epic:    "#a855f7",
Legendario: "#e8702a", Legendary: "#e8702a",
};

export function CardsRoute() {
const { cards, loading, error } = useCards();
const [faction, setFaction] = useState<string | null>(null);

const factions = Array.from(new Set(cards.map((c) => c.faction).filter(Boolean)));
const filtered = faction ? cards.filter((c) => c.faction === faction) : cards;

return (
  <section>
    <div
      className="hero-banner"
      style={{ background: "linear-gradient(160deg, #120800 0%, #1e1000 45%, #16162e 100%)" }}
    >
      <div className="hero-banner-overlay">
        <div>
          <h1>Cards</h1>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {cards.length > 0 ? `${cards.length} canonical cards in the VEXFORGE collection` : "Loading the collection…"}
          </p>
        </div>
      </div>
    </div>

    {loading && <SkeletonCardGrid count={8} minWidth={160} />}
    {error && <p className="error">{error}</p>}

    {!loading && factions.length > 0 && (
      <div className="faction-filter">
        <button
          className={`faction-btn ${faction === null ? "active" : ""}`}
          onClick={() => setFaction(null)}
        >
          All
        </button>
        {factions.map((f) => (
          <button
            key={f}
            className={`faction-btn ${faction === f ? "active" : ""}`}
            onClick={() => setFaction(faction === f ? null : f)}
          >
            {FACTION_ICONS[f] && (
              <img src={FACTION_ICONS[f]} alt={f} className="faction-btn-icon" />
            )}
            {f}
          </button>
        ))}
      </div>
    )}

    {!loading && !error && filtered.length === 0 && (
      <div className="empty-state">
        <p>No cards found{faction ? ` for faction ${faction}` : ""}.</p>
      </div>
    )}

    <div className="card-grid">
      {filtered.map((c) => (
        <article key={c.id} className="card-tile">
          {c.image_url && (
            <img className="card-art" src={c.image_url} alt={c.name} loading="lazy" />
          )}
          <div className="card-tile-footer">
            <div className="card-tile-name-row">
              {c.faction && FACTION_ICONS[c.faction] && (
                <img src={FACTION_ICONS[c.faction]} alt={c.faction} className="card-faction-icon" />
              )}
              <h3>{c.name}</h3>
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              {c.faction} ·{" "}
              <span style={{ color: RARITY_COLOR[c.rarity] ?? "#e8702a" }}>{c.rarity}</span>
            </p>
            <p className="stat-row">PWR {c.power} · AFF {c.affinity} · PRE {c.prestige}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);
}
