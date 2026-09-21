import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { NAV_ITEMS } from "../data/content";

export function PortalShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="portal">
      <header className="portalHeader">
        <div className="shell portalHeader__inner">
          <BrandMark compact />
          <nav className="desktopNav" aria-label="Navegación principal">
            <NavLink to="/game" className="navLink">Juego</NavLink>
            <NavLink to="/cards" className="navLink">Cartas</NavLink>
            <NavLink to="/world" className="navLink">Mundo</NavLink>
            <NavLink to="/news" className="navLink">Noticias</NavLink>
            <NavLink to="/media" className="navLink">Media</NavLink>
          </nav>
          <div className="portalHeader__actions">
            <Link className="headerDownload" to="/download">Descargar</Link>
            <button className="menuButton" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
              <span /> <span /> <span />
            </button>
          </div>
        </div>
        {open && (
          <div className="mobileNavPanel">
            <div className="shell mobileNavPanel__inner">
              {NAV_ITEMS.map(item => <NavLink key={item.to} to={item.to} className="mobileNavLink">{item.label}</NavLink>)}
              <Link to="/download" className="mobileNavLink mobileNavLink--download">Descargar VEXFORGE</Link>
              <Link to="/support" className="mobileNavLink">Soporte</Link>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="portalFooter">
        <div className="shell portalFooter__grid">
          <div>
            <BrandMark compact />
            <p className="footerNote">Portal oficial de VEXFORGE. El juego activo se desarrolla para Android en Unity.</p>
          </div>
          <div className="footerLinks">
            <Link to="/game">Juego</Link>
            <Link to="/cards">Cartas</Link>
            <Link to="/world">Mundo</Link>
            <Link to="/news">Noticias</Link>
            <Link to="/media">Media</Link>
            <Link to="/download">Descarga</Link>
            <Link to="/support">Soporte</Link>
            <Link to="/privacy">Privacidad</Link>
            <Link to="/terms">Términos</Link>
          </div>
        </div>
        <div className="shell footerBase"><span>VEXFORGE</span><span>© {new Date().getFullYear()}</span></div>
      </footer>
    </div>
  );
}
