import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { DownloadGate } from "../components/DownloadGate";

export function Download() {
  return <>
    <section className="pageHero downloadHero"><div className="downloadHero__image"/><div className="downloadHero__veil"/><div className="shell downloadHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>DESCARGA</span><h1>La Forja<br/><em>te espera.</em></h1><p>La entrada oficial de VEXFORGE para Android.</p></Reveal></div></section>
    <section className="v53DownloadPage"><div className="v53DownloadPage__ambient" aria-hidden="true"/><div className="shell v53DownloadPage__grid"><Reveal><div><SectionHeading kicker="ANDROID" title={<>Descarga<br/><em>VEXFORGE.</em></>} copy="La página de descarga reunirá los accesos oficiales de VEXFORGE para Android."/><Link to="/support" className="inlineAction">Preguntas frecuentes <Icon name="arrow" size={15}/></Link></div></Reveal><Reveal delay={80}><div className="v53DownloadPage__panel"><img src={ASSETS.regions.forgeCore} alt="La Forja de VEXFORGE" loading="eager"/><div className="v53DownloadPage__panelVeil"/><div className="v53DownloadPage__copy"><span>ANDROID</span><h2>LANZAMIENTO<br/><em>OFICIAL</em></h2><p>La descarga aparecerá aquí cuando VEXFORGE esté disponible.</p></div><DownloadGate/></div></Reveal></div></section>
  </>;
}
