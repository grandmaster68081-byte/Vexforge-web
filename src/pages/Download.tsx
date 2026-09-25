import { Link } from "react-router-dom";
import { ASSETS, DOWNLOAD_TARGETS, readyLink } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { RemoteImage } from "../components/RemoteImage";

export function Download() {
  const google = readyLink(DOWNLOAD_TARGETS.googlePlay);
  const direct = readyLink(DOWNLOAD_TARGETS.directAndroid);
  return <>
    <section className="downloadHero"><div className="downloadHero__image"/><div className="downloadHero__veil"/><div className="shell downloadHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>DESCARGA</span><h1>La Forja<br/><em>se abrirá pronto.</em></h1><p>La descarga oficial aparecerá aquí cuando VEXFORGE esté listo.</p></Reveal></div></section>
    <section className="downloadSection"><div className="shell downloadLayout"><Reveal><div><SectionHeading kicker="ANDROID" title={<>Una sola puerta<br/><em>hacia el juego.</em></>} copy="Cuando llegue el momento, aquí estará la puerta directa al juego."/><Link to="/support" className="inlineAction">Preguntas frecuentes <Icon name="arrow" size={15}/></Link></div></Reveal><Reveal delay={80}><div className="downloadPanel"><RemoteImage src={ASSETS.regions.forgeCore} alt="VEXFORGE"/><div className="downloadPanel__veil"/><div className="downloadPanel__copy"><span>ANDROID</span><h2>PRÓXIMAMENTE</h2><p>VEXFORGE estará disponible aquí próximamente.</p></div><div className="downloadOptions"><DownloadOption label="Google Play" note="Tienda oficial" href={google}/><DownloadOption label="Descarga directa" note="Navegador" href={direct}/></div></div></Reveal></div></section>
  </>;
}
function DownloadOption({ label, note, href }: { label: string; note: string; href: string | null }) { return href ? <a className="downloadOption" href={href} target="_blank" rel="noreferrer"><span><Icon name="download" size={17}/><span><strong>{label}</strong><small>{note}</small></span></span><Icon name="external" size={15}/></a> : <div className="downloadOption downloadOption--disabled" aria-disabled="true"><span><Icon name="download" size={17}/><span><strong>{label}</strong><small>{note}</small></span></span><em>PRÓXIMAMENTE</em></div>; }
