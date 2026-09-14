/**
 * VEXFORGE — UX/CX TIER 1 2026 experience tokens.
 *
 * Source of truth: docs/VE-UXCX-TIER1-2026/00_LOVABLE_MASTER_DIRECTIVE.md
 *
 * The directive requires the five domains to read as places inside one game
 * instead of independent administrative modules. This module holds the shared
 * identity + motion language so no screen invents its own vocabulary.
 */

export type DomainKey = 'foja' | 'arena' | 'archivo' | 'forja' | 'legado';

export type DomainTone = 'accent' | 'primary' | 'danger' | 'success' | 'rarityEpic' | 'rarityRare';

export type DomainIdentity = {
  /** Canonical place name of the domain inside the world. */
  place: string;
  /** Player-facing title of the screen. */
  title: string;
  /** One line that states what the player does here. */
  purpose: string;
  /** Feather icon used as the domain sigil. */
  sigil: string;
  tone: DomainTone;
};

export const DOMAIN_IDENTITY: Record<DomainKey, DomainIdentity> = {
  foja: {
    place: 'FOJA',
    title: 'Nexus de la Forja',
    purpose: 'El lugar al que vuelves entre combates.',
    sigil: 'home',
    tone: 'accent',
  },
  arena: {
    place: 'ARENA',
    title: 'Arena oficial',
    purpose: 'Aqui se prueba lo forjado.',
    sigil: 'zap',
    tone: 'danger',
  },
  archivo: {
    place: 'ARCHIVO',
    title: 'Archivo de cartas',
    purpose: 'Tus cartas son objetos que posees, descubres y estudias.',
    sigil: 'layers',
    tone: 'rarityRare',
  },
  forja: {
    place: 'FORJA',
    title: 'Forja de mazos',
    purpose: 'Aqui construyes tu arma estrategica.',
    sigil: 'columns',
    tone: 'primary',
  },
  legado: {
    place: 'LEGADO',
    title: 'Legado del forjador',
    purpose: 'Esto es lo que has conseguido en VEXFORGE.',
    sigil: 'award',
    tone: 'rarityEpic',
  },
};

/** Motion tokens. Nivel 1 micro, nivel 2 ambiente, nivel 3 navegacion. */
export const MOTION = {
  micro: 160,
  reveal: 320,
  navigation: 460,
  ambient: 2800,
} as const;

/** Depth tokens for the layered scene language. */
export const DEPTH = {
  scene: 0,
  ambient: 1,
  surface: 2,
  focus: 3,
} as const;

/**
 * T2V shared visual-system contract.
 *
 * These values describe presentation roles only. They must not become a
 * source of gameplay state, card data, combat timing, or reward logic.
 * Screens consume the roles and resolve their actual colors through useColors.
 */
export const VISUAL_TOKENS = {
  material: {
    scene: { elevation: DEPTH.scene, opacity: 1 },
    ambient: { elevation: DEPTH.ambient, opacity: 0.72 },
    panel: { elevation: DEPTH.surface, opacity: 0.9 },
    focus: { elevation: DEPTH.focus, opacity: 0.96 },
  },
  colorRoles: {
    scene: 'background',
    surface: 'panel',
    surfaceStrong: 'panelStrong',
    text: 'foreground',
    secondaryText: 'mutedForeground',
    divider: 'border',
    focus: 'accent',
    danger: 'danger',
  },
  typography: {
    display: 'display',
    title: 'title',
    section: 'section',
    body: 'body',
    meta: 'meta',
    label: 'label',
  },
  radius: {
    compact: 10,
    surface: 14,
    modal: 18,
    pill: 999,
  },
  border: {
    hairline: 1,
    standard: 1,
    focus: 2,
  },
  shadow: {
    ambient: { opacity: 0.12, radius: 8, elevation: 2 },
    surface: { opacity: 0.22, radius: 12, elevation: 4 },
    focus: { opacity: 0.3, radius: 16, elevation: 7 },
  },
  icon: {
    defaultStroke: 1.7,
    activeStroke: 2.1,
    disabledOpacity: 0.46,
  },
  spacing: {
    micro: 4,
    compact: 8,
    control: 12,
    surface: 16,
    section: 24,
    scene: 32,
  },
  safeArea: {
    horizontal: 16,
    topContent: 18,
    bottomNavigation: 108,
  },
  motion: {
    micro: MOTION.micro,
    reveal: MOTION.reveal,
    navigation: MOTION.navigation,
    ambient: MOTION.ambient,
  },
  qualityTiers: {
    low: { ambient: false, particles: false, blur: false },
    standard: { ambient: true, particles: false, blur: true },
    high: { ambient: true, particles: true, blur: true },
  },
} as const;
