import type { ForgeIconName } from "../shared/components/ForgeIcon";

/**
 * VE-3-PILOT authored presentation only.
 *
 * These treatments are keyed by canonical card code and derived from the
 * already-verified faction, rarity, specialization, region, and keywords.
 * They never enter combat math, rewards, settlement, or any backend contract.
 */
export interface CardPilotIdentity {
  accent: string;
  edge: string;
  overlay: string;
  icon: ForgeIconName;
  treatment: "shadow-veil" | "forged-weight" | "arcane-flux";
}

export const CARD_PILOT_IDENTITIES: Readonly<Record<string, CardPilotIdentity>> = {
  "VEX-0016": {
    accent: "#a78bfa",
    edge: "rgba(123,79,212,.82)",
    overlay:
      "linear-gradient(135deg, rgba(6,6,18,.18), rgba(123,79,212,.2) 58%, rgba(61,201,107,.14))",
    icon: "target",
    treatment: "shadow-veil",
  },
  "VEX-0017": {
    accent: "#f0c050",
    edge: "rgba(232,184,75,.92)",
    overlay:
      "linear-gradient(180deg, rgba(232,184,75,.2), rgba(32,22,8,.04) 48%, rgba(232,184,75,.12))",
    icon: "shield",
    treatment: "forged-weight",
  },
  "VEX-0097": {
    accent: "#8f7cff",
    edge: "rgba(123,79,212,.74)",
    overlay:
      "radial-gradient(circle at 52% 38%, rgba(176,138,248,.25), rgba(44,37,112,.08) 48%, rgba(5,5,13,.04) 75%)",
    icon: "spark",
    treatment: "arcane-flux",
  },
};

export function getCardPilotIdentity(code: string | null | undefined): CardPilotIdentity | null {
  return code ? CARD_PILOT_IDENTITIES[code] ?? null : null;
}