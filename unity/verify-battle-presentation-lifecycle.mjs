import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(join(projectRoot, relativePath), "utf8");

function methodBody(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `Missing method: ${signature}`);
  const open = source.indexOf("{", start);
  assert.notEqual(open, -1, `Missing method body: ${signature}`);

  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }

  assert.fail(`Unclosed method body: ${signature}`);
}

const app = read("Assets/Scripts/Core/VexforgeApp.cs");
const shell = read("Assets/Scripts/UI/GameShellController.cs");
const bootstrap = read("Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs");
const gate = read("Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs");

const appAwake = methodBody(app, "private void Awake()");
assert.match(appAwake, /PresentationBootstrap\s*=\s*gameObject\.AddComponent<VexforgeTier1Bootstrap>\(\)/);

const appInitialize = methodBody(app, "private async Task InitializeCore()");
assert.match(appInitialize, /PresentationBootstrap\.Initialize\(this\)/);

const shellInitialize = methodBody(shell, "private void InitializeBattlePresentation()");
const directorInitialization = shellInitialize.indexOf("battleDirector.Initialize(");
const ownerBinding = shellInitialize.indexOf("app.PresentationBootstrap.BindCanonicalPresentation(");
assert.ok(directorInitialization >= 0, "GameShellController must initialize the canonical director.");
assert.ok(ownerBinding > directorInitialization, "The runtime owner must bind the canonical presentation after initialization.");
assert.match(shellInitialize, /battlePresentationInitialized\s*=\s*true/);

const shellValidation = methodBody(shell, "internal bool TryGetCanonicalBattlePresentation(");
assert.match(shellValidation, /var ownerScene\s*=\s*gameObject\.scene/);
assert.doesNotMatch(shellValidation, /SceneManager\.GetActiveScene\(\)/);

const bootstrapInitialize = methodBody(bootstrap, "public void Initialize(VexforgeApp owner)");
assert.match(bootstrapInitialize, /Build\(app\)/);
assert.match(bootstrapInitialize, /VexforgeTier1PresentationState\.Initializing/);
assert.match(bootstrapInitialize, /Invoke\(nameof\(HandleCanonicalBindingTimeout\)/);

const bind = methodBody(bootstrap, "public void BindCanonicalPresentation(");
assert.match(bind, /ValidateCandidate\(/);
assert.match(bind, /CancelInvoke\(nameof\(HandleCanonicalBindingTimeout\)\)/);
assert.ok(
  bind.indexOf("PublishCanonicalPresentation(") <
    bind.indexOf("SetPresentationState(VexforgeTier1PresentationState.Ready"),
  "The bootstrap must publish references before declaring readiness."
);

const bootstrapTimeout = methodBody(bootstrap, "private void HandleCanonicalBindingTimeout()");
assert.match(bootstrapTimeout, /FailPresentation\(/);
assert.match(bootstrapTimeout, /GameShellController\.InitializeBattlePresentation/);
const failPresentation = methodBody(bootstrap, "private void FailPresentation(");
assert.match(failPresentation, /VexforgeTier1PresentationState\.FailedRetryable/);

const retry = methodBody(bootstrap, "public void RetryPresentationBinding(");
assert.match(retry, /app\.GetComponent<GameShellController>\(\)/);
assert.match(retry, /TryGetCanonicalBattlePresentation\(/);
assert.doesNotMatch(bootstrap, /FindObjectsByType|StartCoroutine|IEnumerator\s+BindCanonicalPresentation|private void Update\(\)/);

const gateInitialize = methodBody(gate, "public void Initialize(");
assert.match(gateInitialize, /PresentationReadinessChanged\s*\+=\s*HandlePresentationReadinessChanged/);

const gateShow = methodBody(gate, "public void Show()");
assert.match(gateShow, /presentationReadiness\.IsPresentationReady/);
assert.match(gateShow, /canonicalBattle\s*=\s*presentationReadiness\.CanonicalBattle/);

const gateReadinessCallback = methodBody(gate, "private void HandlePresentationReadinessChanged()");
assert.match(gateReadinessCallback, /presentationReadiness\.IsPresentationReady/);
assert.match(gateReadinessCallback, /Show\(\)/);

const gateRetry = methodBody(gate, "private void RetryPresentationBinding()");
assert.match(gateRetry, /PresentationGeneration/);
assert.match(gateRetry, /HandlePresentationReadinessChanged\(\)/);
assert.match(gateRetry, /if\s*\(!presentationReadiness\.IsPresentationReady\)/);

console.log(
  "PASS: static owner-driven lifecycle contract: App initialization -> GameShell binding -> bootstrap readiness -> Battle Gate discovery."
);
console.log("NOTE: this source check does not replace a Unity Play Mode test.");
