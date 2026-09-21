import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ASSETS, DOWNLOAD_TARGETS, readyLink } from "../lib/assets";
import { loadFeaturedCards, PortalCard } from "../lib/cards";
import { FeaturedCard } from "../components/FeaturedCard";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { DownloadButton } from "../components/DownloadButton";
import { NAV_ITEMS } from "../data/content";

const factionEntries = Object.entries(ASSETS.factions);

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<PortalCard[]>([]);

  useEffect(() => {
    let live = true;
    loadFeaturedCards().then(data => { if (live) setCards(data); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onPointer = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--hero-x", `${x * 12}px`);
      node.style.setProperty("--hero-y", `${y * 8}px`);
    };
    node.addEventListener("pointermove", onPointer);
    return () => node.removeEventListener("pointermove", onPointer);
  }, []);

  return (
    <div>
      <section className="hero" ref={heroRef}>
        <div className="hero__media" />
        <div className="hero__vignette" />
        <div className="shell hero__content">
          <div className="hero__copy">
            <div className="kicker">TRADING CARD GAME · ANDROID</div>
            <h1>VEXFORGE</h1>
            <p className="hero__lead">Cartas, decisiones y territorio. Construye tu mazo y entra en un mundo donde cada partida se forja en el momento.</p>
            <div className="hero__actions">
              <Link to="/download" className="button button--primary">Descargar</Link>
              <Link to="/game" className="button button--quiet">Descubrir el juego</Link>
            </div>
            <div className="hero__microcopy">Android · próxima disponibilidad oficial</div>
          </div>
          <div className="hero__sigil" aria-hidden="true">
            <span>V</span><i>FORGE</i>
          </div>
        </div>
        <div className="hero__edge"><span /> <b>NEXUS / 01</b></div>
      </section>

      <section className="quickNav">
        <div className="shell quickNav__inner">
          {NAV_ITEMS.map((item, index) => (
            <Link to={item.to} key={item.to} className="quickNav__item"><span>0{index + 1}</span>{item.label}<b>↗</b></Link>
          ))}
        </div>
      </section>

      <section className="section section--intro">
        <div className="shell splitIntro">
          <Reveal>
            <SectionHeading kicker="EL PUNTO DE PARTIDA" title="Un portal. Un juego. Una sola identidad." copy="La web ya no intenta ser el juego. Es la puerta de entrada oficial: presenta VEXFORGE, conserva su catálogo público y lleva al jugador directamente hacia Android." />
          </Reveal>
          <Reveal className="statementPanel">
            <div className="statementPanel__line" />
            <span>VEXFORGE / CANON</span>
            <strong>UNITY<br />ANDROID</strong>
            <p>El runtime activo vive en Unity. Supabase permanece como autoridad del backend.</p>
          </Reveal>
        </div>
      </section>

      <section className="scene scene--nexus">
        <div className="scene__media" style={{ backgroundImage: `url(${ASSETS.nexusAtmosphere})` }} />
        <div className="scene__veil" />
        <div className="shell scene__content">
          <Reveal>
            <div className="sceneTag">MICROSCENE / NEXUS</div>
            <h2>La entrada al mundo.</h2>
            <p>Un espacio central desde el que las distintas áreas de VEXFORGE toman forma.</p>
            <Link to="/world" className="textLink">Explorar el mundo <span>→</span></Link>
          </Reveal>
        </div>
      </section>

      <section className="section section--cards">
        <div className="shell">
          <Reveal>
            <SectionHeading kicker="ARCHIVO DE COLECCIÓN" title="Las cartas que llevan la colección al límite." copy="La vitrina pública prioriza las rarezas más altas: Míticas y Legendarias. El arte se consume desde la fuente oficial de VEXFORGE." />
          </Reveal>
          <div className="featuredCardsGrid">
            {cards.slice(0, 4).map(card => <FeaturedCard key={card.id} card={card} />)}
          </div>
          {cards.length === 0 && (
            <div className="catalogFallback">
              <span>CATÁLOGO EN SINCRONIZACIÓN</span>
              <strong>La galería de alta rareza se mostrará aquí con el arte oficial cuando el catálogo público esté disponible.</strong>
            </div>
          )}
          <div className="sectionCta"><Link to="/cards" className="textLink">Ver archivo de cartas <span>→</span></Link></div>
        </div>
      </section>

      <section className="section section--factions">
        <div className="shell">
          <Reveal>
            <SectionHeading kicker="CUATRO CAMINOS" title="Elige una forma de entrar en la Forja." copy="Las cuatro facciones que ya forman parte de la identidad del catálogo actual." />
          </Reveal>
          <div className="factionRail">
            {factionEntries.map(([name, item], index) => (
              <Link key={name} to="/game#factions" className="factionCard" style={{ "--tone": item.tone, "--bg": `url(${item.background})` } as CSSProperties}>
                <div className="factionCard__index">0{index + 1}</div>
                <img src={item.icon} alt="" className="factionCard__icon" />
                <div className="factionCard__copy"><span>FACCION</span><strong>{name}</strong><p>{item.discipline}</p></div>
                <div className="factionCard__arrow">↗</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--media">
        <div className="shell mediaFeature">
          <Reveal className="mediaFeature__frame">
            <div className="mediaFeature__image" style={{ backgroundImage: `url(${ASSETS.cover})` }} />
            <div className="mediaFeature__overlay" />
            <div className="mediaFeature__label"><span>MEDIA / 01</span><strong>VEXFORGE</strong></div>
          </Reveal>
          <Reveal className="mediaFeature__copy">
            <SectionHeading kicker="IDENTIDAD VISUAL" title="Un universo que se reconoce antes de explicarse." copy="Arte oficial, facciones y superficies del catálogo público conviven en una dirección visual oscura, limpia y deliberada." />
            <Link to="/media" className="textLink">Abrir media <span>→</span></Link>
          </Reveal>
        </div>
      </section>

      <section className="downloadBand">
        <div className="shell downloadBand__inner">
          <div><span className="kicker">ANDROID / PRÓXIMAMENTE</span><h2>La Forja todavía se está preparando.</h2><p>Las rutas oficiales de descarga ya están preparadas. Se activarán cuando VEXFORGE tenga una distribución pública confirmada.</p></div>
          <div className="downloadBand__actions">
            <DownloadButton href={readyLink(DOWNLOAD_TARGETS.googlePlay)}>Google Play</DownloadButton>
            <DownloadButton href={readyLink(DOWNLOAD_TARGETS.directAndroid)} secondary>Descarga directa</DownloadButton>
          </div>
        </div>
      </section>
    </div>
  );
}
