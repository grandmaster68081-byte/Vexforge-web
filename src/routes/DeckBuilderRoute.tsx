import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useDeck } from "../domains/deck/useDeck";
import type { PlayerCardEntry } from "../domains/deck/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast } from "../shared/context/ToastContext";
import { EmptyState } from "../shared/components/EmptyState";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};
const FACTION_COLOR: Record<string, string> = {
  Guerrero: "#e85d04", Mago: "#4a9eff", "Paladín": "#e8b84b", "Pícaro": "#a855f7",
};
const RARITY_ORDER = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
const ALL_FACTIONS = ["Guerrero", "Mago", "Paladín", "Pícaro"];

function MiniCard({ card, count, selected, canAdd, onClick }: {
  card: PlayerCardEntry; count: number; selected: boolean; canAdd: boolean; onClick: () => void;
}) {
  const rc = RARITY_COLOR[card.rarity] ?? "#8b8b9e";
  const auraClass = card.rarity === "Mythic" ? "card-mythic-aura" : card.rarity === "Legendary" ? "card-legendary-aura" : undefined;
  return (
    <div onClick={onClick} className={auraClass} style={{
      background: selected ? `${rc}18` : "#1a1a2e",
      border: `1.5px solid ${selected ? rc : rc + "33"}`,
      borderRadius: 8, padding: "9px 11px",
      cursor: canAdd || selected ? "pointer" : "not-allowed",
      opacity: !canAdd && !selected ? 0.45 : 1,
      transition: "all .12s ease",
      boxShadow: selected ? `0 0 8px ${rc}33` : "none", position: "relative",
    }}>
      {count > 0 && (
        <span style={{ position: "absolute", top: 3, right: 5, background: rc, color: "#0a0a12", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>×{count}</span>
      )}
      <div style={{ color: rc, fontSize: 8, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>{card.rarity.toUpperCase()}</div>
      <div style={{ color: "#e8e8f0", fontFamily: "Cinzel,serif", fontSize: 11, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{card.name}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: FACTION_COLOR[card.faction] ?? "#888", fontSize: 9 }}>{card.faction}</span>
        <span style={{ color: "#e8b84b", fontSize: 9 }}>⚡{card.power}</span>
      </div>
    </div>
  );
}

function DeckPanel({ selectedIds, myCards, saving, saveMsg, validation, onValidate, onSave }: {
  selectedIds: string[]; myCards: PlayerCardEntry[];
  saving: boolean; saveMsg: string | null;
  validation: { valid: boolean; errors: string[] } | null;
  onValidate: () => void; onSave: () => void;
}) {
  const counts: Record<string, number> = {};
  const factions: Record<string, number> = {};
  selectedIds.forEach(id => {
    const c = myCards.find(x => x.card_id === id);
    if (!c) return;
    counts[c.rarity] = (counts[c.rarity] ?? 0) + 1;
    factions[c.faction] = (factions[c.faction] ?? 0) + 1;
  });
  const total = selectedIds.length;
  const isValid = total >= 5 && total <= 30 && Object.keys(factions).length <= 2;
  const factionList = Object.entries(factions).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 16 }}>
      <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
        <p style={{ color: "#888", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 12px" }}>MAZO ACTUAL</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#888", fontSize: 12 }}>Cartas</span>
          <span style={{ color: isValid ? "#3ddc84" : "#e3573f", fontWeight: 800, fontSize: 16 }}>{total}/30</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, (total / 30) * 100)}%`,
            background: isValid ? "#3ddc84" : total < 5 ? "#e3573f" : "#e8b84b",
            borderRadius: 2, transition: "width 0.3s ease",
          }} />
        </div>

        {/* Rarity breakdown */}
        {Object.entries(counts).length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {RARITY_ORDER.filter(r => counts[r]).map(r => (
              <div key={r} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: RARITY_COLOR[r], fontSize: 10 }}>{r}</span>
                <span style={{ color: "#888", fontSize: 10 }}>×{counts[r]}</span>
              </div>
            ))}
          </div>
        )}

        {factionList.length > 0 && (
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 10, marginTop: 8 }}>
            <div style={{ color: "#7a7a9a", fontSize: 10, marginBottom: 6 }}>FACCIONES</div>
            {factionList.map(([f, n]) => (
              <div key={f} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: FACTION_COLOR[f] ?? "#888", fontSize: 11 }}>{f}</span>
                <span style={{ color: "#888", fontSize: 11 }}>{n}</span>
              </div>
            ))}
            {Object.keys(factions).length > 2 && (
              <div style={{ color: "#e3573f", fontSize: 10, marginTop: 4 }}>⚠️ Máx. 2 facciones</div>
            )}
          </div>
        )}
      </div>

      {validation && !validation.valid && validation.errors.length > 0 && (
        <div style={{ background: "#2a1a1a", border: "1px solid #e3573f44", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
          {validation.errors.map((v, i) => <div key={i} style={{ color: "#e3573f", fontSize: 11, marginBottom: 4 }}>• {v}</div>)}
        </div>
      )}
      {saveMsg && (
        <div style={{ background: "#1a2a1a", border: "1px solid #3ddc8444", borderRadius: 10, padding: "10px 14px", marginBottom: 10, color: "#3ddc84", fontSize: 12 }}>{saveMsg}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onValidate} style={{ padding: "9px", borderRadius: 10, border: "1px solid #e8b84b44", background: "transparent", color: "#e8b84b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🔍 Validar</button>
        <button onClick={onSave} disabled={saving || !isValid} style={{ padding: "9px", borderRadius: 10, border: "none", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13, cursor: isValid && !saving ? "pointer" : "not-allowed", background: isValid ? "linear-gradient(135deg,#e8b84b,#c9901f)" : "#1a1a2e", color: isValid ? "#0a0a12" : "#444" }}>
          {saving ? "Guardando…" : "⚔️ Guardar Mazo"}
        </button>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({
  search, setSearch,
  factionFilter, setFactionFilter,
  rarityFilter, setRarityFilter,
  totalShown, totalAll,
}: {
  search: string; setSearch: (v: string) => void;
  factionFilter: string; setFactionFilter: (v: string) => void;
  rarityFilter: string; setRarityFilter: (v: string) => void;
  totalShown: number; totalAll: number;
}) {
  const chipStyle = (active: boolean, color: string) => ({
    padding: "4px 10px", borderRadius: 20,
    border: `1px solid ${active ? color : color + "44"}`,
    background: active ? color + "22" : "transparent",
    color: active ? color : "#7a7a9a",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.06em",
    transition: "all 0.15s ease",
  });

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Search box */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#5a5a7a", fontSize: 13, pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "8px 10px 8px 32px",
            background: "#12121a", border: "1px solid #2a2a3e",
            borderRadius: 8, color: "#e8e8f0", fontSize: 12,
            fontFamily: "Rajdhani,sans-serif", outline: "none",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#7a7a9a", cursor: "pointer", fontSize: 13,
          }}>✕</button>
        )}
      </div>

      {/* Faction chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => setFactionFilter("")} style={chipStyle(factionFilter === "", "#e8b84b")}>Todas</button>
        {ALL_FACTIONS.map(f => (
          <button key={f} onClick={() => setFactionFilter(factionFilter === f ? "" : f)}
            style={chipStyle(factionFilter === f, FACTION_COLOR[f] ?? "#888")}>{f}</button>
        ))}
      </div>

      {/* Rarity chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {RARITY_ORDER.map(r => (
          <button key={r} onClick={() => setRarityFilter(rarityFilter === r ? "" : r)}
            style={chipStyle(rarityFilter === r, RARITY_COLOR[r] ?? "#888")}>{r}</button>
        ))}
      </div>

      {(search || factionFilter || rarityFilter) && (
        <div style={{ marginTop: 8, color: "#7a7a9a", fontSize: 10 }}>
          Mostrando {totalShown} de {totalAll} cartas ·{" "}
          <button onClick={() => { setSearch(""); setFactionFilter(""); setRarityFilter(""); }}
            style={{ background: "none", border: "none", color: "#e8b84b", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>
            limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

export function DeckBuilderRoute() {
  const { myCards, selectedIds, loading, saving, error, saveMsg, validation, toggleCard, validate, save } = useDeck();
  const { addToast } = useToast();

  useEffect(() => {
    if (!saveMsg) return;
    addToast("success", "✓ Mazo guardado", saveMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveMsg]);

  const [authed, setAuthed]           = useState<boolean | null>(null);
  const [search, setSearch]           = useState("");
  const [factionFilter, setFactionFilter] = useState("");
  const [rarityFilter, setRarityFilter]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, []);

  const deckCounts: Record<string, number> = {};
  selectedIds.forEach(id => { deckCounts[id] = (deckCounts[id] ?? 0) + 1; });

  const canAdd = (card: PlayerCardEntry) => {
    const inDeck = deckCounts[card.card_id] ?? 0;
    const limit = ["Legendary", "Mythic"].includes(card.rarity) ? 1 : 2;
    return inDeck < limit && selectedIds.length < 30;
  };

  const sorted = useMemo(() => [...myCards].sort((a, b) => {
    const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return ri !== 0 ? ri : b.power - a.power;
  }), [myCards]);

  const filtered = useMemo(() => sorted.filter(card => {
    if (factionFilter && card.faction !== factionFilter) return false;
    if (rarityFilter && card.rarity !== rarityFilter) return false;
    if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sorted, factionFilter, rarityFilter, search]);

  if (authed === null || loading) return <PageLoader />;
  if (authed === false) return <BlockedAuthState message="Inicia sesión para construir y guardar mazos." />;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Estrategia ───</p>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>⚔️ Constructor de Mazos</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Formato Estándar: 5–30 cartas · Máx. 2 copias · Máx. 1 Legendary/Mythic · Máx. 2 facciones</p>
      </div>
      {error && <div style={{ background: "#2a1a1a", border: "1px solid #e3573f33", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#e3573f", fontSize: 13 }}>{error}</div>}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FilterBar
            search={search} setSearch={setSearch}
            factionFilter={factionFilter} setFactionFilter={setFactionFilter}
            rarityFilter={rarityFilter} setRarityFilter={setRarityFilter}
            totalShown={filtered.length} totalAll={myCards.length}
          />

          <div style={{ color: "#888", fontSize: 12, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Tu Colección <span style={{ color: "#7a7a9a" }}>({myCards.length} cartas únicas)</span></span>
            <span style={{ color: "#e8b84b", fontWeight: 700 }}>{selectedIds.length} seleccionadas</span>
          </div>
          {myCards.length === 0 ? (
            <EmptyState icon="🃏" title="Sin cartas" description="Aún no tienes cartas. Abre packs desde la tienda para empezar a construir tu mazo." />
          ) : filtered.length === 0 ? (
            <EmptyState icon="🔍" title="Sin resultados" description="Ninguna carta coincide con el filtro. Prueba con otros criterios." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
              {filtered.map(card => (
                <MiniCard key={card.card_id} card={card} count={deckCounts[card.card_id] ?? 0} selected={(deckCounts[card.card_id] ?? 0) > 0} canAdd={canAdd(card)} onClick={() => toggleCard(card.card_id)} />
              ))}
            </div>
          )}
        </div>
        <DeckPanel selectedIds={selectedIds} myCards={myCards} saving={saving} saveMsg={saveMsg} validation={validation} onValidate={validate} onSave={save} />
      </div>
    </main>
  );
}
