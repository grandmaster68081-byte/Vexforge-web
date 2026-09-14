import { typography, typeScale } from '@/constants/typography';

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
    display: { fontFamily: typography.display, fontSize: typeScale.display, lineHeight: 44, letterSpacing: 0.2 },
    title: { fontFamily: typography.display, fontSize: typeScale.title, lineHeight: 32, letterSpacing: 0.1 },
    section: { fontFamily: typography.display, fontSize: typeScale.section, lineHeight: 25 },
    body: { fontFamily: typography.body, fontSize: typeScale.body, lineHeight: 21 },
    meta: { fontFamily: typography.bodySemiBold, fontSize: typeScale.meta, lineHeight: 15, letterSpacing: 0.9 },
    label: { fontFamily: typography.bodyBold, fontSize: typeScale.label, lineHeight: 13, letterSpacing: 1.5 },
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
  control: {
    button: {
      minHeight: 46,
      radius: 12,
      paddingHorizontal: 14,
      iconSize: 16,
      gap: 8,
      pressedOpacity: 0.72,
      disabledOpacity: 0.45,
    },
    progress: {
      height: 6,
      radius: 4,
    },
  },
  domainHeader: {
    sigilSize: 36,
    sigilRadius: 12,
    sigilStroke: 1,
    identityGap: 10,
    ruleWidth: 54,
    ruleRadius: 1,
    titleTop: 14,
    purposeTop: 5,
    purposeLineHeight: 18,
  },
  scene: {
    backgroundOpacity: 0.74,
    ambientGlow: {
      size: 300,
      radius: 150,
      leftTop: 96,
      leftOffset: -174,
      rightTop: 300,
      rightOffset: -188,
    },
    orbit: {
      size: 430,
      radius: 215,
      borderWidth: 1,
      top: 86,
      right: -250,
      rotation: '18deg',
    },
    watermark: {
      size: 220,
      top: 12,
      right: -54,
      opacity: 0.16,
    },
  },
  state: {
    gap: 9,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 22,
    skeletonWidth: '78%',
    skeletonGap: 6,
    skeletonMargin: 2,
    skeletonHeight: 7,
    skeletonRadius: 4,
    titleSize: 15,
    titleTracking: 0.4,
    messageSize: 12,
    messageLineHeight: 18,
    messageMaxWidth: 310,
    actionRadius: 10,
    actionTop: 3,
    actionHorizontalPadding: 12,
    actionVerticalPadding: 9,
    actionTextSize: 10,
  },
  navigation: {
    bar: {
      webHeight: 84,
      mobileBaseHeight: 72,
      topPadding: 6,
      bottomPadding: 6,
      horizontalPadding: 7,
      itemMinHeight: 56,
      itemPaddingVertical: 3,
      elevation: 12,
      topRailInset: 18,
      topRailHeight: 1,
    },
    label: {
      fontSize: 9,
      letterSpacing: 1,
    },
    seal: {
      width: 38,
      height: 30,
      radius: 4,
      borderWidth: 1,
      beaconSize: 4,
      beaconRadius: 2,
      beaconBottom: 3,
    },
    authLoading: {
      gap: 14,
      labelSize: 10,
      labelTracking: 1.5,
    },
  },
  identityMark: {
    frame: {
      size: 38,
      borderWidth: 1,
      radius: 12,
      rotation: '45deg',
    },
    compact: {
      size: 30,
      radius: 9,
    },
    image: {
      scale: '72%',
      radius: 6,
    },
  },
  metricPlaque: {
    width: '31%',
    minHeight: 84,
    radius: 12,
    gap: 4,
    borderWidth: 1,
    iconSize: 18,
    valueSize: 18,
    labelSize: 8,
    labelTracking: 0.6,
  },
  battlefield: {
    root: { radius: 22, padding: 12, gap: 10 },
    identity: { markSize: 30, markRadius: 10, gap: 8, paddingHorizontal: 3 },
    formation: { gap: 6 },
    unitCard: { radius: 13, padding: 6, gap: 3 },
    unitArt: { height: 74, radius: 9 },
    championArtHeight: 92,
    reserve: {
      gap: 8,
      minHeight: 28,
      paddingHorizontal: 3,
      itemWidth: 24,
      itemHeight: 28,
      itemRadius: 5,
    },
    lane: { radius: 12, paddingVertical: 8, paddingHorizontal: 10, gap: 2 },
  },
  domainPortal: {
    object: { minHeight: 137, paddingHorizontal: 4, paddingVertical: 8 },
    halo: { size: 54, radius: 31, borderWidth: 1, rotation: '45deg' },
    sigil: { size: 34, borderWidth: 1, rotation: '-45deg' },
    core: { size: 6, radius: 3, offset: 1 },
    trace: { width: 34, height: 1 },
    label: { fontSize: 8, letterSpacing: 1.35, marginTop: 4 },
    title: { fontSize: 11.5, lineHeight: 15, marginTop: 3 },
    status: { gap: 5, marginTop: 4, markSize: 4, markRadius: 2 },
    iconSize: 17,
  },
  formation: {
    root: { radius: 18, padding: 14, gap: 10 },
    heading: { gap: 10 },
    seal: { size: 36, radius: 12 },
    kicker: { fontSize: 9, letterSpacing: 1.2 },
    title: { fontSize: 19, marginTop: 2 },
    count: { fontSize: 11 },
    copy: { fontSize: 11, lineHeight: 17 },
    section: { fontSize: 9, letterSpacing: 1, marginTop: 3 },
    rows: { gap: 6 },
    card: { minWidth: 92, radius: 12, padding: 8, gap: 4 },
    cardHeader: { gap: 4 },
    cardArt: { height: 64, radius: 8 },
    role: { fontSize: 8, letterSpacing: 0.5 },
    name: { fontSize: 11, lineHeight: 14, minHeight: 28 },
    meta: { fontSize: 8, lineHeight: 12 },
    power: { fontSize: 8, marginTop: 2 },
    emptyCard: { fontSize: 10, lineHeight: 14, minHeight: 28 },
    feedback: { minHeight: 50, radius: 12, padding: 10, gap: 8 },
    feedbackText: { fontSize: 9, letterSpacing: 0.4, lineHeight: 14 },
    retry: { radius: 8, paddingHorizontal: 8, paddingVertical: 7 },
    retryText: { fontSize: 8, letterSpacing: 0.5 },
    footnote: { fontSize: 9, lineHeight: 14 },
  },
} as const;
