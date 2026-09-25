import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { loadFeaturedCards, type PortalCard } from "../lib/cards";
import { PILLARS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { CardShowcase } from "../components/CardShowcase";
import { DownloadGate } from "../components/DownloadGate";

const discovery = [
  { kicker: "EL JUEGO", title: "Aprende. Construye. Compite.", copy: "Una experiencia de cartas donde cada decisión cambia el siguiente turno.", image: ASSETS.lobby, to: "/game" },
  { kicker: "EL MUNDO", title: "Entra en la Forja.", copy: "Descubre regiones, facciones y lugares que dan forma a VEXFORGE.", image: ASSETS.nexus, to: "/world" },
  { kicker: "LA COLECCIÓN", title: "Encuentra tu carta.", copy: "Explora las rarezas y las cartas que definen cada estilo de juego.", image: ASSETS.regions.shadowFracture, to: "/cards" },
];

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
    <section className="v5Hero" ref={heroRef} aria-labelledby="home-title">
      <div className="v5Hero__image" aria-hidden="true" />
      <div className="v5Hero__veil" aria-hidden="true" />
      <div className="v5Hero__content shell">
        <Reveal>
          <span className="eyebrow eyebrow--light"><i/>JUEGO DE CARTAS COLECCIONABLE</span>
          <div className="v5Hero__wordmark" aria-label="VEXFORGE"><span>VEX</span><em>FORGE</em></div>
          <h1 id="home-title">La Forja<br/><em>despierta.</em></h1>
          <p>Construye tu mazo. Domina el campo. Forja tu camino.</p>
          <div className="v5Hero__actions">
            <Link className="portalButton portalButton--gold" to="/game">Descubre el juego <Icon name="arrow" size={17}/></Link>
            <Link className="portalButton portalButton--outline" to="/cards">Explora las cartas <Icon name="card" size={17}/></Link>
          </div>
        </Reveal>
      </div>
      <div className="v5Hero__scroll" aria-hidden="true"><span/>DESPLAZA</div>
    </section>

    <section className="v5Intro">
      <div className="shell">
        <div className="v5Intro__lead">
          <Reveal><SectionHeading kicker="VEXFORGE" title={<>Una batalla de cartas<br/><em>con identidad.</em></>} copy="Construye un mazo, lee el campo y decide cuándo cambiar la partida." /></Reveal>
          <Reveal delay={80}><div className="v5Intro__image"><img src={ASSETS.lobby} alt="Escena de VEXFORGE" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div></Reveal>
        </div>
        <div className="v5Pillars" aria-label="Pilares de juego">
          {PILLARS.map((pillar, index) => <Reveal key={pillar.kicker} delay={index * 55}><article className="v5Pillar"><span>{pillar.kicker}</span><strong>{pillar.title}</strong><p>{pillar.copy}</p></article></Reveal>)}
        </div>
      </div>
    </section>

    <section className="v5Discover">
      <div className="shell">
        <div className="v5SectionHead"><Reveal><SectionHeading kicker="DESCUBRE VEXFORGE" title={<>Entra donde<br/><em>comienza la aventura.</em></>} /></Reveal><Reveal delay={80}><Link className="inlineAction" to="/game">Conoce el juego <Icon name="arrow" size={15}/></Link></Reveal></div>
        <div className="v5Discover__grid">
          {discovery.map((item, index) => <Reveal key={item.kicker} delay={index * 60}><Link to={item.to} className={`v5DiscoverCard v5DiscoverCard--${index === 0 ? "lead" : "support"}`}>
            <img src={item.image} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <div className="v5DiscoverCard__veil" />
            <div className="v5DiscoverCard__copy"><span>{item.kicker}</span><h3>{item.title}</h3><p>{item.copy}</p><b>Explorar <Icon name="arrow" size={15}/></b></div>
          </Link></Reveal>)}
        </div>
      </div>
    </section>

    <section className="v5Cards">
      <div className="shell">
        <div className="v5SectionHead"><Reveal><SectionHeading kicker="COLECCIÓN" title={<>Cartas que<br/><em>definen la partida.</em></>} copy="Descubre las rarezas que destacan dentro del universo VEXFORGE." /></Reveal><Reveal delay={80}><Link className="inlineAction" to="/cards">Ver la colección <Icon name="arrow" size={15}/></Link></Reveal></div>
        {cards.length ? <div className="v5Cards__grid">{cards.map((card, index) => <Reveal key={card.id} delay={index * 55}><CardShowcase card={card} featured={index === 0}/></Reveal>)}</div> : <Link className="v5CardsFallback" to="/cards"><img src={ASSETS.cover} alt="Arte de VEXFORGE" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div><span className="eyebrow"><i/>COLECCIÓN</span><h3>Descubre VEXFORGE.</h3><p>Conoce las cartas y las rarezas que dan identidad a cada estilo de juego.</p><b>Explorar cartas <Icon name="arrow" size={15}/></b></div></Link>}
      </div>
    </section>

    <section className="v5Factions">
      <div className="shell">
        <div className="v5SectionHead"><Reveal><SectionHeading kicker="CUATRO SENDAS" title={<>Elige cómo<br/><em>jugarás.</em></>} copy="Guerrero, Mago, Paladín y Pícaro. Cuatro formas de entrar en la Forja." /></Reveal><Reveal delay={80}><Link className="inlineAction" to="/game#factions">Conoce las facciones <Icon name="arrow" size={15}/></Link></Reveal></div>
        <div className="v5Factions__grid">{Object.entries(ASSETS.factions).map(([name, item], index) => <Link key={name} to="/game#factions" className="v5FactionCard">
          <img src={item.background} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div className="v5FactionCard__veil" />
          <img className="v5FactionCard__icon" src={item.icon} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div className="v5FactionCard__copy"><span>0{index + 1}</span><h3>{name}</h3></div>
        </Link>)}</div>
      </div>
    </section>

    <section className="v5World">
      <img src={ASSETS.nexus} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <div className="v5World__veil" aria-hidden="true" />
      <div className="shell v5World__content"><Reveal><span className="eyebrow eyebrow--light"><i/>EL MUNDO</span><h2>Más allá de la batalla,<br/><em>existe la Forja.</em></h2><p>Explora regiones y atmósferas que convierten VEXFORGE en un universo propio.</p><Link className="portalButton portalButton--gold" to="/world">Explorar el mundo <Icon name="arrow" size={17}/></Link></Reveal></div>
    </section>

    <section className="v5Download">
      <div className="shell v5Download__grid"><Reveal><span className="eyebrow"><i/>ANDROID</span><h2>La batalla<br/><em>te espera.</em></h2><p>VEXFORGE llegará a Android. Aquí encontrarás el acceso oficial.</p></Reveal><Reveal delay={90}><DownloadGate/></Reveal></div>
    </section>
  </>;
}
