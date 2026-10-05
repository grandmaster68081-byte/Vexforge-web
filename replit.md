# VEXFORGE — Unity Android Runtime

Unity under `unity/**` is the only active Android game runtime. The current
migration order is `VEXFORGE_UNITY_MIGRATION_MASTER_V1`; operational context is
in `VEXFORGE_CONTEXT.md` and `docs/vexforge-canonical/`.

## Active scope

- Work on `unity/**` as the only active game runtime.
- Expo/React Native source under `mobile/**` was removed in Hito 10 on
  2026-10-05 at `77d31b5d` by explicit user direction while parity gates were
  still open. Do not restore it or treat its removal as proof of parity.
- Use the retained migration inventory and historical records only as
  pre-retirement evidence; Unity Editor/device verification remains open.
- Do not port Expo Router, React Native, Metro, Skia, or gameplay JavaScript
  into Unity. Reimplement only required behavior in C# and native Unity APIs.
- Keep Supabase authoritative for identity, ownership, combat, settlement,
  economy, progress, and rewards.
- Keep the web portal (`src/**`, `public/**`) frozen; preserve `faucet/**` and
  its Kivora assets/migrations as a separate product.
- The official branch is `main`; every completed milestone must be committed
  and pushed to `origin/main`.
- Before each milestone: `git fetch --prune origin`; confirm `main`, a clean
  tree, and `HEAD == origin/main`. Commit and push each completed milestone
  before beginning the next.
- Never reset, rebase, merge, cherry-pick, or force-push the official branch.
- Responses to the user are in Spanish.

Frozen or out of scope:

- `src/**` and `public/**` web portal code.
- `faucet/**`, Kivora migrations, and its assets.
- Supabase live schema, RPC, RLS, authentication, and backend rules.
- Old ZIPs and historical documentation except as evidence when referenced by
  the migration inventory.

`faucet/**` is the separate Kivora product. Keep it and its migrations/assets
isolated; do not include them in VEXFORGE work or delete them as part of this
scope.

No Epic/Fab asset payloads or listing identifiers were found in the repository.
Epic/Fab sourcing is retired from the active direction. The game's `epic`
card rarity is unrelated and must remain intact.

## Run & verify

Unity Editor/device validation is not available in this environment. Do not
claim Unity compilation, Android behavior, or parity without corresponding
evidence. No APK/AAB build is authorized or required during this migration.

The root `npm run verify`, `npm run typecheck`, and `npm run build` commands
apply to the frozen web portal, not to Unity. The Expo project and its checks
are retired. No Unity Android workflow is currently configured; the user has
deferred creating a dedicated Unity workflow to a later step. Do not generate
APK/AAB files during this migration.

## Runtime stack

- Unity Editor `6000.3.0f1`
- Android package `com.vexforge.android`
- C# / Unity runtime under `unity/**`
- Expo/React Native runtime source has been retired; only historical migration
  records remain.

## Where things live

- `unity/Assets/Scripts/Core/` — app bootstrap, state and navigation.
- `unity/Assets/Scripts/Backend/` — Supabase client, contracts and repositories.
- `unity/Assets/Scripts/Presentation/` and `Tier1/` — world, battle, tutorial,
  audio and other runtime presentation.
- `unity/Assets/` — Unity scenes and project assets.
- `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json` — tracked
  pre-retirement source snapshot and per-capability migration decisions.
- `docs/vexforge-canonical/30_EXPO_UNITY_ASSET_MIGRATION_MANIFEST.json` —
  pre-retirement asset provenance snapshot; its file counts describe that
  snapshot, not the current tree.
- `supabase/`, `backend/` — existing authority/contracts; do not change their
  behavior for this client migration.
- `src/`, `public/` — frozen web portal; `faucet/` — separate Kivora product.

## Architecture decisions

- Supabase remains authoritative for authentication, ownership, combat
  settlement, rewards and economy; presentation must not calculate them.
- Implement Unity behavior from the retained migration evidence and existing
  backend contracts; do not reintroduce the Expo JavaScript runtime or duplicate
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
- The historical Expo tactical lab was not ported as the competitive battle
  resolver; Supabase remains authoritative for combat settlement.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- The user authorized retiring `mobile/**` before the documented gates passed.
  Keep those gates marked open until real evidence closes them; the deletion is
  not a parity or security pass.
