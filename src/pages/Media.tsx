import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

const mediaItems = [
  ["Nexus", ASSETS.nexusAtmosphere],
  ["Lobby", ASSETS.lobby],
  ["Cover", ASSETS.cover],
  ["Guerrero", ASSETS.factions.Guerrero.background],
  ["Mago", ASSETS.factions.Mago.background],
  ["Paladín", ASSETS.factions.Paladín.background],
  ["Pícaro", ASSETS.factions.Pícaro.background],
];

export function Media() {
  return <>
    <section className="pageHero pageHero--media"><div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.nexusAtmosphere})` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">MEDIA / OFFICIAL</div><h1>El universo también vive fuera del juego.</h1><p>Una selección de arte oficial ya registrado en VEXFORGE Storage.</p></div></section>
    <section className="section"><div className="shell"><Reveal><SectionHeading kicker="GALERÍA" title="Arte y atmósfera." copy="La galería usa las rutas verificadas del manifiesto canónico del proyecto. No añade una segunda copia local." /></Reveal><div className="mediaGrid">{mediaItems.map(([label, image], i) => <Reveal key={`${label}-${i}`} className={`mediaTile ${i === 0 ? "mediaTile--wide" : ""}`}><div className="mediaTile__image" style={{ backgroundImage: `url(${image})` }} /><div className="mediaTile__label"><span>0{i + 1}</span><strong>{label}</strong></div></Reveal>)}</div></div></section>
  </>;
}
