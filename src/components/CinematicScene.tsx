import { useEffect, useRef, type CSSProperties } from "react";
import { Reveal } from "./Reveal";
import { Icon } from "./Icon";
import { ForgeGlyph } from "./ForgeGlyph";
import { Link } from "react-router-dom";

export function CinematicScene({ image, eyebrow, title, copy, action, to, align = "left", index, variant = "core", className = "" }: { image: string; eyebrow: string; title: string; copy: string; action?: string; to?: string; align?: "left" | "right"; index?: string; variant?: "core" | "battle" | "nexus" | "forge"; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--scene-x", `${x * 8}px`);
      node.style.setProperty("--scene-y", `${y * 6}px`);
    };
    const reset = () => { node.style.setProperty("--scene-x", "0px"); node.style.setProperty("--scene-y", "0px"); };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    return () => { node.removeEventListener("pointermove", onMove); node.removeEventListener("pointerleave", reset); };
  }, []);
  const style = { "--scene-image": `url(${image})` } as CSSProperties;
  return <section className={`cinematicScene cinematicScene--${align} cinematicScene--${variant} ${className}`} style={style} ref={ref}>
    <div className="cinematicScene__image" aria-hidden="true" />
    <div className="cinematicScene__depth" aria-hidden="true" />
    <div className="cinematicScene__veil" aria-hidden="true" />
    <div className="cinematicScene__frame" aria-hidden="true"><span/><span/><span/><span/></div>
    <div className="cinematicScene__glyph"><ForgeGlyph variant={variant}/></div>
    <div className="shell cinematicScene__inner">
      <Reveal>
        <span className="eyebrow"><i />{eyebrow}</span>
        {index && <span className="cinematicScene__index">{index}</span>}
        <h2>{title}</h2>
        <p>{copy}</p>
        {to && action && <Link to={to} className="sceneAction">{action}<Icon name="arrow" size={15}/></Link>}
      </Reveal>
    </div>
  </section>;
}
