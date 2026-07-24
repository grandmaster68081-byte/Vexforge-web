import { useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useCards, type Card } from "../domains/cards/useCards";
import { getCardByCode } from "../domains/cards/repository";
import { AudioEngine } from "../lib/audioEngine";

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const RARITY_CFG: Record<string, { color: string; glow: string; label: string; order: number }> = {
  Common:    { color: "#9ca3af", glow: "none",                           label: "Común",       order: 1 },
  Uncommon:  { color: "#22c55e", glow: "0 0 12px rgba(34,197,94,.4)",   label: "Infrecuente", order: 2 },
  Rare:      { color: "#60a5fa", glow: "0 0 16px rgba(96,165,250,.5)",  label: "Rara",        order: 3 },
  Epic:      { color: "#a78bfa", glow: "0 0 20px rgba(167,139,250,.6)", label: "Épica",       order: 4 },
  Legendary: { color: "#f59e0b", glow: "0 0 28px rgba(245,158,11,.7)",  label: "Legendaria",  order: 5 },
  Mythic:    { color: "#ef4444", glow: "0 0 36px rgba(239,68,68,.8)",   label: "Mítica",      order: 6 },
};
const FACTION_CFG: Record<string, { color: string; bg: string; bgImg: string; icon: string }> = {
  Guerrero: { color: "#f87171", bg: "linear-gradient(160deg,#7f1d1d,#1c0a0a)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_guerrero.jpg", icon: "⚔️" },
  Mago:     { color: "#818cf8", bg: "linear-gradient(160deg,#1e1b4b,#0a0a1e)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_mago.jpg",     icon: "🔮" },
  Paladín:  { color: "#fbbf24", bg: "linear-gradient(160deg,#451a03,#1c0a00)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_paladin.jpg",   icon: "🛡️" },
  Pícaro:   { color: "#34d399", bg: "linear-gradient(160deg,#022c22,#0a1c14)", bgImg: "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/bg_picaro.jpg",    icon: "🗡️" },
};
const RARITIES = ["Common","Uncommon","Rare","Epic","Legendary","Mythic"];
const FACTIONS = ["Guerrero","Mago","Paladín","Pícaro"];
type ExtCard = Card & { synergy_json?: Record<string,any>; card_tags?: string[] };

// ─── HELPERS ────────────────────────────────────────────────────────────────
function FilterBtn({ active, color, onClick, children }: {
  active: boolean; color: string; onClick: () => void; children: ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? color + "22" : "rgba(255,255,255,.03)",
      border: `1px solid ${active ? color : "rgba(255,255,255,.08)"}`,
      borderRadius: 6, padding: "4px 10px",
      color: active ? color : "#555577",
      fontSize: 11, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
      cursor: "pointer", textTransform: "uppercase", letterSpacing: ".05em",
      transition: "all .15s",
    }}>{children}</button>
  );
}

function CardArt({ card }: { card: Card }) {
  const faction = FACTION_CFG[card.faction] ?? FACTION_CFG.Guerrero;
  const rarity  = RARITY_CFG[card.rarity]  ?? RARITY_CFG.Common;
  if (card.image_url) {
    return (
      <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", borderRadius: "6px 6px 0 0" }}>
        <img src={card.image_url} alt={card.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: "6px 6px 0 0",
      background: faction.bgImg ? `url(${faction.bgImg})` : faction.bg,
      backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, padding: 12 }}>
      <div style={{ fontSize: 36, lineHeight: 1 }}>{faction.icon}</div>
      <p style={{ fontFamily: "Cinzel,serif", color: rarity.color, fontSize: 10,
        textAlign: "center", lineHeight: 1.3, margin: 0, textTransform: "uppercase",
        letterSpacing: "0.05em", wordBreak: "break-word" }}>{card.name}</p>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", color: "#8888aa",
          textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3,
          transition: "width .5s ease", boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  );
}

