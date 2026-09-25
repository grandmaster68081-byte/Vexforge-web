import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { PortalShell } from "./components/PortalShell";
import { Home } from "./pages/Home";
import { Game } from "./pages/Game";
import { Cards } from "./pages/Cards";
import { World } from "./pages/World";
import { News } from "./pages/News";
import { Media } from "./pages/Media";
import { Download } from "./pages/Download";
import { Support } from "./pages/Support";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
import "./styles/portal.css";

const meta: Record<string, { title: string; description: string }> = {
  "/": { title: "VEXFORGE — Portal oficial", description: "VEXFORGE: juego, cartas, mundo, noticias, media y descarga oficial cuando esté disponible." },
  "/game": { title: "VEXFORGE — Juego", description: "Descubre el universo y el recorrido de VEXFORGE." },
  "/cards": { title: "VEXFORGE — Cartas", description: "Explora las cartas Míticas y Legendarias de VEXFORGE." },
  "/world": { title: "VEXFORGE — Mundo", description: "Conoce regiones y atmósferas del universo VEXFORGE." },
  "/news": { title: "VEXFORGE — Noticias", description: "Anuncios oficiales de VEXFORGE." },
  "/media": { title: "VEXFORGE — Media", description: "Arte y atmósfera de VEXFORGE." },
  "/download": { title: "VEXFORGE — Descarga", description: "Canales oficiales de descarga de VEXFORGE." },
  "/download/android": { title: "VEXFORGE — Android", description: "Estado de publicación de VEXFORGE para Android." },
  "/support": { title: "VEXFORGE — Soporte", description: "Ayuda y preguntas frecuentes de VEXFORGE." },
  "/privacy": { title: "VEXFORGE — Privacidad", description: "Información de privacidad del portal oficial de VEXFORGE." },
  "/terms": { title: "VEXFORGE — Términos", description: "Condiciones de uso del portal oficial de VEXFORGE." },
};

function PageMeta() {
  const location = useLocation();
  useEffect(() => {
    const entry = meta[location.pathname] ?? { title: "VEXFORGE — Portal oficial", description: "Portal oficial de VEXFORGE." };
    document.title = entry.title;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) { description = document.createElement("meta"); description.name = "description"; document.head.appendChild(description); }
    description.content = entry.description;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `https://vexforge-web.pages.dev${location.pathname}`;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = (meta[location.pathname] && !["/privacy", "/terms", "/download/android"].includes(location.pathname)) ? "index,follow" : "noindex,nofollow";
    const hash = decodeURIComponent(location.hash.replace("#", ""));
    requestAnimationFrame(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      else window.scrollTo(0, 0);
    });
  }, [location.pathname, location.hash]);
  return null;
}

function App() {
  return <BrowserRouter><PageMeta/><PortalShell><Routes>
    <Route path="/" element={<Home/>}/><Route path="/game" element={<Game/>}/><Route path="/cards" element={<Cards/>}/><Route path="/world" element={<World/>}/><Route path="/news" element={<News/>}/><Route path="/media" element={<Media/>}/><Route path="/download" element={<Download/>}/><Route path="/download/android" element={<Download/>}/><Route path="/support" element={<Support/>}/><Route path="/privacy" element={<Legal kind="privacy"/>}/><Route path="/terms" element={<Legal kind="terms"/>}/><Route path="*" element={<NotFound/>}/>
  </Routes></PortalShell></BrowserRouter>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><App/></StrictMode>);
