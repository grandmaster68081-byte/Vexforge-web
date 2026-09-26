import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { loadFeaturedCards, type PortalCard } from "../lib/cards";
import { PILLARS, WORLD_REGIONS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { CardShowcase } from "../components/CardShowcase";
import { DownloadGate } from "../components/DownloadGate";
import { ForgeGlyph } from "../components/ForgeGlyph";

const discovery = [
  { kicker: "EL JUEGO", title: "Aprende. Construye. Compite.", copy: "Una experiencia de cartas donde cada decisión cambia el siguiente turno.", image: ASSETS.lobby, to: "/game", index: "01" },
  { kicker: "EL MUNDO", title: "Entra en la Forja.", copy: "Descubre regiones, facciones y lugares que dan forma a VEXFORGE.", image: ASSETS.nexus, to: "/world", index: "02" },
  { kicker: "LA COLECCIÓN", title: "Encuentra tu carta.", copy: "Explora las rarezas y las cartas que definen cada estilo de juego.", image: ASSETS.regions.shadowFracture, to: "/cards", index: "03" },
];

const pillarImages = [ASSETS.regions.forgeCore, ASSETS.regions.shadowFracture, ASSETS.regions.warboundZone];

export function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const [cards, setCards] = useState<PortalCard[]>([]);

  useEffect(() => {
    let live = true;
    loadFeaturedCards(4).then((items) => live && setCards(items));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const node = heroRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--hero-x", `${x * 5}px`);
      node.style.setProperty("--hero-y", `${y * 4}px`);
    };
    const reset = () => { node.style.setProperty("--hero-x", "0px"); node.style.setProperty("--hero-y", "0px"); };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    return () => { node.removeEventListener("pointermove", onMove); node.removeEventListener("pointerleave", reset); };
  }, []);

  return <>
    <section className="v53Hero" ref={heroRef} aria-labelledby="home-title">
      <div className="v53Hero__image" aria-hidden="true" />
      <div className="v53Hero__atmosphere" aria-hidden="true" />
      <div className="v53Hero__veil" aria-hidden="true" />
      <div className="v53Hero__frame" aria-hidden="true"><span/><span/><span/><span/></div>
      <div className="v53Hero__content shell">
        <Reveal>
          <div className="v53Hero__eyebrow"><span className="eyebrow eyebrow--light"><i/>PORTAL OFICIAL</span><span className="v53Hero__edition">JUEGO DE CARTAS COLECCIONABLE</span></div>
          <div className="v53Hero__wordmark" aria-label="VEXFORGE"><span>VEX</span><em>FORGE</em></div>
          <h1 id="home-title">La Forja<br/><em>despierta.</em></h1>
          <p>Construye tu mazo. Domina el campo. Forja tu camino.</p>
          <div className="v53Hero__actions">
            <Link className="portalButton portalButton--gold" to="/game">Descubre el juego <Icon name="arrow" size={17}/></Link>
            <Link className="portalButton portalButton--outline" to="/cards">Explora las cartas <Icon name="card" size={17}/></Link>
          </div>
        </Reveal>
      </div>
      {cards[0]?.image_url && <Link className="v53Hero__cardLink" to="/cards" aria-label={`Ver ${cards[0].name} en la colección`}>
        <div className="v53Hero__cardArt"><img src={cards[0].image_url} alt={`${cards[0].name} — carta oficial VEXFORGE`} loading="eager" fetchPriority="high"/></div>
        <div className="v53Hero__cardFrame" aria-hidden="true"/>
        <div className="v53Hero__cardGlow" aria-hidden="true"/>
        <div className="v53Hero__cardMeta"><span>{cards[0].rarity === "Mythic" ? "MÍTICA" : "LEGENDARIA"} · {cards[0].faction || "VEXFORGE"}</span><strong>{cards[0].name}</strong></div>
      </Link>}
      <div className="v53Hero__seal" aria-hidden="true"><ForgeGlyph/><span>VEXFORGE</span></div>
      <div className="v53Hero__scroll" aria-hidden="true"><span/>DESCIENDE</div>
    </section>

    <section className="v53Prologue">
      <div className="v53Prologue__ambient" aria-hidden="true" />
      <div className="shell v53Prologue__grid">
        <Reveal className="v53Prologue__artWrap"><div className="v53Prologue__art"><img src={ASSETS.lobby} alt="Escena de VEXFORGE" loading="eager" decoding="async"/><div className="v53Prologue__artFrame"/><div className="v53Prologue__stamp"><ForgeGlyph/><span>ARCHIVO<br/>OFICIAL</span></div></div></Reveal>
        <Reveal delay={70} className="v53Prologue__copy"><span className="eyebrow"><i/>VEXFORGE</span><SectionHeading kicker="LA EXPERIENCIA" title={<>Una batalla de cartas<br/><em>con identidad.</em></>} copy="Construye un mazo, lee el campo y decide cuándo cambiar la partida."/><Link className="inlineAction" to="/game">Conoce el juego <Icon name="arrow" size={15}/></Link></Reveal>
      </div>
      <div className="shell v53PillarRail" aria-label="Pilares de juego"><div className="v53PillarRail__head"><span>RECORRIDO DE LA FORJA</span><i/><small>COLECCIÓN · ESTRATEGIA · BATALLA</small></div>
        {PILLARS.map((pillar, index) => <Reveal key={pillar.kicker} delay={index * 55} className="v53PillarCard" style={{ "--pillar-image": `url(${pillarImages[index]})` } as CSSProperties}>
          <span className="v53PillarCard__number">0{index + 1}</span><div><small>{pillar.kicker}</small><strong>{pillar.title}</strong><p>{pillar.copy}</p></div><Icon name="arrow" size={16}/>
        </Reveal>)}
      </div>
      <div className="shell v54WorldStrip" aria-label="Regiones de VEXFORGE"><div className="v54WorldStrip__head"><span>ATLAS DE LA FORJA</span><i/><small>REGIONES OFICIALES</small></div><div className="v54WorldStrip__rail">{WORLD_REGIONS.map((region) => { const image = ASSETS.regions[region.key as keyof typeof ASSETS.regions]; return <Link key={region.name} className="v54WorldStrip__item" to="/world"><img src={image} alt="" loading="lazy" decoding="async"/><span>{region.number}</span><strong>{region.name}</strong></Link>; })}</div></div>
    </section>

    <section className="v53Gateways">
      <div className="shell">
        <div className="v53SectionHeader"><Reveal><SectionHeading kicker="DESCUBRE VEXFORGE" title={<>Tres puertas.<br/><em>Un solo universo.</em></>} copy="Juega, explora y colecciona dentro de un mundo construido alrededor de tus decisiones."/></Reveal><Reveal delay={80}><span className="v53SectionHeader__sigil"><ForgeGlyph/></span></Reveal></div>
        <div className="v53GatewayGrid">
          {discovery.map((item, index) => <Reveal key={item.kicker} delay={index * 55} className={`v53Gateway v53Gateway--${index === 0 ? "lead" : "support"}`}>
            <Link to={item.to} className="v53Gateway__link">
              <img src={item.image} alt="" loading="lazy" decoding="async"/>
              <span className="v53Gateway__wash"/><span className="v53Gateway__line"/>
              <div className="v53Gateway__index">{item.index}</div>
              <div className="v53Gateway__copy"><small>{item.kicker}</small><h3>{item.title}</h3><p>{item.copy}</p><b>Explorar <Icon name="arrow" size={15}/></b></div>
            </Link>
          </Reveal>)}
        </div>
      </div>
    </section>

    <section className="v53Vault">
      <div className="v53Vault__backdrop" aria-hidden="true" />
      <div className="shell">
        <div className="v53SectionHeader v53SectionHeader--vault"><Reveal><SectionHeading kicker="COLECCIÓN" title={<>Cartas que<br/><em>definen la partida.</em></>} copy="La colección oficial ocupa el centro del escenario."/></Reveal><Reveal delay={80}><Link className="inlineAction" to="/cards">Ver la colección <Icon name="arrow" size={15}/></Link></Reveal></div>
        {cards.length ? <div className="v53CardShelf">{cards.map((card, index) => <Reveal key={card.id} delay={index * 55}><CardShowcase card={card} featured={index === 0}/></Reveal>)}</div> : <Link className="v53VaultFallback" to="/cards"><img src={ASSETS.cover} alt="Arte de VEXFORGE" loading="lazy" decoding="async"/><div><span className="eyebrow"><i/>COLECCIÓN</span><h3>Descubre la Forja.</h3><p>Conoce las cartas y las rarezas que dan identidad a cada estilo de juego.</p><b>Explorar cartas <Icon name="arrow" size={15}/></b></div></Link>}
      </div>
    </section>

    <section className="v53Factions">
      <div className="v53Factions__ambient" aria-hidden="true" />
      <div className="shell">
        <div className="v53SectionHeader"><Reveal><SectionHeading kicker="CUATRO SENDAS" title={<>Elige cómo<br/><em>jugarás.</em></>} copy="Guerrero, Mago, Paladín y Pícaro. Cuatro identidades visuales dentro de la Forja."/></Reveal><Reveal delay={80}><Link className="inlineAction" to="/game#factions">Conoce las facciones <Icon name="arrow" size={15}/></Link></Reveal></div>
        <div className="v53FactionRail">{Object.entries(ASSETS.factions).map(([name, item], index) => <Link key={name} to="/game#factions" className={`v53Faction v53Faction--${item.tone}`}>
          <img src={item.background} alt="" loading="lazy" decoding="async"/><div className="v53Faction__wash"/><div className="v53Faction__icon"><img src={item.icon} alt="" loading="lazy" decoding="async"/></div><span className="v53Faction__number">0{index + 1}</span><div className="v53Faction__copy"><small>FACCIÓN</small><h3>{name}</h3></div>
        </Link>)}</div>
      </div>
    </section>

    <section className="v53WorldReveal">
      <img src={ASSETS.nexus} alt="" loading="lazy" decoding="async"/>
      <div className="v53WorldReveal__veil" aria-hidden="true"/>
      <div className="v53WorldReveal__frame" aria-hidden="true"/>
      <div className="shell v53WorldReveal__content"><Reveal><span className="eyebrow eyebrow--light"><i/>EL MUNDO</span><h2>Más allá de la batalla,<br/><em>existe la Forja.</em></h2><p>Explora regiones y atmósferas que convierten VEXFORGE en un universo propio.</p><Link className="portalButton portalButton--gold" to="/world">Explorar el mundo <Icon name="arrow" size={17}/></Link></Reveal></div>
    </section>

    <section className="v53Download">
      <div className="v53Download__scene" aria-hidden="true"/>
      <div className="v53Download__veil" aria-hidden="true"/>
      <div className="shell v53Download__grid"><Reveal><span className="eyebrow eyebrow--light"><i/>ANDROID</span><h2>La batalla<br/><em>te espera.</em></h2><p>VEXFORGE llegará a Android. Aquí encontrarás el acceso oficial cuando esté disponible.</p></Reveal><Reveal delay={90}><DownloadGate/></Reveal></div>
    </section>
  </>;
}
