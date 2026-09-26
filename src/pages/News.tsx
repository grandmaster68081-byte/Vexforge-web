import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { RemoteImage } from "../components/RemoteImage";
import { Icon } from "../components/Icon";

const newsLanes = [
  { number: "01", title: "ANUNCIOS", copy: "Presentaciones y comunicados oficiales cuando existan.", image: ASSETS.regions.forgeCore },
  { number: "02", title: "ACTUALIZACIONES", copy: "Cambios y novedades del universo VEXFORGE.", image: ASSETS.regions.warboundZone },
  { number: "03", title: "REVELACIONES", copy: "Nuevas cartas, regiones o contenidos publicados oficialmente.", image: ASSETS.regions.cindersRealm },
];

export function News() {
  return <>
    <section className="pageHero pageHero--news"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>NOTICIAS</span><h1>Todo lo que pasa<br/><em>en VEXFORGE.</em></h1><p>Anuncios, actualizaciones y novedades oficiales del juego.</p></Reveal></div></section>
    <section className="v53NewsChamber"><div className="v53NewsChamber__ambient" aria-hidden="true"/><div className="shell v53NewsChamber__grid"><Reveal><div className="v53NewsChamber__visual"><RemoteImage src={ASSETS.regions.shadowFracture} alt="Paisaje de VEXFORGE" eager/><div className="v53NewsChamber__frame"/><div className="v53NewsChamber__badge"><span>VEXFORGE</span><b>NEWS</b></div></div></Reveal><Reveal delay={90}><div className="v53NewsChamber__copy"><SectionHeading kicker="NOTICIAS" title={<>Mantente al día<br/><em>con la Forja.</em></>} copy="Las noticias oficiales de VEXFORGE aparecerán aquí."/><Link className="inlineAction" to="/download">Ver la descarga <Icon name="arrow" size={15}/></Link></div></Reveal></div></section>
    <section className="v53NewsLanes"><div className="shell"><Reveal><SectionHeading kicker="ARCHIVO DE NOTICIAS" title={<>Tres formas de<br/><em>seguir la Forja.</em></>} copy="La arquitectura está preparada para noticias reales sin inventar titulares, fechas ni eventos." /></Reveal><div className="v53NewsLanes__rail">{newsLanes.map((lane, i) => <Reveal key={lane.number} delay={i * 45} className="v53NewsLane"><div className="v53NewsLane__image"><img src={lane.image} alt="" loading="lazy" decoding="async"/></div><span>{lane.number}</span><div><small>CANAL OFICIAL</small><h3>{lane.title}</h3><p>{lane.copy}</p></div><span className="v53NewsLane__mark" aria-hidden="true"/></Reveal>)}</div></div></section>
  </>;
}
