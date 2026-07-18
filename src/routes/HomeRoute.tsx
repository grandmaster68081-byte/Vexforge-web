import { Link } from "react-router-dom";
import { useHome } from "../domains/home/useHome";
import { SkeletonStatGrid, SkeletonList } from "../shared/components/Skeleton";

const LOBBY_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/lobby/main.jpg";

const FEATURES = [
  {
    icon: "🃏",
    title: "Collect Cards",
    desc: "Build your deck from 24 unique cards across 4 factions — Guerrero, Mago, Pícaro, and Paladín.",
    href: "/cards",
  },
  {
    icon: "⚔️",
    title: "Battle in PvP",
    desc: "Compete in Season 1 — Forge of Legends. Climb the leaderboard, earn glory and exclusive rewards.",
    href: "/pvp",
  },
  {
    icon: "🏪",
    title: "Trade the Market",
    desc: "Buy and sell cards with other players. Rare cards are worth their weight in forge-iron.",
    href: "/market",
  },
  {
    icon: "⚗️",
    title: "Forge New Cards",
    desc: "Fuse two cards into something more powerful. The forge never rests.",
    href: "/fusion",
  },
];

const HOW_TO_PLAY = [
  {
    step: "01",
    title: "Create Account",
    desc: "Sign up and receive your Forge status. Your journey begins immediately.",
  },
  {
    step: "02",
    title: "Open Packs",
    desc: "Purchase card packs to grow your collection. Each pack contains cards from all rarities.",
  },
  {
    step: "03",
    title: "Complete Missions",
    desc: "Daily and weekly missions reward XP, shards, and currency. Stay active to level up fast.",
  },
  {
    step: "04",
    title: "Battle & Trade",
    desc: "Join PvP Season 1, fuse cards, trade in the market, and build your legacy.",
  },
];

