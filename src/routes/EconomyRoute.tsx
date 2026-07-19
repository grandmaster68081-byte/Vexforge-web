import { useEconomy } from "../domains/economy/useEconomy";
import { SkeletonStatGrid } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_economy.jpg";
const ENTRY_COLOR: Record<string, string> = { earn: "#3ddc84", spend: "#e3573f", receive: "#4a9eff", send: "#e8702a", reward: "#3ddc84", fee: "#e3573f", burn: "#a855f7" };
const ENTRY_ICON: Record<string, string>  = { earn: "↑", spend: "↓", receive: "←", send: "→", reward: "★", fee: "↓", burn: "🔥" };

export function EconomyRoute() {
const { wallet, ledger, loading, reason, signedIn } = useEconomy();
return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay" style={{ alignItems: "flex-start", padding: "40px 48px" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ember-gold)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, marginBottom: 10 }}>─── Iron Treasury ───</p>
        <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: "clamp(2.4rem,5vw,3.8rem)", fontWeight: 900, margin: 0 }}>Economy</h1>
        <p style={{ marginTop: 14, fontSize: 15, color: "var(--fg-muted)", maxWidth: 480 }}>Your wallet balances and transaction history. Read-only by design.</p>
      </div>
    </div>
    <div style={{ padding: "40px 48px 48px" }}>
      {loading ? <SkeletonStatGrid /> : !signedIn ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>💰</div>
          <p style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 16, color: "var(--ember-gold)", marginBottom: 8 }}>Sign In Required</p>
          <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>Sign in to view your iron treasury.</p>
          <Link to="/account" className="btn btn-primary" style={{ fontSize: 13 }}>Sign In</Link>
        </div>
      ) : !wallet ? (
        <p className="muted" style={{ textAlign: "center", padding: "48px 0" }}>{reason ?? "No wallet data found."}</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginBottom: 36 }}>
            {[
              { label: "VEX In-Game",   value: wallet.vex_ingame ?? 0,   sub: "Earned through gameplay", color: "var(--ember-gold)" },
              { label: "VEX Tradeable", value: wallet.vex_tradeable ?? 0, sub: "Available to trade",      color: "#3ddc84" },
            ].map((card: any) => (
              <div key={card.label} style={{ padding: "24px 26px", borderRadius: "var(--radius-lg)", background: "var(--layer-1)", border: `1px solid ${card.color}25` }}>
                <p style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--fg-muted)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 600, marginBottom: 10 }}>{card.label}</p>
                <p style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 28, fontWeight: 900, color: card.color, margin: "0 0 4px", lineHeight: 1 }}>{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
                <p className="muted" style={{ fontSize: 11, margin: 0 }}>{card.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", marginBottom: 36, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>Economy is read-only from the web. VEX is earned through missions, packs, and PvP.</p>
          </div>
          <h2 className="forge-section-header">Transaction Ledger</h2>
          {(!ledger || ledger.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 24px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "var(--radius-lg)" }}>
              <p className="muted" style={{ fontSize: 13 }}>No transactions recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ledger.slice(0, 30).map((entry: any, i: number) => {
                const type = entry.entry_type ?? entry.type ?? "unknown";
                const color = ENTRY_COLOR[type] ?? "#8a8a9e";
                const amount = entry.amount ?? entry.delta ?? 0;
                return (
                  <div key={entry.id ?? i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderRadius: "var(--radius-md)", background: "var(--layer-1)", borderLeft: `3px solid ${color}`, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{ENTRY_ICON[type] ?? "·"}</span>
                    <span style={{ flex: 1, fontSize: 12, fontFamily: '"Rajdhani",sans-serif', fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>{type}</span>
                    <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: '"IBM Plex Mono",monospace' }}>{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "—"}</span>
                    <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 14, color, fontWeight: 700, minWidth: 70, textAlign: "right" }}>{amount > 0 ? "+" : ""}{Number(amount).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  </section>
);
}