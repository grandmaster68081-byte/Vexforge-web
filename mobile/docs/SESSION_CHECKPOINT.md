# VEXFORGE Session Checkpoint

Date: 2026-09-30  
Execution contract: `mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`

## Current milestone — unified runtime foundation

- Official branch: `main`; base commit before this milestone: `e5399050`,
  matching `origin/main`; the worktree was clean before editing.
- Added the first `mobile/game/**` runtime core: 2.5D depth projection,
  camera presets, per-actor motion mapping, event-driven presentation cues,
  pack-opening cue timeline, and guarded world/battle/result flow state.
- Added `scripts/verify-mobile-game-runtime.mjs` and the
  `verify:game-runtime` script. It checks cue alignment, independent actor
  motion, camera/depth projection, pack phases, and the PvP authority guard.
- Validation: existing static verifier, runtime compatibility audit,
  interactive audit (500 deterministic runs), typecheck, and the new runtime
  verifier all pass. No build or deployment was run.
- Live Supabase inspection was read-only. The mission start/settle RPCs accept
  client outcome/result JSON; `resolve_battle_run` accepts `p_won` and a
  caller-supplied snapshot; the client-callable boss attack accepts damage.
  These are not treated as authoritative battle simulation by Expo. The
  existing PvP resolver remains the verified authority boundary.
- Supabase data and schema were not changed.
- NEXT: integrate the runtime into Arena/BattlefieldCanvas, the world-to-PvP
  result path, pack ceremony, tutorial, boss presentation and dev-only Game
  Lab; then verify and push that bounded milestone before continuing.

## Previous continuity checkpoint — documentation only

- **BASE:** official `main` was fetched and confirmed at
  `1446cdd959add695c2405e5caa5a621a742e64ee` before this update.
- **RUNTIME:** Expo / React Native in `mobile/**` is the only active game
  runtime. Unity is preserved legacy and is not a target for new work.
- **EPIC/FAB:** the old acquisition roadmap was retired. Repository audit found
  no Fab payloads, vendor packages or listing identifiers. Card `epic` rarity
  remains ordinary game data.
- **ISOLATION:** Kivora (`faucet/**`, related assets and `*kivora*` migrations)
  was identified as a separate product and left untouched. No Supabase data
  was read or modified as part of this correction.
- **CHANGES:** active repository entrypoints and status docs now point to the
  Expo scope; Unity is explicitly marked legacy; historic contradictory
  records remain labeled as history.
- **VALIDATION:** `git diff --check` passed; runtime code, assets, workflows,
  builds and deployments were not changed or run.
- **NEXT:** follow the existing exact next milestone below: run the mobile
  static verifier and dependency/compatibility audit, then create the smallest
  compatible runtime core without changing the Supabase authority boundary.

## Git

- CURRENT SHA: `397992b10761d67888fdb0cd0f826283617a1d14` before this checkpoint
  finalization commit
- REMOTE MAIN SHA: `397992b10761d67888fdb0cd0f826283617a1d14`
- BRANCH: `main`
- WORKTREE CLEAN: yes after the milestone push

## Completed milestone

- Imported the official `Vexforge-web` repository tree into the persistent
  Project Editor checkout.
- Established `origin` against the official GitHub repository.
- Preserved the active continuation order in `mobile/docs`.
- Audited the actual Expo manifests, mobile routes, battle foundation,
  Supabase client boundary, assets and verifiers.
- Confirmed the referenced Supabase project is live and healthy.
- Ran the existing mobile static verifier successfully.
- Aligned the mobile dependency graph with Expo SDK 54 using the Expo
  compatibility resolver without migrating SDK lines.
- Added a reproducible mobile npm lockfile and the SDK-compatible `expo-asset`
  peer.
- Removed the unsupported `targetSdkVersion` config field and switched Expo
  icon fields to a derived PNG with recorded provenance.

## Files changed

- `replit.md`
- `mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md`
- `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`
- `mobile/docs/SESSION_CHECKPOINT.md`
- `mobile/docs/ASSET_PROVENANCE.md`
- `mobile/assets/images/icon.png`
- `mobile/package-lock.json`

## Assets

- ASSETS GENERATED: none.
- ASSETS VERIFIED: existing official/project-provided mobile asset tree was
  present in `origin/main`; no new art or audio was generated.
- DERIVED ASSET: `vexforge-runtime-icon-png`, SHA-256
  `59968f89076408b6cb488f2fa29c39e73231e61dc77c22c805102e3283fbaaba`.

## Validation

- GitHub fetch: PASS.
- Local branch equals `origin/main` before this milestone: PASS.
- Supabase Management API project check: PASS, HTTP 200,
  `ACTIVE_HEALTHY`.
- Expo dependency resolver: PASS — dependencies up to date for SDK 54.
- Expo Doctor: PASS — 18/18 checks.
- Typecheck: PASS.
- Mobile static verifier: PASS — 23 required files, 40 source files,
  75 runtime assets, zero old Expo references, secret scan clean.
- BUILD STATUS: NOT RUN.
- APK: NOT RUN.
- AAB: NOT RUN.

## Remaining gaps

- The runtime foundation now exists, but `BattlefieldCanvas` and Arena do not
  yet consume the shared 2.5D scene/timeline/camera cues.
- The world-to-authoritative-PvP result path, synchronized audio/haptics,
  pack timeline integration, boss presentation, tutorial integration and
  development-only Game Lab remain to be completed.
- No client-safe, server-simulated authoritative world-boss settlement has
  been verified; do not submit locally calculated win/damage values as
  settlement.

## Exact next milestone

Integrate the runtime foundation into the mobile experience, verify the
vertical slice and presentation surfaces, and push the bounded milestone to
`main` before beginning any further implementation.