export function HomeRoute() {
  const { profile, progress, wallet, nextMissions, signedIn, loading } =
    useHome();

  /* ── LOADING ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div>
        <div
          className="hero-banner"
          style={{ backgroundImage: `url(${LOBBY_URL})`, minHeight: 360 }}
        >
          <div className="hero-banner-overlay">
            <div>
              <h1 style={{ fontSize: 36, marginBottom: 8 }}>VEXFORGE</h1>
              <p className="muted">Loading forge status…</p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <SkeletonStatGrid count={3} />
          <SkeletonList rows={3} />
        </div>
      </div>
    );
  }

  /* ── AUTHENTICATED DASHBOARD ─────────────────────────── */
  if (signedIn) {
    return (
      <div>
        {/* Hero */}
        <div
          className="hero-banner"
          style={{ backgroundImage: `url(${LOBBY_URL})`, minHeight: 280 }}
        >
          <div className="hero-banner-overlay">
            <div>
              <h1 style={{ fontSize: 30, marginBottom: 6 }}>
                {profile?.display_name
                  ? `Welcome back, ${profile.display_name}`
                  : "Welcome back"}
              </h1>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Your forge status is live — Season 1 is active.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 8 }}>
          {/* Quick stats */}
          {(progress || wallet) && (
            <div className="dashboard-grid">
              {progress && (
                <>
                  <div className="stat-card home-stat-card">
                    <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Level
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "var(--forge-ember)", margin: 0 }}>
                      {progress.level ?? 1}
                    </p>
                  </div>
                  <div className="stat-card home-stat-card">
                    <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      XP
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
                      {(progress.xp ?? 0).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
              {wallet && (
                <div className="stat-card home-stat-card">
                  <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    Balance
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "#f0b429", margin: 0 }}>
                    {Number(wallet.vex_ingame ?? 0).toFixed(2)}{" "}
                    <span style={{ fontSize: 12, opacity: 0.6 }}>USDT</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div>
            <h2 style={{ marginBottom: 14, fontSize: 16 }}>Quick Access</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to="/cards">
                <button>🃏 Cards</button>
              </Link>
              <Link to="/missions">
                <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                  📋 Missions
                </button>
              </Link>
              <Link to="/market">
                <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                  🏪 Market
                </button>
              </Link>
              <Link to="/pvp">
                <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                  ⚔️ PvP Season 1
                </button>
              </Link>
              <Link to="/packs">
                <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                  📦 Packs
                </button>
              </Link>
              <Link to="/clans">
                <button style={{ background: "#ffffff0e", border: "1px solid #ffffff16" }}>
                  🏰 Clans
                </button>
              </Link>
            </div>
          </div>

          {/* Active missions */}
          {nextMissions && nextMissions.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ fontSize: 16 }}>Active Missions</h2>
                <Link to="/missions" style={{ color: "var(--forge-ember)", fontSize: 13, textDecoration: "none" }}>
                  View all →
                </Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nextMissions.slice(0, 4).map((m) => (
                  <div key={m.id} className="mission-row">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{m.name}</p>
                      {m.mission_group && (
                        <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>
                          {m.mission_group}
                        </p>
                      )}
                    </div>
                    <span className="mission-tag">{m.mission_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player links */}
          <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid #ffffff10", flexWrap: "wrap" }}>
            <Link to="/profile"   style={{ color: "var(--forge-slate)", textDecoration: "none", fontSize: 13 }}>Profile</Link>
            <Link to="/progress"  style={{ color: "var(--forge-slate)", textDecoration: "none", fontSize: 13 }}>Progress</Link>
            <Link to="/economy"   style={{ color: "var(--forge-slate)", textDecoration: "none", fontSize: 13 }}>Economy</Link>
            <Link to="/inventory" style={{ color: "var(--forge-slate)", textDecoration: "none", fontSize: 13 }}>Inventory</Link>
            <Link to="/settings"  style={{ color: "var(--forge-slate)", textDecoration: "none", fontSize: 13 }}>Settings</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── LANDING PAGE (guest) ────────────────────────────── */
  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="landing-hero"
        style={{ backgroundImage: `url(${LOBBY_URL})` }}
      >
        <div className="landing-hero-overlay">
          <div className="landing-hero-content">
            <div className="landing-hero-eyebrow">
              Season 1 — Forge of Legends · Now Live
            </div>
            <h1 className="landing-hero-title">Enter the Forge</h1>
            <p className="landing-hero-sub">
              A strategic card game where the cards you collect, the battles you
              fight, and the alliances you forge define your legacy.
            </p>
            <div className="landing-hero-cta">
              <Link to="/account" className="landing-cta-primary">
                Start Playing
              </Link>
              <Link to="/cards" className="landing-cta-secondary">
                Browse Cards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="landing-stats">
        <div className="landing-stats-grid">
          <div className="landing-stat">
            <span className="landing-stat-value">24</span>
            <span className="landing-stat-label">Unique Cards</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">4</span>
            <span className="landing-stat-label">Factions</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">S1</span>
            <span className="landing-stat-label">Season Live</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">∞</span>
            <span className="landing-stat-label">Strategies</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything in the Forge</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <Link key={f.href} to={f.href} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Card preview teaser ── */}
      <section style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="landing-section-title" style={{ marginBottom: 0 }}>The Collection</h2>
          <Link
            to="/cards"
            style={{ color: "var(--forge-ember)", fontSize: 13, textDecoration: "none" }}
          >
            Browse all 24 cards →
          </Link>
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {[
            { name: "Acechador Nocturno", faction: "Pícaro",   rarity: "Épico",      color: "#a855f7" },
            { name: "Archimago del Vacío", faction: "Mago",    rarity: "Mythic",     color: "#ff6b6b" },
            { name: "Bastión de Hierro",  faction: "Guerrero", rarity: "Legendario", color: "#e8702a" },
            { name: "Centinela de la Fe", faction: "Paladín",  rarity: "Uncommon",   color: "#4a9eff" },
          ].map((c) => (
            <Link to="/cards" key={c.name} style={{ textDecoration: "none" }}>
              <div className="card-tile" style={{ cursor: "pointer", transition: "transform 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
                <div style={{ height: 100, background: "linear-gradient(135deg, #1d2127, #2a2f38)", borderRadius: 6, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  🃏
                </div>
                <h3 style={{ fontSize: 13, marginBottom: 4 }}>{c.name}</h3>
                <p className="muted" style={{ fontSize: 11, margin: 0 }}>{c.faction}</p>
                <span style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.rarity}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How to Play ── */}
      <section className="landing-howto">
        <h2 className="landing-section-title">How to Play</h2>
        <div className="landing-howto-grid">
          {HOW_TO_PLAY.map((s) => (
            <div key={s.step} className="landing-howto-step">
              <span className="landing-howto-number">{s.step}</span>
              <h3 className="landing-howto-title">{s.title}</h3>
              <p className="landing-howto-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="landing-cta-section"
        style={{ backgroundImage: `url(${LOBBY_URL})` }}
      >
        <div className="landing-cta-overlay">
          <h2>Ready to Forge Your Legend?</h2>
          <p className="muted" style={{ fontSize: 15, marginTop: 8, marginBottom: 0 }}>
            Join Season 1 — Forge of Legends. Now live.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <Link to="/account" className="landing-cta-primary">
              Create Account
            </Link>
            <Link to="/pvp" className="landing-cta-secondary">
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
