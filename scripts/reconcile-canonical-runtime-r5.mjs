import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const BASE_COMMIT = '12f043c682dda43a0517a706a836f83256b055b7';
const SNAPSHOT_DATE = '2026-09-18';

function read(file) {
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`);
  return fs.readFileSync(full, 'utf8');
}

function write(file, value) {
  fs.writeFileSync(path.join(repoRoot, file), value, 'utf8');
}

function patchJson(file, transform) {
  const parsed = JSON.parse(read(file));
  const result = transform(parsed);
  write(file, `${JSON.stringify(result, null, 2)}\n`);
}

patchJson('docs/vexforge-canonical/data/build_registry.json', (data) => ({
  ...data,
  current_source_commit: BASE_COMMIT,
  current_task_build: 'UNITY_CANONICAL_RUNTIME_CLOSURE_R5',
  target_runtime: 'Unity Android',
  current_runtime: 'Unity Android',
  legacy_runtime: 'Expo / React Native',
  unity_build: 'BLOCKED_NO_BUILD_GATE',
  migration_status: 'UNITY_IMPLEMENTED_UNVERIFIED'
}));

patchJson('docs/vexforge-canonical/data/current_state.json', (data) => {
  const android = data.android || {};
  const legacyExpo = android.legacy_expo || {
    expo: android.expo,
    expo_lockfile: android.expo_lockfile,
    reactNative: android.reactNative,
    runtimeVersion: android.runtimeVersion
  };

  delete android.expo;
  delete android.expo_lockfile;
  delete android.reactNative;
  delete android.runtimeVersion;
  android.runtime = 'unity_android';
  android.unity_editor = '6000.3.0f1';
  android.legacy_expo = legacyExpo;

  return {
    ...data,
    repository: {
      ...(data.repository || {}),
      commit: BASE_COMMIT,
      snapshot_date: SNAPSHOT_DATE
    },
    android,
    current_block: 'UNITY_CANONICAL_RUNTIME_CLOSURE_R5',
    overall_status: 'UNITY_IMPLEMENTED_UNVERIFIED',
    target_runtime: 'unity_android',
    current_runtime: 'unity_android',
    legacy_runtime: 'expo_react_native',
    migration_status: 'UNITY_CANONICAL_RUNTIME'
  };
});

patchJson('docs/vexforge-canonical/data/screen_registry.json', (data) => ({
  ...data,
  source_commit: BASE_COMMIT,
  unity_runtime_routes: [
    { route: 'NEXUS', internal_route: 'Nexus', presentation: 'VexforgeNexusStage / NexusPresentationRoot' },
    { route: 'ARCHIVE', internal_route: 'Collection', presentation: 'VexforgeVirtualizedCardGallery' },
    { route: 'FORGE', internal_route: 'Deck', presentation: 'VexforgeVirtualizedCardGallery' },
    { route: 'BATTLEFIELD', internal_route: 'Battle', presentation: 'BattlePresentationDirector' },
    { route: 'MISSIONS', internal_route: 'Missions', presentation: 'GameShell contextual surface' },
    { route: 'ECONOMY', internal_route: 'Economy', presentation: 'GameShell contextual surface' },
    { route: 'PROFILE', internal_route: 'Profile', presentation: 'GameShell contextual surface' }
  ],
  legacy_mobile_routes: data.legacy_mobile_routes || []
}));

let readme = read('README.md');
readme = readme
  .replace(/cd mobile\s*\r?\nnpm ci\s*\r?\nnpm run typecheck/gi, 'Open `unity/` in Unity 6000.3.0f1')
  .replace(/ANDROID PRODUCT:\s*mobile\/\*\*\s*ACTIVE RUNTIME:\s*Expo\s*\/\s*React Native/i,
    'ANDROID PRODUCT: unity/**  ACTIVE RUNTIME: Unity 6000.3.0f1');
write('README.md', readme);

let context = read('VEXFORGE_CONTEXT.md');
context = context.replace(/Commit auditado:/i, 'Commit base auditado:');
context = context.replace(/Commit base auditado:\s*[0-9a-f]{40}/i, `Commit base auditado: ${BASE_COMMIT}`);
write('VEXFORGE_CONTEXT.md', context);

let currentBlock = read('docs/vexforge-canonical/17_CURRENT_BLOCK.md');
currentBlock = currentBlock
  .replace('`UNITY_RUNTIME_REACTIVATION`', '`UNITY_CANONICAL_RUNTIME_CLOSURE_R5`')
  .replace('Continuar Unity como único runtime activo del producto Android sin destruir el\nlegado histórico `mobile/**`.',
    'Cerrar la consolidación de Unity como único runtime activo del producto Android sin destruir el\nlegado histórico `mobile/**`.')
  .replace('| Unity Android (legacy source only) legacy | PRESERVED |', '| Expo / React Native legacy | PRESERVED |')
  .replace(' | `mobile/**` sin eliminación ni trabajo nuevo |', ' | `mobile/**` sin eliminación ni trabajo nuevo |');
write('docs/vexforge-canonical/17_CURRENT_BLOCK.md', currentBlock);

let migration = read('docs/vexforge-canonical/26_UNITY_ENGINE_MIGRATION.md');
if (!migration.includes('Presentation Foundation')) {
  migration += '\n\n## Canonical Presentation Closure\n\nLa Presentation Foundation bajo `unity/Assets/Scripts/Presentation/` es la única ruta activa del cliente Unity. `UI/` es contextual; `World/` legacy no es runtime activo.\n';
}
write('docs/vexforge-canonical/26_UNITY_ENGINE_MIGRATION.md', migration);

let expoDoc = read('docs/vexforge-canonical/27_EXPO_GAME_RUNTIME.md');
if (!expoDoc.startsWith('> STATUS: LEGACY REFERENCE ONLY')) {
  expoDoc = '> STATUS: LEGACY REFERENCE ONLY — DO NOT USE AS ACTIVE RUNTIME OR ARCHITECTURAL SOURCE.\n\n' + expoDoc;
}
write('docs/vexforge-canonical/27_EXPO_GAME_RUNTIME.md', expoDoc);

console.log('R5 canonical runtime reconciliation applied deterministically. Expo remains legacy; Unity is active.');
