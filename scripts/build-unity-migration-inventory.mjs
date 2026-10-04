import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const outputPath = "docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json";
const tracked = (pathspec) => {
  const result = execFileSync("git", ["ls-files", "--", pathspec], { encoding: "utf8" });
  return result.split(/\r?\n/).filter(Boolean).sort();
};
const trackedMobileFiles = tracked("mobile");
const trackedWorkflowFiles = tracked(".github/workflows");

const scopeDefinitions = [
  ["expo-app", "mobile/app"],
  ["expo-engine", "mobile/src/engine"],
  ["expo-render", "mobile/src/render"],
  ["expo-services", "mobile/src/services"],
  ["expo-context", "mobile/context"],
  ["expo-lib", "mobile/lib"],
  ["expo-constants", "mobile/constants"],
  ["expo-game", "mobile/game"],
  ["expo-components", "mobile/src/components"],
  ["expo-assets", "mobile/assets"],
  ["expo-scripts", "mobile/scripts"],
  ["expo-docs", "mobile/docs"],
  ["unity-core", "unity/Assets/Scripts/Core"],
  ["unity-session", "unity/Assets/Scripts/Session"],
  ["unity-backend", "unity/Assets/Scripts/Backend"],
  ["unity-game-state", "unity/Assets/Scripts/GameState"],
  ["unity-presentation", "unity/Assets/Scripts/Presentation"],
  ["unity-ui", "unity/Assets/Scripts/UI"],
  ["unity-tier1", "unity/Assets/Scripts/Tier1"],
  ["unity-scenes", "unity/Assets/Scenes"],
  ["unity-packages", "unity/Packages"],
  ["unity-project-settings", "unity/ProjectSettings"],
  ["unity-runtime-assets", "unity/Assets/Resources/VexforgeTier1"],
].map(([id, path]) => ({ id, path, files: tracked(path) }));

scopeDefinitions.push({
  id: "expo-package-and-config",
  path: "tracked mobile package/app/build configuration",
  files: trackedMobileFiles.filter((path) =>
    /^mobile\/(?:package(?:-lock)?\.json|app\.json|app\.config\.[^/]+|eas\.json|metro\.config\.[^/]+|babel\.config\.[^/]+|tsconfig(?:\.[^/]+)?\.json)$/.test(path),
  ),
});
scopeDefinitions.push({
  id: "github-workflows",
  path: ".github/workflows",
  files: trackedWorkflowFiles,
});
scopeDefinitions.push({
  id: "unity-assets",
  path: "unity/Assets",
  files: tracked("unity/Assets"),
});
for (const scope of scopeDefinitions) scope.fileCount = scope.files.length;

