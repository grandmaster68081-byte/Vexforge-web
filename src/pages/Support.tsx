import { useState } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { FAQ } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { RemoteImage } from "../components/RemoteImage";

const supportPaths = [
  { title: "Descarga", copy: "Consulta el acceso oficial cuando esté publicado.", image: ASSETS.regions.forgeCore, to: "/download" },
  { title: "Cartas", copy: "Explora la selección pública de cartas de VEXFORGE.", image: ASSETS.regions.shadowFracture, to: "/cards" },
  { title: "Mundo", copy: "Conoce las regiones y atmósferas de la Forja.", image: ASSETS.regions.ironVeins, to: "/world" },
];

export function Support() {
  const [open, setOpen] = useState(0);
  return <>
    <section className="pageHero pageHero--support"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>SOPORTE</span><h1>Todo lo que necesitas<br/><em>para jugar.</em></h1><p>Respuestas claras sobre VEXFORGE, la descarga y el inicio de tu aventura.</p></Reveal></div></section>
    <section className="v53SupportChamber"><div className="v53SupportChamber__ambient" aria-hidden="true"/><div className="shell v53SupportChamber__grid"><Reveal><div className="supportVisual"><RemoteImage src={ASSETS.regions.ironVeins} alt="Paisaje de VEXFORGE" eager/><div className="supportVisual__caption"><span>VEXFORGE</span><strong>AYUDA</strong></div></div></Reveal><Reveal delay={90}><div><SectionHeading kicker="PREGUNTAS FRECUENTES" title={<>Respuestas<br/><em>sin rodeos.</em></>} copy="Lo esencial para empezar y saber qué esperar."/><div className="faqList">{FAQ.map((item, i) => <div className={`faqItem ${open === i ? "is-open" : ""}`} key={item.q}><button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item.q}</strong><Icon name={open === i ? "minus" : "plus"} size={16}/></button>{open === i && <p>{item.a}</p>}</div>)}</div></div></Reveal></div></section>
    <section className="v53SupportPaths"><div className="shell"><Reveal><SectionHeading kicker="RUTAS RÁPIDAS" title={<>Encuentra tu<br/><em>siguiente paso.</em></>} copy="Accesos visuales a las áreas públicas del portal oficial." /></Reveal><div className="v53SupportPaths__grid">{supportPaths.map((pathItem, i) => <Reveal key={pathItem.title} delay={i * 45}><Link to={pathItem.to} className="v53SupportPath"><img src={pathItem.image} alt="" loading="lazy" decoding="async"/><span className="v53SupportPath__veil"/><span className="v53SupportPath__number">0{i + 1}</span><div><small>VEXFORGE</small><h3>{pathItem.title}</h3><p>{pathItem.copy}</p></div><Icon name="arrow" size={16}/></Link></Reveal>)}</div></div></section>
  </>;
}
