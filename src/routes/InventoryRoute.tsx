import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInventory } from "../domains/inventory/useInventory";
import type { PlayerCard } from "../domains/inventory/repository";
import { CollectionScorePanel } from "../shared/components/CollectionScorePanel";
import { DeckStatsPanel } from "../shared/components/DeckStatsPanel";

// ─── CONFIG (matches CardsRoute exactly) ────────────────────────────────────
const RARITY_CFG: Record<string, { color: string; glow: string; label: string }> = {
  Common:    { color: "#9ca3af", glow: "none",                           label: "Común"       },
  Uncommon:  { color: "#22c55e", glow: "0 0 12px rgba(34,197,94,.4)",   label: "Infrecuente" },
  Rare:      { color: "#60a5fa", glow: "0 0 16px rgba(96,165,250,.5)",  label: "Rara"        },
  Epic:      { color: "#a78bfa", glow: "0 0 20px rgba(167,139,250,.6)", label: "Épica"       },
  Legendary: { color: "#f59e0b", glow: "0 0 28px rgba(245,158,11,.7)",  label: "Legendaria"  },
  Mythic:    { color: "#ef4444", glow: "0 0 36px rgba(239,68,68,.8)",   label: "Mítica"      },
};
const FACTION_CFG: Record<string, { color: string; bg: string; bgImg: string; icon: string }> = {
  Guerrero: { color: "#f87171", bg: "linear-gradient(160deg,#7f1d1d,#1c0a0a)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_guerrero.jpg", icon: "⚔️" },
  Mago:     { color: "#818cf8", bg: "linear-gradient(160deg,#1e1b4b,#0a0a1e)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_mago.jpg",     icon: "🔮" },
  Paladín:  { color: "#fbbf24", bg: "linear-gradient(160deg,#451a03,#1c0a00)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_paladin.jpg",   icon: "🛡️" },
  Pícaro:   { color: "#34d399", bg: "linear-gradient(160deg,#022c22,#0a1c14)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_picaro.jpg",    icon: "🗡️" },
};
const RARITIES = ["Common","Uncommon","Rare","Epic","Legendary","Mythic"];
const FACTIONS = ["Guerrero","Mago","Paladín","Pícaro"];