const capabilities = [
  {
    id: "android-runtime-and-bootstrap",
    classification: "KEEP_UNITY",
    evidence: [
      { path: "unity/Assets/Scripts/Core/VexforgeApp.cs", behavior: "Unity application bootstrap and service composition." },
      { path: "unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs", behavior: "Unity runtime presentation bootstrap." },
      { path: "unity/ProjectSettings/ProjectSettings.asset", behavior: "Android application identity is configured for Unity." },
    ],
    decision: "Keep Unity as the sole Android runtime; Expo is a migration reference, not an additional runtime.",
  },
  {
    id: "authentication-and-session",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo repository exposes email sign-in, email sign-up, and sign-out; no reset or provider flow was found." },
      { path: "mobile/src/app/GameProvider.tsx", behavior: "Expo observes session state and persists tutorial/quality preferences." },
      { path: "unity/Assets/Scripts/Backend/SupabaseAuthService.cs", behavior: "Unity implements email sign-in/sign-up, confirmation-required handling, refresh/restore, and remote sign-out with local cleanup." },
      { path: "unity/Assets/Scripts/Session/SessionService.cs", behavior: "Unity exposes generic player-facing auth feedback and an explicit email-confirmation state." },
      { path: "unity/Assets/Scripts/UI/GameShellController.cs", behavior: "Unity provides sign-in and account-creation actions." },
      { path: "unity/Assets/Scripts/Session/SecureSessionStore.cs", behavior: "Unity code uses Android Keystore-backed AES/GCM session storage; device behavior is unverified." },
    ],
    decision: "Port only supported email auth/session behavior; the live project requires email confirmation and has no external provider enabled. Keep credentials in secure storage and verify on Android before declaring parity.",
  },
  {
    id: "player-state-and-settings",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/app/GameProvider.tsx", behavior: "Expo persists quality and tutorial progress locally and tracks auth readiness." },
      { path: "unity/Assets/Scripts/GameState/GameStateStore.cs", behavior: "Unity loads profile, progress, and player insight state through the existing store." },
      { path: "unity/Assets/Scripts/Backend/VexforgeRepository.cs", behavior: "Unity reads player statistics and rank through the same existing read-only RPC contracts used by Expo." },
      { path: "unity/Assets/Scripts/Core/PersistentRuntimeState.cs", behavior: "Unity persists reduced-motion preference and last route." },
    ],
    decision: "Match useful player-state reads while keeping persistent player progress and competitive rank authoritative in Supabase; keep device-local presentation preferences separate.",
  },
  {
    id: "catalog-collection-and-card-detail",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo reads the active card catalogue, player collection, and card detail data." },
      { path: "unity/Assets/Scripts/Backend/VexforgeRepository.cs", behavior: "Unity exposes catalogue/collection reads." },
      { path: "unity/Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs", behavior: "Unity renders a virtualized card gallery." },
    ],
    decision: "Port collection filters, inspection, and useful empty/error states without replacing canonical card data or artwork.",
  },
  {
    id: "deck-and-formation",
    classification: "REUSE_SHARED_BACKEND_CONTRACT",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo validates and saves decks and stores match formations through RPCs." },
      { path: "unity/Assets/Scripts/Backend/VexforgeRepository.cs", behavior: "Unity uses the existing deck/formation backend contracts." },
    ],
    decision: "Reuse current Supabase contracts; port the interaction flow only, and do not duplicate validation authority.",
  },
  {
    id: "competitive-battle-resolution",
    classification: "REUSE_SHARED_BACKEND_CONTRACT",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo resolves PvP through vexforge_battle_resolve and validates the result." },
      { path: "unity/Assets/Scripts/Backend/VexforgeRepository.cs", behavior: "Unity resolves PvP through the existing backend call." },
      { path: "unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs", behavior: "Unity consumes returned events for presentation." },
    ],
    decision: "Supabase remains the only competitive resolver and settlement authority; never port the local Expo tactical lab into competitive play.",
  },
  {
    id: "battle-event-presentation-and-replay",
    classification: "PORT_EXPO_BEHAVIOR_INTO_UNITY",
    evidence: [
      { path: "mobile/src/engine/presentation.ts", behavior: "Expo classifies event types into presentation categories." },
      { path: "mobile/src/engine/replay.ts", behavior: "Expo constructs replay frames from authoritative result events." },
      { path: "unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs", behavior: "Unity sequences the event presentation; replay controls/parity remain unverified." },
    ],
    decision: "Port event semantics, pacing, replay controls, and skip behavior without porting battle rules.",
  },
  {
    id: "pack-purchase-and-opening",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo buys/opens packs through RPCs and validates server-returned opened cards." },
      { path: "mobile/game/packTimeline.ts", behavior: "Expo defines staged, interactive reveal cues with audio and haptic intent." },
      { path: "unity/Assets/Scripts/Tier1/VexforgeTier1PackRevealDirector.cs", behavior: "Unity currently displays a timed vault/relic sequence without card-by-card interaction." },
    ],
    decision: "Connect the Unity ceremony to the authoritative order/open result, then port interaction and reveal semantics.",
  },
  {
    id: "world-boss-and-tutorial",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/app/world.tsx", behavior: "Expo exposes world/boss/raid surfaces backed by repository data." },
      { path: "mobile/app/tutorial.tsx", behavior: "Expo provides a tutorial route and persisted tutorial progression." },
      { path: "unity/Assets/Scripts/Tier1/VexforgeTier1TutorialDirector.cs", behavior: "Unity tutorial is integrated with the authorized battle gate." },
      { path: "unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs", behavior: "Unity presents structural boss arrival/event cues." },
    ],
    decision: "Port supported navigation and tutorial semantics; keep boss damage and rewards server-authoritative.",
  },
  {
    id: "audio-cues",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/render/AudioCues.tsx", behavior: "Expo maps presentation categories to runtime audio cues." },
      { path: "unity/Assets/Scripts/Tier1/VexforgeTier1AudioDirector.cs", behavior: "Unity maps a subset of battle event types to locally loaded clips." },
    ],
    decision: "Port cue taxonomy and user settings where source behavior exists; audio must remain optional and never affect rules.",
  },
  {
    id: "haptics",
    classification: "PORT_EXPO_BEHAVIOR_INTO_UNITY",
    evidence: [
      { path: "mobile/src/app/GameProvider.tsx", behavior: "Expo exposes selection, impact, success, and warning haptics." },
      { path: "mobile/game/packTimeline.ts", behavior: "Pack timeline stages declare semantic haptic cues." },
    ],
    decision: "Implement a native Unity haptic service only for the existing semantic cues; fail safely when unsupported.",
  },
  {
    id: "reduced-motion-and-quality",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/render/VexforgeSceneStage.tsx", behavior: "Expo rendering checks reduced-motion preference." },
      { path: "unity/Assets/Scripts/Core/PersistentRuntimeState.cs", behavior: "Unity persists a reduced-motion preference." },
      { path: "unity/Assets/Scripts/Tier1/VexforgeTier1QualityDirector.cs", behavior: "Unity selects presentation quality budgets." },
    ],
    decision: "Connect reduced-motion state to Unity animation/camera/VFX and preserve the rule that quality changes presentation only.",
  },
  {
    id: "economy-market-and-rewards",
    classification: "REUSE_SHARED_BACKEND_CONTRACT",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo wallet, shop, market, fusion, withdrawal, and reward mutations use Supabase RPCs." },
      { path: "unity/Assets/Scripts/Backend/VexforgeRepository.cs", behavior: "Unity consumes existing player/economy contracts." },
    ],
    decision: "Port only UI flows with current backend contracts; keep prices, eligibility, balances, and settlement authoritative server-side.",
  },
  {
    id: "social",
    classification: "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    evidence: [
      { path: "mobile/src/services/repository.ts", behavior: "Expo calls current friend, private/global chat, clan, and presence RPCs." },
      { path: "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs", behavior: "Unity contains a social repository boundary." },
      { path: "unity/Assets/Scripts/UI/VexforgeSocialHub.cs", behavior: "Unity contains a social UI surface." },
    ],
    decision: "Compare each screen/action to its live contract and port only supported behavior.",
  },
  {
    id: "telemetry",
    classification: "NOT_APPLICABLE",
    evidence: [
      { path: "mobile/src", behavior: "No Expo analytics/telemetry integration was found in the inspected runtime source." },
    ],
    decision: "Do not invent telemetry events or backend contracts. Revisit only if an existing source contract is found.",
  },
  {
    id: "boss-identity-art",
    classification: "CONTENT_GAP",
    evidence: [
      { path: "unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs", behavior: "Current boss arrival can use a structural primitive presentation." },
      { path: "unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json", behavior: "Foundation uses a resource manifest; separable identity art needs an asset-level audit." },
    ],
    decision: "Do not substitute generated art; verify official/separable boss art and manifest provenance before closing this gap.",
  },
  {
    id: "web-portal",
    classification: "NOT_APPLICABLE",
    evidence: [
      { path: "src", behavior: "Existing web portal is frozen and is not an Android game runtime." },
    ],
    decision: "Preserve unchanged.",
  },
  {
    id: "kivora-faucet",
    classification: "NOT_APPLICABLE",
    evidence: [
      { path: "faucet", behavior: "Separate Kivora product and migrations." },
    ],
    decision: "Preserve unchanged and outside VEXFORGE runtime migration scope.",
  },
  {
    id: "expo-removal-parity-gate",
    classification: "CONTENT_GAP",
    evidence: [
      { path: "docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md", behavior: "Editor, device, parity, security, and deletion verification remain required." },
    ],
    decision: "Keep mobile/** until every removal gate is satisfied with evidence.",
  },
];

const inventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baselineCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  classificationValues: [
    "KEEP_UNITY",
    "EXTEND_UNITY_WITH_EXPO_CAPABILITY",
    "PORT_EXPO_BEHAVIOR_INTO_UNITY",
    "REUSE_SHARED_BACKEND_CONTRACT",
    "CONTENT_GAP",
    "NOT_APPLICABLE",
  ],
  decisionRule: "Each capability has exactly one classification, based on inspected implementation and the existing Supabase contract, not filenames.",
  scopes: scopeDefinitions,
  capabilities,
  gates: {
    inventory: "RECORDED",
    unityEditorCompilation: "NOT_VERIFIED",
    androidDeviceBehavior: "NOT_VERIFIED",
    capabilityParity: "OPEN",
    securityAndRemovalReview: "OPEN",
    mobileDeletion: "BLOCKED_UNTIL_ALL_GATES_PASS",
    androidApkOrAabBuild: "NOT_RUN_AND_NOT_REQUIRED_BY_THIS_MIGRATION",
  },
  authorityBoundary: {
    androidRuntime: "unity/**",
    behaviorReferenceUntilParity: "mobile/**",
    backendAuthority: "Supabase live",
    frozenWebPortal: ["src/**", "public/**"],
    separateProductToPreserve: ["faucet/**", "supabase/migrations/*kivora*"],
    forbiddenClientAuthority: ["competitive battle resolution", "ownership", "economy settlement", "rewards"],
  },
};

writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(`Wrote ${outputPath}: ${scopeDefinitions.length} source scopes, ${capabilities.length} capability decisions.`);