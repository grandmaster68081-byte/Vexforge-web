import { useState, useEffect } from "react";
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

function MiniCard({ card, count, selected, canAdd, onClick }: {
  card: PlayerCardEntry; count: number; selected: boolean; canAdd: boolean; onClick: () => void;
}) {
  const rc = RARITY_COLOR[card.rarity] ?? "#8b8b9e";
  return (
    <div onClick={onClick} style={{
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
        <div style={{ background: "#0e0e1a", borderRadius: 4, height: 6, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (total / 30) * 100)}%`, height: "100%", background: isValid ? "linear-gradient(90deg,#3ddc84,#4a9eff)" : "#e3573f", transition: "width .3s", borderRadius: 4 }} />
        </div>
        {RARITY_ORDER.filter(r => counts[r]).map(r => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: RARITY_COLOR[r], fontSize: 11 }}>{r}</span>
            <span style={{ color: "#888", fontSize: 11 }}>×{counts[r]}</span>
          </div>
        ))}
        {factionList.length > 0 && (
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 10, marginTop: 8 }}>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 6 }}>FACCIONES</div>
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

export function DeckBuilderRoute() {
  const { myCards, selectedIds, loading, saving, error, saveMsg, validation, toggleCard, validate, save } = useDeck();
  const { addToast } = useToast();

  useEffect(() => {
    if (!saveMsg) return;
    addToast("success", "✓ Mazo guardado", saveMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveMsg]);
  const [authed, setAuthed] = useState<boolean | null>(null);

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

  const sorted = [...myCards].sort((a, b) => {
    const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return ri !== 0 ? ri : b.power - a.power;
  });

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
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Tu Colección <span style={{ color: "#555" }}>({myCards.length} cartas únicas)</span></span>
            <span style={{ color: "#e8b84b", fontWeight: 700 }}>{selectedIds.length} seleccionadas</span>
          </div>
          {myCards.length === 0 ? (
            <EmptyState icon="🃏" title="Sin cartas" description="Aún no tienes cartas. Abre packs desde la tienda para empezar a construir tu mazo." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
              {sorted.map(card => (
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
