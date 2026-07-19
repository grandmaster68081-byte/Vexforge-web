// VEXFORGE Rank Utilities — mirrors backend get_player_rank RPC thresholds exactly.
export const RANK_TIERS = [
  { name: "Mythic",   min: 3000, color: "#ff4444", icon: "💎", shields: 0 },
  { name: "Diamond",  min: 2400, color: "#4a9eff", icon: "💠", shields: 3 },
  { name: "Platinum", min: 1800, color: "#a855f7", icon: "🔮", shields: 2 },
  { name: "Gold",     min: 1300, color: "#e8b84b", icon: "🥇", shields: 2 },
  { name: "Silver",   min: 900,  color: "#b0b0b0", icon: "🥈", shields: 1 },
  { name: "Bronze",   min: 500,  color: "#cd7f32", icon: "🥉", shields: 1 },
  { name: "Iron",     min: 0,    color: "#9e9e9e", icon: "⚒️",  shields: 0 },
] as const;

export type TierName = typeof RANK_TIERS[number]["name"];
export interface RankTier { name: TierName; min: number; color: string; icon: string; shields: number; }

export function getRank(mmr: number): RankTier {
  return (RANK_TIERS.find(t => mmr >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1]) as RankTier;
}
export function getNextTier(tierName: TierName): RankTier | null {
  const idx = RANK_TIERS.findIndex(t => t.name === tierName);
  return idx > 0 ? RANK_TIERS[idx - 1] as RankTier : null;
}
export function tierProgress(mmr: number): number {
  const current = getRank(mmr);
  const next    = getNextTier(current.name);
  if (!next) return 100;
  return Math.min(100, Math.round(((mmr - current.min) / (next.min - current.min)) * 100));
}
