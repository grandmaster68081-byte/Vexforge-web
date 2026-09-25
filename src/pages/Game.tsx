import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { GAME_AREAS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CinematicScene } from "../components/CinematicScene";
import { Icon } from "../components/Icon";

export function Game() {
  return <>
    <section className="pageHero pageHero--game"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>EL JUEGO</span><h1>La partida<br/><em>empieza antes.</em></h1><p>Colección, lectura del campo y decisión definen el ritmo de cada partida.</p></Reveal></div></section>
    <section className="chapterSection"><div className="shell"><Reveal><SectionHeading kicker="EL RECORRIDO" title={<>Cuatro espacios.<br/><em>Un mismo viaje.</em></>} copy="Nexus, Batalla, Forja y Misiones forman el recorrido visible de VEXFORGE." /></Reveal><div className="chapterList">{GAME_AREAS.map((area, i) => <Reveal key={area.number} delay={i * 65}><Link to={i === 0 ? "/world" : i === 1 ? "/cards" : "/game#factions"} className="chapterRow"><span className="chapterRow__number">{area.number}</span><div className="chapterRow__core"><small>{area.meta}</small><h2>{area.title}</h2><p>{area.copy}</p></div><Icon name="arrow" size={18}/></Link></Reveal>)}</div></div></section>
    <CinematicScene image={ASSETS.regions.forgeCore} eyebrow="PREPARACIÓN" title="Antes de decidir, existe el silencio." copy="Cartas, espacio y momento: la preparación también forma parte de la partida." index="03" variant="forge" to="/cards" action="Ver la colección" />
    <section className="factionFeature" id="factions"><div className="shell"><Reveal><SectionHeading kicker="CUATRO SENDAS" title={<>Una identidad.<br/><em>Cuatro lenguajes.</em></>} copy="Guerrero, Mago, Paladín y Pícaro abren cuatro expresiones visuales dentro del universo VEXFORGE." /></Reveal></div><div className="factionFeature__grid">{Object.entries(ASSETS.factions).map(([name, item], i) => <article key={name} className={`factionFeatureCard factionFeatureCard--${item.tone}`}><div className="factionFeatureCard__bg" style={{ "--image": `url(${item.background})` } as CSSProperties}/><div className="factionFeatureCard__veil"/><div className="factionFeatureCard__top"><span>0{i + 1}</span><img src={item.icon} alt=""/></div><div className="factionFeatureCard__bottom"><small>SENDA</small><h3>{name}</h3></div></article>)}</div></section>
    <section className="gameQuote"><div className="shell gameQuote__grid"><Reveal><span className="eyebrow"><i/>VEXFORGE</span><h2>La diferencia no está en la cantidad.<br/><em>Está en la decisión.</em></h2></Reveal><Reveal delay={100}><p>La colección abre posibilidades. La decisión define la partida.</p></Reveal></div></section>
  </>;
}
