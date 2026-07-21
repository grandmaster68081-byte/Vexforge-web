import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useMarket } from "../domains/market/useMarket";
import { useState } from "react";
import type { MarketListing, OwnedCard } from "../domains/market/repository";

const RARITY_COLOR: Record<string, string> = {
  Common: "#9A9AB0", Uncommon: "#3DC96B", Rare: "#4A9EFF",
  Epic: "#A855F7", Legendary: "#E8B84B", Mythic: "#FF4444",
};
const RARITY_ORDER = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_market.jpg";

// ─── Sort / Filter types ──────────────────────────────────────────────────────

type SortKey = "price_asc" | "price_desc" | "newest" | "rarity";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "price_asc",  label: "💰 Precio ↑" },
  { key: "price_desc", label: "💰 Precio ↓" },
  { key: "newest",     label: "🆕 Reciente" },
  { key: "rarity",     label: "⭐ Rareza"   },
];

function applySort(list: MarketListing[], sort: SortKey): MarketListing[] {
  return [...list].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "rarity") {
      const ri = RARITY_ORDER.indexOf(a.card_rarity ?? "") - RARITY_ORDER.indexOf(b.card_rarity ?? "");
      return ri !== 0 ? ri : a.price - b.price;
    }
    return 0; // newest: server order (price asc by default, swap for newest if created_at added later)
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: string | null }) {
  if (!rarity) return null;
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 8px", borderRadius: 20, fontSize: 9,
      fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.08em",
      fontWeight: 700,
      background: `${RARITY_COLOR[rarity] ?? "#9A9AB0"}18`,
      border: `1px solid ${RARITY_COLOR[rarity] ?? "#9A9AB0"}55`,
      color: RARITY_COLOR[rarity] ?? "#9A9AB0",
    }}>
      {rarity.toUpperCase()}
    </span>
  );
}

function ListingCard({
  listing, isMine, onBuy, onCancel, pending,
}: {
  listing: MarketListing;
  isMine: boolean;
  onBuy: (id: string) => void;
  onCancel: (id: string) => void;
  pending: boolean;
}) {
  const rarityColor = RARITY_COLOR[listing.card_rarity ?? ""] ?? "#9A9AB0";
  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      background: isMine ? "rgba(232,184,75,0.05)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isMine ? "rgba(232,184,75,0.35)" : `${rarityColor}30`}`,
      display: "flex", flexDirection: "column",
      transition: "transform .15s, border-color .15s",
    }}>
      {/* Rarity stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${rarityColor},${rarityColor}44)` }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--fg-primary)", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              {listing.card_name ?? "Carta desconocida"}
            </div>
            <div style={{ marginTop: 4 }}>
              <RarityBadge rarity={listing.card_rarity} />
            </div>
          </div>
          {isMine && (
            <div style={{
              background: "rgba(232,184,75,0.12)", border: "1px solid rgba(232,184,75,0.4)",
              borderRadius: 6, padding: "2px 8px", fontSize: 9,
              fontFamily: '"IBM Plex Mono",monospace', color: "#E8B84B", letterSpacing: "0.1em",
              flexShrink: 0,
            }}>MÍO</div>
          )}
        </div>

        {/* Price */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 6,
          background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px",
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#E8B84B", fontFamily: '"Rajdhani",sans-serif' }}>
            {listing.price.toLocaleString("es-ES")}
          </span>
          <span style={{ color: "var(--fg-dim)", fontSize: 11, fontFamily: '"IBM Plex Mono",monospace' }}>VEX</span>
        </div>

        {/* Action */}
        {isMine ? (
          <button
            onClick={() => onCancel(listing.id)}
            disabled={pending}
            style={{
              padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(232,64,64,0.4)",
              background: "rgba(232,64,64,0.08)", color: "#E84040",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.06em",
              opacity: pending ? 0.5 : 1, width: "100%",
            }}
          >
            {pending ? "Cancelando…" : "✕ Cancelar listado"}
          </button>
        ) : (
          <button
            onClick={() => onBuy(listing.id)}
            disabled={pending}
            style={{
              padding: "9px 12px", borderRadius: 7, border: "none",
              background: "linear-gradient(135deg,#2a4f9a,#4A9EFF)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.06em",
              opacity: pending ? 0.5 : 1, width: "100%",
            }}
          >
            {pending ? "Comprando…" : "🛒 Comprar"}
          </button>
        )}
      </div>
    </div>
  );
}

