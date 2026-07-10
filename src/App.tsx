import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { CardsRoute } from "./routes/CardsRoute";
import { MissionsRoute } from "./routes/MissionsRoute";
import { BlockedRoute } from "./routes/BlockedRoute";

const NAV = [
  { path: "/cards", label: "Cards" },
  { path: "/missions", label: "Missions" },
  { path: "/market", label: "Market" },
  { path: "/assets", label: "Assets" },
  { path: "/profile", label: "Profile" },
  { path: "/progress", label: "Progress" },
  { path: "/economy", label: "Economy" },
  { path: "/settings", label: "Settings" },
  { path: "/inventory", label: "Inventory" },
  { path: "/fusion", label: "Fusion" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="side-nav">
          <div className="brand">VEXFORGE</div>
          {NAV.map((n) => (
            <NavLink key={n.path} to={n.path} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<CardsRoute />} />
            <Route path="/cards" element={<CardsRoute />} />
            <Route path="/missions" element={<MissionsRoute />} />
            <Route
              path="/market"
              element={<BlockedRoute title="Market" status="blocked_auth" reason="Listings are readable, but browsing UI for real player-scoped actions needs auth wired first. See backend/pending/auth-and-writes.md." />}
            />
            <Route
              path="/assets"
              element={<BlockedRoute title="Assets" status="blocked_auth" reason="Real asset table verified and ready; this route just hasn't been wired to it yet in this pass. See src/domains/assets/repository.ts." />}
            />
            <Route path="/profile" element={<BlockedRoute title="Profile" status="blocked_auth" reason="Waiting on an auth provider. Backend RLS is already correctly configured." />} />
            <Route path="/progress" element={<BlockedRoute title="Progress" status="blocked_auth" reason="Waiting on an auth provider. Backend RLS is already correctly configured." />} />
            <Route path="/economy" element={<BlockedRoute title="Economy" status="blocked_auth" reason="Waiting on an auth provider. Backend RLS is already correctly configured." />} />
            <Route path="/settings" element={<BlockedRoute title="Settings" status="blocked_auth" reason="Table confirmed to exist. Waiting on an auth provider." />} />
            <Route path="/inventory" element={<BlockedRoute title="Inventory" status="blocked_no_path" reason="No public or authenticated RLS policy exists yet. This needs a backend decision, not a frontend fix." />} />
            <Route path="/fusion" element={<BlockedRoute title="Fusion" status="blocked_no_path" reason="No public or authenticated RLS policy exists yet. This needs a backend decision, not a frontend fix." />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
