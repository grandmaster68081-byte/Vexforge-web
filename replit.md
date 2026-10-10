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

- Before preparing this slice, `main` was clean and matched `origin/main` at
  `d4616089f1582c9994544b205a396d56b1c4e95b`.
- Bootstrap APK #2 remains only a pipeline smoke test and is not migration
  progress. APK #3 is the first verified official content slice: 8 auth/session
  scripts, 1,095 lines (6.4457%), zero Unity warnings/errors, 26,697,451-byte
  APK, SHA-256
  `4c61a45f9da457302db858053a0062d3788f2b6f52b7b3f94ec5380de4f031ff`.
  The downloaded artifact hash matches its build report.
- Run #3 restored the prior `unity-bootstrap/Library` using a compatible
  restore-key (1,821,722,229 bytes) and saved a new cache (1,829,028,455
  bytes). Its old summary misreported a restore-key hit as no cache because it
  checked only exact `cache-hit`; the workflow now reports `cache-matched-key`.
- Stage 2 passed in run #4: five official scripts, 1,165 lines (6.8578%),
  bringing the cumulative C# count to 2,260/16,988 (13.3035%). Its only C#
  dependency outside the slice is `Backend/ApiContracts.cs` from stage 1.
  UGUI is already in the bootstrap package manifest. The artifact is 26,772,411
  bytes with SHA-256
  `8a77ab7e4e54bb70569e03d91e9ba3b42ce5c239f2430f96645ad4883bb4f89b`;
  the downloaded APK matches its report and passes ZIP integrity checks.
- Run #4 restored the run #3 cache through a compatible restore-key
  (1,829,028,455 bytes) and saved a new cache (1,831,499,299 bytes). Its Unity
  `BuildReport.summary.totalSize` log value is 621,713,303 bytes; the packaged
  APK size is independently verified as 26,772,411 bytes.
- Tier1 resource assets and the pack-reveal director are intentionally not
  included in this compile-only slice, so it is not a functional pack reveal.
- The bootstrap scene still omits `VexforgeApp`; `unity/**` remains untouched.
  Stage 3 now contains the other 63 canonical C# scripts (14,728 lines), bringing
  the copied runtime script set to 76/76 and 16,988/16,988 lines. Every added
  source hash matches `unity/`; the stage is not yet committed or compiled. It
  intentionally adds no new scenes, Resources, source `.meta` files or other
  excluded Unity project content. Passing this compile test will not prove game
  runtime, scene, resource or full-content parity.
- After stage 3 passes, migrate the remaining canonical Unity project content
  in dependency-closed batches of no more than 10% of the full tracked `unity/`
  inventory (197 files / 35,920,194 bytes at `d4616089`). Do not set a fixed
  number of batches. Continue checking exact source hashes and full APK/cache
  evidence after each successful stage.
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
  cumulative and followed by a complete APK build. Run #2 was only a workflow
  smoke test; runs #3 and #4 validate the first two official content slices.
  The current authorized stage 3 adds all remaining canonical C# scripts at
  once, while still excluding the not-yet-migrated scenes/resources/metadata.
  Only after its APK succeeds do the remaining full-project files move in
  batches capped at 10% of the complete tracked Unity inventory, with no fixed
  number of batches.
  The builder requires a real scene and does not generate placeholders. It does
  not replace or authorize the official game workflow. The user has conditionally
  authorized this migration to continue sequentially without a new prompt for
  each APK, only after the current baseline run succeeds and each later run
  succeeds in turn. Stop after any failure; do not retry without fresh
  authorization.
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

- The user explicitly said not to remove VexforgeSPP. That name is absent from
  the current official Unity tree and repository history; do not treat its
  absence as permission to delete or replace it if its canonical source is
  supplied or found later.
- `SecureSessionStore` contains Android Keystore/AES-GCM code, but Editor/device
  behavior has not been verified.
- Unity source implementation alone does not prove runtime parity; the open
  Editor/device checks remain required evidence.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- Repository cleanup does not count as Unity Editor, device, parity, or security
  verification; keep those checks open until real evidence closes them.
