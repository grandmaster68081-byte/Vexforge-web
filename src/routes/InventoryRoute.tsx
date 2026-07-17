import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_progress.jpg";

const UPCOMING: { icon: string; label: string; desc: string }[] = [
  { icon: "🗂️", label: "Full collection view", desc: "Filter, sort, and search across your entire card collection." },
  { icon: "🔒", label: "Card locking", desc: "Lock individual cards to prevent accidental listing or fusion." },
  { icon: "📦", label: "Bulk actions", desc: "Select multiple cards for batch listing, transfer, or fusion." },
  { icon: "📊", label: "Collection valuation", desc: "Estimated collection value based on current market prices." },
];

export function InventoryRoute() {
  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Inventory</h1>
          <p style={{ color: "#c4c4d4", fontSize: 13, marginTop: 4 }}>Advanced card management — coming soon</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="coming-soon-panel">
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Full Inventory Management</p>
          <p className="muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            A dedicated inventory screen with advanced card management is coming in the next release.
            Your collection is live right now through the Cards and Market sections.
          </p>
          <Link to="/cards" className="btn-small">View Cards →</Link>
        </div>

        <div>
          <h2 style={{ marginBottom: 14 }}>What's Coming</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            {UPCOMING.map((item) => (
              <div key={item.label} style={{
                background: "#ffffff06", border: "1px solid #ffffff10",
                borderRadius: 10, padding: "16px",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.label}</p>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px" }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Market</p>
              <p className="muted" style={{ fontSize: 12 }}>Buy and cancel listings are live.</p>
            </div>
            <Link to="/market" className="btn-small">Open →</Link>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px" }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Fusion</p>
              <p className="muted" style={{ fontSize: 12 }}>Forge new cards from duplicates.</p>
            </div>
            <Link to="/fusion" className="btn-small">Open →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
