# VEXFORGE — Unity Android Runtime

Unity under `unity/**` is the only active Android game runtime. The current
migration order is `VEXFORGE_UNITY_MIGRATION_MASTER_V1`; operational context is
in `VEXFORGE_CONTEXT.md` and `docs/vexforge-canonical/`.

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
- Keep the official branch on `main`; before milestones, fetch and confirm a
  clean tree with `HEAD == origin/main`. Commit and push completed work.
- Never reset, rebase, merge, cherry-pick, or force-push the official branch.
- Responses to the user are in Spanish.

Out of scope unless requested:

- Changes to `src/**`, `public/**`, or `unity/**` during repository cleanup.
- Supabase live schema, RPC, RLS, authentication, data, and backend rules.
- Unity builds, APK/AAB generation, releases, and Unity Cloud Build.

No Epic/Fab asset payloads or listing identifiers were found in the repository.
Epic/Fab sourcing is retired from the active direction. The game's `epic`
card rarity is unrelated and must remain intact.

## Run & verify

Unity Editor/device validation is not available in this environment. Do not
claim Unity compilation, Android behavior, or parity without corresponding
evidence. The workflow is manual and has not been dispatched. Do not generate
APK/AAB files without separate authorization.

The root `npm run verify`, `npm run typecheck`, and `npm run build` commands
apply to the web portal, not to Unity.

## Runtime stack

- Unity Editor `6000.3.0f1`
- Android package `com.vexforge.android`
- C# / Unity runtime under `unity/**`

## Where things live

- `unity/Assets/Scripts/Core/` — app bootstrap, state and navigation.
- `unity/Assets/Scripts/Backend/` — Supabase client, contracts and repositories.
- `unity/Assets/Scripts/Presentation/` and `Tier1/` — world, battle, tutorial,
  audio and other runtime presentation.
- `unity/Assets/` — Unity scenes and project assets.
- `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` — manual build boundaries.
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
