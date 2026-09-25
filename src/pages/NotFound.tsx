import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function NotFound() {
  return <section className="notFound"><div className="shell"><span className="eyebrow"><i/>VEXFORGE</span><h1>404</h1><p>Esta página no existe.</p><Link to="/" className="portalButton portalButton--gold">Volver a VEXFORGE <Icon name="arrow" size={16}/></Link></div></section>;
}
