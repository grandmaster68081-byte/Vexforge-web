import type { ForgeIconName } from '@/components/ForgeIcon';

/**
 * VE-3-PILOT authored presentation for the Android collection.
 *
 * The map is keyed only by canonical card code. Its visual parameters are
 * presentation-only and do not enter card stats, combat, rewards, or storage.
 */
export type MobileCardPilotIdentity = {
  accent: string;
  edge: string;
  overlay: string;
  icon: ForgeIconName;
  treatment: 'shadow-veil' | 'forged-weight' | 'arcane-flux';
};

export const MOBILE_CARD_PILOT_IDENTITIES: Readonly<Record<string, MobileCardPilotIdentity>> = {
  'VEX-0016': {
    accent: '#a78bfa',
    edge: '#7b4fd4',
    overlay: '#7b4fd426',
    icon: 'target',
    treatment: 'shadow-veil',
  },
  'VEX-0017': {
    accent: '#f0c050',
    edge: '#e8b84b',
    overlay: '#e8b84b26',
    icon: 'shield',
    treatment: 'forged-weight',
  },
  'VEX-0097': {
    accent: '#8f7cff',
    edge: '#7b4fd4',
    overlay: '#b08af83b',
    icon: 'spark',
    treatment: 'arcane-flux',
  },
};

export function getCardPilotIdentity(code: string | null | undefined): MobileCardPilotIdentity | null {
  return code ? MOBILE_CARD_PILOT_IDENTITIES[code] ?? null : null;
}