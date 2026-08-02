import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useDeck } from "../domains/deck/useDeck";
import type { PlayerCardEntry } from "../domains/deck/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast } from "../shared/context/ToastContext";
import { EmptyState } from "../shared/components/EmptyState";
import { getKeywordsForCard } from "../lib/keywords";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};
const FACTION_COLOR: Record<string, string> = {
  Guerrero: "#e85d04", Mago: "#4a9eff", "Paladín": "#e8b84b", "Pícaro": "#a855f7",
};
const RARITY_ORDER = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
const RARITY_MULT: Record<string, number> = {
  Common: 1.0, Uncommon: 1.3, Rare: 1.6,
  Epic: 2.1, Legendary: 3.0, Mythic: 4.0, Founder: 3.5,
};
function calcDPS(cards: { card_id: string; power: number; rarity: string }[], championId: string | null): number {
  return Math.round(cards
    .filter(c => c.card_id !== championId)
    .reduce((sum, c) => sum + (c.power ?? 1) * (RARITY_MULT[c.rarity] ?? 1.0), 0));
}
function getDPSTier(dps: number): { label: string; color: string; icon: string } {
  if (dps >= 2000) return { label: 'LEYENDA',  color: '#ffd700', icon: '💎' };
  if (dps >= 1200) return { label: 'MAESTRO',  color: '#e8b84b', icon: '🔥' };
  if (dps >= 600)  return { label: 'FORJADOR', color: '#a855f7', icon: '⚡' };
  if (dps >= 200)  return { label: 'APRENDIZ', color: '#4a9eff', icon: '🛡' };
  return { label: 'RECLUTA', color: '#8b8b9e', icon: '⚔' };
}

const ALL_FACTIONS = ["Guerrero", "Mago", "Paladín", "Pícaro"];

