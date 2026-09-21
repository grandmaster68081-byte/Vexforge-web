import { Link } from "react-router-dom";
export function NotFound() { return <section className="section notFound"><div className="shell"><span className="kicker">404 / NEXUS</span><h1>No hay una ruta aquí.</h1><p>La puerta que buscas no forma parte del portal oficial.</p><Link to="/" className="button button--primary">Volver al inicio</Link></div></section>; }
