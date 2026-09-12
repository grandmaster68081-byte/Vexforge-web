import { readFile } from "node:fs/promises";

const manifest = await readFile("src/lib/assetManifest.ts", "utf8");
const engine = await readFile("src/lib/audioEngine.ts", "utf8");
const provider = await readFile("src/providers/AudioProvider.tsx", "utf8");
const styles = await readFile("src/styles.css", "utf8");

const manifestBlock = manifest.match(/AUDIO_MANIFEST = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const entries = [...manifestBlock.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?contexts:\s*\[([^\]]*)\]/g)]
  .map(([, id, contexts]) => ({ id, contexts }));
const requiredContexts = ["hub", "battle", "missions", "market"];

if (entries.length < 12) {
  throw new Error(`Audio manifest incomplete: expected 12 entries, found ${entries.length}`);
}

for (const context of requiredContexts) {
  if (!entries.some(entry => entry.contexts.includes(`"${context}"`))) {
    throw new Error(`Audio context missing from manifest: ${context}`);
  }
  if (!provider.includes(`"${context}"`)) {
    throw new Error(`Audio context missing from route provider: ${context}`);
  }
}

const requiredEngineMarkers = [
  "startSectionAmbient",
  "startCombatMusic",
  "sfxNavChange",
  "sfxBattleHit",
  "sfxVictory",
  "sfxDefeat",
];
for (const marker of requiredEngineMarkers) {
  if (!engine.includes(marker)) throw new Error(`Audio engine marker missing: ${marker}`);
}

if (!provider.includes("pointerdown") || !styles.includes("prefers-reduced-motion")) {
  throw new Error("Audio provider must retain gesture unlock and accessibility-safe integration");
}

console.log(
  `Audio flow verified: ${entries.length} manifest entries, ${requiredContexts.length} required contexts, ` +
  "ambient/combat/UI/reward coverage, gesture unlock.",
);