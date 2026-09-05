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
