import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const required = [
  'src/core/runtimeGuards.ts',
  'src/core/performanceBudget.ts',
  'src/engine/cinematicDirector.ts',
  'src/services/contentPrefetch.ts',
  'src/render/VexforgeImage.tsx',
  'docs/TIER1_REFERENCE_RESEARCH_1.10.md',
  'docs/CANONICAL_CONTENT_AUTHORITY_1.10.md',
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`missing:${file}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '1.10.0') failures.push(`package-version:${pkg.version}`);
if (!pkg.dependencies['expo-image']) failures.push('expo-image-missing');

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
if (app.expo.version !== '1.10.0') failures.push(`app-version:${app.expo.version}`);
if (app.expo.android?.versionCode !== 11) failures.push(`android-version-code:${app.expo.android?.versionCode}`);

const codeFiles = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.expo' || e.name === '.git') continue;
    if (e.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) codeFiles.push(full);
  }
}
walk(path.join(root, 'app')); walk(path.join(root, 'src'));
const text = codeFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const forbiddenRuntimeLore = ['Aether Prime','Bosque Eterno','Ciudad Mecánica','Tierras Sombrías','Frontera del Vacío','Paladines de Aether','Legión Umbral','Sindicato Mecánico','Hijos del Vacío','Guardianes Primordiales'];
for (const term of forbiddenRuntimeLore) if (text.includes(term)) failures.push(`superseded-runtime-lore:${term}`);
if (text.includes("eq('season_key','S1_2026')")) failures.push('hardcoded-season');
if (!text.includes('assertBattleResult')) failures.push('battle-result-guard-not-wired');
if (!text.includes('assertOpenedCards')) failures.push('pack-result-guard-not-wired');
if (!text.includes('withMutationGate')) failures.push('mutation-gate-not-used');

const requiredMutationMethods = ['saveDeck','storeFormation','resolveBattle','forfeitBattle','claimDailyQuest','joinRaid','claimSeasonTier','createListing','buyListing','cancelListing','submitDeposit','requestWithdrawal','buyPack','openPack','createShopOrder','submitShopPayment','fusion','evolve'];
const repo = fs.readFileSync(path.join(root, 'src/services/repository.ts'), 'utf8');
for (const method of requiredMutationMethods) {
  const match = repo.match(new RegExp(`async ${method}\\([^\\n]+`));
  if (!match || !repo.slice(Math.max(0, repo.indexOf(match[0])), repo.indexOf(match[0]) + 900).includes('withMutationGate')) failures.push(`mutation-not-gated:${method}`);
}
const raidRepoBlock=repo.slice(repo.indexOf('async contributeRaid'), repo.indexOf('async claimSeasonTier'));
if (raidRepoBlock.includes("vexforge_contribute_raid")) failures.push('legacy-direct-raid-contribution-present');


const imageFiles = codeFiles.filter(f => /WorldBackdrop|SceneCinematic|BattleCinematic|VexforgeCard|BattlefieldCanvas|BossMonument|PackOpeningCeremony/.test(f));
for (const file of imageFiles) {
  const body = fs.readFileSync(file, 'utf8');
  if (body.includes('<Image ') || body.includes('<Animated.Image ') || body.includes("from 'react-native'" ) && /\bImage\b/.test(body.split('\n').find(x=>x.includes("from 'react-native'")) ?? '')) {
    failures.push(`legacy-image-surface:${path.relative(root,file)}`);
  }
}

console.log(JSON.stringify({ ok: failures.length === 0, codeFiles: codeFiles.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
