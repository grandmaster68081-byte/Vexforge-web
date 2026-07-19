import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useHome } from "../domains/home/useHome";

const LOBBY_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/lobby/main.jpg";

const FEATURES = [
  { icon:"🃏", title:"127 Cartas Únicas",    desc:"4 facciones · 6 rarezas · Common a Mythic. Cada carta con keywords y sinergias propias.", href:"/cards",        color:"#E84040" },
  { icon:"⚔️", title:"Combat PvP",           desc:"Motor turn-by-turn con sistema ELO. 7 tiers desde Iron hasta Mythic.", href:"/pvp",          color:"#5B8BF5" },
  { icon:"📦", title:"Pack Opening",         desc:"5 tipos de packs con probabilidades reales y sistema de pity garantizado.", href:"/packs",        color:"#3DC96B" },
  { icon:"⚗️", title:"Fusión de Cartas",     desc:"Combina dos cartas con el keyword Forge para obtener algo más poderoso.", href:"/fusion",       color:"#E8B84B" },
  { icon:"🏪", title:"Mercado P2P",          desc:"Compra y vende cartas con otros jugadores. Fee del 5% por venta.", href:"/market",       color:"#E84040" },
  { icon:"🐉", title:"World Bosses",         desc:"10 bosses de T1 a T6. Desde Karrath hasta El Origen. Recompensas épicas.", href:"/bosses",       color:"#5B8BF5" },
  { icon:"📜", title:"Misiones Diarias",     desc:"Completa misiones por tipo y región. Gana VEX y XP progresivamente.", href:"/missions",     color:"#3DC96B" },
  { icon:"🏆", title:"25+ Logros",           desc:"Desbloquea logros permanentes y demuestra tu dominio en la forja.", href:"/achievements", color:"#E8B84B" },
  { icon:"🏰", title:"Clanes",               desc:"Únete o crea un clan. Contribuye y sube el prestige de tu facción.", href:"/clans",        color:"#E84040" },
  { icon:"💜", title:"Season Pass",          desc:"Temporada 1: El Despertar del Forjador. 50 niveles de recompensas.", href:"/season-pass",  color:"#A855F7" },
];

