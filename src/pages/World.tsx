import type { CSSProperties } from "react";
import { ASSETS } from "../lib/assets";
import { WORLD_REGIONS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CinematicScene } from "../components/CinematicScene";

export function World() {
  return <>
    <section className="pageHero pageHero--world"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>MUNDO</span><h1>Un mundo que<br/><em>se descubre por capas.</em></h1><p>Regiones y atmósferas que dan escala al universo VEXFORGE.</p></Reveal></div></section>
    <section className="worldSection"><div className="shell"><Reveal><SectionHeading kicker="REGIONES" title={<>La geografía<br/><em>también cuenta.</em></>} copy="Cinco lugares visuales para comenzar a reconocer el mundo de VEXFORGE." /></Reveal><div className="worldRail">{WORLD_REGIONS.map((region, i) => { const image = ASSETS.regions[region.key as keyof typeof ASSETS.regions]; return <article key={region.name} className="worldCard"><div className="worldCard__image" style={{ "--image": `url(${image})` } as CSSProperties}/><div className="worldCard__veil"/><div className="worldCard__copy"><span>{region.number}</span><small>REGIÓN</small><h3>{region.name}</h3><p>{region.caption}</p></div></article>; })}</div></div></section>
    <CinematicScene image={ASSETS.cover} eyebrow="HORIZONTE" title="La escala también cuenta." copy="VEXFORGE no necesita explicarlo todo de una vez. El mundo puede abrirse poco a poco." index="03" variant="nexus" />
    <section className="worldNote"><div className="shell worldNote__grid"><Reveal><span className="eyebrow"><i/>EL CODEX</span><h2>Más mundo.<br/><em>Cuando sea real.</em></h2></Reveal><Reveal delay={100}><p>El mundo de VEXFORGE todavía tiene espacio para crecer.</p></Reveal></div></section>
  </>;
}