// ─── CARD ART ────────────────────────────────────────────────────────────────
function CardArt({ item }: { item: PlayerCard }) {
  const faction = FACTION_CFG[item.faction] ?? FACTION_CFG.Guerrero;
  const rarity  = RARITY_CFG[item.rarity]  ?? RARITY_CFG.Common;
  if (item.image_url) {
    return (
      <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", borderRadius: "6px 6px 0 0" }}>
        <img src={item.image_url} alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: "6px 6px 0 0",
      background: faction.bgImg ? `url(${faction.bgImg})` : faction.bg, backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, padding: 12 }}>
      <div style={{ fontSize: 36, lineHeight: 1 }}>{faction.icon}</div>
      <p style={{ fontFamily: "Cinzel,serif", color: rarity.color, fontSize: 10,
        textAlign: "center", lineHeight: 1.3, margin: 0, textTransform: "uppercase",
        letterSpacing: "0.05em", wordBreak: "break-word" }}>{item.name}</p>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

// ─── C.4 — Card Detail Modal for InventoryRoute ───────────────────────────────
function InvCardDetailModal({
  card, onClose, onNav,
}: {
  card: PlayerCard;
  onClose: () => void;
  onNav: (path: string) => void;
}) {
  const rarity  = RARITY_CFG[card.rarity]  ?? RARITY_CFG.Common;
  const faction = FACTION_CFG[card.faction] ?? FACTION_CFG.Guerrero;
  const keywords: string[] = (card.synergy_json as any)?.keywords ?? [];

  function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#777", fontFamily: "Rajdhani,sans-serif", letterSpacing: ".06em" }}>{label}</span>
          <span style={{ fontSize: 12, color, fontWeight: 700, fontFamily: "Rajdhani,sans-serif" }}>{value}</span>
        </div>
        <div style={{ height: 7, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: pct + "%", borderRadius: 4,
            background: `linear-gradient(90deg,${color}88,${color})`,
            transition: "width .7s cubic-bezier(.25,.46,.45,.94)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: "40%",
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)",
              animation: "apb-shimmer 2.8s linear infinite",
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "linear-gradient(160deg,#0e0e20,#13131f)",
        border: `1.5px solid ${rarity.color}`,
        boxShadow: rarity.glow + ", 0 32px 80px rgba(0,0,0,.8)",
        borderRadius: 16, maxWidth: 540, width: "100%", maxHeight: "92vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: faction.color + "11",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
              color: rarity.color, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>
              {rarity.label} · {faction.icon} {card.faction}
            </div>
            <h2 style={{
              fontFamily: "Cinzel,serif", color: "#e8e8f0",
              margin: "0 0 4px", fontSize: "clamp(15px,3vw,20px)", lineHeight: 1.2,
              textShadow: `0 0 20px ${rarity.color}44`,
            }}>{card.name}</h2>
            <div style={{ fontSize: 10, color: "#555577", fontFamily: "Rajdhani,sans-serif" }}>
              {card.code} {card.card_tier ? `· T${card.card_tier}` : ""}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 6, color: "#8888aa", cursor: "pointer",
            width: 32, height: 32, fontSize: 16, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 18 }}>
            {/* Art + ownership */}
            <div>
              <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 8, overflow: "hidden",
                background: faction.bgImg ? `url(${faction.bgImg})` : faction.bg,
                backgroundSize: "cover", backgroundPosition: "center" }}>
                {card.image_url && (
                  <img src={card.image_url} alt={card.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              {/* Owned badge */}
              <div style={{
                marginTop: 8, padding: "8px 10px",
                background: "rgba(232,184,75,.1)", border: "1px solid rgba(232,184,75,.3)",
                borderRadius: 8, textAlign: "center",
              }}>
                <div style={{ color: "#e8b84b", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14 }}>
                  ×{card.quantity}
                </div>
                <div style={{ color: "#777", fontSize: 9, fontFamily: "Rajdhani,sans-serif", textTransform: "uppercase" }}>
                  En colección
                </div>
              </div>
              {/* Badges */}
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {card.fusion_enabled && (
                  <span style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)",
                    borderRadius: 4, padding: "3px 8px", fontSize: 9, color: "#4ade80",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700, textAlign: "center" }}>🔥 Fusión</span>
                )}
                {card.marketable && (
                  <span style={{ background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.3)",
                    borderRadius: 4, padding: "3px 8px", fontSize: 9, color: "#60a5fa",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700, textAlign: "center" }}>📋 Mercado</span>
                )}
                {card.locked && (
                  <span style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 4, padding: "3px 8px", fontSize: 9, color: "#ef4444",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700, textAlign: "center" }}>🔒 Bloqueada</span>
                )}
              </div>
            </div>

            {/* Stats + info */}
            <div>
              <StatBar label="Poder"     value={card.power}    max={Math.max(card.power, 80)}    color="#f87171" />
              <StatBar label="Afinidad"  value={card.affinity}  max={Math.max(card.affinity, 30)}  color="#818cf8" />
              <StatBar label="Prestigio" value={card.prestige}  max={Math.max(card.prestige, 15)}  color="#fbbf24" />
              <StatBar label="Carga"     value={card.charge}    max={Math.max(card.charge, 10)}    color="#34d399" />

              {/* Keywords */}
              {keywords.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 9, color: "#555577", fontFamily: "Rajdhani,sans-serif",
                    textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Habilidades</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {keywords.map(kw => (
                      <span key={kw} style={{
                        background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.4)",
                        borderRadius: 4, padding: "3px 8px", fontSize: 9,
                        fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                        color: "#a78bfa", textTransform: "uppercase" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lore */}
              {card.lore && (
                <div style={{ marginTop: 12, padding: "10px 12px",
                  background: faction.color + "08",
                  border: "1px solid rgba(255,255,255,.05)", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "#555577", fontFamily: "Rajdhani,sans-serif",
                    textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Lore</div>
                  <p style={{ fontSize: 11, color: "#8888aa", fontStyle: "italic",
                    lineHeight: 1.7, margin: 0 }}>"{card.lore}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => onNav("/deck-builder")} style={{
            flex: 1, minWidth: 80, padding: "10px 0",
            background: "rgba(232,184,75,.1)", border: "1px solid rgba(232,184,75,.4)",
            borderRadius: 8, color: "#e8b84b", cursor: "pointer",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
            textTransform: "uppercase", letterSpacing: ".06em" }}>⚔ Deck</button>
          {card.fusion_enabled && (
            <button onClick={() => onNav("/fusion")} style={{
              flex: 1, minWidth: 80, padding: "10px 0",
              background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.35)",
              borderRadius: 8, color: "#4ade80", cursor: "pointer",
              fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
              textTransform: "uppercase", letterSpacing: ".06em" }}>🔥 Fusión</button>
          )}
          {card.marketable && !card.locked && (
            <button onClick={() => onNav("/market")} style={{
              flex: 1, minWidth: 80, padding: "10px 0",
              background: "rgba(96,165,250,.08)", border: "1px solid rgba(96,165,250,.35)",
              borderRadius: 8, color: "#60a5fa", cursor: "pointer",
              fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
              textTransform: "uppercase", letterSpacing: ".06em" }}>📋 Mercado</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InventoryRoute() {
  const navigate = useNavigate();
  const { items, loading, error, signedIn } = useInventory();
  const [search,        setSearch]        = useState("");
  const [filterRarity,  setFilterRarity]  = useState("all");
  const [filterFaction, setFilterFaction] = useState("all");
  const [sortBy,        setSortBy]        = useState<"quantity"|"rarity"|"name"|"power">("quantity");
  const [showLocked,    setShowLocked]    = useState(true);
  const [selectedCard,  setSelectedCard]  = useState<PlayerCard | null>(null);

  const rarityOrder = Object.fromEntries(RARITIES.map((r, i) => [r, i]));

  const filtered = useMemo(() => {
    return items
      .filter(c => {
        if (!showLocked && c.locked) return false;
        if (filterRarity  !== "all" && c.rarity  !== filterRarity)  return false;
        if (filterFaction !== "all" && c.faction !== filterFaction) return false;
        if (search) {
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "quantity") return b.quantity - a.quantity;
        if (sortBy === "rarity")   return (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0);
        if (sortBy === "name")     return a.name.localeCompare(b.name);
        if (sortBy === "power")    return b.power - a.power;
        return 0;
      });
  }, [items, search, filterRarity, filterFaction, sortBy, showLocked]);

  // Derived stats
  const totalQuantity = items.reduce((s, c) => s + c.quantity, 0);
  const rarityCount   = RARITIES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = items.filter(c => c.rarity === r).length; return acc;
  }, {});
  const highRarityCount = (rarityCount.Epic ?? 0) + (rarityCount.Legendary ?? 0) + (rarityCount.Mythic ?? 0);

  // ── NOT SIGNED IN ─────────────────────────────────────────────────────────
  if (!loading && !signedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🗃️</div>
          <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 12px" }}>
            Tu Inventario
          </h2>
          <p style={{ color: "#8888aa", fontFamily: "Rajdhani,sans-serif", marginBottom: 28, lineHeight: 1.6 }}>
            Inicia sesión para ver las cartas que posees, su rareza y sus acciones disponibles.
          </p>
          <Link to="/account" style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#c9901f,#e8b84b)",
            borderRadius: 8, padding: "12px 28px",
            color: "#0a0a14", fontFamily: "Rajdhani,sans-serif",
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            letterSpacing: ".08em", textTransform: "uppercase" }}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14" }}>
      <CollectionScorePanel />
      <DeckStatsPanel />
      {/* ─── Header ─── */}
      <div style={{ background: "linear-gradient(160deg,#0a0a14,#0e0e22)",
        borderBottom: "1px solid rgba(201,144,31,.15)", padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: ".18em", color: "#e8b84b", margin: "0 0 8px",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
            ⚔️ COLECCIÓN PERSONAL
          </p>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 20px",
            fontSize: "clamp(24px,4vw,42px)", textShadow: "0 0 40px rgba(201,144,31,.3)" }}>
            Inventario
          </h1>

          {/* Stats row */}
          {!loading && (
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "Cartas Únicas", value: items.length,   color: "#e8b84b" },
                { label: "Total Copias",  value: totalQuantity,  color: "#60a5fa" },
                { label: "Épicas+",       value: highRarityCount, color: "#a78bfa" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 26, color: s.color, fontWeight: 700, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 9, color: "#555577", fontFamily: "Rajdhani,sans-serif",
                    textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Rarity breakdown */}
          {!loading && items.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {RARITIES.filter(r => (rarityCount[r] ?? 0) > 0).map(r => (
                <span key={r} style={{
                  background: RARITY_CFG[r].color + "18",
                  border: `1px solid ${RARITY_CFG[r].color}44`,
                  borderRadius: 4, padding: "2px 8px",
                  fontSize: 10, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                  color: RARITY_CFG[r].color, letterSpacing: ".05em" }}>
                  {RARITY_CFG[r].label}: {rarityCount[r]}
                </span>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { to: "/cards",        label: "📖 Compendio",      color: "#e8b84b", bg: "rgba(232,184,75,.12)" },
              { to: "/deck-builder", label: "⚔ Construir Deck",  color: "#60a5fa", bg: "rgba(96,165,250,.12)" },
              { to: "/market",       label: "📋 Mercado",         color: "#4ade80", bg: "rgba(74,222,128,.12)" },
              { to: "/fusion",       label: "🔥 Fusión",          color: "#a78bfa", bg: "rgba(139,92,246,.12)" },
              { to: "/packs",        label: "📦 Más Packs",       color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
            ].map(a => (
              <Link key={a.to} to={a.to} style={{
                background: a.bg, border: `1px solid ${a.color}44`,
                borderRadius: 8, padding: "8px 16px",
                color: a.color, fontSize: 11,
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                textDecoration: "none", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sticky Filters ─── */}
      <div style={{ background: "rgba(10,10,20,.94)", borderBottom: "1px solid rgba(255,255,255,.05)",
        padding: "14px 24px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar carta…"
              style={{ flex: "1 1 180px", minWidth: 140,
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "8px 14px", color: "#e8e8f0", fontSize: 13,
                fontFamily: "Rajdhani,sans-serif", outline: "none" }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "8px 12px", color: "#8888aa", fontSize: 12,
                fontFamily: "Rajdhani,sans-serif", cursor: "pointer" }}>
              <option value="quantity">Más copias primero</option>
              <option value="rarity">Por rareza</option>
              <option value="name">Por nombre</option>
              <option value="power">Por poder</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6,
              color: "#8888aa", fontSize: 12, fontFamily: "Rajdhani,sans-serif", cursor: "pointer",
              userSelect: "none" }}>
              <input type="checkbox" checked={showLocked} onChange={e => setShowLocked(e.target.checked)}
                style={{ accentColor: "#e8b84b", width: 14, height: 14 }} />
              Bloqueadas
            </label>
            {(search || filterRarity !== "all" || filterFaction !== "all") && (
              <button onClick={() => { setSearch(""); setFilterRarity("all"); setFilterFaction("all"); }}
                style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 8, padding: "8px 14px", color: "#f87171", fontSize: 11,
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 700, cursor: "pointer" }}>
                ✕ Limpiar
              </button>
            )}
          </div>
          {/* Rarity pills */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
            {["all", ...RARITIES].map(r => {
              const active = filterRarity === r;
              const color  = r === "all" ? "#8888aa" : RARITY_CFG[r].color;
              return (
                <button key={r} onClick={() => setFilterRarity(r === filterRarity ? "all" : r)}
                  style={{
                    background: active ? color + "22" : "rgba(255,255,255,.03)",
                    border: `1px solid ${active ? color : "rgba(255,255,255,.08)"}`,
                    borderRadius: 6, padding: "4px 10px", color: active ? color : "#555577",
                    fontSize: 11, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                    cursor: "pointer", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {r === "all" ? "Todas" : RARITY_CFG[r].label}
                </button>
              );
            })}
          </div>
          {/* Faction pills */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {["all", ...FACTIONS].map(f => {
              const active = filterFaction === f;
              const color  = f === "all" ? "#8888aa" : FACTION_CFG[f].color;
              return (
                <button key={f} onClick={() => setFilterFaction(f === filterFaction ? "all" : f)}
                  style={{
                    background: active ? color + "22" : "rgba(255,255,255,.03)",
                    border: `1px solid ${active ? color : "rgba(255,255,255,.08)"}`,
                    borderRadius: 6, padding: "4px 10px", color: active ? color : "#555577",
                    fontSize: 11, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, cursor: "pointer" }}>
                  {f === "all" ? "Todas" : `${FACTION_CFG[f].icon} ${f}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ color: "#e8b84b", fontSize: 40, marginBottom: 12 }}>⚔</div>
            <p style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif" }}>Cargando inventario…</p>
          </div>
        )}
        {/* Error */}
        {error && !loading && (
          <div style={{ padding: 24, background: "rgba(239,68,68,.08)",
            border: "1px solid rgba(239,68,68,.3)", borderRadius: 12,
            color: "#f87171", textAlign: "center", fontFamily: "Rajdhani,sans-serif" }}>{error}</div>
        )}
        {/* Empty collection */}
        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
            <h3 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 12px" }}>
              Colección vacía
            </h3>
            <p style={{ color: "#8888aa", fontFamily: "Rajdhani,sans-serif", marginBottom: 28, lineHeight: 1.6 }}>
              Abre tu primer pack para comenzar a forjar tu leyenda.
            </p>
            <Link to="/packs" style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#c9901f,#e8b84b)",
              borderRadius: 8, padding: "12px 28px",
              color: "#0a0a14", fontFamily: "Rajdhani,sans-serif",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
              letterSpacing: ".08em", textTransform: "uppercase" }}>
              📦 Ir a Packs
            </Link>
          </div>
        )}
        {/* No filter results */}
        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif" }}>
              Ninguna carta coincide con los filtros
            </p>
          </div>
        )}
        {/* Card grid */}
        {!loading && filtered.length > 0 && (
          <>
            <p style={{ color: "#555577", fontSize: 12, fontFamily: "Rajdhani,sans-serif", margin: "0 0 16px" }}>
              Mostrando {filtered.length} carta{filtered.length !== 1 ? "s" : ""}
              {items.length !== filtered.length ? ` de ${items.length}` : ""}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
              {filtered.map(item => {
                const rarity  = RARITY_CFG[item.rarity]  ?? RARITY_CFG.Common;
                const faction = FACTION_CFG[item.faction] ?? FACTION_CFG.Guerrero;
                const keywords: string[] = (item.synergy_json as any)?.keywords ?? [];

                return (
                  <div key={item.player_card_id} style={{
                    position: "relative", background: "#111122", borderRadius: 10,
                    border: `1.5px solid ${rarity.color}`, boxShadow: rarity.glow,
                    overflow: "hidden", transition: "transform .15s, box-shadow .15s",
                    cursor: "pointer" }}
                    onClick={() => setSelectedCard(item)}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "";
                    }}>
                    <CardArt item={item} />

                    <div style={{ padding: "8px 10px 10px" }}>
                      <p style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 11,
                        margin: "0 0 4px", fontWeight: 700, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>

                      <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                          color: rarity.color, textTransform: "uppercase", letterSpacing: ".05em" }}>
                          {rarity.label}
                        </span>
                        <span style={{ color: "#444466", fontSize: 9 }}>·</span>
                        <span style={{ fontSize: 9, fontFamily: "Rajdhani,sans-serif",
                          color: faction.color, textTransform: "uppercase" }}>
                          {faction.icon} {item.faction}
                        </span>
                      </div>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 4, justifyContent: "space-between", marginBottom: 6 }}>
                        {([["POW", item.power, "#f87171"],["AFF", item.affinity, "#818cf8"],
                           ["PRE", item.prestige, "#fbbf24"],["CHG", item.charge, "#34d399"]] as const).map(([lbl, val, col]) => (
                          <div key={lbl} style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: 11, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: col }}>{val}</div>
                            <div style={{ fontSize: 8, color: "#555577", fontFamily: "Rajdhani,sans-serif", letterSpacing: ".06em" }}>{lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* Keywords */}
                      {keywords.length > 0 && (
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 7 }}>
                          {keywords.map(kw => (
                            <span key={kw} style={{
                              background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.3)",
                              borderRadius: 3, padding: "1px 5px", fontSize: 8,
                              fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                              color: "#a78bfa", textTransform: "uppercase" }}>{kw}</span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => navigate("/deck-builder")} style={{
                          flex: 1, background: "rgba(232,184,75,.1)",
                          border: "1px solid rgba(232,184,75,.3)",
                          borderRadius: 5, padding: "5px 0",
                          color: "#e8b84b", fontSize: 9, fontFamily: "Rajdhani,sans-serif",
                          fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Deck</button>
                        {item.quantity > 1 && !item.locked && item.fusion_enabled && (
                          <button onClick={() => navigate("/fusion")} style={{
                            flex: 1, background: "rgba(139,92,246,.1)",
                            border: "1px solid rgba(139,92,246,.3)",
                            borderRadius: 5, padding: "5px 0",
                            color: "#a78bfa", fontSize: 9, fontFamily: "Rajdhani,sans-serif",
                            fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Fusión</button>
                        )}
                        {!item.locked && !item.listed && item.marketable && (
                          <button onClick={() => navigate("/market")} style={{
                            flex: 1, background: "rgba(96,165,250,.1)",
                            border: "1px solid rgba(96,165,250,.3)",
                            borderRadius: 5, padding: "5px 0",
                            color: "#60a5fa", fontSize: 9, fontFamily: "Rajdhani,sans-serif",
                            fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Vender</button>
                        )}
                      </div>
                    </div>

                    {/* Quantity badge */}
                    <div style={{ position: "absolute", top: 6, right: 6,
                      background: "rgba(232,184,75,.92)", borderRadius: 20, padding: "2px 7px",
                      fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                      color: "#0a0a14", letterSpacing: ".05em" }}>×{item.quantity}</div>

                    {/* Status badges */}
                    {item.locked && (
                      <div style={{ position: "absolute", top: 6, left: 6,
                        background: "rgba(239,68,68,.85)", borderRadius: 3, padding: "2px 5px",
                        fontSize: 8, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#fff" }}>🔒</div>
                    )}
                    {item.listed && (
                      <div style={{ position: "absolute", top: item.locked ? 26 : 6, left: 6,
                        background: "rgba(74,222,128,.85)", borderRadius: 3, padding: "2px 5px",
                        fontSize: 8, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#0a0a14" }}>📋</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* C.4 — Carta Detail Modal */}
      {selectedCard && (
        <InvCardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onNav={(p) => { setSelectedCard(null); navigate(p); }}
        />
      )}
    </div>
  );
}
