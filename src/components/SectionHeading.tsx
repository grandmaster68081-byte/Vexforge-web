import type { ReactNode } from "react";

export function SectionHeading({ kicker, title, copy, align = "left", lead = false }: { kicker: string; title: ReactNode; copy?: string; align?: "left" | "center"; lead?: boolean }) {
  return <header className={`sectionHeading sectionHeading--${align} ${lead ? "sectionHeading--lead" : ""}`}>
    <div className="sectionHeading__kicker"><span />{kicker}</div>
    <h2>{title}</h2>
    {copy && <p>{copy}</p>}
  </header>;
}
