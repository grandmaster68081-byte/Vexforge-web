import { useState } from "react";
import { useCards, type Card } from "../domains/cards/useCards";

const RARITY_COLOR: Record<string, string> = {
  Common:    "#9A9AB0",
  Uncommon:  "#3DC96B",
  Rare:      "#4A9EFF",
  Epic:      "#A855F7",
  Legendary: "#E8B84B",
  Mythic:    "#FF4444",
};

const RARITY_ORDER = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
const ALL_FACTIONS = ["All", "Guerrero", "Mago", "Paladín", "Pícaro"];

const FACTION_ICONS: Record<string, string> = {
  Guerrero: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/guerrero.png",
  Mago:     "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/mago.png",
  Paladín:  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/paladin.png",
  Pícaro:   "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/picaro.png",
};

const FACTION_CLASS: Record<string, string> = {
  Guerrero: "active-guerrero",
  Mago:     "active-mago",
  Paladín:  "active-paladin",
  Pícaro:   "active-picaro",
};

const FACTION_EMOJI: Record<string, string> = {
  Guerrero: "⚔️",
  Mago:     "🔮",
  Paladín:  "🛡️",
  Pícaro:   "🗡️",
};

function SkeletonCardGrid() {
  return (
    <div className="card-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "2/3", borderRadius: 12, overflow: "hidden" }}>
          <div className="skeleton" style={{ width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}

function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const rarColor = RARITY_COLOR[card.rarity] ?? "#8b8b9e";

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Card image */}
        <div style={{ position: "relative", height: 260, background: "var(--layer-1)", overflow: "hidden" }}>
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 80,
              background: `linear-gradient(145deg, ${rarColor}15, var(--layer-2))`,
            }}>
              {FACTION_EMOJI[card.faction ?? ""] ?? "🃏"}
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
            background: "linear-gradient(0deg, rgba(20,20,40,1) 0%, transparent 100%)",
          }} />
          {/* Rarity strip top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: rarColor,
            boxShadow: `0 0 12px ${rarColor}`,
          }} />
          {/* Power badge */}
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(5,5,13,0.8)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${rarColor}55`,
            borderRadius: 8, padding: "4px 10px",
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 13, fontWeight: 700,
            color: rarColor,
          }}>
            ⚡{card.power}
          </div>
          {/* Card code */}
          <div style={{
            position: "absolute", bottom: 12, left: 16,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10, color: "rgba(255,255,255,0.4)",
          }}>
            {card.code}
          </div>
        </div>

        {/* Card details */}
        <div style={{ padding: "24px 24px 28px" }}>
          {/* Rarity + Faction */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              padding: "3px 10px", borderRadius: 20,
              background: `${rarColor}18`,
              border: `1px solid ${rarColor}50`,
              color: rarColor,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
            }}>
              {card.rarity.toUpperCase()}
            </span>
            <span style={{
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: 12, color: "var(--fg-muted)", letterSpacing: "0.08em",
            }}>
              {card.faction} · {card.specialization ?? "Base"}
            </span>
            {card.is_founder && (
              <span style={{
                padding: "2px 8px", borderRadius: 20,
                background: "rgba(232,184,75,0.15)",
                border: "1px solid rgba(232,184,75,0.4)",
                color: "#E8B84B", fontSize: 9,
                fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700,
              }}>FOUNDER</span>
            )}
          </div>

          {/* Name */}
          <h3 style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 22, fontWeight: 700,
            color: "var(--fg-primary)",
            marginBottom: 16,
          }}>{card.name}</h3>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8, marginBottom: 20,
          }}>
            {[
              { label: "PWR", val: card.power, color: rarColor },
              { label: "AFF", val: card.affinity, color: "#5B8BF5" },
              { label: "PRE", val: card.prestige, color: "#A855F7" },
              { label: "CHG", val: card.charge, color: "#3DC96B" },
            ].map(s => (
              <div key={s.label} style={{
                background: "var(--layer-1)",
                border: `1px solid ${s.color}25`,
                borderRadius: 8, padding: "10px 8px",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: '"Cinzel Decorative", serif',
                  fontSize: 20, fontWeight: 900,
                  color: s.color, lineHeight: 1,
                }}>{s.val}</div>
                <div style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 8, color: "var(--fg-dim)",
                  letterSpacing: "0.12em", marginTop: 4,
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Lore */}
          {card.lore && (
            <p style={{
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: 13, color: "var(--fg-muted)",
              lineHeight: 1.7, fontStyle: "italic",
              borderLeft: `2px solid ${rarColor}40`,
              paddingLeft: 12,
              marginBottom: 16,
            }}>"{card.lore}"</p>
          )}

          {/* Region */}
          {card.region_id && (
            <div style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10, color: "var(--fg-dim)",
              letterSpacing: "0.1em",
            }}>
              📍 {card.region_id}
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32,
            background: "rgba(5,5,13,0.8)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            color: "var(--fg-muted)",
            fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>
      </div>
    </div>
  );
}

function CardTile({ card, onClick }: { card: Card; onClick: (c: Card) => void }) {
  const rarColor = RARITY_COLOR[card.rarity] ?? "#9A9AB0";
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="card-tile"
      data-rarity={card.rarity}
      onClick={() => onClick(card)}
    >
      {/* Rarity strip */}
      <div className="card-rarity-strip" style={{
        background: rarColor,
        boxShadow: `0 0 8px ${rarColor}80`,
      }} />

      {/* Image area */}
      <div className="card-image-area">
        {card.image_url && !imgError ? (
          <img
            src={card.image_url}
            alt={card.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-image-fallback">
            {FACTION_EMOJI[card.faction ?? ""] ?? "🃏"}
          </div>
        )}
        {/* Power badge */}
        <div className="card-power-badge">⚡{card.power}</div>
      </div>

      {/* Info footer */}
      <div className="card-info">
        <div className="card-name">{card.name}</div>
        <div className="card-meta">
          <span className="card-faction-tag">{card.faction}</span>
          <span
            className="card-rarity-badge"
            style={{
              background: `${rarColor}18`,
              border: `1px solid ${rarColor}40`,
              color: rarColor,
            }}
          >
            {card.rarity === "Legendary" ? "LEG" :
             card.rarity === "Uncommon" ? "UNC" :
             card.rarity.substring(0, 3).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CardsRoute() {
  const { cards, loading, error } = useCards();
  const [faction, setFaction] = useState("All");
  const [rarityFilter, setRarityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Card | null>(null);
  const [sortBy, setSortBy] = useState<"name"|"power"|"rarity">("rarity");

  const filtered = cards
    .filter((c) => faction === "All" || c.faction === faction || c.faction?.replace("é","e") === faction.replace("é","e"))
    .filter((c) => rarityFilter === "All" || c.rarity === rarityFilter)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "power") return (b.power ?? 0) - (a.power ?? 0);
    if (sortBy === "rarity") return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return a.name.localeCompare(b.name);
  });

  const byRarity = RARITY_ORDER.reduce((acc, r) => {
    const count = filtered.filter(c => c.rarity === r).length;
    if (count > 0) acc[r] = count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}

      <div className="content">
        {/* Header */}
        <div className="route-header">
          <h2>Colección de Cartas</h2>
          <span className="route-badge">
            {loading ? "cargando..." : `${sorted.length} / ${cards.length} cartas`}
          </span>
        </div>

        {/* Rarity summary bar */}
        {!loading && cards.length > 0 && (
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap",
            marginBottom: 24, padding: "16px 20px",
            background: "var(--layer-2)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
          }}>
            {RARITY_ORDER.filter(r => byRarity[r]).map(r => (
              <button
                key={r}
                onClick={() => setRarityFilter(rarityFilter === r ? "All" : r)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: `1px solid ${rarityFilter === r ? RARITY_COLOR[r] : RARITY_COLOR[r] + "40"}`,
                  background: rarityFilter === r ? RARITY_COLOR[r] + "20" : "transparent",
                  color: RARITY_COLOR[r],
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {r} <span style={{ opacity: 0.7 }}>({byRarity[r]})</span>
              </button>
            ))}
          </div>
        )}

        {/* Faction tabs */}
        <div className="faction-tabs">
          {ALL_FACTIONS.map((f) => (
            <button
              key={f}
              className={`faction-tab ${f === faction ? (f === "All" ? "active-all" : FACTION_CLASS[f] ?? "active-all") : ""}`}
              onClick={() => setFaction(f)}
            >
              {FACTION_ICONS[f] && (
                <img src={FACTION_ICONS[f]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              {f === "All" ? "⚡ Todas" : `${FACTION_EMOJI[f] ?? ""} ${f}`}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar carta..."
            className="market-search"
            style={{ width: 240 }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {(["rarity","power","name"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: `1px solid ${sortBy === s ? "rgba(201,144,31,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: sortBy === s ? "rgba(201,144,31,0.12)" : "transparent",
                  color: sortBy === s ? "var(--ember-gold-lt)" : "var(--fg-muted)",
                  fontFamily: '"Rajdhani", sans-serif',
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  transition: "all 0.15s ease",
                }}
              >
                {s === "rarity" ? "Rareza" : s === "power" ? "Poder" : "Nombre"}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <SkeletonCardGrid />
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Error al cargar</div>
            <div className="empty-state-desc">{error}</div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🃏</div>
            <div className="empty-state-title">Sin resultados</div>
            <div className="empty-state-desc">Prueba con otro filtro o búsqueda.</div>
          </div>
        ) : (
          <div className="card-grid">
            {sorted.map((card) => (
              <CardTile key={card.id} card={card} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}