import { DOWNLOAD_TARGETS, readyLink } from "../lib/assets";
import { DownloadButton } from "../components/DownloadButton";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

export function Download() {
  return <>
    <section className="pageHero pageHero--download"><div className="pageHero__media" style={{ backgroundImage: `url(/media/vexforge-portal-keyart.webp)` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">DOWNLOAD / OFFICIAL</div><h1>La próxima puerta de entrada a VEXFORGE.</h1><p>Las rutas oficiales están preparadas, pero permanecen cerradas hasta que exista una distribución pública confirmada.</p></div></section>
    <section className="section"><div className="shell downloadGrid"><Reveal><SectionHeading kicker="ANDROID" title="Cuando esté listo, estará aquí." copy="No hay una APK de prueba enlazada desde el portal público. La ruta queda reservada para la publicación oficial de Google Play y, si se decide, una descarga directa autorizada." /></Reveal><Reveal className="downloadPanel"><span>VEXFORGE / ANDROID</span><strong>PRÓXIMAMENTE</strong><div><DownloadButton href={readyLink(DOWNLOAD_TARGETS.googlePlay)}>Google Play</DownloadButton><DownloadButton href={readyLink(DOWNLOAD_TARGETS.directAndroid)} secondary>Descarga directa</DownloadButton></div></Reveal></div></section>
  </>;
}
