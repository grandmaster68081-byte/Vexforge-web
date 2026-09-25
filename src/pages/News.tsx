import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { RemoteImage } from "../components/RemoteImage";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function News() {
  return <>
    <section className="pageHero pageHero--news"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>NOTICIAS</span><h1>Solo habrá<br/><em>algo que contar.</em></h1><p>Las novedades de VEXFORGE aparecerán aquí.</p></Reveal></div></section>
    <section className="newsSection"><div className="shell"><div className="newsQuiet"><Reveal><div className="newsQuiet__visual"><RemoteImage src={ASSETS.regions.shadowFracture} alt="El Nexus de VEXFORGE"/><div className="newsQuiet__frame"/><div className="newsQuiet__meta"><span>VEXFORGE</span><b>01</b></div></div></Reveal><Reveal delay={90}><div className="newsQuiet__copy"><SectionHeading kicker="ANUNCIOS OFICIALES" title={<>Sin ruido.<br/><em>Solo señales.</em></>} copy="Nuevas temporadas, eventos y anuncios aparecerán aquí cuando estén listos para la comunidad."/><Link className="inlineAction" to="/game">Volver al juego <Icon name="arrow" size={15}/></Link></div></Reveal></div></div></section>
  </>;
}
