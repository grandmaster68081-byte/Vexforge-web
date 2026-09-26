import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { PortalCard } from "../lib/cards";
import { ASSETS } from "../lib/assets";

const rarityMeta: Record<string, { label: string; tone: string }> = {
  Mythic: { label: "MÍTICA", tone: "violet" },
  Legendary: { label: "LEGENDARIA", tone: "gold" },
};

export function CardShowcase({ card, featured = false }: { card: PortalCard; featured?: boolean }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const meta = rarityMeta[card.rarity] ?? { label: String(card.rarity || "Carta").toUpperCase(), tone: "gold" };
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || reduceMotion()) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    node.style.setProperty("--card-rx", `${(-y * 4).toFixed(2)}deg`);
    node.style.setProperty("--card-ry", `${(x * 5).toFixed(2)}deg`);
    node.style.setProperty("--card-mx", `${(x * 18).toFixed(1)}%`);
    node.style.setProperty("--card-my", `${(y * 18).toFixed(1)}%`);
  };
  const reset = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--card-rx", "0deg");
    node.style.setProperty("--card-ry", "0deg");
    node.style.setProperty("--card-mx", "50%");
    node.style.setProperty("--card-my", "50%");
  };
  return <article ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`cardShowcase cardShowcase--${meta.tone} ${featured ? "cardShowcase--featured" : ""}`} style={{ "--card-glow": meta.tone === "violet" ? "122, 86, 224" : "215, 164, 58" } as CSSProperties}>
    <div className="cardShowcase__art">
      {card.image_url ? <img src={card.image_url} alt={`${card.name} — ${meta.label.toLowerCase()}`} loading={featured ? "eager" : "lazy"} decoding="async" fetchPriority={featured ? "high" : "auto"} className={ready ? "is-ready" : ""} onLoad={() => setReady(true)} /> : <div className="cardShowcase__missing"><img src={ASSETS.cover} alt="" aria-hidden="true"/><div><span>VEXFORGE</span><small>ARTE OFICIAL</small></div></div>}
      <div className="cardShowcase__frame" aria-hidden="true" />
      <div className="cardShowcase__shine" aria-hidden="true" />
      <span className="cardShowcase__rarity">{meta.label}</span>
    </div>
    <div className="cardShowcase__caption">
      <div><span>{card.faction || "VEXFORGE"}</span>{card.power != null && <span>{String(card.power).padStart(2, "0")} PODER</span>}</div>
      <h3>{card.name}</h3>
    </div>
  </article>;
}
