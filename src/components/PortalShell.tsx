import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";
import { PRIMARY_NAV } from "../data/content";
import { SOCIAL_TARGETS, readyLink } from "../lib/assets";

export function PortalShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    if (open && window.matchMedia("(max-width: 820px)").matches) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrolled(window.scrollY > 18);
      setProgress(Math.min(100, Math.max(0, window.scrollY / max * 100)));
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [location.pathname]);
  const socialLinks = Object.entries(SOCIAL_TARGETS).flatMap(([name, value]) => {
    const url = readyLink(value); return url ? [{ name, url }] : [];
  });
  return <div className="portalRoot">
    <a className="skipLink" href="#content">Saltar al contenido</a>
    <header className={`portalHeader ${scrolled ? "portalHeader--scrolled" : ""}`}>
      <div className="portalHeader__progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress / 100})` }}/></div>
      <div className="portalHeader__inner shell">
        <BrandMark />
        <nav className="desktopNav" aria-label="Principal">
          {PRIMARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }: { isActive: boolean }) => `navLink ${isActive ? "is-active" : ""}`}>{item.label}</NavLink>)}
        </nav>
        <div className="portalHeader__actions">
          <Link className="headerDownload" to="/download">Descarga <Icon name="download" size={15}/></Link>
          <button className="menuButton" type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Cerrar menú" : "Abrir menú"}><Icon name={open ? "close" : "menu"} size={22}/></button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="mobileNav" aria-label="Navegación móvil"><div className="shell mobileNav__inner"><div className="mobileNav__crest"><BrandMark /></div>{PRIMARY_NAV.map((item, index) => <NavLink key={item.to} to={item.to} className="mobileNav__link"><span>0{index + 1}</span><b>{item.label}</b><Icon name="arrow" size={15}/></NavLink>)}<NavLink to="/download" className="mobileNav__link mobileNav__link--download"><span>+</span><b>Descarga</b><Icon name="download" size={16}/></NavLink></div></nav>}
    </header>
    <main id="content">{children}</main>
    <footer className="portalFooter">
      <div className="portalFooter__mist" aria-hidden="true"/>
      <div className="portalFooter__top shell">
        <div className="footerBrand"><BrandMark /><p>El universo de cartas de VEXFORGE.</p></div>
        <div className="footerNav">
          <div><span>EXPLORAR</span>{PRIMARY_NAV.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}<Link to="/media">Galería</Link></div>
          <div><span>AYUDA</span><Link to="/download">Descarga</Link><Link to="/support">Soporte</Link><Link to="/privacy">Privacidad</Link><Link to="/terms">Términos</Link></div>
          {socialLinks.length > 0 && <div><span>SEGUIR</span>{socialLinks.map(({ name, url }) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}</div>}
        </div>
      </div>
      <div className="portalFooter__base shell"><span>VEXFORGE</span><span>© {new Date().getFullYear()} VEXFORGE</span></div>
    </footer>
  </div>;
}
