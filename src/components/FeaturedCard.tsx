import { useState, type CSSProperties } from "react";
import { PortalCard } from "../lib/cards";

const tone: Record<string, string> = {
  Mythic: "#ef5b58",
  Legendary: "#efb442",
};

export function FeaturedCard({ card }: { card: PortalCard }) {
  const [loaded, setLoaded] = useState(false);
  const accent = tone[card.rarity] ?? "#d0a24c";
  return (
    <article className="featuredCard" style={{ "--accent": accent } as CSSProperties}>
      <div className="featuredCard__art">
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className={loaded ? "is-loaded" : ""} onLoad={() => setLoaded(true)} />
        ) : <div className="featuredCard__fallback">Arte oficial<br />pendiente</div>}
        <div className="featuredCard__sheen" />
      </div>
      <div className="featuredCard__meta">
        <div className="featuredCard__topline"><span>{card.rarity === "Mythic" ? "MÍTICA" : "LEGENDARIA"}</span><b>{card.faction}</b></div>
        <h3>{card.name}</h3>
        {card.lore && <p>{card.lore}</p>}
        <div className="featuredCard__stats">
          <span><b>{card.power}</b> POW</span><span><b>{card.affinity}</b> AFF</span><span><b>{card.prestige}</b> PRE</span><span><b>{card.charge}</b> CHG</span>
        </div>
      </div>
    </article>
  );
}
