import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function NotFound() { return <section className="notFound"><div className="shell"><span className="eyebrow"><i/>VEXFORGE / 404</span><h1>404</h1><p>Esta dirección ya no existe.</p><Link to="/" className="portalButton portalButton--gold">Volver al inicio <Icon name="arrow" size={16}/></Link></div></section>; }
