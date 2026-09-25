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
    <section className="pageHero pageHero--support"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>VEXFORGE / SOPORTE</span><h1>Ayuda<br/><em>sin rodeos.</em></h1><p>Las respuestas que necesitas, sin rodeos.</p></Reveal></div></section>
    <section className="supportSection"><div className="shell supportLayout"><Reveal><div className="supportVisual"><RemoteImage src={ASSETS.regions.ironVeins} alt="Nexus de VEXFORGE"/><div className="supportVisual__caption"><span>NEXUS / 01</span><strong>LA PUERTA</strong></div></div></Reveal><Reveal delay={90}><div><SectionHeading kicker="FAQ" title={<>Preguntas<br/><em>frecuentes.</em></>} copy="Lo esencial, en un solo lugar." /><div className="faqList">{FAQ.map((item, i) => <div className={`faqItem ${open === i ? "is-open" : ""}`} key={item.q}><button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item.q}</strong><Icon name={open === i ? "minus" : "plus"} size={16}/></button>{open === i && <p>{item.a}</p>}</div>)}</div></div></Reveal></div></section>
  </>;
}
