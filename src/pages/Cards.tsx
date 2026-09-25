import { useEffect, useMemo, useState } from "react";
import { ASSETS } from "../lib/assets";
import { loadFeaturedCards, type PortalCard } from "../lib/cards";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CardShowcase } from "../components/CardShowcase";
import { RemoteImage } from "../components/RemoteImage";

export function Cards() {
  const [cards, setCards] = useState<PortalCard[]>([]);
  const [filter, setFilter] = useState<"ALL" | "Mythic" | "Legendary">("ALL");
  useEffect(() => { let live = true; loadFeaturedCards(10).then((items) => live && setCards(items)); return () => { live = false; }; }, []);
  const filtered = useMemo(() => filter === "ALL" ? cards : cards.filter((card) => card.rarity === filter), [cards, filter]);
  return <>
    <section className="pageHero pageHero--cards"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>COLECCIÓN</span><h1>Lo más raro<br/><em>merece su vitrina.</em></h1><p>Míticas y Legendarias ocupan el primer plano de la colección.</p></Reveal></div></section>
    <section className="cardArchiveSection"><div className="shell"><div className="archiveTop"><Reveal><SectionHeading kicker="MÍTICAS / LEGENDARIAS" title={<>La colección<br/><em>en primer plano.</em></>} copy="Una selección de las rarezas más altas de VEXFORGE." /></Reveal><div className="archiveFilters" role="group" aria-label="Filtrar por rareza"><button className={filter === "ALL" ? "is-active" : ""} type="button" onClick={() => setFilter("ALL")} >Todas</button><button className={filter === "Mythic" ? "is-active" : ""} type="button" onClick={() => setFilter("Mythic")} >Míticas</button><button className={filter === "Legendary" ? "is-active" : ""} type="button" onClick={() => setFilter("Legendary")} >Legendarias</button></div></div>
      {filtered.length ? <div className="cardArchiveGrid">{filtered.map((card, i) => <Reveal key={card.id} delay={i * 45}><CardShowcase card={card} featured={i === 0}/></Reveal>)}</div> : <div className="archiveEmpty"><RemoteImage src={ASSETS.cover} alt="Universo VEXFORGE"/><div><span className="eyebrow"><i/>ARCHIVO</span><h3>La vitrina está esperando el archivo.</h3><p>Las cartas de mayor rareza aparecerán aquí cuando la colección esté abierta.</p></div></div>}
    </div></section>
  </>;
}
