import { Link } from "react-router-dom";
import { useInventory } from "../domains/inventory/useInventory";

const BG_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_progress.jpg";

const RARITY_COLOR: Record<string, string> = {
  Común: "#8a8a9e", Common: "#8a8a9e",
  Raro: "#4a9eff",   Rare: "#4a9eff",
  Épico: "#a855f7",  Epic: "#a855f7",
  Legendario: "#e8702a", Legendary: "#e8702a",
  Mythic: "#ff6b6b",
};

function rarityColor(r: string | null): string {
  if (!r) return "#8a8a9e";
  for (const [k, v] of Object.entries(RARITY_COLOR)) {
    if (r.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "#8a8a9e";
}

export function InventoryRoute() {
  const { items, loading, error, signedIn } = useInventory();

  return (
    <section>
      <div
        className="hero-banner"
        style={{ backgroundImage: `url(${BG_URL})` }}
      >
        <div className="hero-banner-overlay">
          <h1>Inventory</h1>
          <p style={{ color: "#c4c4d4", fontSize: 13, marginTop: 4 }}>
            {signedIn
              ? `${items.length} item${items.length !== 1 ? "s" : ""} in your inventory`
              : "Your personal item storage"}
          </p>
        </div>
      </div>

      {/* Not signed in */}
      {!loading && !signedIn && (
        <div className="empty-state" style={{ marginTop: 8 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Sign in to view your inventory</p>
          <p className="muted" style={{ marginBottom: 16 }}>
            Your items, shards, and collectibles are stored here. Sign in to manage them.
          </p>
          <Link to="/account">
            <button style={{ background: "var(--forge-ember)" }}>Sign In →</button>
          </Link>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 56, borderRadius: 8 }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

      {/* Empty inventory */}
      {!loading && signedIn && !error && items.length === 0 && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Your inventory is empty</p>
          <p className="muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Open card packs to receive items. Completing missions also rewards shards and collectibles.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/packs">
              <button style={{ background: "var(--forge-ember)" }}>Open Packs →</button>
            </Link>
            <Link to="/missions">
              <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                View Missions
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Inventory list */}
      {!loading && signedIn && items.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="stat-card"
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: "#ffffff08",
                    border: "1px solid #ffffff12",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {item.item_type === "shard" ? "💎"
                    : item.item_type === "card" ? "🃏"
                    : item.item_type === "consumable" ? "⚗️"
                    : "📦"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.item_name ?? item.item_type ?? "Unknown Item"}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {item.rarity && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: rarityColor(item.rarity),
                        }}
                      >
                        {item.rarity}
                      </span>
                    )}
                    {item.item_type && (
                      <span className="muted" style={{ fontSize: 11 }}>
                        {item.item_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity badge */}
                <div
                  style={{
                    background: "#ffffff0a",
                    border: "1px solid #ffffff12",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                    color: "var(--forge-mist)",
                  }}
                >
                  ×{item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #ffffff10",
              flexWrap: "wrap",
            }}
          >
            <Link to="/cards">
              <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                🃏 View Cards
              </button>
            </Link>
            <Link to="/fusion">
              <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                ⚗️ Fusion Lab
              </button>
            </Link>
            <Link to="/market">
              <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                🏪 Market
              </button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