function MiniCard({ card, count, selected, canAdd, onClick }: {
  card: PlayerCardEntry; count: number; selected: boolean; canAdd: boolean; onClick: () => void;
}) {
  const rc = RARITY_COLOR[card.rarity] ?? "#8b8b9e";
  const auraClass = card.rarity === "Mythic" ? "card-mythic-aura" : card.rarity === "Legendary" ? "card-legendary-aura" : undefined;
  const keywords = getKeywordsForCard(card.synergy_json);
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
       <div style={{ minHeight: 14, marginTop: 5, color: "#74748e", fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
         {card.specialization ?? "Sin especialización"}
         {keywords.length > 0 && <span style={{ color: "#a9cfff" }}> · {keywords.map(keyword => keyword.name).join(" · ")}</span>}
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
  const selectedCards = selectedIds
    .map(id => myCards.find(card => card.card_id === id))
    .filter((card): card is PlayerCardEntry => !!card);
  const primaryFaction = factionList[0]?.[0] ?? null;
  const factionBonusValues = selectedCards
    .map(card => {
      const bonus = card.synergy_json?.faction_bonus;
      return primaryFaction && typeof bonus === "object" && bonus !== null && typeof bonus[primaryFaction] === "number"
        ? bonus[primaryFaction] as number
        : 0;
    })
    .filter(value => value > 0);
  const averageFactionBonus = factionBonusValues.length
    ? Math.round((factionBonusValues.reduce((sum, value) => sum + value, 0) / factionBonusValues.length) * 100)
    : 0;
  const sharedKeywords = selectedCards
    .flatMap(card => getKeywordsForCard(card.synergy_json).map(keyword => keyword.name))
    .reduce<Record<string, number>>((counts, keyword) => {
      counts[keyword] = (counts[keyword] ?? 0) + 1;
      return counts;
    }, {});
  const synergies = Object.entries(sharedKeywords)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a);

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
         {selectedCards.length > 0 && (
           <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 10, marginTop: 10 }}>
             <div style={{ color: "#a9cfff", fontSize: 10, marginBottom: 6, letterSpacing: "0.06em" }}>LECTURA ESTRATÉGICA</div>
             <div style={{ color: "#8e8eaa", fontSize: 10, lineHeight: 1.45 }}>
               {primaryFaction
                 ? <>Afinidad declarada · <span style={{ color: FACTION_COLOR[primaryFaction] ?? "#e8b84b" }}>{primaryFaction}</span>{averageFactionBonus > 0 ? ` · ${averageFactionBonus}% promedio` : ""}</>
                 : "Añade cartas para evaluar afinidades."}
             </div>
             {synergies.length > 0 ? (
               <div style={{ marginTop: 6, color: "#63e69b", fontSize: 10 }}>
                 Sinergias compartidas · {synergies.map(([keyword, count]) => `${keyword} ×${count}`).join(" · ")}
               </div>
             ) : (
               <div style={{ marginTop: 6, color: "#62627c", fontSize: 10 }}>Combina dos o más keywords para revelar patrones del mazo.</div>
             )}
           </div>
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
  const [championId, setChampionId]    = useState<string | null>(null);
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

          {/* ── Champion DPS Panel (Plan: DeckPowerScore visual) ─── */}
          {selectedIds.length > 0 && (() => {
            const deckCards = selectedIds
              .map(id => myCards.find(c => c.card_id === id))
              .filter((c): c is PlayerCardEntry => !!c);
            const dps = calcDPS(deckCards, championId);
            const tier = getDPSTier(dps);
            const eligibleChampions = deckCards.filter(c => ["Legendary","Mythic"].includes(c.rarity));
            const champion = championId ? myCards.find(c => c.card_id === championId) : null;
            return (
              <div style={{
                background: "linear-gradient(135deg,rgba(232,184,75,0.06),rgba(168,85,247,0.04))",
                border: "1px solid rgba(232,184,75,0.2)", borderRadius: 12,
                padding: "14px 16px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: "#e8b84b", letterSpacing: "0.08em" }}>
                    ⚡ DECK POWER SCORE
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{tier.icon}</span>
                    <span style={{ fontFamily: "Rajdhani,sans-serif", fontWeight: 900, fontSize: 22, color: tier.color,
                      textShadow: `0 0 16px ${tier.color}88` }}>{dps.toLocaleString()}</span>
                    <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 10, color: tier.color,
                      background: `${tier.color}22`, border: `1px solid ${tier.color}44`,
                      borderRadius: 20, padding: "2px 8px", letterSpacing: "0.06em" }}>{tier.label}</span>
                  </div>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (dps / 2000) * 100)}%`,
                    background: `linear-gradient(90deg,#4a9eff,${tier.color})`,
                    borderRadius: 2, transition: "width 0.4s ease",
                    boxShadow: `0 0 8px ${tier.color}88` }} />
                </div>
                <div style={{ fontSize: 10, color: "#7a7a9a", marginBottom: 6, fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.08em" }}>
                  👑 DESIGNAR CAMPEÓN (Legendary · Mythic)
                </div>
                {eligibleChampions.length === 0 ? (
                  <div style={{ fontSize: 10, color: "#4a4a6a", fontFamily: "Rajdhani,sans-serif" }}>
                    Añade una carta Legendary o Mythic para designar tu Campeón
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {eligibleChampions
                      .filter((c, i, a) => a.findIndex(x => x.card_id === c.card_id) === i)
                      .map(c => {
                        const rc = RARITY_COLOR[c.rarity] ?? "#888";
                        const isChamp = championId === c.card_id;
                        return (
                          <button key={c.card_id} onClick={() => setChampionId(isChamp ? null : c.card_id)} style={{
                            padding: "5px 12px", borderRadius: 20,
                            border: `1px solid ${isChamp ? rc : rc + "44"}`,
                            background: isChamp ? `${rc}22` : "transparent",
                            color: isChamp ? rc : "#7a7a9a",
                            fontSize: 10, cursor: "pointer",
                            fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                            boxShadow: isChamp ? `0 0 10px ${rc}44` : "none",
                            transition: "all 0.15s ease",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {isChamp ? "👑 " : ""}{c.name}
                            <span style={{ color: rc, opacity: 0.7 }}>· {c.rarity.slice(0,3).toUpperCase()}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
                {champion && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "#6a6a8a", fontFamily: "Rajdhani,sans-serif" }}>
                    👑 <span style={{ color: RARITY_COLOR[champion.rarity] }}>{champion.name}</span> —
                    Su ATK se amplifica con el DPS total del mazo en cada batalla
                  </div>
                )}
              </div>
            );
          })()}
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
