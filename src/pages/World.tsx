import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

const regions = [
  ["NEXUS CORE", ASSETS.regions.forgeCore],
  ["IRON VEINS", ASSETS.regions.ironVeins],
  ["SHADOW FRACTURE", ASSETS.regions.shadowFracture],
  ["CINDERS REALM", ASSETS.regions.cindersRealm],
  ["WARBOUND ZONE", ASSETS.regions.warboundZone],
];

export function World() {
  return <>
    <section className="pageHero pageHero--world"><div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.regions.shadowFracture})` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">ARCHIVO / MUNDO</div><h1>Un mundo que se descubre por capas.</h1><p>Regiones, codex y jefes mundiales forman parte del vocabulario público de VEXFORGE.</p></div></section>
    <section className="section"><div className="shell"><Reveal><SectionHeading kicker="REGIONES" title="Geografías del archivo." copy="Estas imágenes están registradas en el almacenamiento oficial del proyecto y sirven como base visual para el portal." /></Reveal><div className="regionGrid">{regions.map(([name, image], i) => <Reveal key={name} className="regionCard"><div className="regionCard__image" style={{ backgroundImage: `url(${image})` }} /><div className="regionCard__meta"><span>0{i + 1}</span><h3>{name}</h3><b>↗</b></div></Reveal>)}</div></div></section>
    <section className="scene scene--boss"><div className="scene__media" style={{ backgroundImage: `url(${ASSETS.factions.Paladín.background})` }} /><div className="scene__veil" /><div className="shell scene__content"><Reveal><div className="sceneTag">WORLD BOSSES</div><h2>El mundo también tiene amenazas.</h2><p>La estructura pública conserva un espacio para jefes mundiales y encuentros de alto impacto.</p><Link to="/news" className="textLink">Ver novedades <span>→</span></Link></Reveal></div></section>
    <section className="section"><div className="shell centeredCta"><span className="kicker">CODEX</span><h2>El archivo completo pertenece al juego.</h2><p>La web muestra solo lo necesario. El resto se descubre dentro de VEXFORGE.</p><Link to="/download" className="button button--primary">Ver descarga</Link></div></section>
  </>;
}
