export const PRIMARY_NAV = [
  { to: "/game", label: "Juego" },
  { to: "/cards", label: "Cartas" },
  { to: "/world", label: "Mundo" },
  { to: "/news", label: "Noticias" },
];

export const PILLARS = [
  { kicker: "COLECCIÓN", title: "Construye", copy: "Reúne cartas con identidad y crea un mazo a tu manera." },
  { kicker: "ESTRATEGIA", title: "Adapta", copy: "Lee el campo, anticipa el siguiente movimiento y cambia de plan." },
  { kicker: "BATALLA", title: "Decide", copy: "Juega tu turno con intención y convierte cada oportunidad en ventaja." },
];

export const GAME_AREAS = [
  { number: "01", title: "NEXUS", meta: "MUNDO", copy: "El punto de partida para conocer la Forja." },
  { number: "02", title: "BATALLA", meta: "COMBATE", copy: "Donde el mazo se convierte en decisión." },
  { number: "03", title: "FORJA", meta: "PREPARACIÓN", copy: "Ajusta tu colección y prepara tu siguiente partida." },
  { number: "04", title: "MISIONES", meta: "AVANCE", copy: "Objetivos que amplían tu recorrido por VEXFORGE." },
];

export const FAQ = [
  { q: "¿Dónde se podrá jugar VEXFORGE?", a: "La primera edición está prevista para Android. Los accesos oficiales aparecerán en la sección de descarga." },
  { q: "¿Cuándo estará disponible?", a: "La fecha de lanzamiento se anunciará oficialmente en Noticias y en la sección de descarga." },
  { q: "¿Dónde aparecerán las novedades?", a: "Los anuncios, actualizaciones y noticias oficiales estarán reunidos en la sección Noticias." },
  { q: "¿Dónde puedo conocer las cartas?", a: "La sección Cartas reúne la selección pública de cartas de VEXFORGE cuando esté disponible." },
];

export const WORLD_REGIONS = [
  { number: "01", name: "FORGE CORE", key: "forgeCore", caption: "El corazón de la Forja." },
  { number: "02", name: "IRON VEINS", key: "ironVeins", caption: "Metal, piedra y presión." },
  { number: "03", name: "SHADOW FRACTURE", key: "shadowFracture", caption: "Una frontera rota." },
  { number: "04", name: "CINDERS REALM", key: "cindersRealm", caption: "Donde el fuego no duerme." },
  { number: "05", name: "WARBOUND ZONE", key: "warboundZone", caption: "El campo espera." },
] as const;
