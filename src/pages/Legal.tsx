export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const privacy = kind === "privacy";
  return <section className="legalPage"><div className="shell legalPage__inner"><span className="eyebrow"><i/>VEXFORGE / {privacy ? "PRIVACIDAD" : "TÉRMINOS"}</span><h1>{privacy ? "Privacidad." : "Términos."}</h1><div className="legalPage__notice"><span>VEXFORGE</span><h2>{privacy ? "Información de privacidad." : "Condiciones de uso."}</h2><p>Esta página quedará reservada para la información legal aplicable al portal oficial de VEXFORGE.</p></div></div></section>;
}
