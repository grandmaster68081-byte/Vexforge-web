/**
 * Stable card identity registry for scene-level presentation.
 *
 * The registry only describes visual treatment. Card names, lore, rarity,
 * faction and artwork remain live values from the canonical cards table.
 */
export const HOME_PILOT_CARD_ID = '4610f718-76f9-4a8a-83ca-f90eeb26015c';

export type CardIdentityVisual = {
  treatment: 'shadow-veil' | 'forged-weight' | 'arcane-flux';
  accent: string;
  edge: string;
  overlay: string;
};

export const CARD_IDENTITY_REGISTRY: Readonly<Record<string, CardIdentityVisual>> = {
  [HOME_PILOT_CARD_ID]: {
    treatment: 'shadow-veil',
    accent: '#b08af8',
    edge: '#7151b8',
    overlay: '#24163f',
  },
};

export function getCardIdentityVisual(cardId: string | null | undefined): CardIdentityVisual | null {
  return cardId ? CARD_IDENTITY_REGISTRY[cardId] ?? null : null;
}