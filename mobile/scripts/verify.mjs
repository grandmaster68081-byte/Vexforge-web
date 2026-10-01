import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.cwd();
const require = createRequire(import.meta.url);

function expoConfigVersionSafe(config) {
  const version = config?.expo?.version;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid Expo version.');
  return version;
}

const required = [
  'app/_layout.tsx',
  'plugins/withEmbeddedJsBundle.js',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/arena.tsx',
  'app/dev/game-lab.tsx',
  'package.json',
  'app.json',
  'eas.json',
  'src/services/repository.ts',
  'src/engine/presentation.ts',
  'src/engine/tacticalLabEngine.ts',
  'src/engine/tacticalInteractive.ts',
  'src/render/BattlefieldCanvas.tsx',
  'src/render/BattleEffects.tsx',
  'src/components/PackOpeningCeremony.tsx',
  'src/components/BattleCinematic.tsx',
  'src/components/SceneCinematic.tsx',
  'src/engine/battleDirector.ts',
  'src/services/mutationGate.ts',
  'app/tutorial.tsx',
  'app/missions.tsx',
  'docs/ARCHITECTURE.md',
  'docs/BATTLE_RUNTIME.md',
  'docs/BUILD_HANDOFF.md',
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join('\n')}`);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const expoConfig = appConfig.expo ?? {};
if (packageJson.main !== 'expo-router/entry') throw new Error('Expo Router entrypoint mismatch.');
if (packageJson.version !== expoConfigVersionSafe(appConfig)) throw new Error('Package/app version mismatch.');
if (expoConfig.android?.package !== 'com.vexforge.android') throw new Error('Android package mismatch.');
if (!Array.isArray(expoConfig.plugins) || !expoConfig.plugins.includes('./plugins/withEmbeddedJsBundle.js')) throw new Error('Embedded bundle plugin missing from app.json.');
const { ensureEmbeddedJsBundle } = require('../plugins/withEmbeddedJsBundle.js');
if (typeof ensureEmbeddedJsBundle !== 'function') throw new Error('Embedded bundle plugin does not expose its Gradle validator.');
for (const defaultSetting of [
  '    // debuggableVariants = ["debug"]',
  '    debuggableVariants = ["debug"]',
]) {
  const gradleFixture = [
    'plugins {',
    '}',
    '',
    'react {',
    defaultSetting,
    '    bundleCommand = "export:embed"',
    '}',
  ].join('\n');
  const normalizedGradleFixture = ensureEmbeddedJsBundle(gradleFixture);
  const activeBundleSettings = normalizedGradleFixture
    .split(/\r?\n/)
    .filter((line) => /^[ \t]*debuggableVariants\s*=/.test(line));
  if (
    activeBundleSettings.length !== 1 ||
    !/^[ \t]*debuggableVariants\s*=\s*\[\s*\]\s*$/.test(activeBundleSettings[0])
  ) {
    throw new Error('Embedded bundle plugin did not replace the React Native default.');
  }
  if (ensureEmbeddedJsBundle(normalizedGradleFixture) !== normalizedGradleFixture) {
    throw new Error('Embedded bundle Gradle configuration is not idempotent.');
  }
}
const generatedGradlePath = path.join(root, 'android/app/build.gradle');
if (fs.existsSync(generatedGradlePath)) {
  const generatedGradle = fs.readFileSync(generatedGradlePath, 'utf8');
  if (ensureEmbeddedJsBundle(generatedGradle) !== generatedGradle) {
    throw new Error('Generated Android project is not configured to embed JavaScript in every variant.');
  }
}
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
if (eas.build?.preview?.android?.buildType !== 'apk') throw new Error('Preview build profile is not APK.');
if (eas.build?.production?.android?.buildType !== 'app-bundle') throw new Error('Production build profile is not AAB.');
const deps = packageJson.dependencies ?? {};
for (const key of [
  'expo',
  'react',
  'react-native',
  '@shopify/react-native-skia',
  'expo-image',
  '@supabase/supabase-js',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'expo-constants',
  'expo-audio',
]) {
  if (!deps[key]) throw new Error(`Missing dependency: ${key}`);
}

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
const sceneNames = ['nexus','arena','archive','forge','founders','missions','store','economy','world','social','meta','tutorial','events'];
const sceneMasters = sceneNames.map((scene) => `assets/vexforge/scenes/${scene === 'founders' ? 'founders' : scene}.jpg`);
const sceneTiers = sceneNames.flatMap((scene) => ['high','medium','low'].map((tier) => `assets/content-packs/${scene}/${tier}.jpg`));
const cinematicNames = ['battle_intro','battle_victory','battle_defeat','boss_phase','pack_reveal','mission_complete','fusion','season_arrival'];
const cinematicAssets = cinematicNames.map((name) => `assets/vexforge/cinematics/${name}.jpg`);
const requiredAssets = [...supportAssets, ...sceneMasters, ...sceneTiers, ...cinematicAssets];
const missingAssets = requiredAssets.filter((file) => !fs.existsSync(path.join(root, file)));
if (missingAssets.length) throw new Error(`Missing runtime assets:\n${missingAssets.join('\n')}`);
const assetQa = JSON.parse(fs.readFileSync(path.join(root,'docs/OFFICIAL_ASSET_QA_1.10.0.json'),'utf8'));
if (assetQa.runtime_version !== packageJson.version) throw new Error('Asset QA release mismatch.');
if (assetQa.scene_master_count !== 13 || assetQa.scene_tier_derivative_count !== 39) throw new Error('Official scene asset registry is incomplete.');
for (const item of assetQa.assets.filter((x)=>x.path.startsWith('assets/vexforge/scenes/') && !x.path.includes('.meta'))) {
  if (item.path.endsWith('.jpg') && (item.width ?? 0) < 1000) throw new Error(`Scene master is below release resolution: ${item.path}`);
}


const forbidden = ['mobile/', '/mobile/', 'expo-old', 'old-expo', 'placeholder.com'];
const sourceTexts = [];
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === '.git') continue;
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      sourceFiles.push(full);
      sourceTexts.push(fs.readFileSync(full, 'utf8'));
    }
  }
}
walk(path.join(root, 'src'));
walk(path.join(root, 'app'));

const text = sourceTexts.join('\n');
const bad = forbidden.filter((term) => text.includes(term));
if (bad.length) throw new Error(`Historical Expo reference detected in runtime source: ${bad.join(', ')}`);

const forbiddenSecrets = /(service_role|sb_secret|-----BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY-----)/i;
if (forbiddenSecrets.test(text)) throw new Error('Potential secret material detected in runtime source.');


const routeFiles = ['app/(tabs)/index.tsx','app/(tabs)/arena.tsx','app/(tabs)/archive.tsx','app/(tabs)/forge.tsx','app/(tabs)/legacy.tsx','app/auth.tsx','app/tutorial.tsx','app/missions.tsx','app/store.tsx','app/economy.tsx','app/world.tsx','app/social.tsx','app/meta.tsx','app/dev/game-lab.tsx'];
const missingRoutes = routeFiles.filter((f)=>!fs.existsSync(path.join(root,f)));
if (missingRoutes.length) throw new Error(`Missing product routes:
${missingRoutes.join('\n')}`);
const contractChecks = ['vexforge_battle_resolve','vexforge_buy_pack_with_vex','vexforge_open_pack','vexforge_submit_deposit','vexforge_request_withdrawal','create_listing','buy_listing','save_deck','validate_deck','vexforge_apply_fusion','vexforge_evolve_card','vexforge_join_raid','social_send_global_message'];
for (const contract of contractChecks) if (!text.includes(contract)) throw new Error(`Missing canonical server contract reference: ${contract}`);
const staleNames = ['ArenaScene','NexusScene','ArchiveScene','ForgeScene','LegacyScene','EconomyScene','StoreScene','SocialScene','WorldScene'];
for (const stale of staleNames) if (text.includes(stale)) throw new Error(`Stale historical scene reference detected: ${stale}`);

const codeRoots = [path.join(root, 'app'), path.join(root, 'src')];
const missingLocalImports = [];
function walkCode(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === '.git') continue;
    if (entry.isDirectory()) walkCode(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const body = fs.readFileSync(full, 'utf8');
      for (const match of body.matchAll(/from\s*['"](\.\.?\/[^'"]+)['"]/g)) {
        const base = path.resolve(path.dirname(full), match[1]);
        const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')];
        if (!candidates.some((candidate) => fs.existsSync(candidate))) missingLocalImports.push(`${path.relative(root, full)} -> ${match[1]}`);
      }
    }
  }
}
for (const codeRoot of codeRoots) walkCode(codeRoot);
if (missingLocalImports.length) throw new Error(`Missing local imports:\n${missingLocalImports.join('\n')}`);

console.log(JSON.stringify({
  ok: true,
  requiredFiles: required.length,
  sourceFiles: sourceFiles.length,
  verifiedAssets: requiredAssets.length,
  oldExpoReferences: 0,
  secretScan: 'clean',
}, null, 2));
