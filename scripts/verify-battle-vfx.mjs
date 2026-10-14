import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs'),
  'utf8',
);
const director = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs'),
  'utf8',
);
const vfx = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Tier1/VexforgeTier1VfxDirector.cs'),
  'utf8',
);

function methodBody(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `Missing method ${signature}`);
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `Missing body for ${signature}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }
  assert.fail(`Unclosed method ${signature}`);
}

const stageAnchor = methodBody(
  stage,
  'public bool TryGetEventAnchor(BattleEvent battleEvent, out Vector3 position)',
);
assert.match(stageAnchor, /battleEvent\.actor_id/);
assert.match(stageAnchor, /battleEvent\.target_id/);
assert.match(stageAnchor, /TryGetSideAnchor\(/);
assert.match(stageAnchor, /impactCore\.position/);

const sideAnchor = methodBody(
  stage,
  'private bool TryGetSideAnchor(string participantId, out Vector3 position)',
);
assert.match(sideAnchor, /IsLocalActor\(participantId\)/);
assert.match(sideAnchor, /playerZone/);
assert.match(sideAnchor, /opponentZone/);

const directorAnchor = methodBody(
  director,
  'public bool TryGetEventAnchor(BattleEvent battleEvent, out Vector3 position)',
);
assert.match(directorAnchor, /battlefield\.TryGetEventAnchor\(battleEvent, out position\)/);

const eventHandler = methodBody(vfx, 'private void OnEvent(BattleEvent evt)');
assert.match(eventHandler, /director\.TryGetEventAnchor\(evt, out anchor\)/);
assert.match(eventHandler, /Emit\(anchor,/);
assert.doesNotMatch(eventHandler, /Vector3\.up\s*\*\s*\.30f/);
assert.doesNotMatch(eventHandler, /new GameObject/);

const initialize = methodBody(vfx, 'public void Initialize(Transform parent)');
assert.match(initialize, /for \(var i = 0; i < PoolCapacity; i\+\+\)/);
assert.match(initialize, /CreatePooledEffect\(i\)/);

const emit = methodBody(vfx, 'private void Emit(Vector3 position, Color color, int count, float lifetime)');
assert.match(emit, /!pool\[i\]\.InUse/);
assert.match(emit, /StartCoroutine\(ReleaseAfter\(effect,/);
assert.doesNotMatch(emit, /new GameObject|Destroy\(/);

const release = methodBody(vfx, 'private IEnumerator ReleaseAfter(PooledEffect effect, float seconds)');
assert.match(release, /StopEmittingAndClear/);
assert.match(release, /effect\.InUse = false/);

console.log(
  'BATTLE VFX SOURCE PASS — canonical event anchors are forwarded from the battlefield and particle systems are reused with deterministic release. Unity Editor runtime behavior remains a separate gate.',
);
