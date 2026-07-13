import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { CardsRoute } from "./routes/CardsRoute";
import { MissionsRoute } from "./routes/MissionsRoute";
import { MarketRoute } from "./routes/MarketRoute";
import { AssetsRoute } from "./routes/AssetsRoute";
import { AccountRoute } from "./routes/AccountRoute";
import { ProfileRoute } from "./routes/ProfileRoute";
import { ProgressRoute } from "./routes/ProgressRoute";
import { EconomyRoute } from "./routes/EconomyRoute";
import { SettingsRoute } from "./routes/SettingsRoute";
import { BlockedRoute } from "./routes/BlockedRoute";
import { FusionRoute } from "./routes/FusionRoute";
import { HomeRoute } from "./routes/HomeRoute";
import { PvpRoute } from "./routes/PvpRoute";
import { PacksRoute } from "./routes/PacksRoute";

const LOGO_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/cards", label: "Cards" },
  { path: "/missions", label: "Missions" },
  { path: "/market", label: "Market" },
  { path: "/pvp", label: "PvP" },
  { path: "/packs", label: "Packs" },
  { path: "/assets", label: "Assets" },
  { path: "/profile", label: "Profile" },
  { path: "/progress", label: "Progress" },
  { path: "/economy", label: "Economy" },
  { path: "/settings", label: "Settings" },
  { path: "/inventory", label: "Inventory" },
  { path: "/fusion", label: "Fusion" },
  { path: "/account", label: "Account" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="side-nav">
          <div className="brand">
            <img src={LOGO_URL} alt="VEXFORGE" className="brand-logo" />
            VEXFORGE
          </div>
          {NAV.map((n) => (
            <NavLink key={n.path} to={n.path} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/cards" element={<CardsRoute />} />
            <Route path="/missions" element={<MissionsRoute />} />
            <Route path="/market" element={<MarketRoute />} />
            <Route path="/pvp" element={<PvpRoute />} />
            <Route path="/packs" element={<PacksRoute />} />
            <Route path="/assets" element={<AssetsRoute />} />
            <Route path="/profile" element={<ProfileRoute />} />
            <Route path="/progress" element={<ProgressRoute />} />
            <Route path="/economy" element={<EconomyRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
            <Route path="/account" element={<AccountRoute />} />
            <Route path="/inventory" element={<BlockedRoute title="Inventory" status="blocked_no_path" reason="No public or authenticated RLS policy exists on this table, and it has no foreign key tying it to players/auth.users -- opening it up is not a safe frontend fix. The canonical, RLS-scoped inventory data already lives in the Cards domain (player_cards). See vexforge_project_decisions, chat30_inventory_not_materialized." />} />
            <Route path="/fusion" element={<FusionRoute />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
