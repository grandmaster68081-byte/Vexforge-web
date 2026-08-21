/** VE-VIS-3 — public motion contract guard. */
import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles.css", "utf8");
const tokens = [
  "--motion-dur-instant", "--motion-dur-fast", "--motion-dur-standard",
  "--motion-dur-slow", "--motion-dur-cinematic", "--motion-dur-ambient",
  "--motion-ease-linear", "--motion-ease-standard", "--motion-ease-entrance",
  "--motion-ease-exit", "--motion-ease-emphasis", "--motion-dist-micro",
  "--motion-dist-small", "--motion-dist-medium", "--motion-dist-large",
  "--motion-dist-scene", "--motion-dist-dramatic",
];
const classes = ["motion-surface", "motion-stagger", "motion-press", "motion-lift", "motion-scene", "motion-impact", "motion-nudge", "motion-reveal"];
const missingTokens = tokens.filter((token) => !styles.includes(token));
const missingClasses = classes.filter((name) => !styles.includes(`.${name}`));
const reducedMotion = styles.includes("@media (prefers-reduced-motion: reduce)");
const consumers = {
  App: readFileSync("src/App.tsx", "utf8").includes("motion-scene"),
  HomeRoute: readFileSync("src/routes/HomeRoute.tsx", "utf8").includes("motion-surface") && readFileSync("src/routes/HomeRoute.tsx", "utf8").includes("motion-reveal"),
  BattleResultScreen: readFileSync("src/components/battle/BattleResultScreen.tsx", "utf8").includes("motion-scene") && readFileSync("src/components/battle/BattleResultScreen.tsx", "utf8").includes("motion-impact"),
};
const result = { tokens: tokens.length, classes: classes.length, missingTokens, missingClasses, reducedMotion, consumers };
console.log(JSON.stringify(result, null, 2));
if (missingTokens.length || missingClasses.length || !reducedMotion || Object.values(consumers).some((value) => !value)) throw new Error("Motion contract incomplete.");
console.log("Motion contract verified: 17 tokens, 8 classes, reduced-motion support, and 3 consumers.");
