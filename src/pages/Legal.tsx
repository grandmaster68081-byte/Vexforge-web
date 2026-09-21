import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const privacy = kind === "privacy";
  return <section className="section legalPage"><div className="shell legalShell"><Reveal><SectionHeading kicker="VEXFORGE / LEGAL" title={privacy ? "Privacidad" : "Términos"} copy={privacy ? "Esta página es un destino legal del portal público. Sustituye este texto por la política jurídica final antes de la publicación comercial." : "Esta página reserva la ruta de términos de servicio del portal. Sustituye este texto por el documento jurídico final antes de la publicación."} /></Reveal><div className="legalNotice"><span>ESTADO</span><strong>RUTA PREPARADA — TEXTO LEGAL FINAL PENDIENTE</strong><p>No se crean tablas ni registros de base de datos para sostener estas páginas. El contenido vive en el repositorio de la web.</p></div></div></section>;
}
