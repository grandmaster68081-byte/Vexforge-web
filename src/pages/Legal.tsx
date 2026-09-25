export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const privacy = kind === "privacy";
  return <section className="legalPage"><div className="shell legalPage__inner"><span className="eyebrow"><i/>VEXFORGE / {privacy ? "PRIVACIDAD" : "TÉRMINOS"}</span><h1>{privacy ? "Privacidad." : "Términos."}</h1><div className="legalPage__notice"><span>PUBLICACIÓN PENDIENTE</span><h2>Información oficial próximamente.</h2><p>La documentación oficial aparecerá aquí antes del lanzamiento.</p></div></div></section>;
}
