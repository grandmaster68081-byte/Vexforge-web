import { useMarket } from "../domains/market/useMarket";
import { useState } from "react";

const RARITY_COLOR: Record<string, string> = {
  Common: "#9A9AB0", Uncommon: "#3DC96B", Rare: "#4A9EFF",
  Epic: "#A855F7", Legendary: "#E8B84B", Mythic: "#FF4444",
};
const RARITY_ORDER = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_market.jpg";

export function MarketRoute() {
  const { listings, myCards, currentPlayerId, loading, actionError, pending, create, buy } = useMarket();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [buyMsg, setBuyMsg] = useState<string | null>(null);

  async function createListing() {
    if (!selectedCardId || !newPrice) return;
    const result = await create(selectedCardId, parseFloat(newPrice));
    setCreateMsg(result.data ? "✓ Carta listada correctamente" : (result.reason ?? "Error al listar"));
    if (result.data) { setSelectedCardId(""); setNewPrice(""); }
  }

  async function buyListing(id: string) {
    const result = await buy(id);
    setBuyMsg(result.data ? "✓ Compra exitosa" : (result.reason ?? "Error al comprar"));
  }

  const creating = pending;
  const [rarityFilter, setRarityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  const filtered = listings
    .filter(l => rarityFilter === "all" || (l.card_rarity ?? "") === rarityFilter)
    .filter(l => !search || ((l.card_name ?? "").toLowerCase().includes(search.toLowerCase())));

  const sorted = [...filtered].sort((a, b) => {
    const ri = RARITY_ORDER.indexOf(a.card_rarity ?? "") - RARITY_ORDER.indexOf(b.card_rarity ?? "");
    return ri !== 0 ? ri : a.price - b.price;
  });

  return (
    <div>
      {/* Hero */}
      <div style={{
        position: "relative",
        height: 240,
        margin: "-62px -20px 0",
        overflow: "hidden",
        display: "flex", alignItems: "flex-end", padding: "32px 40px",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url('${BG_URL}')`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(0deg, rgba(5,5,13,1) 0%, rgba(5,5,13,0.3) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10, letterSpacing: "0.3em",
            color: "var(--ember-gold)", textTransform: "uppercase", marginBottom: 8,
          }}>— Iron Market —</div>
          <h1 style={{
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900,
            color: "var(--fg-primary)", marginBottom: 4,
          }}>Mercado</h1>
          <p style={{ color: "rgba(237,240,247,0.5)", fontSize: 13 }}>
            {listings.length} listados activos · Fee del 5% por venta
          </p>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 40 }}>
        {/* Tabs */}
        <div className="market-tabs" style={{ marginBottom: 28 }}>
          {(["buy", "sell"] as const).map(t => (
            <button
              key={t}
              className={`market-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "buy" ? "🛒 Comprar" : "💰 Vender"}
            </button>
          ))}
        </div>

        {tab === "buy" && (
          <>
            {/* Filters */}
            <div className="market-filters">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Buscar carta..."
                className="market-search"
              />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button
                  onClick={() => setRarityFilter("all")}
                  style={{
                    padding: "5px 14px", borderRadius: 20,
                    border: `1px solid ${rarityFilter === "all" ? "rgba(201,144,31,0.5)" : "rgba(255,255,255,0.1)"}`,
                    background: rarityFilter === "all" ? "rgba(201,144,31,0.12)" : "transparent",
                    color: rarityFilter === "all" ? "var(--ember-gold-lt)" : "var(--fg-muted)",
                    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
                    fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}
                >All</button>
                {RARITY_ORDER.map(r => (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(rarityFilter === r ? "all" : r)}
                    style={{
                      padding: "5px 14px", borderRadius: 20,
                      border: `1px solid ${rarityFilter === r ? RARITY_COLOR[r] : RARITY_COLOR[r] + "40"}`,
                      background: rarityFilter === r ? RARITY_COLOR[r] + "18" : "transparent",
                      color: RARITY_COLOR[r],
                      fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >{r.substring(0, 3).toUpperCase()}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 260, borderRadius: 12 }} />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏪</div>
                <div className="empty-state-title">
                  {listings.length === 0 ? "Mercado vacío" : "Sin resultados"}
                </div>
                <div className="empty-state-desc">
                  {listings.length === 0
                    ? "Nadie ha listado cartas aún. ¡Sé el primero!"
                    : "Prueba con otro filtro."}
                </div>
              </div>
            ) : (
              <div className="market-listing-grid">
                {sorted.map((l: any) => {
                  const rc = RARITY_COLOR[l.card_rarity] ?? "#8b8b9e";
                  return (
                    <div key={l.id} className="market-listing-card">
                      {/* Rarity strip */}
                      <div style={{ height: 3, background: rc, boxShadow: `0 0 8px ${rc}` }} />
                      {/* Card visual */}
                      <div style={{
                        height: 140,
                        background: `linear-gradient(145deg, ${rc}10, var(--layer-1))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 52,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}>🃏</div>
                      <div className="market-listing-body">
                        <div className="market-listing-name">{l.card_name ?? "Carta"}</div>
                        <div className="market-listing-meta">
                          <div>
                            <div className="market-price">{l.price}</div>
                            <div className="market-price-label">VEX</div>
                          </div>
                          <span style={{
                            padding: "3px 8px", borderRadius: 20,
                            background: `${rc}18`,
                            border: `1px solid ${rc}40`,
                            color: rc,
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: 9, fontWeight: 700,
                          }}>
                            {(l.card_rarity ?? "").substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <button
                          className="market-buy-btn"
                          onClick={() => buyListing(l.id)}
                        >
                          Comprar
                        </button>
                        {buyMsg && <p style={{ color: "var(--success)", fontSize: 11, marginTop: 6, textAlign: "center" }}>{buyMsg}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "sell" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{
              background: "var(--layer-2)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 32,
            }}>
              <h3 style={{
                fontFamily: '"Cinzel", serif', fontSize: 18, marginBottom: 24,
                color: "var(--fg-primary)",
              }}>Listar una carta</h3>

              {!currentPlayerId ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔒</div>
                  <div className="empty-state-title">Inicia sesión</div>
                  <div className="empty-state-desc">Debes estar autenticado para vender cartas.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "var(--fg-muted)", marginBottom: 8,
                    }}>Seleccionar carta</label>
                    <select
                      className="forge-input"
                      value={selectedCardId}
                      onChange={e => setSelectedCardId(e.target.value)}
                    >
                      <option value="">— Elige una carta —</option>
                      {(myCards ?? []).map((c: any) => (
                        <option key={c.player_card_id} value={c.player_card_id}>
                          {c.name} [{c.rarity}] ×{c.quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "var(--fg-muted)", marginBottom: 8,
                    }}>Precio (VEX)</label>
                    <input
                      type="number"
                      className="forge-input"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="10"
                      min="1"
                    />
                    <div style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10, color: "var(--fg-dim)", marginTop: 6,
                    }}>
                      Recibirás: {Math.floor(parseFloat(newPrice || "0") * 0.95)} VEX (−5% fee)
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={createListing}
                    disabled={creating || !selectedCardId || !newPrice}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {creating ? "Listando..." : "💰 Listar carta"}
                  </button>
                  {(createMsg ?? actionError) && <p style={{ color: createMsg?.startsWith("✓") ? "var(--success)" : "#e3573f", fontSize: 12, textAlign: "center" }}>{createMsg ?? actionError}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}