export const PRIMARY_NAV = [
  { to: "/game", label: "Juego" },
  { to: "/cards", label: "Cartas" },
  { to: "/world", label: "Mundo" },
  { to: "/news", label: "Noticias" },
  { to: "/media", label: "Media" },
];

export const PILLARS = [
  { kicker: "COLECCIÓN", title: "Construye", copy: "Una colección con identidad. Un mazo con intención." },
  { kicker: "ESTRATEGIA", title: "Lee", copy: "Mira el campo, mide la línea y espera el momento." },
  { kicker: "BATALLA", title: "Decide", copy: "Cada turno abre una posibilidad y cierra otra." },
];

export const GAME_AREAS = [
  { number: "01", title: "NEXUS", meta: "ENTRADA", copy: "La puerta al universo VEXFORGE." },
  { number: "02", title: "BATALLA", meta: "COMBATE", copy: "Donde la colección se convierte en decisión." },
  { number: "03", title: "FORJA", meta: "PREPARACIÓN", copy: "Construye, afina y vuelve a intentarlo." },
  { number: "04", title: "MISIONES", meta: "RECORRIDO", copy: "Objetivos que dan ritmo a tu camino." },
];

export const FAQ = [
  { q: "¿Dónde se jugará VEXFORGE?", a: "La primera edición está prevista para Android. La puerta oficial aparecerá aquí cuando esté disponible." },
  { q: "¿Cuándo estará disponible?", a: "La fecha de llegada y la descarga aparecerán aquí cuando sea el momento." },
  { q: "¿La web sustituye al juego?", a: "No. Este portal te presenta VEXFORGE; la partida vive dentro del juego." },
  { q: "¿Dónde aparecerán los anuncios?", a: "Las novedades oficiales aparecerán en Noticias." },
];

export const WORLD_REGIONS = [
  { number: "01", name: "FORGE CORE", key: "forgeCore", caption: "El corazón de la Forja." },
  { number: "02", name: "IRON VEINS", key: "ironVeins", caption: "Metal, piedra y presión." },
  { number: "03", name: "SHADOW FRACTURE", key: "shadowFracture", caption: "Una frontera rota." },
  { number: "04", name: "CINDERS REALM", key: "cindersRealm", caption: "Donde el fuego no duerme." },
  { number: "05", name: "WARBOUND ZONE", key: "warboundZone", caption: "El campo espera." },
] as const;
