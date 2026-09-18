import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs',
  'unity/Assets/Scripts/Presentation/VexforgeCardPool.cs',
  'unity/Assets/Scripts/Presentation/VexforgeCardView.cs',
  'unity/Assets/Scripts/Presentation/VexforgeDiegeticInputRouter.cs',
  'unity/Assets/Scripts/Presentation/VexforgeNexusStage.cs',
  'unity/Assets/Scripts/Presentation/VexforgePresentationResources.cs',
  'unity/Assets/Scripts/Presentation/VexforgeRenderBootstrap.cs',
  'unity/Assets/Scripts/Presentation/VexforgeTextureLruCache.cs',
  'unity/Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs',
  'unity/Assets/Scripts/Presentation/VexforgeWorldHotspot.cs',
  'unity/Assets/Scripts/Presentation/NexusPresentationRoot.cs',
  'unity/Assets/Scripts/Presentation/NexusDevelopmentFallback.cs',
  'unity/Assets/Scripts/Presentation/Editor/VexforgeR5ProjectSetup.cs',
  'unity/Assets/Scripts/UI/GameShellController.cs',
  'unity/Packages/manifest.json',
  'unity/ProjectSettings/ProjectSettings.asset'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing: ${file}`);
}

function read(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

const manifest = read('unity/Packages/manifest.json');
if (!/"com\.unity\.inputsystem"\s*:\s*"1\.20\.0"/.test(manifest)) {
  failures.push('manifest missing com.unity.inputsystem 1.20.0');
}
if (!/"com\.unity\.render-pipelines\.universal"\s*:\s*"17\.3\.0"/.test(manifest)) {
  failures.push('manifest missing com.unity.render-pipelines.universal 17.3.0');
}

const projectSettings = read('unity/ProjectSettings/ProjectSettings.asset');
if (!/activeInputHandler:\s*2\b/.test(projectSettings)) {
  failures.push('ProjectSettings activeInputHandler is not 2');
}

const presentationFiles = [
  'unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs',
  'unity/Assets/Scripts/Presentation/VexforgeCardPool.cs',
  'unity/Assets/Scripts/Presentation/VexforgeCardView.cs',
  'unity/Assets/Scripts/Presentation/VexforgeDiegeticInputRouter.cs',
  'unity/Assets/Scripts/Presentation/VexforgeNexusStage.cs',
  'unity/Assets/Scripts/Presentation/VexforgePresentationResources.cs',
  'unity/Assets/Scripts/Presentation/VexforgeRenderBootstrap.cs',
  'unity/Assets/Scripts/Presentation/VexforgeTextureLruCache.cs',
  'unity/Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs',
  'unity/Assets/Scripts/Presentation/VexforgeWorldHotspot.cs',
  'unity/Assets/Scripts/Presentation/NexusPresentationRoot.cs',
  'unity/Assets/Scripts/Presentation/NexusDevelopmentFallback.cs'
];

for (const file of presentationFiles) {
  const source = read(file);
  if (/\bScreenSpaceOverlay\b/.test(source)) failures.push(`${file}: ScreenSpaceOverlay forbidden`);
  if (/\bShader\.Find\s*\(/.test(source)) failures.push(`${file}: Shader.Find forbidden in runtime Presentation`);
  if (/\bMaterialPropertyBlock\b/.test(source)) failures.push(`${file}: MaterialPropertyBlock forbidden in Presentation`);
  if (/\bUnityEngine\.Input\b/.test(source)) failures.push(`${file}: legacy UnityEngine.Input forbidden`);
  if (/GameRoute\.(Archive|Forge|Battlefield)\b/.test(source)) failures.push(`${file}: non-existent GameRoute alias remains`);
  if (/card_tier[\s\S]{0,180}illustration|illustration[\s\S]{0,180}card_tier/.test(source)) {
    failures.push(`${file}: art mode cannot be derived from card_tier`);
  }
}

const gameShell = read('unity/Assets/Scripts/UI/GameShellController.cs');
if (/\bNexusWorldController\b/.test(gameShell)) failures.push('GameShell still references NexusWorldController');
if (/\bCardRenderer\b/.test(gameShell)) failures.push('GameShell still references CardRenderer');
if (/\bScreenSpaceOverlay\b/.test(gameShell)) failures.push('GameShell still uses ScreenSpaceOverlay');
if (/Mathf\.Min\s*\(\s*catalog\.Length\s*,\s*8\s*\)/.test(gameShell)) {
  failures.push('GameShell still truncates catalog to 8');
}

const allCs = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.cs')) allCs.push(full);
  }
}
walk(path.join(root, 'unity/Assets/Scripts'));

for (const file of allCs) {
  const source = fs.readFileSync(file, 'utf8');
  if (/\bMathf\.Min\s*\(\s*catalog\.Length\s*,\s*8\s*\)/.test(source)) {
    failures.push(`${path.relative(root, file)}: artificial eight-card catalog limit`);
  }
  if (/\bVexforge\.World\b/.test(source) && file.endsWith('GameShellController.cs')) {
    failures.push('legacy world namespace remains active in GameShell');
  }
}

for (const deleted of [
  'unity/Assets/Scripts/UI/CardRenderer.cs',
  'unity/Assets/Scripts/World/NexusWorldController.cs'
]) {
  if (fs.existsSync(path.join(root, deleted))) failures.push(`legacy file still exists: ${deleted}`);
}

const navigation = read('unity/Assets/Scripts/Core/NavigationService.cs');
for (const route of ['Collection', 'Deck', 'Battle', 'Missions', 'Economy']) {
  if (!new RegExp(`\\b${route}\\b`).test(navigation)) failures.push(`NavigationService missing ${route}`);
}

let changedFiles = [];
try {
  const outputs = [
    execFileSync('git', ['diff', '--name-only', 'af4787a0c2788dd8b3b406e42e0e82f9267d092e..HEAD'], { encoding: 'utf8' }),
    execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }),
    execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' }),
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.replace(/^..\s+/, ''))
      .join('\n')
  ];
  changedFiles = [...new Set(
    outputs.join('\n').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  )];
} catch {
  // The validator may be run outside a full git worktree; do not fail solely for that.
}

for (const file of changedFiles) {
  if (file.startsWith('mobile/')) failures.push(`mobile/** modified: ${file}`);
  if (file.startsWith('supabase/')) failures.push(`supabase/** modified: ${file}`);
  if (/\.(apk|aab|unitypackage)$/i.test(file) || /(^|\/)gradle(\/|$)/i.test(file)) {
    failures.push(`build artifact present: ${file}`);
  }
}

const legacyMarkers = [
  ['README.md', /ANDROID PRODUCT:\s*mobile\/\*\*\s*ACTIVE RUNTIME:\s*Expo/i],
  ['README.md', /cd mobile\s*\r?\nnpm ci\s*\r?\nnpm run typecheck/i],
  ['VEXFORGE_CONTEXT.md', /Commit auditado:\s*(?!af4787a0c2788dd8b3b406e42e0e82f9267d092e)[0-9a-f]{40}/i]
];

for (const [file, pattern] of legacyMarkers) {
  if (pattern.test(read(file))) failures.push(`${file}: stale canonical marker`);
}

if (failures.length > 0) {
  console.error(`R5 canonical validation FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R5 canonical validation PASSED.');
console.log('Note: Unity Editor compilation and Android/device verification remain unverified.');
