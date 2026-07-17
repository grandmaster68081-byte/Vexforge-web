import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { CardsRoute }    from "./routes/CardsRoute";
import { MissionsRoute } from "./routes/MissionsRoute";
import { MarketRoute }   from "./routes/MarketRoute";
import { AssetsRoute }   from "./routes/AssetsRoute";
import { AccountRoute }  from "./routes/AccountRoute";
import { ProfileRoute }  from "./routes/ProfileRoute";
import { ProgressRoute } from "./routes/ProgressRoute";
import { EconomyRoute }  from "./routes/EconomyRoute";
import { SettingsRoute } from "./routes/SettingsRoute";
import { FusionRoute }   from "./routes/FusionRoute";
import { HomeRoute }     from "./routes/HomeRoute";
import { PvpRoute }      from "./routes/PvpRoute";
import { PacksRoute }    from "./routes/PacksRoute";
import { ClansRoute }    from "./routes/ClansRoute";
import { InventoryRoute } from "./routes/InventoryRoute";

const LOGO_URL =
"https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";

const NAV_SECTIONS = [
{
  label: "Game",
  items: [
    { path: "/",         label: "Home" },
    { path: "/cards",    label: "Cards" },
    { path: "/missions", label: "Missions" },
    { path: "/market",   label: "Market" },
    { path: "/pvp",      label: "PvP" },
    { path: "/packs",    label: "Packs" },
    { path: "/clans",    label: "Clans" },
    { path: "/fusion",   label: "Fusion" },
  ],
},
{
  label: "Player",
  items: [
    { path: "/profile",   label: "Profile" },
    { path: "/progress",  label: "Progress" },
    { path: "/economy",   label: "Economy" },
    { path: "/settings",  label: "Settings" },
    { path: "/inventory", label: "Inventory" },
  ],
},
{
  label: "System",
  items: [
    { path: "/assets",  label: "Assets" },
    { path: "/account", label: "Account" },
  ],
},
];

export default function App() {
const [menuOpen, setMenuOpen] = useState(false);
const closeMenu = () => setMenuOpen(false);

return (
  <BrowserRouter>
    <div className={`app-shell${menuOpen ? " nav-open" : ""}`}>
      {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}

      <nav className="side-nav">
        <div className="brand">
          <img src={LOGO_URL} alt="VEXFORGE" className="brand-logo" />
          <span className="brand-name">VEXFORGE</span>
        </div>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="nav-section">
            <span className="nav-section-label">{section.label}</span>
            {section.items.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.path === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeMenu}
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <main className="content">
        <div className="mobile-topbar">
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <span className="mobile-brand">VEXFORGE</span>
        </div>

        <Routes>
          <Route path="/"          element={<HomeRoute />} />
          <Route path="/cards"     element={<CardsRoute />} />
          <Route path="/missions"  element={<MissionsRoute />} />
          <Route path="/market"    element={<MarketRoute />} />
          <Route path="/pvp"       element={<PvpRoute />} />
          <Route path="/packs"     element={<PacksRoute />} />
          <Route path="/clans"     element={<ClansRoute />} />
          <Route path="/assets"    element={<AssetsRoute />} />
          <Route path="/profile"   element={<ProfileRoute />} />
          <Route path="/progress"  element={<ProgressRoute />} />
          <Route path="/economy"   element={<EconomyRoute />} />
          <Route path="/settings"  element={<SettingsRoute />} />
          <Route path="/account"   element={<AccountRoute />} />
          <Route path="/inventory" element={<InventoryRoute />} />
          <Route path="/fusion"    element={<FusionRoute />} />
        </Routes>
      </main>
    </div>
  </BrowserRouter>
);
}
