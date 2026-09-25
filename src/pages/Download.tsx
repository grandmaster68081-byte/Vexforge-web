import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { RemoteImage } from "../components/RemoteImage";

export function Download() {
  return <>
    <section className="downloadHero"><div className="downloadHero__image"/><div className="downloadHero__veil"/><div className="shell downloadHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>DESCARGA</span><h1>La Forja<br/><em>te espera.</em></h1><p>La entrada oficial de VEXFORGE para Android.</p></Reveal></div></section>
    <section className="downloadSection"><div className="shell downloadLayout"><Reveal><div><SectionHeading kicker="ANDROID" title={<>Descarga<br/><em>VEXFORGE.</em></>} copy="La página de descarga reunirá los accesos oficiales de VEXFORGE para Android."/><Link to="/support" className="inlineAction">Preguntas frecuentes <Icon name="arrow" size={15}/></Link></div></Reveal><Reveal delay={80}><div className="downloadPanel"><RemoteImage src={ASSETS.regions.forgeCore} alt="La Forja de VEXFORGE"/><div className="downloadPanel__veil"/><div className="downloadPanel__copy"><span>ANDROID</span><h2>LANZAMIENTO<br/><em>OFICIAL</em></h2><p>La descarga aparecerá aquí cuando VEXFORGE esté disponible.</p></div><div className="downloadOptions"><div className="downloadOption downloadOption--disabled"><strong>Google Play</strong><small>Tienda oficial</small></div><div className="downloadOption downloadOption--disabled"><strong>Android</strong><small>Acceso oficial</small></div></div></div></Reveal></div></section>
  </>;
}
