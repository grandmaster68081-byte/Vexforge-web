/** VE-VIS-4 — combat scene direction guard. */
import { readFileSync } from "node:fs";

const board = readFileSync("src/components/battle/InteractiveBattleBoard.tsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

const requiredEventBranches = [
  "turn.is_kill",
  "eventTypes.has('shield_block')",
  "eventTypes.has('poison_death')",
  "eventTypes.has('poison_tick')",
  "eventTypes.has('double_strike')",
  "eventTypes.has('lifesteal')",
  "turn.is_crit",
];

const requiredLabels = ["KO", "BLOQUEO", "VENENO", "DOBLE GOLPE", "DRENAJE", "CRÍTICO", "IMPACTO"];
const missingBranches = requiredEventBranches.filter((branch) => !board.includes(branch));
const missingLabels = requiredLabels.filter((label) => !board.includes(`'${label}'`));
const hasCue = board.includes("function CombatActionCue") && board.includes("className=\"combat-action-cue\"");
const hasStatus = board.includes('role="status"') && board.includes('aria-live="polite"');
const hasReducedMotion = styles.includes(".combat-action-cue") && styles.includes("prefers-reduced-motion: reduce");

const result = {
  requiredEventBranches: requiredEventBranches.length,
  missingBranches,
  requiredLabels: requiredLabels.length,
  missingLabels,
  hasCue,
  hasStatus,
  hasReducedMotion,
};
console.log(JSON.stringify(result, null, 2));

if (
  missingBranches.length ||
  missingLabels.length ||
  !hasCue ||
  !hasStatus ||
  !hasReducedMotion
) {
  throw new Error("Combat scene direction contract incomplete.");
}

console.log("Combat scene direction verified: dedicated cues for all resolved action types.");