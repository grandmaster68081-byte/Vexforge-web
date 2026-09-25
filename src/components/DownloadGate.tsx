import { Icon } from "./Icon";
import { DOWNLOAD_TARGETS, readyLink } from "../lib/assets";

export function DownloadGate() {
  const targets = [
    { label: "Google Play", note: "Android · tienda oficial", href: readyLink(DOWNLOAD_TARGETS.googlePlay) },
    { label: "Descarga directa", note: "Android · navegador", href: readyLink(DOWNLOAD_TARGETS.directAndroid) },
  ];
  return <div className="downloadGate" aria-label="Canales oficiales de descarga">
    <div className="downloadGate__top"><span>PRÓXIMAMENTE</span><b>ANDROID</b></div>
    <h3>La puerta abrirá aquí.</h3>
    <p>Las puertas de descarga permanecen cerradas hasta el lanzamiento oficial.</p>
    <div className="downloadGate__rows">
      {targets.map((target) => target.href ? <a className="downloadGate__row" key={target.label} href={target.href} target="_blank" rel="noreferrer"><span><Icon name="download" size={17}/><span><strong>{target.label}</strong><small>{target.note}</small></span></span><Icon name="external" size={15}/></a> : <div className="downloadGate__row downloadGate__row--disabled" key={target.label} aria-disabled="true"><span><Icon name="download" size={17}/><span><strong>{target.label}</strong><small>{target.note}</small></span></span><em>PRÓXIMAMENTE</em></div>)}
    </div>
  </div>;
}
