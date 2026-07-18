import { useState, useEffect, useRef } from "react";
    import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
    import { supabase }        from "./lib/supabase";
    import { CardsRoute }      from "./routes/CardsRoute";
    import { MissionsRoute }   from "./routes/MissionsRoute";
    import { MarketRoute }     from "./routes/MarketRoute";
    import { AssetsRoute }     from "./routes/AssetsRoute";
    import { AccountRoute }    from "./routes/AccountRoute";
    import { ProfileRoute }    from "./routes/ProfileRoute";
    import { ProgressRoute }   from "./routes/ProgressRoute";
    import { EconomyRoute }    from "./routes/EconomyRoute";
    import { SettingsRoute }   from "./routes/SettingsRoute";
    import { FusionRoute }     from "./routes/FusionRoute";
    import { HomeRoute }       from "./routes/HomeRoute";
    import { PvpRoute }        from "./routes/PvpRoute";
    import { PacksRoute }      from "./routes/PacksRoute";
    import { ClansRoute }      from "./routes/ClansRoute";
    import { InventoryRoute }  from "./routes/InventoryRoute";
    import { NotFoundRoute }   from "./routes/NotFoundRoute";

    const LOGO_URL =
    "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";

    const PRIMARY_NAV = [
    { path: "/cards",    label: "Cards"    },
    { path: "/missions", label: "Missions" },
    { path: "/market",   label: "Market"   },
    { path: "/pvp",      label: "PvP"      },
    { path: "/packs",    label: "Packs"    },
    { path: "/clans",    label: "Clans"    },
    { path: "/fusion",   label: "Fusion"   },
    ];

    function ForgeHeader() {
    const [user, setUser]           = useState<{ email?: string } | null>(null);
    const [open, setOpen]           = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      supabase.auth.getSession().then(({ data }) =>
        setUser(data.session?.user ?? null)
      );
      const { data: sub } = supabase.auth.onAuthStateChange((_, session) =>
        setUser(session?.user ?? null)
      );
      return () => sub.subscription.unsubscribe();
    }, []);

    // Close avatar dropdown on outside click
    useEffect(() => {
      if (!dropdownOpen) return;
      const handler = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [dropdownOpen]);

    const close   = () => setOpen(false);
    const closeDD = () => setDropdownOpen(false);

    return (
      <header className="forge-header">
        <div className="forge-header-inner">
          {/* Brand */}
          <Link to="/" className="forge-brand" onClick={close}>
            <img src={LOGO_URL} alt="VEXFORGE" className="forge-brand-logo" />
            <span className="forge-brand-name">VEXFORGE</span>
          </Link>

          {/* Desktop nav */}
          <nav className="forge-nav">
            {PRIMARY_NAV.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                className={({ isActive }) =>
                  "forge-nav-link" + (isActive ? " active" : "")
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth actions */}
          <div className="forge-header-actions">
            {user ? (
              <div className="forge-avatar-wrap" ref={dropdownRef}>
                <button
                  className="forge-avatar"
                  onClick={() => setDropdownOpen((v) => !v)}
                  title="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  {(user.email ?? "?")[0].toUpperCase()}
                </button>
                {dropdownOpen && (
                  <div className="forge-avatar-dropdown">
                    <NavLink to="/profile"   className="forge-avatar-item" onClick={closeDD}>Profile</NavLink>
                    <NavLink to="/progress"  className="forge-avatar-item" onClick={closeDD}>Progress</NavLink>
                    <NavLink to="/economy"   className="forge-avatar-item" onClick={closeDD}>Economy</NavLink>
                    <NavLink to="/inventory" className="forge-avatar-item" onClick={closeDD}>Inventory</NavLink>
                    <NavLink to="/settings"  className="forge-avatar-item" onClick={closeDD}>Settings</NavLink>
                    <hr className="forge-avatar-divider" />
                    <NavLink to="/account"   className="forge-avatar-item forge-avatar-item--account" onClick={closeDD}>Account</NavLink>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/account" className="forge-btn-primary">
                Sign In
              </Link>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="forge-hamburger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <nav className="forge-mobile-nav">
            {PRIMARY_NAV.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                className="forge-mobile-nav-link"
                onClick={close}
              >
                {l.label}
              </NavLink>
            ))}
            <hr className="forge-mobile-divider" />
            {user ? (
              <>
                <NavLink to="/profile"   className="forge-mobile-nav-link" onClick={close}>Profile</NavLink>
                <NavLink to="/progress"  className="forge-mobile-nav-link" onClick={close}>Progress</NavLink>
                <NavLink to="/economy"   className="forge-mobile-nav-link" onClick={close}>Economy</NavLink>
                <NavLink to="/inventory" className="forge-mobile-nav-link" onClick={close}>Inventory</NavLink>
                <NavLink to="/settings"  className="forge-mobile-nav-link" onClick={close}>Settings</NavLink>
                <NavLink to="/account"   className="forge-mobile-nav-link" onClick={close}>Account</NavLink>
              </>
            ) : (
              <Link
                to="/account"
                className="forge-mobile-nav-link"
                onClick={close}
                style={{ color: "var(--forge-ember)", fontWeight: 600 }}
              >
                Sign In →
              </Link>
            )}
          </nav>
        )}
      </header>
    );
    }

    export default function App() {
    return (
      <BrowserRouter>
        <div className="forge-page">
          <ForgeHeader />

          <main className="content">
            <Routes>
              <Route path="/"          element={<HomeRoute />} />
              <Route path="/cards"     element={<CardsRoute />} />
              <Route path="/missions"  element={<MissionsRoute />} />
              <Route path="/market"    element={<MarketRoute />} />
              <Route path="/pvp"       element={<PvpRoute />} />
              <Route path="/packs"     element={<PacksRoute />} />
              <Route path="/clans"     element={<ClansRoute />} />
              <Route path="/fusion"    element={<FusionRoute />} />
              <Route path="/inventory" element={<InventoryRoute />} />
              <Route path="/profile"   element={<ProfileRoute />} />
              <Route path="/progress"  element={<ProgressRoute />} />
              <Route path="/economy"   element={<EconomyRoute />} />
              <Route path="/settings"  element={<SettingsRoute />} />
              <Route path="/assets"    element={<AssetsRoute />} />
              <Route path="/account"   element={<AccountRoute />} />
              <Route path="*"          element={<NotFoundRoute />} />
            </Routes>
          </main>

          <footer className="forge-footer">
            <div className="forge-footer-inner">
              <span className="forge-footer-brand">VEXFORGE</span>
              <span>© 2026 VEXFORGE — All rights reserved</span>
              <nav className="forge-footer-links">
                <Link to="/cards">Cards</Link>
                <Link to="/market">Market</Link>
                <Link to="/pvp">PvP</Link>
                <Link to="/packs">Packs</Link>
                <Link to="/account">Account</Link>
              </nav>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    );
    }