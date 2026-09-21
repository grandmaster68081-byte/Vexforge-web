import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

export function Game() {
  return <>
    <section className="pageHero pageHero--game">
      <div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.lobby})` }} />
      <div className="pageHero__veil" />
      <div className="shell pageHero__content"><div className="kicker">VEXFORGE / EL JUEGO</div><h1>Una experiencia construida alrededor de la decisión.</h1><p>Descubre las cuatro áreas que definen la experiencia pública de VEXFORGE: Nexus, Battle, Forge y Missions.</p></div>
    </section>
    <section className="section">
      <div className="shell">
        <Reveal><SectionHeading kicker="EL CICLO" title="Entrar. Preparar. Combatir. Avanzar." copy="La web mantiene esta explicación breve y orientada a la experiencia; la profundidad vive dentro del cliente Android." /></Reveal>
        <div className="featureRows">
          {[
            ["01", "NEXUS", "El punto de entrada y la capa de navegación del mundo.", ASSETS.nexusAtmosphere],
            ["02", "BATTLE", "El espacio competitivo donde el estado y el resultado se resuelven con la autoridad del backend.", ASSETS.factions.Guerrero.background],
            ["03", "FORGE", "La idea de construir, ajustar y dar forma a tu colección.", ASSETS.regions.forgeCore],
            ["04", "MISSIONS", "La capa de objetivos y progresión que completa el ciclo.", ASSETS.regions.shadowFracture],
          ].map(([index, title, copy, image]) => <Reveal key={title} className="featureRow">
            <span className="featureRow__index">{index}</span><div className="featureRow__image" style={{ backgroundImage: `url(${image})` }} /><div className="featureRow__copy"><span>AREA</span><h3>{title}</h3><p>{copy}</p></div><span className="featureRow__arrow">↗</span>
          </Reveal>)}
        </div>
      </div>
    </section>
    <section className="section section--dark" id="factions"><div className="shell"><Reveal><SectionHeading kicker="IDENTIDAD DE JUEGO" title="Cuatro facciones ya forman parte del sistema visual." copy="Guerrero, Mago, Paladín y Pícaro cuentan con iconografía y escenarios oficiales dentro del catálogo del proyecto." /></Reveal><div className="miniFactions">{Object.entries(ASSETS.factions).map(([name, item]) => <div key={name} className="miniFaction" style={{ "--bg": `url(${item.background})`, "--tone": item.tone } as CSSProperties}><img src={item.icon} alt=""/><span>{name}</span></div>)}</div></div></section>
    <section className="section"><div className="shell centeredCta"><span className="kicker">LISTO PARA DESCUBRIR</span><h2>Entra al archivo o conoce el mundo.</h2><div><Link to="/cards" className="button button--primary">Cartas</Link><Link to="/world" className="button button--quiet">Mundo</Link></div></div></section>
  </>;
}
