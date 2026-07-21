// src/lib/keywords.ts
// VEXFORGE Keyword Glossary — Descripciones mecánicas de todas las keywords de synergy_json

export interface KeywordDef {
  name: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
  detail: string;
}

export const KEYWORD_GLOSSARY: Record<string, KeywordDef> = {
  Guard: {
    name: "Guard",
    icon: "🛡️",
    color: "#f59e0b",
    glow: "0 0 8px rgba(245,158,11,0.5)",
    description: "Protección frontal",
    detail:
      "Esta carta absorbe el primer ataque dirigido a tu líder cada turno. El atacante enemigo debe enfrentarse a ella antes que al resto del campo.",
  },
  Surge: {
    name: "Surge",
    icon: "⚡",
    color: "#ef4444",
    glow: "0 0 8px rgba(239,68,68,0.5)",
    description: "Golpe inicial potenciado",
    detail:
      "En el turno en que esta carta entra al campo, inflige el doble de su daño base en el primer ataque. El efecto desaparece al final de ese turno.",
  },
  Flux: {
    name: "Flux",
    icon: "🔮",
    color: "#818cf8",
    glow: "0 0 8px rgba(129,140,248,0.5)",
    description: "Generación de energía arcana",
    detail:
      "Al inicio de cada turno genera +1 de energía arcana utilizable por cartas de Facción Mago. Se acumula hasta un máximo de 5.",
  },
  Consecrate: {
    name: "Consecrate",
    icon: "✨",
    color: "#fbbf24",
    glow: "0 0 8px rgba(251,191,36,0.5)",
    description: "Aura curativa",
    detail:
      "Al final de cada turno restaura 1 HP a todos los aliados adyacentes en el campo de batalla. No puede superar el HP máximo de cada carta.",
  },
  Drain: {
    name: "Drain",
    icon: "🩸",
    color: "#a78bfa",
    glow: "0 0 8px rgba(167,139,250,0.5)",
    description: "Robo de vida",
    detail:
      "Cuando esta carta inflige daño, recupera HP equivalente al 50% del daño causado. El exceso de curación no se almacena ni se transfiere.",
  },
  Veil: {
    name: "Veil",
    icon: "🌫️",
    color: "#9ca3af",
    glow: "0 0 8px rgba(156,163,175,0.4)",
    description: "Inmunidad táctica",
    detail:
      "Esta carta es inmune a habilidades dirigidas durante 1 turno al entrar al campo. No protege contra daño de área. Se activa una sola vez por invocación.",
  },
  Forge: {
    name: "Forge",
    icon: "🔥",
    color: "#f97316",
    glow: "0 0 8px rgba(249,115,22,0.5)",
    description: "Forjable",
    detail:
      "Esta carta puede ser potenciada mediante el sistema de Evolución o Fusión. Es candidata para ascenso de rareza en el Forge de VEXFORGE.",
  },
  Resonance: {
    name: "Resonance",
    icon: "🎵",
    color: "#60a5fa",
    glow: "0 0 8px rgba(96,165,250,0.5)",
    description: "Amplificación de aliados",
    detail:
      "Mientras esta carta esté en el campo, las habilidades activas de tus otras cartas reciben +20% de eficacia. Solo se aplica el efecto del Resonance más alto si hay múltiples.",
  },
};

/** Devuelve la definición de una keyword, o undefined si no existe. */
export function getKeyword(name: string): KeywordDef | undefined {
  return KEYWORD_GLOSSARY[name];
}

/** Extrae las KeywordDefs de un synergy_json de carta. Ignora las desconocidas. */
export function getKeywordsForCard(
  synergyJson: Record<string, unknown> | null | undefined
): KeywordDef[] {
  if (!synergyJson?.keywords) return [];
  return (synergyJson.keywords as string[])
    .map((k) => KEYWORD_GLOSSARY[k])
    .filter((k): k is KeywordDef => k !== undefined);
}

/** Badge inline de keyword: muestra el icono + nombre con color y glow. */
export function keywordBadgeStyle(kw: KeywordDef): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${kw.color}55`,
    boxShadow: kw.glow,
    color: kw.color,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "default",
    transition: "all 0.15s ease",
  };
}
