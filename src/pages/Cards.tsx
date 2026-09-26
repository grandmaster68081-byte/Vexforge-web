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
    <section className="pageHero pageHero--cards"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>COLECCIÓN</span><h1>Descubre las cartas<br/><em>que definen VEXFORGE.</em></h1><p>Explora las rarezas que destacan dentro del universo de la Forja.</p></Reveal>{cards[0]?.image_url && <div className="v54HeroCard" aria-hidden="true"><img src={cards[0].image_url} alt="" loading="eager" fetchPriority="high"/><span><b>{cards[0].rarity === "Mythic" ? "MÍTICA" : "LEGENDARIA"}</b><strong>{cards[0].name}</strong></span></div>}</div></section>
    <section className="v53CardArchive"><div className="v53CardArchive__ambient" aria-hidden="true"/><div className="shell"><div className="v53ArchiveHead"><Reveal><SectionHeading kicker="COLECCIÓN" title={<>Elige tu<br/><em>siguiente carta.</em></>} copy="Míticas y Legendarias ocupan el primer plano de esta selección." /></Reveal><div className="archiveFilters" role="group" aria-label="Filtrar por rareza"><button className={filter === "ALL" ? "is-active" : ""} type="button" onClick={() => setFilter("ALL")}>Todas</button><button className={filter === "Mythic" ? "is-active" : ""} type="button" onClick={() => setFilter("Mythic")}>Míticas</button><button className={filter === "Legendary" ? "is-active" : ""} type="button" onClick={() => setFilter("Legendary")}>Legendarias</button></div></div>{filtered.length ? <div className="v53CardArchive__grid">{filtered.map((card, i) => <Reveal key={card.id} delay={i * 45}><CardShowcase card={card} featured={i === 0}/></Reveal>)}</div> : <div className="archiveEmpty"><RemoteImage src={ASSETS.cover} alt="Arte de VEXFORGE"/><div><span className="eyebrow"><i/>VEXFORGE</span><h3>La colección empieza aquí.</h3><p>Explora el universo y descubre las cartas que forman parte de cada estilo de juego.</p></div></div>}</div></section>
  </>;
}
