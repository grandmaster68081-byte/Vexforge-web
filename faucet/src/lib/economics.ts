export const KIVORA_ECONOMICS = {
  pointsPerUsdDisplay: 1000,
  targetUserShareBps: 3500,
  bitcoTasksExchangeRate: 350,
  withdrawalMinPoints: 10_000,
  withdrawalMinUsd: 10,
  rewardHoldHours: 72,
  autoPayout: false,
} as const;

export function displayUsdFromPoints(points: number): number {
  return points / KIVORA_ECONOMICS.pointsPerUsdDisplay;
}

export function providerUsdToKivoraPoints(providerUsd: number): number {
  return providerUsd * KIVORA_ECONOMICS.bitcoTasksExchangeRate;
}

export function kivoraPointsToProviderUsdReference(points: number): number {
  return points / KIVORA_ECONOMICS.pointsPerUsdDisplay;
}

export function isWithdrawalMinimumMet(points: number): boolean {
  return points >= KIVORA_ECONOMICS.withdrawalMinPoints;
}

// The returned reward from BitcoTasks is already the final Kivora Points amount
// because the provider app exchange rate is configured to 350 KP / USD.
// Do NOT multiply the callback reward by 35% again.
