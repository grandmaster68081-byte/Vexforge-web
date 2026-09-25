import { Link } from "react-router-dom";
import { Icon } from "./Icon";

export function DownloadGate() {
  return <div className="downloadGate" aria-label="Información oficial de descarga de VEXFORGE">
    <div className="downloadGate__top"><span>ANDROID</span><b>LANZAMIENTO OFICIAL</b></div>
    <h3>Descarga VEXFORGE.</h3>
    <p>El acceso oficial estará disponible en esta página cuando VEXFORGE llegue a Android.</p>
    <div className="downloadGate__channels">
      <div className="downloadGate__channel"><span className="downloadGate__channelIcon"><Icon name="download" size={17}/></span><span><strong>Google Play</strong><small>TIENDA OFICIAL</small></span></div>
      <div className="downloadGate__channel"><span className="downloadGate__channelIcon"><Icon name="download" size={17}/></span><span><strong>Android</strong><small>ACCESO OFICIAL</small></span></div>
    </div>
    <Link to="/download" className="downloadGate__action">Ver la página de descarga <Icon name="arrow" size={15}/></Link>
  </div>;
}