function ActionToast({ msg, isError, onDismiss }: { msg: string; isError: boolean; onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        cursor: "pointer", borderRadius: 10, padding: "12px 16px", marginBottom: 16,
        background: isError ? "rgba(232,64,64,0.07)" : "rgba(61,201,107,0.07)",
        border: `1px solid ${isError ? "rgba(232,64,64,0.3)" : "rgba(61,201,107,0.3)"}`,
        color: isError ? "#E84040" : "#3DC96B",
        display: "flex", alignItems: "center", gap: 10,
      }}
    >
      <span style={{ fontSize: 18 }}>{isError ? "⚠️" : "✓"}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{msg}</span>
      <span style={{ fontSize: 10, opacity: 0.5, fontFamily: '"IBM Plex Mono",monospace' }}>tap</span>
    </div>
  );
}

// ─── Sell form ────────────────────────────────────────────────────────────────

function SellForm({
  myCards, pending, onCreate,
}: {
  myCards: OwnedCard[];
  pending: boolean;
  onCreate: (playerCardId: string, price: number) => Promise<void>;
}) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedCard = myCards.find(c => c.id === selectedCardId) ?? null;
  const priceNum = parseFloat(newPrice || "0");
  const netReceive = priceNum > 0 ? Math.floor(priceNum * 0.95) : 0;

  async function handleCreate() {
    if (!selectedCardId || !newPrice || priceNum <= 0) return;
    try {
      await onCreate(selectedCardId, priceNum);
      setMsg({ text: "✓ Carta listada correctamente en el mercado", ok: true });
      setSelectedCardId(""); setNewPrice("");
    } catch (e: any) {
      setMsg({ text: e?.message ?? "Error al crear el listado", ok: false });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
      {msg && (
        <ActionToast msg={msg.text} isError={!msg.ok} onDismiss={() => setMsg(null)} />
      )}

      {/* Card selector */}
      <div>
        <label style={{ display: "block", fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 8 }}>
          Selecciona una carta
        </label>
        <select
          className="forge-input"
          value={selectedCardId}
          onChange={e => setSelectedCardId(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="">— Elige una carta de tu colección —</option>
          {myCards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.card_name ?? "Carta"} [{c.card_rarity ?? "?"}] ×{c.quantity}
            </option>
          ))}
        </select>
        {/* Card preview when selected */}
        {selectedCard && (
          <div style={{
            marginTop: 8, borderRadius: 8, padding: "10px 14px",
            background: `${RARITY_COLOR[selectedCard.card_rarity ?? ""] ?? "#9A9AB0"}0a`,
            border: `1px solid ${RARITY_COLOR[selectedCard.card_rarity ?? ""] ?? "#9A9AB0"}40`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 24 }}>🃏</div>
            <div>
              <div style={{ color: "var(--fg-primary)", fontWeight: 700, fontSize: 13 }}>{selectedCard.card_name}</div>
              <RarityBadge rarity={selectedCard.card_rarity} />
              <span style={{ color: "var(--fg-dim)", fontSize: 10, marginLeft: 8 }}>×{selectedCard.quantity} en inventario</span>
            </div>
          </div>
        )}
        {myCards.length === 0 && (
          <p style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 8 }}>
            No tienes cartas disponibles para listar. ¡Abre packs para conseguir más!
          </p>
        )}
      </div>

      {/* Price */}
      <div>
        <label style={{ display: "block", fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 8 }}>
          Precio (VEX)
        </label>
        <input
          type="number"
          className="forge-input"
          value={newPrice}
          onChange={e => setNewPrice(e.target.value)}
          placeholder="10"
          min="1"
          style={{ width: "100%" }}
        />
        {priceNum > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: "var(--fg-dim)" }}>
              Recibirás: <span style={{ color: "#3DC96B", fontWeight: 700 }}>{netReceive} VEX</span>
            </span>
            <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: "var(--fg-dim)" }}>
              Fee: <span style={{ color: "#E84040" }}>{priceNum - netReceive} VEX (5%)</span>
            </span>
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={handleCreate}
        disabled={pending || !selectedCardId || priceNum <= 0}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {pending ? "Listando…" : "💰 Listar carta en el mercado"}
      </button>
    </div>
  );
}

