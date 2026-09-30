export const DOMAINS = [
  {id:'nexus', label:'FOJA', title:'Ciudadela del Nexus', glyph:'✦', desc:'Centro vivo del ecosistema y puerta de entrada.'},
  {id:'arena', label:'ARENA', title:'Bastión de Combate', glyph:'⚔', desc:'PvP, ranked, eventos y replay.'},
  {id:'archive', label:'ARCHIVO', title:'Sanctum de Cartas', glyph:'◈', desc:'Colección, inspección, rareza y progreso.'},
  {id:'forge', label:'FORJA', title:'Mesa de Formación', glyph:'⌂', desc:'Mazos, sinergias y validación.'},
  {id:'missions', label:'ÓRDENES', title:'Salón de Misiones', glyph:'✧', desc:'Energía, PvE y recompensas.'},
  {id:'world', label:'MUNDOS', title:'Mapa del Nexus', glyph:'◎', desc:'Regiones, bosses, raids y eventos.'},
  {id:'economy', label:'TESORO', title:'Bóveda Económica', glyph:'◇', desc:'VEX, mercado y circulación de valor.'},
  {id:'social', label:'GREMIO', title:'Salón de Clanes', glyph:'♜', desc:'Amigos, chats y guerra de clanes.'},
  {id:'store', label:'ABASTO', title:'Cámara de Packs', glyph:'◆', desc:'Adquisición y ceremonias de recompensa.'},
] as const;

export const SYSTEM_FLOW = [
  'ENERGÍA', 'MISIONES', 'PVE', 'CARTAS', 'FORJA', 'ARENA', 'RANKING', 'CLANES', 'MERCADO', 'EVENTOS', 'TEMPORADAS'
] as const;

export const ECONOMIC_INVARIANTS = [
  'Toda mutación de wallet debe pasar por el gatekeeper server-side.',
  'El cliente nunca decide una recompensa, precio, comisión o entitlement.',
  'Toda operación repetible necesita idempotencia.',
  'No existe saldo negativo.',
  'El mercado aplica su política de fee definida por servidor.',
  'La monetización acelera progreso, no garantiza victoria.',
] as const;
