import type { CSSProperties } from "react";
import { ASSETS } from "../lib/assets";
import { WORLD_REGIONS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CinematicScene } from "../components/CinematicScene";

export function World() {
  return <>
    <section className="pageHero pageHero--world"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>MUNDO</span><h1>Entra en la Forja.<br/><em>Descubre sus regiones.</em></h1><p>Un universo de lugares, facciones y atmósferas que esperan ser explorados.</p></Reveal></div></section>
    <section className="worldSection"><div className="shell"><Reveal><SectionHeading kicker="REGIONES" title={<>Un mundo para<br/><em>explorar.</em></>} copy="Conoce las regiones que forman el universo de VEXFORGE." /></Reveal><div className="worldRail">{WORLD_REGIONS.map((region) => { const image = ASSETS.regions[region.key as keyof typeof ASSETS.regions]; return <article key={region.name} className="worldCard"><div className="worldCard__image" style={{ "--image": `url(${image})` } as CSSProperties}/><div className="worldCard__veil"/><div className="worldCard__copy"><span>{region.number}</span><small>REGIÓN</small><h3>{region.name}</h3><p>{region.caption}</p></div></article>; })}</div></div></section>
    <CinematicScene image={ASSETS.cover} eyebrow="NEXUS" title="Toda historia necesita un punto de partida." copy="La Forja conecta las regiones y da contexto a cada paso que das." variant="nexus" />
    <section className="worldNote"><div className="shell worldNote__grid"><Reveal><span className="eyebrow"><i/>EL UNIVERSO</span><h2>Hay más por<br/><em>descubrir.</em></h2></Reveal><Reveal delay={100}><p>La historia de VEXFORGE se extiende a través de sus lugares, sus facciones y sus cartas.</p></Reveal></div></section>
  </>;
}
