import { ASSETS } from "../lib/assets";
import { useEffect, useMemo, useState } from "react";
import { loadFeaturedCards, PortalCard } from "../lib/cards";
import { FeaturedCard } from "../components/FeaturedCard";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

export function Cards() {
  const [cards, setCards] = useState<PortalCard[]>([]);
  const [filter, setFilter] = useState<"all" | "Mythic" | "Legendary">("all");
  useEffect(() => { let live = true; loadFeaturedCards().then(data => { if (live) setCards(data); }); return () => { live = false; }; }, []);
  const filtered = useMemo(() => filter === "all" ? cards : cards.filter(card => card.rarity === filter), [cards, filter]);
  return <>
    <section className="pageHero pageHero--cards"><div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.cover})` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">ARCHIVO / CARTAS</div><h1>Lo más raro merece su propia vitrina.</h1><p>Una selección pública de las rarezas más altas del catálogo.</p></div></section>
    <section className="section"><div className="shell"><Reveal><SectionHeading kicker="MÍTICAS / LEGENDARIAS" title="Colección destacada" copy="Las cartas se consultan desde el catálogo público y su arte solo se muestra cuando la URL pertenece al almacenamiento oficial de VEXFORGE." /></Reveal>
      <div className="filterBar"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todas</button><button className={filter === "Mythic" ? "active" : ""} onClick={() => setFilter("Mythic")}>Míticas</button><button className={filter === "Legendary" ? "active" : ""} onClick={() => setFilter("Legendary")}>Legendarias</button></div>
      <div className="featuredCardsGrid featuredCardsGrid--page">{filtered.map(card => <FeaturedCard key={card.id} card={card} />)}</div>
      {!cards.length && <div className="emptyArchive"><span>CATÁLOGO PÚBLICO</span><strong>Aún no se han recibido cartas de alta rareza desde el endpoint público.</strong><p>La página queda preparada para poblarse automáticamente sin almacenar una segunda copia de las cartas.</p></div>}
    </div></section>
  </>;
}
