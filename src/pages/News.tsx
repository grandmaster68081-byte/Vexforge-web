import { ASSETS } from "../lib/assets";
import { NEWS_ITEMS } from "../data/content";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

export function News() {
  return <>
    <section className="pageHero pageHero--news"><div className="pageHero__media" style={{ backgroundImage: `url(${ASSETS.lobby})` }} /><div className="pageHero__veil" /><div className="shell pageHero__content"><div className="kicker">VEXFORGE / NEWSROOM</div><h1>Noticias sin ruido.</h1><p>Un espacio breve para anuncios, desarrollo y novedades oficiales.</p></div></section>
    <section className="section"><div className="shell"><Reveal><SectionHeading kicker="ÚLTIMAS NOTAS" title="Lo que importa, cuando importa." copy="Los contenidos editoriales viven en el portal y no requieren convertir la web en un segundo cliente del juego." /></Reveal><div className="newsList">{NEWS_ITEMS.map(item => <Reveal key={item.code} className="newsItem"><div className="newsItem__date">{item.code}</div><div><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.text}</p></div><b>↗</b></Reveal>)}</div></div></section>
  </>;
}
