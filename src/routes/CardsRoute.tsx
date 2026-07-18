import { useState } from "react";
    import { useCards } from "../domains/cards/useCards";
    import type { Card } from "../domains/cards/repository";
    import { SkeletonCardGrid } from "../shared/components/Skeleton";

    const FACTION_ICONS: Record<string, string> = {
    Guerrero: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_guerrero.png",
    Mago:     "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_mago.png",
    Paladin:  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_paladin.png",
    "Paladín":"https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_paladin.png",
    Picaro:   "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_picaro.png",
    "Pícaro": "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_picaro.png",
    };

    const RARITY_COLOR: Record<string, string> = {
    Común: "#8b8b9e", Common: "#8b8b9e",
    Raro:    "#4a9eff",  Rare:    "#4a9eff",
    Uncommon: "#3ddc84",
    Épico:   "#a855f7",  Epic:    "#a855f7",
    Legendario: "#e8702a", Legendary: "#e8702a",
    };

    function StatPill({ label, value, color = "#e8702a" }: { label: string; value: number; color?: string }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 16px", background: "#ffffff08", borderRadius: 8, border: "1px solid #ffffff10" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a8a9e" }}>{label}</span>
      </div>
    );
    }

    function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
    const rc = RARITY_COLOR[card.rarity] ?? "#e8702a";
    return (
      <div
        className="modal-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={card.name}
      >
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

          <div className="modal-body">
            {/* Left — card art */}
            <div className="modal-art-col">
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="modal-card-art" />
              ) : (
                <div className="modal-art-placeholder" style={{ borderColor: rc }}>
                  <span style={{ fontSize: 48, color: rc }}>⬡</span>
                </div>
              )}

              {/* Badges below art */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
                <span className="mission-tag" style={{ color: rc, borderColor: rc + "55" }}>{card.rarity}</span>
                {card.faction && (
                  <span className="mission-tag">
                    {FACTION_ICONS[card.faction] && (
                      <img src={FACTION_ICONS[card.faction]} alt="" style={{ width: 12, height: 12, marginRight: 4, verticalAlign: "middle" }} />
                    )}
                    {card.faction}
                  </span>
                )}
                {card.fusion_enabled && (
                  <span className="mission-tag" style={{ color: "#a855f7", borderColor: "#a855f755" }}>⚗ Fusion</span>
                )}
                {card.is_legendary && (
                  <span className="mission-tag" style={{ color: "#e8702a", borderColor: "#e8702a55" }}>★ Legendary</span>
                )}
              </div>
            </div>

            {/* Right — info */}
            <div className="modal-info-col">
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#8a8a9e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                  {card.code}
                  {card.card_tier && <> · {card.card_tier}</>}
                </p>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 0, color: "#f0f0f8" }}>{card.name}</h2>
                {card.specialization && (
                  <p style={{ fontSize: 13, color: "#8a8a9e", marginTop: 4 }}>{card.specialization}</p>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                <StatPill label="PWR"    value={card.power}    color="#e8702a" />
                <StatPill label="AFF"    value={card.affinity} color="#4a9eff" />
                <StatPill label="PRE"    value={card.prestige} color="#3ddc84" />
                <StatPill label="CHG"    value={card.charge}   color="#a855f7" />
              </div>

              {/* Lore */}
              {card.lore && (
                <div style={{ marginBottom: 16, padding: "12px 14px", background: "#ffffff06", borderRadius: 8, borderLeft: `3px solid ${rc}` }}>
                  <p style={{ fontSize: 13, color: "#c0c0d0", lineHeight: 1.6, fontStyle: "italic" }}>"{card.lore}"</p>
                </div>
              )}

              {/* Supply info */}
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#8a8a9e" }}>
                <span>Supply: <b style={{ color: "#e8e8e8" }}>{card.supply.toLocaleString()}</b></span>
                <span>Minted: <b style={{ color: "#e8e8e8" }}>{card.minted.toLocaleString()}</b></span>
                {card.marketable && <span style={{ color: "#3ddc84" }}>✓ Marketable</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    }

    export function CardsRoute() {
    const { cards, loading, error } = useCards();
    const [faction, setFaction]           = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    const factions = Array.from(new Set(cards.map((c) => c.faction).filter(Boolean)));
    const filtered = faction ? cards.filter((c) => c.faction === faction) : cards;

    return (
      <section>
        <div className="hero-banner" style={{ background: "linear-gradient(160deg, #120800 0%, #1e1000 45%, #16162e 100%)" }}>
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
            <button className={`faction-btn ${faction === null ? "active" : ""}`} onClick={() => setFaction(null)}>All</button>
            {factions.map((f) => (
              <button key={f} className={`faction-btn ${faction === f ? "active" : ""}`} onClick={() => setFaction(faction === f ? null : f)}>
                {f && FACTION_ICONS[f] && <img src={FACTION_ICONS[f]} alt={f} className="faction-btn-icon" />}
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
            <article
              key={c.id}
              className="card-tile card-tile-clickable"
              onClick={() => setSelectedCard(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedCard(c)}
              aria-label={`Ver detalle de ${c.name}`}
            >
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

        {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </section>
    );
    }
    