// ─── CARD TILE ───────────────────────────────────────────────────────────────
function CardTile({ card, owned, quantity, onClick }: {
  card: Card; owned: boolean; quantity: number; onClick: () => void;
}) {
  const rarity  = RARITY_CFG[card.rarity]  ?? RARITY_CFG.Common;
  const faction = FACTION_CFG[card.faction] ?? FACTION_CFG.Guerrero;
  return (
    <div onClick={onClick} style={{ position: "relative", cursor: "pointer",
      background: "#111122", borderRadius: 10,
      border: `1.5px solid ${rarity.color}`, boxShadow: rarity.glow,
      transition: "transform .15s, box-shadow .15s", overflow: "hidden" }}
      onMouseEnter={e => {
        try { AudioEngine.sfxCardHover(); } catch {}
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.02)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          rarity.glow === "none" ? "0 8px 24px rgba(0,0,0,.6)" : rarity.glow + ", 0 12px 32px rgba(0,0,0,.5)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = rarity.glow;
      }}>
      <CardArt card={card} />
      <div style={{ padding: "8px 10px 10px" }}>
        <p style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 11,
          margin: "0 0 4px", fontWeight: 700, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name}</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
            color: rarity.color, textTransform: "uppercase", letterSpacing: ".05em" }}>
            {rarity.label}
          </span>
          <span style={{ color: "#444466", fontSize: 9 }}>·</span>
          <span style={{ fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 600,
            color: faction.color, textTransform: "uppercase" }}>
            {faction.icon} {card.faction}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
          {([["POW", card.power, "#f87171"],["AFF", card.affinity, "#818cf8"],
             ["PRE", card.prestige, "#fbbf24"],["CHG", card.charge, "#34d399"]] as const).map(([lbl, val, col]) => (
            <div key={lbl} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: col }}>{val}</div>
              <div style={{ fontSize: 8, color: "#555577", fontFamily: "Rajdhani,sans-serif", letterSpacing: ".06em" }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
      {owned && (
        <div style={{ position: "absolute", top: 6, right: 6,
          background: "rgba(232,184,75,.92)", borderRadius: 20, padding: "2px 7px",
          fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
          color: "#0a0a14", letterSpacing: ".05em" }}>✓ ×{quantity}</div>
      )}
      {card.is_founder && (
        <div style={{ position: "absolute", top: owned ? 26 : 6, right: 6,
          background: "rgba(139,92,246,.9)", borderRadius: 3, padding: "2px 5px",
          fontSize: 8, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#fff" }}>
          FOUNDER
        </div>
      )}
    </div>
  );
}

// ─── CARD DETAIL MODAL ───────────────────────────────────────────────────────
function CardModal({ card, ownedQty, onClose, onNav }: {
  card: ExtCard;
  ownedQty: number | null;
  onClose: () => void;
  onNav: (path: string) => void;
}) {
  const rarity  = RARITY_CFG[card.rarity]  ?? RARITY_CFG.Common;
  const faction = FACTION_CFG[card.faction] ?? FACTION_CFG.Guerrero;
  const keywords: string[] = card.synergy_json?.keywords ?? [];
  const maxPow  = Math.max(card.power, 80);
  const maxAff  = Math.max(card.affinity, 30);
  const maxPre  = Math.max(card.prestige, 15);
  const maxChg  = Math.max(card.charge, 10);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "linear-gradient(160deg,#0e0e20,#13131f)",
        border: `1.5px solid ${rarity.color}`,
        boxShadow: rarity.glow + ", 0 32px 80px rgba(0,0,0,.8)",
        borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "92vh",
        overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", background: faction.color + "11",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
              color: rarity.color, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>
              {rarity.label} · {faction.icon} {card.faction}
            </div>
            <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 4px",
              fontSize: "clamp(16px,3vw,22px)", lineHeight: 1.2,
              textShadow: `0 0 20px ${rarity.color}44` }}>{card.name}</h2>
            <div style={{ fontSize: 10, color: "#555577", fontFamily: "Rajdhani,sans-serif", letterSpacing: ".08em" }}>
              {card.code}
              {card.card_tier && ` · T${card.card_tier}`}
              {card.is_founder  && <span style={{ color: "#a78bfa", marginLeft: 8 }}>⬡ FOUNDER</span>}
              {card.is_legendary && <span style={{ color: "#f59e0b", marginLeft: 8 }}>★ LEGENDARIA</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 6, color: "#8888aa", cursor: "pointer",
            width: 32, height: 32, fontSize: 16, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div className="card-modal-body-grid">
            {/* Art + owned */}
            <div>
              <CardArt card={card} />
              <div style={{ marginTop: 10, padding: "8px 10px",
                background: ownedQty ? "rgba(232,184,75,.1)" : "rgba(255,255,255,.03)",
                border: `1px solid ${ownedQty ? "rgba(232,184,75,.3)" : "rgba(255,255,255,.06)"}`,
                borderRadius: 8, textAlign: "center" }}>
                {ownedQty != null ? (
                  <div style={{ color: "#e8b84b", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 13 }}>
                    TIENES ×{ownedQty}
                  </div>
                ) : (
                  <div style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif", fontSize: 11 }}>No la tienes</div>
                )}
              </div>
              {/* Supply */}
              <div style={{ marginTop: 8, padding: "8px 10px",
                background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 8, display: "flex", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#e8e8f0" }}>{card.supply.toLocaleString()}</div>
                  <div style={{ fontSize: 8, color: "#555577", fontFamily: "Rajdhani,sans-serif", textTransform: "uppercase" }}>Supply</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#e8b84b" }}>{card.minted.toLocaleString()}</div>
                  <div style={{ fontSize: 8, color: "#555577", fontFamily: "Rajdhani,sans-serif", textTransform: "uppercase" }}>Minteadas</div>
                </div>
              </div>
            </div>
            {/* Stats + info */}
            <div>
              <StatBar label="Poder"     value={card.power}    max={maxPow} color="#f87171" />
              <StatBar label="Afinidad"  value={card.affinity}  max={maxAff} color="#818cf8" />
              <StatBar label="Prestigio" value={card.prestige}  max={maxPre} color="#fbbf24" />
              <StatBar label="Carga"     value={card.charge}    max={maxChg} color="#34d399" />
              {/* Keywords */}
              {keywords.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 9, color: "#555577", fontFamily: "Rajdhani,sans-serif",
                    textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Habilidades</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {keywords.map(kw => (
                      <span key={kw} style={{
                        background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.4)",
                        borderRadius: 4, padding: "3px 8px", fontSize: 10,
                        fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                        color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".06em" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Badges */}
              <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {card.fusion_enabled && (
                  <span style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)",
                    borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#4ade80",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700 }}>🔥 Fusión</span>
                )}
                {card.marketable && (
                  <span style={{ background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.3)",
                    borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#60a5fa",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700 }}>📋 Mercado</span>
                )}
              </div>
              {/* Lore */}
              {card.lore && (
                <div style={{ marginTop: 14, padding: "10px 12px",
                  background: faction.color + "08",
                  border: "1px solid rgba(255,255,255,.06)", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "#555577", fontFamily: "Rajdhani,sans-serif",
                    textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Lore</div>
                  <p style={{ fontSize: 12, color: "#8888aa", fontStyle: "italic",
                    lineHeight: 1.6, margin: 0 }}>"{card.lore}"</p>
                </div>
              )}
            </div>
          </div>
          {/* Actions — only if player owns the card */}
          {ownedQty != null && (
            <div style={{ padding: "0 20px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => { onClose(); onNav("/deck-builder"); }} style={{
                flex: 1, minWidth: 100,
                background: "rgba(232,184,75,.12)", border: "1px solid rgba(232,184,75,.4)",
                borderRadius: 8, color: "#e8b84b", padding: "10px 0",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
                cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>⚔ Deck</button>
              {card.fusion_enabled && (
                <button onClick={() => { onClose(); onNav("/fusion"); }} style={{
                  flex: 1, minWidth: 100,
                  background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.4)",
                  borderRadius: 8, color: "#a78bfa", padding: "10px 0",
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>🔥 Fusionar</button>
              )}
              {card.marketable && (
                <button onClick={() => { onClose(); onNav("/market"); }} style={{
                  flex: 1, minWidth: 100,
                  background: "rgba(96,165,250,.12)", border: "1px solid rgba(96,165,250,.4)",
                  borderRadius: 8, color: "#60a5fa", padding: "10px 0",
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>📋 Mercado</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function CardsRoute() {
  const navigate = useNavigate();
  const {
    cards, loading, error,
    collectionById, collectionLoading,
    completionPct, ownedCount, totalCatalog, isAuth,
  } = useCards();
  const [search,        setSearch]        = useState("");
  const [filterRarity,  setFilterRarity]  = useState("all");
  const [filterFaction, setFilterFaction] = useState("all");
  const [sortBy,        setSortBy]        = useState<"rarity"|"name"|"power">("rarity");
  const [selected,      setSelected]      = useState<ExtCard | null>(null);

  const filtered = useMemo(() => {
    const rarityOrder = Object.fromEntries(RARITIES.map((r, i) => [r, i]));
    return cards
      .filter(c => {
        if (filterRarity  !== "all" && c.rarity  !== filterRarity)  return false;
        if (filterFaction !== "all" && c.faction !== filterFaction) return false;
        if (search) {
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rarity") return (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0);
        if (sortBy === "name")   return a.name.localeCompare(b.name);
        if (sortBy === "power")  return b.power - a.power;
        return 0;
      });
  }, [cards, search, filterRarity, filterFaction, sortBy]);

  const openModal = useCallback(async (card: Card) => {
    try { AudioEngine.sfxCardSelect(); } catch {}
    // Show immediately with catalog data, then enrich with synergy_json from full fetch
    setSelected(card as ExtCard);
    const { data } = await getCardByCode(card.code);
    if (data) setSelected(data as ExtCard);
  }, []);

  const modalOwnedQty = selected ? (collectionById.get(selected.id)?.quantity ?? null) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0a0a14,#0e0e22)",
        borderBottom: "1px solid rgba(201,144,31,.15)", padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: ".18em", color: "#e8b84b", margin: "0 0 8px",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
            ⚔️ COMPENDIO DE VEXFORGE
          </p>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 12px",
            fontSize: "clamp(24px,4vw,42px)", textShadow: "0 0 40px rgba(201,144,31,.3)" }}>
            Cartas
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <p style={{ color: "#8888aa", fontSize: 13, margin: 0, fontFamily: "Rajdhani,sans-serif" }}>
              {isAuth
                ? `Colección: ${ownedCount}/${totalCatalog} · ${completionPct}% completado`
                : `${totalCatalog} cartas disponibles · Inicia sesión para ver tu colección`}
            </p>
            {isAuth && totalCatalog > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 200px", maxWidth: 280 }}>
                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${completionPct}%`, height: "100%", borderRadius: 2,
                    background: "linear-gradient(90deg,#c9901f,#e8b84b)", transition: "width .6s ease" }} />
                </div>
                <span style={{ fontSize: 11, color: "#e8b84b", fontFamily: "Rajdhani,sans-serif", fontWeight: 700 }}>
                  {completionPct}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky filters */}
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
              <option value="rarity">Rareza</option>
              <option value="name">Nombre</option>
              <option value="power">Poder</option>
            </select>
            {(search || filterRarity !== "all" || filterFaction !== "all") && (
              <button onClick={() => { setSearch(""); setFilterRarity("all"); setFilterFaction("all"); }}
                style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 8, padding: "8px 14px", color: "#f87171", fontSize: 11,
                  fontFamily: "Rajdhani,sans-serif", fontWeight: 700, cursor: "pointer" }}>
                ✕ Limpiar
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
            <FilterBtn active={filterRarity === "all"} color="#8888aa" onClick={() => setFilterRarity("all")}>Todas</FilterBtn>
            {RARITIES.map(r => (
              <FilterBtn key={r} active={filterRarity === r} color={RARITY_CFG[r].color}
                onClick={() => setFilterRarity(filterRarity === r ? "all" : r)}>
                {RARITY_CFG[r].label}
              </FilterBtn>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <FilterBtn active={filterFaction === "all"} color="#8888aa" onClick={() => setFilterFaction("all")}>Todas</FilterBtn>
            {FACTIONS.map(f => (
              <FilterBtn key={f} active={filterFaction === f} color={FACTION_CFG[f].color}
                onClick={() => setFilterFaction(filterFaction === f ? "all" : f)}>
                {FACTION_CFG[f].icon} {f}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#555577", fontSize: 12, fontFamily: "Rajdhani,sans-serif" }}>
            {loading ? "Cargando…" : `${filtered.length} carta${filtered.length !== 1 ? "s" : ""}`}
          </span>
          {isAuth && !collectionLoading && (
            <span style={{ color: "#555577", fontSize: 12, fontFamily: "Rajdhani,sans-serif" }}>
              Posees {ownedCount} únicas
            </span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ color: "#e8b84b", fontSize: 40, marginBottom: 12 }}>⚔</div>
            <p style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif" }}>Cargando compendio…</p>
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: 24, background: "rgba(239,68,68,.08)",
            border: "1px solid rgba(239,68,68,.3)", borderRadius: 12,
            color: "#f87171", textAlign: "center", fontFamily: "Rajdhani,sans-serif" }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif", fontSize: 16 }}>
              Ninguna carta coincide con los filtros
            </p>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
            {filtered.map(card => {
              const pc = collectionById.get(card.id);
              return (
                <CardTile key={card.id} card={card}
                  owned={!!pc} quantity={pc?.quantity ?? 0}
                  onClick={() => openModal(card)} />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <CardModal card={selected} ownedQty={modalOwnedQty}
          onClose={() => setSelected(null)} onNav={navigate} />
      )}
    </div>
  );
}
