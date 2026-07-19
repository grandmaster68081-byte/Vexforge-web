import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { supabase }            from "./lib/supabase";
import { CardsRoute }          from "./routes/CardsRoute";
import { MissionsRoute }       from "./routes/MissionsRoute";
import { MarketRoute }         from "./routes/MarketRoute";
import { AssetsRoute }         from "./routes/AssetsRoute";
import { AccountRoute }        from "./routes/AccountRoute";
import { ProfileRoute }        from "./routes/ProfileRoute";
import { ProgressRoute }       from "./routes/ProgressRoute";
import { EconomyRoute }        from "./routes/EconomyRoute";
import { SettingsRoute }       from "./routes/SettingsRoute";
import { FusionRoute }         from "./routes/FusionRoute";
import { HomeRoute }           from "./routes/HomeRoute";
import { PvpRoute }            from "./routes/PvpRoute";
import { PacksRoute }          from "./routes/PacksRoute";
import { ClansRoute }          from "./routes/ClansRoute";
import { InventoryRoute }      from "./routes/InventoryRoute";
import { DeckBuilderRoute }    from "./routes/DeckBuilderRoute";
import { WorldBossesRoute }    from "./routes/WorldBossesRoute";
import { QuestsRoute }         from "./routes/QuestsRoute";
import { AchievementsRoute }   from "./routes/AchievementsRoute";
import { SeasonPassRoute }     from "./routes/SeasonPassRoute";
import { CosmeticsRoute }      from "./routes/CosmeticsRoute";
import { LeaderboardRoute }    from "./routes/LeaderboardRoute";
import { EvolutionRoute }      from "./routes/EvolutionRoute";
import { FriendsRoute }        from "./routes/FriendsRoute";
import { NotFoundRoute }       from "./routes/NotFoundRoute";

const LOGO_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";

const PRIMARY_NAV = [
  { path: "/cards",        label: "Cartas",    icon: "🃏" },
  { path: "/missions",     label: "Misiones",  icon: "📜" },
  { path: "/market",       label: "Mercado",   icon: "🏪" },
  { path: "/pvp",          label: "PvP",       icon: "⚔️" },
  { path: "/packs",        label: "Packs",     icon: "📦" },
  { path: "/clans",        label: "Clanes",    icon: "🏰" },
  { path: "/fusion",       label: "Fusión",    icon: "⚗️" },
  { path: "/deck-builder", label: "Deck",      icon: "🗂️" },
  { path: "/bosses",       label: "Bosses",    icon: "🐉" },
  { path: "/leaderboard",  label: "Ranks",     icon: "🏆" },
];

const MORE_NAV = [
  { path: "/friends",       label: "Amigos",    icon: "👥" },
  { path: "/quests",        label: "Quests",    icon: "🎯" },
  { path: "/achievements",  label: "Logros",    icon: "🏅" },
  { path: "/season-pass",   label: "Season",    icon: "💜" },
  { path: "/cosmetics",     label: "Cosméticos", icon: "✨" },
  { path: "/evolution",     label: "Evolución", icon: "🌟" },
  { path: "/inventory",     label: "Inventario", icon: "🎒" },
];

function ForgeHeader() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="forge-header">
      <div className="forge-header-inner">
        {/* Logo */}
        <Link to="/" className="forge-logo-link" onClick={() => setMobileOpen(false)}>
          <img src={LOGO_URL} alt="VEXFORGE" className="forge-logo-img" />
          <span className="forge-logo-text">VEXFORGE</span>
        </Link>

        {/* Desktop nav */}
        <nav className="forge-nav-desktop">
          {PRIMARY_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => "forge-nav-link" + (isActive ? " forge-nav-active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        {user ? (
          <div className="forge-user-menu" ref={dropdownRef}>
            <button className="forge-user-btn" onClick={() => setDropdownOpen(o => !o)}>
              <div className="forge-user-avatar">
                {user.email?.substring(0, 1).toUpperCase() ?? "F"}
              </div>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email?.split("@")[0] ?? "Forjador"}
              </span>
              <span style={{ opacity: 0.5, fontSize: 10 }}>{dropdownOpen ? "▲" : "▼"}</span>
            </button>
            {dropdownOpen && (
              <div className="forge-dropdown">
                <Link to="/profile" onClick={() => setDropdownOpen(false)}>👤 Perfil</Link>
                <Link to="/inventory" onClick={() => setDropdownOpen(false)}>🎒 Inventario</Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>⚙️ Ajustes</Link>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                {MORE_NAV.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setDropdownOpen(false)}>
                    {item.icon} {item.label}
                  </Link>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                <button onClick={async () => { await supabase.auth.signOut(); setDropdownOpen(false); }}>
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/account" className="forge-signin-btn">
            🔥 Entrar
          </Link>
        )}

        {/* Hamburger */}
        <button
          className="forge-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menú"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="forge-nav-mobile">
          {PRIMARY_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => "forge-nav-link" + (isActive ? " forge-nav-active" : "")}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
          {MORE_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => "forge-nav-link" + (isActive ? " forge-nav-active" : "")}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ForgeHeader />
      <div className="forge-content">
        <Routes>
          <Route path="/"               element={<HomeRoute />} />
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
          <Route path="/account"        element={<AccountRoute />} />
          <Route path="*"               element={<NotFoundRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}