// Particle component
function Particles() {
  return (
    <div className="hero-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="hero-particle"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 40}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDuration: `${Math.random() * 4 + 3}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.6 + 0.2,
            background: i % 3 === 0 ? "#E8B84B" : i % 3 === 1 ? "#C9901F" : "#F0C050",
          }}
        />
      ))}
    </div>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export function HomeRoute() {
  const { loading } = useHome();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const totalCards = 127;
  const totalPlayers = 0;
  const totalMissions = 50;
  const totalVex = 390;

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero-section">
        <div
          className="hero-bg-layer"
          style={{
            backgroundImage: `url('${LOBBY_URL}')`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
            transition: "none",
          }}
        />
        <div className="hero-bg-overlay" />
        <div className="hero-ambient-left" />
        <div className="hero-ambient-right" />
        <Particles />

        <div className="hero-content">
          <div className="hero-eyebrow">⚡ THE FORGE AWAITS ⚡</div>
          <h1 className="hero-title">VEXFORGE</h1>
          <p className="hero-subtitle">Forge · Battle · Conquer</p>
          <p className="hero-desc">
            El juego de cartas coleccionables donde forjas tu destino. 127 cartas únicas, 4 facciones, economía real, combate PvP en vivo.
          </p>
          <div className="hero-cta">
            <Link to="/cards" className="btn-primary">
              ⚔️ Explorar Cartas
            </Link>
            <Link to="/packs" className="btn-secondary">
              📦 Abrir un Pack
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat" style={{ animationDelay: "0.1s" }}>
              <div className="hero-stat-num">
                {loading ? "—" : <CountUp target={totalCards} />}
              </div>
              <div className="hero-stat-label">Cartas</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat" style={{ animationDelay: "0.2s" }}>
              <div className="hero-stat-num">4</div>
              <div className="hero-stat-label">Facciones</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat" style={{ animationDelay: "0.3s" }}>
              <div className="hero-stat-num">
                {loading ? "—" : <CountUp target={totalMissions} />}
              </div>
              <div className="hero-stat-label">Misiones</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat" style={{ animationDelay: "0.4s" }}>
              <div className="hero-stat-num">7</div>
              <div className="hero-stat-label">Tiers PvP</div>
            </div>
          </div>
        </div>

        <div className="hero-scroll">Scroll</div>
      </section>

      {/* ── LIVE STATS ── */}
      <div className="dashboard-section">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-label">Estado del juego</div>
          <h2 className="section-title">La <span>Forja</span> en vivo</h2>
          <p className="section-desc">Datos reales de la economía VEXFORGE en este momento.</p>
        </div>

        <div className="live-stats-grid">
          <div className="live-stat-card" style={{ "--card-accent": "#E8B84B" } as React.CSSProperties}>
            <span className="live-stat-icon">💰</span>
            <div className="live-stat-value">
              {loading ? "—" : <CountUp target={totalVex} />}
            </div>
            <div className="live-stat-label">VEX en circulación</div>
            <div className="live-stat-sub">ingame + tradeable</div>
          </div>
          <div className="live-stat-card" style={{ "--card-accent": "#5B8BF5" } as React.CSSProperties}>
            <span className="live-stat-icon">🃏</span>
            <div className="live-stat-value">
              {loading ? "—" : <CountUp target={totalCards} />}
            </div>
            <div className="live-stat-label">Cartas canónicas</div>
            <div className="live-stat-sub">Common → Mythic</div>
          </div>
          <div className="live-stat-card" style={{ "--card-accent": "#3DC96B" } as React.CSSProperties}>
            <span className="live-stat-icon">👥</span>
            <div className="live-stat-value">
              {loading ? "—" : <CountUp target={totalPlayers} />}
            </div>
            <div className="live-stat-label">Forjadores activos</div>
            <div className="live-stat-sub">jugadores registrados</div>
          </div>
          <div className="live-stat-card" style={{ "--card-accent": "#A855F7" } as React.CSSProperties}>
            <span className="live-stat-icon">⚔️</span>
            <div className="live-stat-value">7</div>
            <div className="live-stat-label">Regiones del mundo</div>
            <div className="live-stat-sub">Iron Veins → Shadow Fracture</div>
          </div>
        </div>

        {/* Features */}
        <div style={{ textAlign: "center", marginBottom: 40, marginTop: 80 }}>
          <div className="section-label">Sistemas del juego</div>
          <h2 className="section-title">Todo lo que te <span>espera</span></h2>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              to={f.href}
              className="feature-card"
              style={{ "--feature-color": f.color } as React.CSSProperties}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: "2px",
                  background: `linear-gradient(90deg, transparent, ${f.color}80, transparent)`,
                }}
              />
              <div className="feature-card-icon">{f.icon}</div>
              <div className="feature-card-title">{f.title}</div>
              <div className="feature-card-desc">{f.desc}</div>
              <div className="feature-card-arrow">→</div>
            </Link>
          ))}
        </div>

        {/* CTA bottom */}
        <div style={{
          textAlign: "center",
          marginTop: 80,
          padding: "60px 24px",
          background: "linear-gradient(135deg, rgba(201,144,31,0.06), rgba(123,79,212,0.06))",
          borderRadius: 24,
          border: "1px solid rgba(201,144,31,0.15)",
        }}>
          <div className="section-label" style={{ justifyContent: "center" }}>¿Listo para forjar?</div>
          <h2 className="section-title" style={{ fontSize: "clamp(24px,4vw,42px)", marginBottom: 16 }}>
            Entra a la <span>Forja</span> hoy
          </h2>
          <p style={{ color: "var(--fg-muted)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Regístrate gratis. Sin compras obligatorias. Comienza con cartas básicas y asciende hasta Mythic.
          </p>
          <div className="hero-cta">
            <Link to="/account" className="btn-primary">
              🔥 Comenzar gratis
            </Link>
            <Link to="/missions" className="btn-secondary">
              📜 Ver misiones
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}