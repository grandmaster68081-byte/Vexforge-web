import { useState } from "react";
import { ASSETS } from "../lib/assets";
import { FAQ } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Icon } from "../components/Icon";
import { RemoteImage } from "../components/RemoteImage";

export function Support() {
  const [open, setOpen] = useState(0);
  return <>
    <section className="pageHero pageHero--support"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>SOPORTE</span><h1>Todo lo que necesitas<br/><em>para jugar.</em></h1><p>Respuestas claras sobre VEXFORGE, la descarga y el inicio de tu aventura.</p></Reveal></div></section>
    <section className="supportSection"><div className="shell supportLayout"><Reveal><div className="supportVisual"><RemoteImage src={ASSETS.regions.ironVeins} alt="Paisaje de VEXFORGE"/><div className="supportVisual__caption"><span>VEXFORGE</span><strong>AYUDA</strong></div></div></Reveal><Reveal delay={90}><div><SectionHeading kicker="PREGUNTAS FRECUENTES" title={<>Respuestas<br/><em>sin rodeos.</em></>} copy="Lo esencial para empezar y saber qué esperar."/><div className="faqList">{FAQ.map((item, i) => <div className={`faqItem ${open === i ? "is-open" : ""}`} key={item.q}><button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item.q}</strong><Icon name={open === i ? "minus" : "plus"} size={16}/></button>{open === i && <p>{item.a}</p>}</div>)}</div></div></Reveal></div></section>
  </>;
}
