import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { GAME_AREAS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CinematicScene } from "../components/CinematicScene";
import { Icon } from "../components/Icon";

const areaImages = [ASSETS.nexus, ASSETS.regions.warboundZone, ASSETS.regions.forgeCore, ASSETS.regions.cindersRealm];

export function Game() {
  return <>
    <section className="pageHero pageHero--game"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>EL JUEGO</span><h1>Juega a tu manera.<br/><em>Decide la partida.</em></h1><p>Construye tu mazo, lee el campo y encuentra el momento que cambia el combate.</p></Reveal></div></section>
    <section className="v53InteriorIntro"><div className="v53InteriorIntro__ambient" aria-hidden="true"/><div className="shell v53InteriorIntro__grid"><Reveal><SectionHeading kicker="LA EXPERIENCIA" title={<>Todo empieza<br/><em>con una decisión.</em></>} copy="Nexus, Batalla, Forja y Misiones forman el recorrido dentro de VEXFORGE."/></Reveal><Reveal delay={70}><div className="v53InteriorIntro__art"><img src={ASSETS.lobby} alt="Escena del juego VEXFORGE" loading="eager" decoding="async"/><span>GAME / 01</span></div></Reveal></div></section>
    <section className="v53ChapterGrid"><div className="shell"><div className="v53SectionHeader"><Reveal><SectionHeading kicker="CUATRO ESPACIOS" title={<>Una sola aventura.<br/><em>Cuatro momentos.</em></>} /></Reveal></div><div className="v53ChapterGrid__items">{GAME_AREAS.map((area, i) => <Reveal key={area.number} delay={i * 45} className="v53ChapterCard"><Link to={i === 0 ? "/world" : i === 1 ? "/cards" : "/game#factions"} className="v53ChapterCard__link" style={{ "--image": `url(${areaImages[i]})` } as CSSProperties}><span className="v53ChapterCard__wash"/><span className="v53ChapterCard__number">{area.number}</span><div><small>{area.meta}</small><h2>{area.title}</h2><p>{area.copy}</p></div><Icon name="arrow" size={18}/></Link></Reveal>)}</div></div></section>
    <CinematicScene image={ASSETS.regions.forgeCore} eyebrow="FORJA" title="Prepara tu siguiente movimiento." copy="Tu colección abre posibilidades. Tu decisión marca la diferencia." variant="forge" to="/cards" action="Explorar cartas" />
    <section className="factionFeature" id="factions"><div className="shell"><Reveal><SectionHeading kicker="CUATRO SENDAS" title={<>Cuatro facciones.<br/><em>Cuatro estilos.</em></>} copy="Guerrero, Mago, Paladín y Pícaro aportan una identidad distinta a cada mazo." /></Reveal></div><div className="factionFeature__grid">{Object.entries(ASSETS.factions).map(([name, item], i) => <article key={name} className={`factionFeatureCard factionFeatureCard--${item.tone}`}><div className="factionFeatureCard__bg" style={{ "--image": `url(${item.background})` } as CSSProperties}/><div className="factionFeatureCard__veil"/><div className="factionFeatureCard__top"><span>0{i + 1}</span><img src={item.icon} alt=""/></div><div className="factionFeatureCard__bottom"><small>FACCIÓN</small><h3>{name}</h3></div></article>)}</div></section>
    <section className="gameQuote"><div className="gameQuote__art" aria-hidden="true"/><div className="shell gameQuote__grid"><Reveal><span className="eyebrow"><i/>VEXFORGE</span><h2>La colección abre el camino.<br/><em>La decisión lo transforma.</em></h2></Reveal><Reveal delay={100}><p>Explora, adapta tu estrategia y encuentra la forma de jugar que encaje contigo.</p></Reveal></div></section>
  </>;
}
