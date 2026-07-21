import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import { ErrorBoundary }  from "./shared/components/ErrorBoundary";
import { PageLoader }     from "./shared/components/PageLoader";
import { ToastProvider }  from "./shared/context/ToastContext";
import { TutorialOverlay }    from "./shared/components/TutorialOverlay";
import { NotificationBell }   from "./shared/components/NotificationBell";
import { LevelUpModal }        from "./shared/components/LevelUpModal";

// ─── Lazy routes ─────────────────────────────────────────────────────────────
const HomeRoute         = lazy(() => import("./routes/HomeRoute").then(m => ({ default: m.HomeRoute })));
const AccountRoute      = lazy(() => import("./routes/AccountRoute").then(m => ({ default: m.AccountRoute })));
const CardsRoute        = lazy(() => import("./routes/CardsRoute").then(m => ({ default: m.CardsRoute })));
const MissionsRoute     = lazy(() => import("./routes/MissionsRoute").then(m => ({ default: m.MissionsRoute })));
const MarketRoute       = lazy(() => import("./routes/MarketRoute").then(m => ({ default: m.MarketRoute })));
const AssetsRoute       = lazy(() => import("./routes/AssetsRoute").then(m => ({ default: m.AssetsRoute })));
const ProfileRoute      = lazy(() => import("./routes/ProfileRoute").then(m => ({ default: m.ProfileRoute })));
const ProgressRoute     = lazy(() => import("./routes/ProgressRoute").then(m => ({ default: m.ProgressRoute })));
const EconomyRoute      = lazy(() => import("./routes/EconomyRoute").then(m => ({ default: m.EconomyRoute })));
const SettingsRoute     = lazy(() => import("./routes/SettingsRoute").then(m => ({ default: m.SettingsRoute })));
const FusionRoute       = lazy(() => import("./routes/FusionRoute").then(m => ({ default: m.FusionRoute })));
const PvpRoute          = lazy(() => import("./routes/PvpRoute").then(m => ({ default: m.PvpRoute })));
const PacksRoute        = lazy(() => import("./routes/PacksRoute").then(m => ({ default: m.PacksRoute })));
const ClansRoute        = lazy(() => import("./routes/ClansRoute").then(m => ({ default: m.ClansRoute })));
const InventoryRoute    = lazy(() => import("./routes/InventoryRoute").then(m => ({ default: m.InventoryRoute })));
const DeckBuilderRoute  = lazy(() => import("./routes/DeckBuilderRoute").then(m => ({ default: m.DeckBuilderRoute })));
const WorldBossesRoute  = lazy(() => import("./routes/WorldBossesRoute").then(m => ({ default: m.WorldBossesRoute })));
const QuestsRoute       = lazy(() => import("./routes/QuestsRoute").then(m => ({ default: m.QuestsRoute })));
const AchievementsRoute = lazy(() => import("./routes/AchievementsRoute").then(m => ({ default: m.AchievementsRoute })));
const SeasonPassRoute   = lazy(() => import("./routes/SeasonPassRoute").then(m => ({ default: m.SeasonPassRoute })));
const CosmeticsRoute    = lazy(() => import("./routes/CosmeticsRoute").then(m => ({ default: m.CosmeticsRoute })));
const LeaderboardRoute  = lazy(() => import("./routes/LeaderboardRoute").then(m => ({ default: m.LeaderboardRoute })));
const EvolutionRoute    = lazy(() => import("./routes/EvolutionRoute").then(m => ({ default: m.EvolutionRoute })));
const FriendsRoute      = lazy(() => import("./routes/FriendsRoute").then(m => ({ default: m.FriendsRoute })));
const DepositRoute      = lazy(() => import("./routes/DepositRoute").then(m => ({ default: m.DepositRoute })));
const AdminDepositsRoute  = lazy(() => import("./routes/AdminDepositsRoute").then(m => ({ default: m.AdminDepositsRoute })));
const AdminDashboardRoute = lazy(() => import("./routes/AdminDashboardRoute").then(m => ({ default: m.AdminDashboardRoute })));
const NotFoundRoute     = lazy(() => import("./routes/NotFoundRoute").then(m => ({ default: m.NotFoundRoute })));
const RaidsRoute        = lazy(() => import("./routes/RaidsRoute").then(m => ({ default: m.RaidsRoute })));
const SeasonRankingsRoute = lazy(() => import("./routes/SeasonRankingsRoute").then(m => ({ default: m.SeasonRankingsRoute })));

