// IA.2 — Daily AI Challenger (chat99)
// Deterministic daily deck seeded by date. Tracks one attempt per day in localStorage.

import type { AIDifficulty } from "./aiBattleEngine";

const DAILY_STORAGE_KEY = "vexforge_daily_challenge_v1";

/** Returns today's date string YYYY-MM-DD */
export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export interface DailyChallengeState {
  date: string;
  completed: boolean;
  won: boolean | null;
  vexEarned: number;
}

export function getDailyChallengeState(): DailyChallengeState {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyChallengeState;
      if (parsed.date === todayStr()) return parsed;
    }
  } catch { /* silent */ }
  return { date: todayStr(), completed: false, won: null, vexEarned: 0 };
}

export function saveDailyChallengeResult(won: boolean, vexEarned: number): void {
  try {
    const state: DailyChallengeState = { date: todayStr(), completed: true, won, vexEarned };
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
  } catch { /* silent */ }
}

/** Returns today's AI difficulty seeded by date (cycles Mon-Sun: normal→expert→normal…) */
export function getDailyDifficulty(): AIDifficulty {
  const day = new Date().getDay(); // 0=Sun..6=Sat
  return day === 0 || day === 3 || day === 6 ? "expert" : "normal";
}

/** Returns today's VEX bonus for winning the daily challenge */
export function getDailyVexReward(): number {
  const day = new Date().getDay();
  // Weekend = bigger reward
  return day === 0 || day === 6 ? 350 : 250;
}

/** Returns a display label for today's challenge */
export function getDailyChallengeLabel(): string {
  const diff = getDailyDifficulty();
  return diff === "expert" ? "🔥 Desafío Élite" : "⚔️ Desafío Diario";
}

/** Returns the color accent for today's difficulty */
export function getDailyChallengeColor(): string {
  return getDailyDifficulty() === "expert" ? "#ef4444" : "#f59e0b";
}
