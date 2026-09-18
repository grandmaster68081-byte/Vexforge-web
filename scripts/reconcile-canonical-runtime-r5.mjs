import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const BASE_COMMIT = 'af4787a0c2788dd8b3b406e42e0e82f9267d092e';

function read(file) {
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`);
  return fs.readFileSync(full, 'utf8');
}

function writeFile(file, value) {
  fs.writeFileSync(path.join(repoRoot, file), value, 'utf8');
}

function rewriteKnownActiveRuntimeString(value) {
  if (typeof value !== 'string') return value;

  if (value === 'Expo / React Native' || value === 'Expo/React Native') {
    return 'Unity Android';
  }

  if (value === 'RETIRED_HISTORICAL') {
    return 'ACTIVE_UNVERIFIED';
  }

  return value;
}

function rewriteRuntimeFields(value, key = '') {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRuntimeFields(item, key));
  }

  if (value && typeof value === 'object') {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (childKey === 'current_source_commit') {
        result[childKey] = BASE_COMMIT;
      } else if (
        childKey === 'target_runtime' ||
        childKey === 'current_runtime' ||
        childKey === 'active_runtime'
      ) {
        result[childKey] = rewriteKnownActiveRuntimeString(childValue);
      } else {
        result[childKey] = rewriteRuntimeFields(childValue, childKey);
      }
    }
    return result;
  }

  return rewriteKnownActiveRuntimeString(value);
}

function patchJson(file) {
  const raw = read(file);
  const parsed = JSON.parse(raw);
  writeFile(file, `${JSON.stringify(rewriteRuntimeFields(parsed), null, 2)}\n`);
}

const readme = read('README.md');
const readmePatched = readme
  .replace(
    /ANDROID PRODUCT:\s*mobile\/\*\*\s*ACTIVE RUNTIME:\s*Expo\s*\/\s*React Native/i,
    'ANDROID PRODUCT: unity/** ACTIVE RUNTIME: Unity 6000.3.0f1'
  )
  .replace(
    /cd mobile\s*\r?\nnpm ci\s*\r?\nnpm run typecheck/gi,
    'Open `unity/` in Unity 6000.3.0f1'
  );

writeFile('README.md', readmePatched);

patchJson('docs/vexforge-canonical/data/build_registry.json');
patchJson('docs/vexforge-canonical/data/current_state.json');
patchJson('docs/vexforge-canonical/data/screen_registry.json');

const expoDoc = read('docs/vexforge-canonical/27_EXPO_GAME_RUNTIME.md');
if (!expoDoc.startsWith('> STATUS: LEGACY REFERENCE ONLY')) {
  writeFile(
    'docs/vexforge-canonical/27_EXPO_GAME_RUNTIME.md',
    '> STATUS: LEGACY REFERENCE ONLY — DO NOT USE AS ACTIVE RUNTIME OR ARCHITECTURAL SOURCE.\n\n' +
    expoDoc
  );
}

const context = read('VEXFORGE_CONTEXT.md');
const normalizedContext = context
  .replace(/Expo\s*\/\s*React Native/gi, 'Unity Android (Expo/React Native is legacy)')
  .replace(
    /(Commit auditado:\s*)[0-9a-f]{40}/i,
    `$1${BASE_COMMIT}`
  );

writeFile('VEXFORGE_CONTEXT.md', normalizedContext);

const stateDocPath = 'docs/vexforge-canonical/17_CURRENT_BLOCK.md';
const stateDoc = read(stateDocPath);
const normalizedState = stateDoc
  .replace(/Expo\s*\/\s*React Native/gi, 'Unity Android (legacy source only)')
  .replace(/Expo\/React Native/gi, 'Unity Android (legacy source only)');

writeFile(stateDocPath, normalizedState);

console.log('R5 canonical runtime reconciliation applied deterministically.');