// ─── My Listings tab ──────────────────────────────────────────────────────────

function MyListingsTab({
  listings, currentPlayerId, pending, onCancel,
}: {
  listings: MarketListing[];
  currentPlayerId: string | null;
  pending: boolean;
  onCancel: (id: string) => void;
}) {
  const myListings = listings.filter(l => l.player_id === currentPlayerId);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleCancel(id: string) {
    onCancel(id);
    setMsg({ text: "Listado cancelado. La carta vuelve a tu inventario.", ok: true });
  }

  if (!currentPlayerId) {
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "24px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
        <p style={{ color: "var(--fg-dim)", margin: 0, fontSize: 13 }}>Inicia sesión para ver tus listados activos.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {msg && <ActionToast msg={msg.text} isError={!msg.ok} onDismiss={() => setMsg(null)} />}

      {/* Summary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "var(--fg-dim)", fontSize: 12, fontFamily: '"IBM Plex Mono",monospace' }}>
          {myListings.length} listado{myListings.length !== 1 ? "s" : ""} activo{myListings.length !== 1 ? "s" : ""}
        </div>
        {myListings.length > 0 && (
          <div style={{ color: "var(--fg-dim)", fontSize: 11 }}>
            Valor total: <span style={{ color: "#E8B84B", fontWeight: 700 }}>
              {myListings.reduce((s, l) => s + l.price, 0).toLocaleString("es-ES")} VEX
            </span>
          </div>
        )}
      </div>

      {myListings.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ color: "var(--fg-primary)", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sin listados activos</div>
          <p style={{ color: "var(--fg-dim)", margin: 0, fontSize: 13 }}>
            Ve a la pestaña "Vender" para listar cartas de tu colección.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {myListings.map(l => (
            <ListingCard
              key={l.id}
              listing={l}
              isMine
              onBuy={() => {}}
              onCancel={handleCancel}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export function MarketRoute() {
  const { listings, myCards, currentPlayerId, loading, actionError, pending, create, buy, cancel } = useMarket();

  const [tab, setTab]             = useState<"buy" | "mine" | "sell">("buy");
  const [rarityFilter, setRarity] = useState("all");
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortKey>("price_asc");
  const [buyMsg, setBuyMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  // Buy-tab listings
  const filtered = listings
    .filter(l => rarityFilter === "all" || (l.card_rarity ?? "") === rarityFilter)
    .filter(l => !search || ((l.card_name ?? "").toLowerCase().includes(search.toLowerCase())));
  const sorted = applySort(filtered, sort);

  // Derived counts
  const myListingsCount = listings.filter(l => l.player_id === currentPlayerId).length;

  async function handleBuy(id: string) {
    const result = await buy(id);
    setBuyMsg(result.data
      ? { text: "¡Carta comprada! Ya está en tu inventario.", ok: true }
      : { text: result.reason ?? "Error al comprar", ok: false }
    );
  }

  async function handleCreate(playerCardId: string, price: number) {
    const result = await create(playerCardId, price);
    if (!result.data) throw new Error(result.reason ?? "Error al listar");
  }

  if (loading && !listings.length) return <PageLoader />;
  if (!currentPlayerId && !loading) return <BlockedAuthState message="Inicia sesión para acceder al Mercado de Cartas de VEXFORGE." />;

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{
        position: "relative", height: 240,
        margin: "-62px -20px 0", overflow: "hidden",
        display: "flex", alignItems: "flex-end", padding: "32px 40px",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url('${BG_URL}')`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,5,13,1) 0%, rgba(5,5,13,0.3) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: "0.3em", color: "var(--ember-gold)", textTransform: "uppercase", marginBottom: 8 }}>
            — Iron Market —
          </div>
          <h1 style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "var(--fg-primary)", marginBottom: 4 }}>
            Mercado
          </h1>
          <p style={{ color: "rgba(237,240,247,0.5)", fontSize: 13 }}>
            {listings.length} listados activos · Fee del 5% por venta
          </p>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 40 }}>
        {/* ── Tabs ── */}
        <div className="market-tabs" style={{ marginBottom: 28 }}>
          {([
            { id: "buy",  label: "🛒 Comprar",       count: sorted.length },
            { id: "mine", label: "📋 Mis Listados",   count: myListingsCount },
            { id: "sell", label: "💰 Vender",          count: null },
          ] as const).map(({ id, label, count }) => (
            <button
              key={id}
              className={`market-tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
              {count !== null && count > 0 && (
                <span style={{ background: tab === id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 7px", fontSize: 10, marginLeft: 6 }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── BUY TAB ── */}
        {tab === "buy" && (
          <>
            {buyMsg && <ActionToast msg={buyMsg.text} isError={!buyMsg.ok} onDismiss={() => setBuyMsg(null)} />}
            {(actionError && !buyMsg) && <ActionToast msg={actionError} isError onDismiss={() => {}} />}

            {/* Filters row */}
            <div className="market-filters" style={{ marginBottom: 16 }}>
              <input
                className="forge-input"
                placeholder="🔍 Buscar carta…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ minWidth: 180 }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all", ...RARITY_ORDER].map(r => (
                  <button
                    key={r}
                    onClick={() => setRarity(r)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 11,
                      cursor: "pointer", fontWeight: rarityFilter === r ? 700 : 400,
                      background: rarityFilter === r
                        ? (r === "all" ? "rgba(255,255,255,0.15)" : `${RARITY_COLOR[r] ?? "#fff"}22`)
                        : "rgba(255,255,255,0.05)",
                      color: rarityFilter === r
                        ? (r === "all" ? "var(--fg-primary)" : (RARITY_COLOR[r] ?? "var(--fg-primary)"))
                        : "var(--fg-dim)",
                      border: rarityFilter === r
                        ? `1px solid ${r === "all" ? "rgba(255,255,255,0.2)" : `${RARITY_COLOR[r] ?? "#fff"}66`}`
                        : "1px solid transparent",
                    }}
                  >
                    {r === "all" ? "Todas" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.key}
                  onClick={() => setSort(o.key)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 10,
                    cursor: "pointer", fontFamily: '"IBM Plex Mono",monospace',
                    background: sort === o.key ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.04)",
                    border: sort === o.key ? "1px solid rgba(74,158,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: sort === o.key ? "#4A9EFF" : "var(--fg-dim)",
                    fontWeight: sort === o.key ? 700 : 400,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--fg-dim)" }}>Cargando mercado…</div>
            ) : sorted.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏪</div>
                <div style={{ color: "var(--fg-primary)", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Sin listados disponibles</div>
                <p style={{ color: "var(--fg-dim)", margin: 0, fontSize: 13 }}>
                  {search || rarityFilter !== "all" ? "Prueba con otros filtros." : "El mercado está vacío. ¡Sé el primero en listar!"}
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {sorted.map(l => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    isMine={l.player_id === currentPlayerId}
                    onBuy={handleBuy}
                    onCancel={() => {}}
                    pending={pending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MY LISTINGS TAB ── */}
        {tab === "mine" && (
          <MyListingsTab
            listings={listings}
            currentPlayerId={currentPlayerId}
            pending={pending}
            onCancel={cancel}
          />
        )}

        {/* ── SELL TAB ── */}
        {tab === "sell" && (
          <SellForm
            myCards={myCards as OwnedCard[]}
            pending={pending}
            onCreate={handleCreate}
          />
        )}
      </div>
    </div>
  );
}
