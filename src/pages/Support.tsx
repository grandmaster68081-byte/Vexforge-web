import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

const faqs = [
  ["¿Dónde se juega VEXFORGE?", "El producto activo es una aplicación Android desarrollada en Unity."],
  ["¿La web necesita una cuenta?", "No. El portal es público y no replica el cliente autenticado del juego."],
  ["¿Cuándo estará disponible la descarga?", "Cuando exista una distribución oficial confirmada, la ruta de descarga se activará sin rediseñar esta página."],
  ["¿Dónde llegan las novedades?", "En esta sección de Noticias, además de los canales oficiales que se incorporen en el futuro."],
];

export function Support() {
  return <><section className="pageHero pageHero--support"><div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.nexusAtmosphere})` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">SUPPORT / HELP</div><h1>Directo al punto.</h1><p>Información esencial, sin convertir el portal en un segundo juego.</p></div></section><section className="section"><div className="shell supportGrid"><Reveal><SectionHeading kicker="FAQ" title="Preguntas frecuentes" /></Reveal><div className="faqList">{faqs.map(([q,a]) => <Reveal key={q} className="faq"><button type="button" onClick={e => { const node = e.currentTarget.nextElementSibling as HTMLElement | null; if (node) node.toggleAttribute("hidden"); }}>{q}<span>+</span></button><p hidden>{a}</p></Reveal>)}</div></div></section></>;
}