// ─── Constants ───────────────────────────────────────────────────────────────
const LOGO_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";
const SIDEBAR_W = 220;

// ─── Sidebar groups — full navigation for all 28 routes ──────────────────────
const SIDEBAR_GROUPS: Array<{
  label: string;
  icon: string;
  links: Array<{ to: string; icon: string; label: string; end?: boolean }>;
}> = [
  {
    label: "Principal", icon: "🏠",
    links: [
      { to: "/",          icon: "🏠", label: "Inicio",         end: true  },
      { to: "/cards",     icon: "🃏", label: "Cartas"                     },
      { to: "/inventory", icon: "📦", label: "Mi Colección"               },
      { to: "/missions",  icon: "📋", label: "Misiones"                   },
      { to: "/quests",    icon: "📜", label: "Quests Diarias"             },
    ],
  },
  {
    label: "Batalla", icon: "⚔️",
    links: [
      { to: "/pvp",          icon: "🏆", label: "PvP Arena"        },
      { to: "/deck-builder", icon: "🗡️", label: "Constructor Mazo" },
      { to: "/bosses",       icon: "🐉", label: "Jefes Mundiales"  },
      { to: "/season-pass",  icon: "🌟", label: "Temporada"        },
    ],
  },
  {
    label: "Economía", icon: "💰",
    links: [
      { to: "/packs",    icon: "📦", label: "Packs"     },
      { to: "/market",   icon: "🏪", label: "Mercado"   },
      { to: "/fusion",   icon: "🔮", label: "Fusión"    },
      { to: "/evolution",icon: "✨", label: "Evolución"  },
      { to: "/deposit",  icon: "📥", label: "Depósito"  },
    ],
  },
  {
    label: "Social", icon: "🤝",
    links: [
      { to: "/clans",       icon: "🛡️", label: "Clanes"        },
      { to: "/friends",     icon: "🤝", label: "Amigos"        },
      { to: "/leaderboard", icon: "📊", label: "Ranking"       },
      { to: "/achievements",icon: "🏅", label: "Logros"        },
    ],
  },
  {
    label: "Mi Cuenta", icon: "👤",
    links: [
      { to: "/profile",   icon: "👤", label: "Perfil"     },
      { to: "/economy",   icon: "💰", label: "Economía"   },
      { to: "/progress",  icon: "📈", label: "Progreso"   },
      { to: "/cosmetics", icon: "💎", label: "Cosméticos" },
      { to: "/settings",  icon: "⚙️", label: "Ajustes"    },
    ],
  },
];

// Mobile bottom nav (4 primary + "Más")
const BOTTOM_ITEMS = [
  { to: "/",         icon: "🏠", label: "Inicio",    end: true  },
  { to: "/inventory",icon: "🃏", label: "Colección", end: false },
  { to: "/missions", icon: "📋", label: "Misiones",  end: false },
  { to: "/profile",  icon: "👤", label: "Perfil",    end: false },
];

