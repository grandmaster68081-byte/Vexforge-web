export function SectionHeading({ kicker, title, copy, align = "left" }: { kicker: string; title: string; copy?: string; align?: "left" | "center" }) {
  return (
    <div className={`sectionHeading sectionHeading--${align}`}>
      <div className="kicker">{kicker}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  );
}
