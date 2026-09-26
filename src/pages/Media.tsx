import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { RemoteImage } from "../components/RemoteImage";

const mediaItems = [
  { label: "NEXUS", image: ASSETS.nexus, className: "mediaTile--hero" },
  { label: "LOBBY", image: ASSETS.lobby, className: "mediaTile--wide" },
  { label: "FORGE CORE", image: ASSETS.regions.forgeCore, className: "" },
  { label: "SHADOW FRACTURE", image: ASSETS.regions.shadowFracture, className: "mediaTile--wide" },
  { label: "CINDERS REALM", image: ASSETS.regions.cindersRealm, className: "" },
  { label: "WARBOUND", image: ASSETS.regions.warboundZone, className: "" },
];

export function Media() {
  return <>
    <section className="pageHero pageHero--media"><div className="pageHero__image"/><div className="pageHero__veil"/><div className="shell pageHero__inner"><Reveal><span className="eyebrow eyebrow--light"><i/>MEDIA</span><h1>El mundo<br/><em>sin marco.</em></h1><p>Arte, lugares y atmósferas del universo VEXFORGE.</p></Reveal></div></section>
    <section className="v53MediaVault"><div className="shell"><Reveal><SectionHeading kicker="GALERÍA" title={<>Una identidad<br/><em>reconocible.</em></>} copy="Una selección visual para conocer la identidad de VEXFORGE." /></Reveal><div className="mediaMosaic">{mediaItems.map((item, i) => <Reveal key={item.label} delay={i * 35} className={`mediaTile ${item.className}`}><RemoteImage src={item.image} alt={`${item.label} — VEXFORGE`}/><div className="mediaTile__veil"/><div className="mediaTile__caption"><span>0{i + 1}</span><strong>{item.label}</strong></div></Reveal>)}</div></div></section>
  </>;
}
