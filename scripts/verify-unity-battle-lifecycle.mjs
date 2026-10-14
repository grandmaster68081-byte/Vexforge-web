import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const sources = {
  app: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/Core/VexforgeApp.cs'),
    'utf8',
  ),
  shell: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/UI/GameShellController.cs'),
    'utf8',
  ),
  director: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs'),
    'utf8',
  ),
  stage: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs'),
    'utf8',
  ),
  bootstrap: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs'),
    'utf8',
  ),
  gate: fs.readFileSync(
    path.join(root, 'unity/Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs'),
    'utf8',
  ),
};

const failures = [];

function requireText(source, fragment, label) {
  if (!source.includes(fragment)) failures.push(`${label}: missing ${JSON.stringify(fragment)}`);
}

function requireOrder(source, fragments, label) {
  let previous = -1;
  for (const fragment of fragments) {
    const current = source.indexOf(fragment, previous + 1);
    if (current === -1) {
      failures.push(`${label}: expected ordered step ${JSON.stringify(fragment)}`);
      return;
    }
    previous = current;
  }
}

function requireCount(source, fragment, expected, label) {
  const count = source.split(fragment).length - 1;
  if (count !== expected) {
    failures.push(`${label}: expected ${expected} occurrence(s), found ${count}`);
  }
}

// App owns the sole bootstrap and initializes it after backend/session startup.
requireText(sources.app, 'PresentationBootstrap = GetComponent<VexforgeTier1Bootstrap>();', 'VexforgeApp owner');
requireText(sources.app, 'PresentationBootstrap = gameObject.AddComponent<VexforgeTier1Bootstrap>();', 'VexforgeApp fallback owner');
requireCount(sources.app, 'PresentationBootstrap.Initialize(this);', 2, 'VexforgeApp initialization paths');
requireOrder(
  sources.app,
  ['await Session.RestoreAsync();', 'await GameState.RefreshAsync();', 'PresentationBootstrap.Initialize(this);'],
  'VexforgeApp authenticated initialization',
);

// Shell constructs and initializes one director/stage before explicitly publishing them.
requireOrder(
  sources.shell,
  [
    'await app.InitializeAsync();',
    'BuildBattlePresentationHost();',
    'InitializeBattlePresentation();',
    'battleDirector.Initialize(presentationCamera, artResolver, FindCard, app.GameState.PlayerId);',
    'var battlefield = battleDirector.GetComponentInChildren<VexforgeBattlefieldStage>(true);',
    'battlePresentationInitialized = true;',
    'app.PresentationBootstrap.BindCanonicalPresentation(',
  ],
  'GameShellController startup and binding',
);
requireText(sources.shell, 'battlePresentationInitialized = true;', 'GameShellController initialized guard');
requireText(sources.shell, 'TryGetCanonicalBattlePresentation(', 'GameShellController canonical references');
requireText(sources.shell, 'director.IsInitialized', 'GameShellController director validation');
requireText(sources.shell, 'stage.IsInitialized', 'GameShellController battlefield validation');
requireText(sources.shell, 'resolver.IsDisposed', 'GameShellController art resolver validation');

// Director and stage expose their initialized state only after their setup completes.
requireOrder(
  sources.director,
  ['battlefield.Initialize(camera, resolver, cardLookup, localPlayerId);', 'initialized = true;'],
  'BattlePresentationDirector initialization',
);
requireOrder(
  sources.stage,
  ['BuildArena();', 'initialized = true;'],
  'VexforgeBattlefieldStage initialization',
);
requireText(
  sources.stage,
  'ResolveBattlefieldMeshMaterial',
  'VexforgeBattlefieldStage authored material resolver',
);

// Bootstrap validates, publishes exactly those references, then reports Ready.
requireOrder(
  sources.bootstrap,
  [
    'if (!ValidateCandidate(director, stage, resolver, camera, out reason))',
    'PublishCanonicalPresentation(director, stage, resolver, camera);',
    'if (!ValidatePublishedPresentation(out reason))',
    'SetPresentationState(VexforgeTier1PresentationState.Ready, null);',
  ],
  'VexforgeTier1Bootstrap canonical readiness',
);
requireText(sources.bootstrap, 'gate.BindCanonicalBattle(director);', 'Bootstrap Battle Gate binding');
if (/using\s+System\.Reflection|FindObjects(?:OfType|ByType)|\b600\s*(?:frames|f)/i.test(sources.bootstrap)) {
  failures.push('VexforgeTier1Bootstrap: reflection or scene-wide polling returned to canonical binding');
}

// Gate remains closed until the canonical director is Ready and initialized.
requireOrder(
  sources.gate,
  [
    'if (presentationReadiness == null || !presentationReadiness.IsPresentationReady)',
    'canonicalBattle = presentationReadiness.CanonicalBattle;',
    '_ = DiscoverAsync();',
  ],
  'VexforgeTier1BattleGate.Show readiness gate',
);
requireOrder(
  sources.gate,
  [
    '!presentationReadiness.IsPresentationReady',
    'canonicalBattle != presentationReadiness.CanonicalBattle',
    '!canonicalBattle.IsInitialized',
    'app.Repository.GetPvpOpponentsAsync(8)',
  ],
  'VexforgeTier1BattleGate opponent discovery',
);
requireText(sources.gate, 'RetryPresentationBinding,', 'Battle Gate recoverable retry action');

if (failures.length > 0) {
  console.error('UNITY BATTLE LIFECYCLE STATIC CONTRACT FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'UNITY BATTLE LIFECYCLE STATIC CONTRACT PASS — verified app → shell → director/stage → bootstrap → gate discovery source ordering. ' +
  'This is not Unity compilation or Play Mode evidence.',
);
