import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { PILLARS } from "../data/content";
import { loadFeaturedCards, type PortalCard } from "../lib/cards";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { CinematicScene } from "../components/CinematicScene";
import { CardShowcase } from "../components/CardShowcase";
import { DownloadGate } from "../components/DownloadGate";
import { ForgeGlyph } from "../components/ForgeGlyph";

export function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const [cards, setCards] = useState<PortalCard[]>([]);
  useEffect(() => { let live = true; loadFeaturedCards(4).then((items) => live && setCards(items)); return () => { live = false; }; }, []);
  useEffect(() => {
    const node = heroRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--hero-x", `${((event.clientX - rect.left) / rect.width - .5) * 10}px`);
      node.style.setProperty("--hero-y", `${((event.clientY - rect.top) / rect.height - .5) * 6}px`);
    };
    const reset = () => { node.style.setProperty("--hero-x", "0px"); node.style.setProperty("--hero-y", "0px"); };
    node.addEventListener("pointermove", onMove); node.addEventListener("pointerleave", reset);
    return () => { node.removeEventListener("pointermove", onMove); node.removeEventListener("pointerleave", reset); };
  }, []);
  return <>
    <section className="homeHero" ref={heroRef}>
      <div className="homeHero__image" aria-hidden="true" />
      <div className="homeHero__veil" aria-hidden="true" />
      <div className="homeHero__sigil" aria-hidden="true"><ForgeGlyph variant="core"/></div>
      {cards[0] && <Link className="homeHero__cardLink" to="/cards" aria-label={`Ver la carta ${cards[0].name}`}>
        <div className={`homeHero__card homeHero__card--${cards[0].rarity === "Mythic" ? "mythic" : "legendary"}`}>
          <div className="homeHero__cardArt"><img src={cards[0].image_url || ""} alt="" loading="eager" decoding="async" fetchPriority="high" /></div>
          <div className="homeHero__cardFrame" aria-hidden="true" />
          <div className="homeHero__cardGlow" aria-hidden="true" />
          <div className="homeHero__cardMeta"><span>{cards[0].rarity === "Mythic" ? "MÍTICA" : "LEGENDARIA"}</span><strong>{cards[0].name}</strong></div>
        </div>
      </Link>}
      <div className="shell homeHero__inner">
        <div className="homeHero__copy">
          <Reveal>
            <span className="eyebrow eyebrow--light"><i/>EL JUEGO DE CARTAS DE VEXFORGE</span>
            <div className="homeHero__wordmark" aria-label="VEXFORGE"><span>VEX</span><em>FORGE</em></div>
            <h1>La Forja<br/><em>te espera.</em></h1>
            <p>Construye tu colección. Lee el campo. Elige cuándo avanzar.</p>
            <div className="homeHero__actions"><Link className="portalButton portalButton--gold" to="/game">Descubrir el juego <Icon name="arrow" size={17}/></Link><Link className="portalButton portalButton--outline" to="/cards">Ver cartas <Icon name="arrow" size={17}/></Link></div>
          </Reveal>
        </div>
        <div className="homeHero__monolith" aria-hidden="true">
          <div className="homeHero__monolithLine"/><span>01</span><b>NEXUS</b><small>DONDE COMIENZA EL VIAJE</small>
        </div>
      </div>
      <div className="homeHero__bottom shell"><span>COLECCIÓN · ESTRATEGIA · BATALLA</span><i/><span>SCROLL</span></div>
    </section>

    <section className="manifestoSection">
      <div className="shell manifestoGrid">
        <Reveal><SectionHeading kicker="LA IDEA" title={<>No se trata de tener más.<br/><em>Se trata de decidir mejor.</em></>} copy="VEXFORGE une colección, lectura del campo y el instante exacto de tomar una decisión." /></Reveal>
        <div className="manifestoNumbers">{PILLARS.map((item, i) => <Reveal key={item.kicker} delay={i * 70}><article className="manifestoNumber"><span>0{i + 1}</span><div><small>{item.kicker}</small><h3>{item.title}</h3><p>{item.copy}</p></div></article></Reveal>)}</div>
      </div>
    </section>

    <CinematicScene image={ASSETS.nexus} eyebrow="NEXUS" title="Un mundo que no necesita explicarse para sentirse enorme." copy="La primera mirada a VEXFORGE empieza aquí: arquitectura, distancia y una puerta hacia lo que viene." index="02" variant="nexus" to="/world" action="Entrar al mundo" align="right" />

    <section className="featuredCardsSection">
      <div className="shell">
        <div className="sectionSplit"><Reveal><SectionHeading kicker="COLECCIÓN / ALTA RAREZA" title={<>Lo más raro<br/><em>merece su vitrina.</em></>} copy="Míticas y Legendarias ocupan el primer plano de la colección." /></Reveal><Link className="inlineAction" to="/cards">Abrir archivo <Icon name="arrow" size={15}/></Link></div>
        {cards.length ? <div className="featuredCards">{cards.map((card, index) => <Reveal key={card.id} delay={index * 75}><CardShowcase card={card} featured={index === 0}/></Reveal>)}</div> : <div className="cardFallback"><div className="cardFallback__seal"><ForgeGlyph variant="core"/></div><div><span className="eyebrow"><i/>ARCHIVO</span><h3>La vitrina está esperando el catálogo.</h3><p>Las cartas de mayor rareza aparecerán aquí cuando la colección esté abierta.</p></div></div>}
      </div>
    </section>

    <section className="factionBand" id="factions">
      <div className="shell factionBand__intro"><Reveal><span className="eyebrow"><i/>CUATRO SENDAS</span><h2>Elige una identidad.<br/><em>Hazla tuya.</em></h2><Link className="inlineAction" to="/game#factions">Ver facciones <Icon name="arrow" size={15}/></Link></Reveal></div>
      <div className="factionBand__rail">{Object.entries(ASSETS.factions).map(([name, item], i) => <Link key={name} to="/game#factions" className={`factionCard factionCard--${item.tone}`}><div className="factionCard__image" style={{ "--faction-image": `url(${item.background})` } as CSSProperties}/><div className="factionCard__shade"/><img src={item.icon} alt=""/><div className="factionCard__copy"><span>0{i + 1}</span><small>FACCIONES</small><h3>{name}</h3></div><Icon name="arrow" size={16}/></Link>)}</div>
    </section>

    <CinematicScene image={ASSETS.lobby} eyebrow="BATALLA" title="La colección encuentra su sentido cuando llega el momento." copy="Antes del turno, existe el silencio. Después, solo queda la decisión." index="04" variant="battle" to="/game" action="Conocer el juego" />

    <section className="portalClose"><div className="shell portalClose__grid"><Reveal><span className="eyebrow"><i/>VEXFORGE</span><h2>Cuando se abra la puerta,<br/><em>estarás listo.</em></h2></Reveal><Reveal delay={100}><DownloadGate/></Reveal></div></section>
  </>;
}
