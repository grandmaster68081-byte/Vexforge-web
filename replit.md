# VEXFORGE — Unity Android Runtime

Unity under `unity/**` is the only active Android game runtime. The current
migration order is `VEXFORGE_UNITY_MIGRATION_MASTER_V1`; operational context is
in `VEXFORGE_CONTEXT.md` and `docs/vexforge-canonical/`.

## Active scope

- Work on `unity/**` as the target runtime; use `mobile/**` only as the
  behavior reference until Unity parity and removal gates pass.
- Do not port Expo Router, React Native, Metro, Skia, or gameplay JavaScript
  into Unity. Reimplement only required behavior in C# and native Unity APIs.
- Keep Supabase authoritative for identity, ownership, combat, settlement,
  economy, progress, and rewards.
- Keep the web portal (`src/**`, `public/**`) frozen; preserve `faucet/**` and
  its Kivora assets/migrations as a separate product.
- Do not delete `mobile/**` until all parity, verification, and removal gates
  pass.
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

While Expo source remains, its checks may be used only as reference-source
checks, not as proof of Unity parity:

- `cd mobile && npm install` — install pinned reference-runtime dependencies
  only when needed.
- `npm run verify` — run the repository's static mobile release verifier.
- `npm run typecheck` — run the mobile TypeScript check.
- `npm run doctor` — run Expo Doctor.

Do not run EAS, APK/AAB generation, store deployment, or production deployment.

## Runtime stack

- Unity Editor `6000.3.0f1`
- Android package `com.vexforge.android`
- C# / Unity runtime under `unity/**`
- Expo SDK 54 / React Native 0.81.5 are legacy reference-source versions,
  not the active game runtime.

## Where things live

- `unity/Assets/Scripts/Core/` — app bootstrap, state and navigation.
- `unity/Assets/Scripts/Backend/` — Supabase client, contracts and repositories.
- `unity/Assets/Scripts/Presentation/` and `Tier1/` — world, battle, tutorial,
  audio and other runtime presentation.
- `unity/Assets/` — Unity scenes and project assets.
- `mobile/app/`, `mobile/src/`, `mobile/game/`, `mobile/assets/` — migration
  reference until the removal gate passes.
- `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json` — tracked
  file manifest and per-capability migration decisions.
- `supabase/`, `backend/` — existing authority/contracts; do not change their
  behavior for this client migration.
- `src/`, `public/` — frozen web portal; `faucet/` — separate Kivora product.

## Architecture decisions

- Supabase remains authoritative for authentication, ownership, combat
  settlement, rewards and economy; presentation must not calculate them.
- Port required Expo behavior into Unity without carrying over the JavaScript
  engine or duplicating the backend's authority.
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
- Unity's pack-reveal component currently plays a visual sequence; it does not
  by itself prove the Expo pack purchase/opening flow is at parity.
- Expo's deterministic local tactical lab is not server settlement and must
  not be ported as the competitive battle resolver.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- Never claim `mobile/**` is removable before every documented gate passes.
