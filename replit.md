# VEXFORGE — Unity Android Runtime

Unity under `unity/**` remains the untouched source of truth for the official
Android game. The separate `unity-bootstrap/**` project is the experimental,
incremental destination; the goal is to add all required original code, scenes,
assets and dependencies over multiple authorized APK builds until the complete
game is represented there. It is not permission to change the official source.
Read
`docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md` before changing or building
it. The current game migration order is
`VEXFORGE_UNITY_MIGRATION_MASTER_V1`; operational context is in
`VEXFORGE_CONTEXT.md` and `docs/vexforge-canonical/`.

## Current Bootstrap migration checkpoint (2026-10-10)

- The latest repository baseline reviewed for this handoff is `main` at
  `e62b9dc` (`Prevent placeholder scenes in bootstrap builds`).
- Bootstrap APK #2 is only a pipeline smoke test. It used an empty generated
  scene, so it contains no migrated official game content and is not migration
  progress. Its build report and hash are documented in
  `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.
- `unity-bootstrap/` currently has project settings, package manifests, and a
  build entry point, but no copied official scene or gameplay. The builder now
  fails if the real Vexforge scene is missing; it cannot silently create a
  placeholder.
- Its automated check only verifies that the configured scene file exists; it
  cannot prove official provenance or dependency completeness. Review both
  against `unity/` before accepting a slice.
- Next, inspect the official Unity startup scene and its dependency closure in
  `unity/**`, then choose and copy the smallest coherent, genuine game slice.
  `VexforgeApp` is not a standalone trivial file: it wires backend, session,
  game state, navigation, and `GameShellController`. Verify dependencies from
  source; never substitute invented content.
- The current conditional authorization for sequential Bootstrap builds is
  recorded below and in the workflow guide. The next APK must contain the first
  accepted official slice; do not dispatch a build before that content is
  committed and the guide's preflight is satisfied.
- Supabase's project status was checked read-only as `ACTIVE_HEALTHY`; this
  handoff made no Supabase changes. Unity Cloud Build is not part of this path.

## Active scope

- Unity under `unity/**` is the Android game runtime.
- The official web portal is under `src/**` and `public/**`; leave it unchanged
  unless the user directly requests portal work.
- Supabase remains authoritative for identity, ownership, combat, settlement,
  economy, progress, and rewards. Do not alter the live project unless directly
  authorized.
- The manual Unity workflow is
  `.github/workflows/vexforge-unity-android-github.yml`. Its shard mode has 12
  partitions and a 35,000-variant cap per shard. `normal` and `final` are
  unfiltered and have no variant cap. Do not dispatch or build without separate
  authorization.
- The experimental workflow
  `.github/workflows/vexforge-unity-bootstrap-android.yml` builds only
  `unity-bootstrap/**`, manually, on `main`. Each accepted content slice is
  cumulative and followed by a complete APK build. The successful run #2 was
  only a workflow smoke test: its builder generated an empty default scene, so
  it contains no migrated game content and is not a migration milestone. The
  builder now requires a real scene; future APKs must contain official Vexforge
  content rather than generated placeholders. It does not replace or
  authorize the official game workflow. The user has conditionally authorized
  this migration to continue sequentially without a new prompt for each APK,
  only after the current baseline run succeeds and each later run succeeds in
  turn. Stop after any failure; do not retry without fresh authorization.
  Follow its dedicated operations guide.
- Keep the official branch on `main`; before milestones, fetch and confirm a
  clean tree with `HEAD == origin/main`. Commit and push completed work.
- Never reset, rebase, merge, cherry-pick, or force-push the official branch.
- Responses to the user are in Spanish.

Out of scope unless requested:

- Changes to `src/**`, `public/**`, or `unity/**` during repository cleanup.
- Supabase live schema, RPC, RLS, authentication, data, and backend rules.
- Official game builds, APK/AAB releases, and Unity Cloud Build unless directly
  requested.
- Bootstrap APK/AAB builds outside the current, success-conditioned migration
  authorization.

No Epic/Fab asset payloads or listing identifiers were found in the repository.
Epic/Fab sourcing is retired from the active direction. The game's `epic`
card rarity is unrelated and must remain intact.

## Run & verify

Unity Editor/device validation is not available in this environment. Do not
claim Unity compilation, Android behavior, or parity without corresponding
evidence. The official game workflow remains manual and has not been dispatched.
Bootstrap builds use their separate manual workflow. The active migration may
continue after a successful APK without asking again; stop and report on failure.
A successful bootstrap APK build is not device verification or gameplay parity.

The root `npm run verify`, `npm run typecheck`, and `npm run build` commands
apply to the web portal, not to Unity.

## Runtime stack

- Unity Editor `6000.3.0f1`
- Android package `com.vexforge.android`
- C# / Unity runtime under `unity/**`
- Experimental bootstrap package `com.vexforge.bootstrap` under
  `unity-bootstrap/**`; not a gameplay runtime.

## Where things live

- `unity/Assets/Scripts/Core/` — app bootstrap, state and navigation.
- `unity/Assets/Scripts/Backend/` — Supabase client, contracts and repositories.
- `unity/Assets/Scripts/Presentation/` and `Tier1/` — world, battle, tutorial,
  audio and other runtime presentation.
- `unity/Assets/` — Unity scenes and project assets.
- `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` — manual build boundaries.
- `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md` — isolated project,
  incremental content, manual APK, cache, secret and verification rules.
- `docs/vexforge-canonical/UNITY_INCREMENTAL_VARIANT_BATCHES.md` — shard and
  checkpoint operations.
- `supabase/`, `backend/` — existing authority/contracts; do not change their
  behavior for this client migration.
- `src/`, `public/` — official web portal.

## Architecture decisions

- Supabase remains authoritative for authentication, ownership, combat
  settlement, rewards and economy; presentation must not calculate them.
- Implement Unity behavior against existing backend contracts; do not duplicate
  the backend's authority.
- Official card artwork is canonical and must not be repainted or silently
  replaced by generated art.
- A local laboratory or training presentation must be labelled as such and
  cannot be promoted to competitive settlement.
- Quality, animation, audio, haptics, and reduced-motion settings affect
  presentation only, never game rules.
- Every bounded milestone receives targeted validation, a checkpoint update,
  a commit and a push to `main`.

## Supabase

- Project: `rscuzqnfccqvltkdcdny`
- URL: `https://rscuzqnfccqvltkdcdny.supabase.co`
- Runtime code requires the public client configuration; PATs are never stored
  in source files or runtime bundles.

## Gotchas

- `SecureSessionStore` contains Android Keystore/AES-GCM code, but Editor/device
  behavior has not been verified.
- Unity source implementation alone does not prove runtime parity; the open
  Editor/device checks remain required evidence.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- Repository cleanup does not count as Unity Editor, device, parity, or security
  verification; keep those checks open until real evidence closes them.
