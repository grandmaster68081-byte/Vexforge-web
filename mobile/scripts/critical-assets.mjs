import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const supportAssets = [
  'assets/vexforge/VF_CARD_BACK_CORE.png',
  'assets/vexforge/VF_CARD_FALLBACK_NEUTRAL.png',
  'assets/vexforge/VF_CARD_FRAME_EPIC.png',
  'assets/vexforge/VF_CARD_FRAME_LEGENDARY.png',
  'assets/vexforge/VF_BOSS_AURA.png',
  'assets/vexforge/VF_BOSS_SIGIL.png',
  'assets/vexforge/VF_PACK_RELIC.png',
  'assets/vexforge/VF_REWARD_SIGIL_COMMON.png',
  'assets/vexforge/VF_REWARD_SIGIL_PREMIUM.png',
  'assets/vexforge/attack.wav',
  'assets/vexforge/impact.wav',
  'assets/vexforge/shield.wav',
  'assets/vexforge/fusion.wav',
  'assets/vexforge/pack_reveal.wav',
  'assets/vexforge/reward.wav',
];

const sceneNames = [
  'nexus',
  'arena',
  'archive',
  'forge',
  'founders',
  'missions',
  'store',
  'economy',
  'world',
  'social',
  'meta',
  'tutorial',
  'events',
];
const sceneMasters = sceneNames.map((scene) => `assets/vexforge/scenes/${scene}.jpg`);
const sceneTiers = sceneNames.flatMap((scene) =>
  ['high', 'medium', 'low'].map((tier) => `assets/content-packs/${scene}/${tier}.jpg`),
);
const cinematicAssets = [
  'battle_intro',
  'battle_victory',
  'battle_defeat',
  'boss_phase',
  'pack_reveal',
  'mission_complete',
  'fusion',
  'season_arrival',
].map((name) => `assets/vexforge/cinematics/${name}.jpg`);

export const criticalAssets = [
  ...supportAssets,
  ...sceneMasters,
  ...sceneTiers,
  ...cinematicAssets,
];

export function getVerifiedCriticalAssetHashes(root) {
  if (criticalAssets.length !== 75 || new Set(criticalAssets).size !== 75) {
    throw new Error(`Expected 75 unique critical assets, found ${criticalAssets.length}.`);
  }

  const qaPath = path.join(root, 'docs/OFFICIAL_ASSET_QA_1.10.0.json');
  const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
  const qaByPath = new Map(qa.assets.map((asset) => [asset.path, asset]));
  const checksumPath = path.join(root, 'SHA256SUMS.txt');
  const checksumByPath = new Map(
    fs
      .readFileSync(checksumPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => {
        const match = line.match(/^([a-f0-9]{64})\s+\*?(.*)$/i);
        return match ? [match[2].trim(), match[1].toLowerCase()] : null;
      })
      .filter(Boolean),
  );

  return criticalAssets.map((assetPath) => {
    const sourcePath = path.join(root, assetPath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Critical runtime asset is missing: ${assetPath}`);
    }

    const official = qaByPath.get(assetPath);
    if (!official || !/^[a-f0-9]{64}$/i.test(official.sha256 ?? '')) {
      throw new Error(`Official SHA-256 is missing for critical asset: ${assetPath}`);
    }

    const source = fs.readFileSync(sourcePath);
    const actualHash = crypto.createHash('sha256').update(source).digest('hex');
    if (Number(official.bytes) !== source.length) {
      throw new Error(`Official byte size differs from the source asset: ${assetPath}`);
    }
    if (actualHash !== official.sha256.toLowerCase()) {
      throw new Error(`Critical asset differs from its official SHA-256: ${assetPath}`);
    }
    if (checksumByPath.get(assetPath) !== actualHash) {
      throw new Error(`Critical asset differs from SHA256SUMS.txt: ${assetPath}`);
    }

    return { path: assetPath, sha256: official.sha256.toLowerCase() };
  });
}