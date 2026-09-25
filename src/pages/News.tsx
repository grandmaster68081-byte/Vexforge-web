import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { RemoteImage } from "../components/RemoteImage";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function News() {
  return <>
    <section className="pageHero pageHero--news"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>NOTICIAS</span><h1>Todo lo que pasa<br/><em>en VEXFORGE.</em></h1><p>Anuncios, actualizaciones y novedades oficiales del juego.</p></Reveal></div></section>
    <section className="newsSection"><div className="shell"><div className="newsQuiet"><Reveal><div className="newsQuiet__visual"><RemoteImage src={ASSETS.regions.shadowFracture} alt="Paisaje de VEXFORGE"/><div className="newsQuiet__frame"/><div className="newsQuiet__meta"><span>VEXFORGE</span><b>NEWS</b></div></div></Reveal><Reveal delay={90}><div className="newsQuiet__copy"><SectionHeading kicker="NOTICIAS" title={<>Mantente al día<br/><em>con la Forja.</em></>} copy="Las noticias oficiales de VEXFORGE aparecerán aquí."/><Link className="inlineAction" to="/download">Ver la descarga <Icon name="arrow" size={15}/></Link></div></Reveal></div></div></section>
  </>;
}