const ROUTE_LABELS: Record<string, string> = {
  cards: "Cartas", missions: "Misiones", market: "Mercado", pvp: "PvP",
  packs: "Packs", clans: "Clanes", friends: "Amigos", fusion: "Fusión",
  "deck-builder": "Constructor de Mazo", bosses: "Jefes Mundiales",
  quests: "Quests Diarias", achievements: "Logros", "season-pass": "Temporada",
  cosmetics: "Cosméticos", leaderboard: "Ranking", evolution: "Evolución",
  inventory: "Mi Colección", profile: "Perfil", progress: "Progreso",
  economy: "Economía", settings: "Ajustes", assets: "Recursos",
  deposit: "Depósito", admin: "Admin", deposits: "Depósitos",
  account: "Cuenta",
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 1) return null;
  return (
    <div className="forge-breadcrumb">
      <Link to="/" className="forge-breadcrumb-home">🏠</Link>
      {segments.map((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const label = ROUTE_LABELS[seg] ?? seg;
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="forge-breadcrumb-seg">
            <span className="forge-breadcrumb-sep">›</span>
            {isLast ? (
              <span className="forge-breadcrumb-current">{label}</span>
            ) : (
              <Link to={path} className="forge-breadcrumb-link">{label}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar() {
  const { pathname } = useLocation();
  return (
    <aside
      className="forge-sidebar"
      style={{
        position: "fixed",
        top: 62,
        left: 0,
        bottom: 0,
        width: SIDEBAR_W,
        overflowY: "auto",
        overflowX: "hidden",
        background: "linear-gradient(180deg,#0D0D1A 0%,#05050D 100%)",
        borderRight: "1px solid rgba(201,144,31,0.12)",
        zIndex: 100,
        paddingBottom: 32,
        display: "none",
      }}
    >
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 4 }}>
          {/* Group label */}
          <div
            style={{
              padding: "12px 16px 4px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "rgba(201,144,31,0.55)",
              fontFamily: "'Rajdhani', sans-serif",
              textTransform: "uppercase",
            }}
          >
            {group.icon} {group.label}
          </div>
          {/* Links */}
          {group.links.map((item) => {
            const isActive = item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 16px 7px 20px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#F0C050" : "#8891A0",
                  background: isActive
                    ? "linear-gradient(90deg,rgba(201,144,31,0.15) 0%,transparent 100%)"
                    : "transparent",
                  borderLeft: isActive ? "2px solid #C9901F" : "2px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  borderRadius: "0 6px 6px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

// ─── ForgeHeader ─────────────────────────────────────────────────────────────
function ForgeHeader({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropOpen, setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserEmail(s?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!dropOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [dropOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDropOpen(false);
  }

  return (
    <header className="forge-header">
      <div className="forge-header-inner">
        {/* Logo */}
        <Link to="/" className="forge-logo-link">
          <img src={LOGO_URL} alt="VEXFORGE" className="forge-logo-img" />
          <span className="forge-logo-text">VEXFORGE</span>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Quick links — desktop only */}
        <nav className="forge-nav-desktop" style={{ gap: 4 }}>
          {[
            { to: "/cards",   label: "Cartas",   end: false },
            { to: "/pvp",     label: "PvP",      end: false },
            { to: "/market",  label: "Mercado",  end: false },
            { to: "/packs",   label: "Packs",    end: false },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                "forge-nav-link" + (isActive ? " forge-nav-active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User area */}
        {userEmail ? (
          <div className="forge-user-menu" ref={dropRef}>
            <button
              className="forge-user-btn"
              onClick={() => setDropOpen(o => !o)}
            >
              <span>👤</span>
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userEmail.split("@")[0]}
              </span>
              <span style={{ opacity: 0.5 }}>{dropOpen ? "▲" : "▼"}</span>
            </button>
            {dropOpen && (
              <div className="forge-dropdown">
                <Link to="/profile"  onClick={() => setDropOpen(false)}>👤 Perfil</Link>
                <Link to="/economy"  onClick={() => setDropOpen(false)}>💰 Economía</Link>
                <Link to="/progress" onClick={() => setDropOpen(false)}>📈 Progreso</Link>
                <Link to="/deposit"  onClick={() => setDropOpen(false)}>📥 Depósito</Link>
                <Link to="/settings" onClick={() => setDropOpen(false)}>⚙️ Ajustes</Link>
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                <button onClick={handleSignOut} style={{ color: "#e3573f" }}>🚪 Cerrar sesión</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/account" className="forge-signin-btn">Entrar</Link>
        )}

        {/* Hamburger — mobile only */}
        <button
          className="forge-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <span style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </div>
    </header>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  return (
    <nav className="forge-bottom-nav">
      {BOTTOM_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            "forge-bottom-item" + (isActive ? " forge-bottom-active" : "")
          }
        >
          <span className="forge-bottom-icon">{item.icon}</span>
          <span className="forge-bottom-label">{item.label}</span>
        </NavLink>
      ))}
      <button className="forge-bottom-item" onClick={onMoreClick}>
        <span className="forge-bottom-icon">☰</span>
        <span className="forge-bottom-label">Más</span>
      </button>
    </nav>
  );
}

// ─── MobileSheet ─────────────────────────────────────────────────────────────
function MobileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div className="forge-mobile-backdrop" onClick={onClose} />
      <div className="forge-mobile-sheet">
        <div className="forge-mobile-sheet-label">Explorar VEXFORGE</div>
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="forge-sheet-divider" />
            <div style={{
              padding: "6px 16px 2px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "rgba(201,144,31,0.55)",
              textTransform: "uppercase",
            }}>
              {group.icon} {group.label}
            </div>
            {group.links.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="forge-nav-link forge-sheet-link"
              >
                <span style={{ marginRight: 10 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="forge-sheet-divider" style={{ marginTop: 8 }} />
        <Link to="/account" onClick={onClose} className="forge-nav-link forge-sheet-link">
          <span style={{ marginRight: 10 }}>🔑</span>
          Cuenta
        </Link>
        <Link to="/assets" onClick={onClose} className="forge-nav-link forge-sheet-link">
          <span style={{ marginRight: 10 }}>🎨</span>
          Recursos
        </Link>
        <Link to="/admin" onClick={onClose} className="forge-nav-link forge-sheet-link" style={{ color: "#f59e0b" }}>
          <span style={{ marginRight: 10 }}>🛠️</span>
          Admin
        </Link>
      </div>
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <ToastProvider>
      <ErrorBoundary>
        <ForgeHeader mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div style={{ display: "flex", paddingTop: 62 }}>
          {/* Desktop sidebar — shown via CSS class .forge-sidebar { display: block } at md+ */}
          <DesktopSidebar />
          {/* Main content */}
          <div className="forge-content forge-content-with-sidebar" style={{ flex: 1, minWidth: 0 }}>
            <Breadcrumb />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"               element={<HomeRoute />} />
                <Route path="/account"        element={<AccountRoute />} />
                <Route path="/cards"          element={<CardsRoute />} />
                <Route path="/missions"       element={<MissionsRoute />} />
                <Route path="/market"         element={<MarketRoute />} />
                <Route path="/pvp"            element={<PvpRoute />} />
                <Route path="/packs"          element={<PacksRoute />} />
                <Route path="/clans"          element={<ClansRoute />} />
                <Route path="/friends"        element={<FriendsRoute />} />
                <Route path="/fusion"         element={<FusionRoute />} />
                <Route path="/deck-builder"   element={<DeckBuilderRoute />} />
                <Route path="/bosses"         element={<WorldBossesRoute />} />
                <Route path="/quests"         element={<QuestsRoute />} />
                <Route path="/achievements"   element={<AchievementsRoute />} />
                <Route path="/season-pass"    element={<SeasonPassRoute />} />
                <Route path="/cosmetics"      element={<CosmeticsRoute />} />
                <Route path="/leaderboard"    element={<LeaderboardRoute />} />
                <Route path="/evolution"      element={<EvolutionRoute />} />
                <Route path="/inventory"      element={<InventoryRoute />} />
                <Route path="/profile"        element={<ProfileRoute />} />
                <Route path="/progress"       element={<ProgressRoute />} />
                <Route path="/economy"        element={<EconomyRoute />} />
                <Route path="/settings"       element={<SettingsRoute />} />
                <Route path="/assets"         element={<AssetsRoute />} />
                <Route path="/deposit"        element={<DepositRoute />} />
                <Route path="/admin"          element={<AdminDashboardRoute />} />
                <Route path="/admin/deposits" element={<AdminDepositsRoute />} />
                <Route path="/raids"          element={<RaidsRoute />} />
                <Route path="/season-rankings" element={<SeasonRankingsRoute />} />
                <Route path="*"              element={<NotFoundRoute />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        <BottomNav onMoreClick={() => setMobileOpen(o => !o)} />
        <MobileSheet open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <TutorialOverlay />
        <LevelUpModal />
      </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}
