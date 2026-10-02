# VEXFORGE Session Checkpoint

Date: 2026-10-02
Execution contract: `mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`

## Current milestone — preserve official support PNG bytes in APKs

- Official branch: `main`; fix commit `5d758d3e481abe569a7671d25aa5a1c69c6c2f3f`, verified on `origin/main`.
- Android run 71 (`37055176365`, commit `b46692f`) passed Android export and Gradle APK compilation but failed final verification because the APK did not contain the exact official hashes for nine support PNGs. Release and direct-download steps were skipped.
- The export verifier already checks all 75 original hashes. The APK verifier now separately requires exact-byte copies of the nine official support PNGs under `assets/vexforge-critical/`; the native config plugin stages them into Android's raw assets directory during `expo prebuild --clean`.
- Existing React Native image imports remain unchanged. No game behavior, source art/audio, Supabase data/schema/RPC, Unity, web portal, or Kivora files were changed; no assets were generated.
- Validation: Android prebuild staged 9/9 PNGs with matching official SHA-256 values; Android export produced the embedded Hermes bundle and passed all 75/75 hashes; `audit:all` passed, `verify:game-runtime` passed 18/18 checks, Expo workflow returned `packager-status:running`, and `git diff --check` passed.
- Official Android run 72 (`37058644987`) built commit `5d758d3e` and completed successfully. The APK hash verification, release publication, and direct-link step all passed; all 75 official runtime asset hashes were verified inside the APK.
- Release tag: `vexforge-android-72`; APK size: 170,702,075 bytes; direct download: `https://github.com/grandmaster68081-byte/Vexforge-web/releases/download/vexforge-android-72/VEXFORGE-1.10.0-Android-72.apk` (HTTP 200).
- BUILD STATUS = SUCCESS; APK compiled and published by official run 72.

## Files changed in the current milestone

- `mobile/app.json`
- `mobile/docs/BUILD_HANDOFF.md`
- `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`
- `mobile/docs/SESSION_CHECKPOINT.md`
- `mobile/plugins/withCriticalPngAssets.js`
- `mobile/scripts/verify-android-apk-assets.mjs`

## Previous milestone — actor rig, timeline tracks, and interactive QA

- Added procedural, per-actor rig profiles for idle, anticipation, attack, hit, cast, guard, stagger, status, heal, defeat, victory, summon, phase, and reveal. The existing official card art remains the actor body; torso, arms, cloak, and weapon animate as separate parts.
- Camera presets can focus the event actor or target. Runtime cues carry actor, camera, VFX, audio, haptic, and HUD tracks with timing, targets, easing, completion, skip, and reduced-motion metadata.
- `BattlefieldCanvas` exposes six scene layers and honors reduced-motion settings for camera, actors, flashes, and VFX. Game Lab can toggle layers, select battlefield targets for its local drill, and inspect individual timeline cues.
- The development-only boss fixture is rendered as a battlefield actor for QA; it remains presentation/training only. PvP outcomes still require the existing server resolver.
- At that checkpoint, dependencies and native-device/PvP acceptance were still pending. No production Supabase data/schema/RPC was changed.
- BUILD STATUS = NOT RUN.

## Earlier milestone — live battlefield runtime integration

- Official branch: `main`; implementation base `d974caa85b3dc54c7715e79dc63bd1cccfbb9b87`, confirmed equal to `origin/main` before editing.
- `BattlefieldCanvas` now consumes shared 2.5D actor projections, per-actor motion, camera cues, viewport-local VFX, synchronized audio and haptics. Arena replay and local drills use the same presentation runtime; the tutorial reuses that battlefield.
- Arena now has a shared-header PvP entry from the world, server-result gating through `GameFlow` / `isAuthoritativeResult`, synchronized replay cues, and a return-to-world action. The client still does not calculate or settle competitive results.
- `PackOpeningCeremony` consumes stage and card-reveal timeline cues for camera, timing, audio and haptics.
- Added a development-only Game Lab route for actor/camera/event inspection, local tactical drills, pack ceremony and boss presentation. The route is guarded in development code and its entry is hidden outside development builds.
- Boss scenes remain presentation-only. No client damage, rewards, economy settlement, Supabase data, schema or RPC changes were made.
- Validation: `npm --prefix mobile run verify` passed (24 required files, 56 source files, 75 assets, secret scan clean); `verify:game-runtime`, typecheck, `audit:battle` (2,500 runs), `audit:interactive` (500 runs), `audit:release`, and `git diff --check` passed.
- Expo workflow restarted successfully. `/status` returned `packager-status:running` from both localhost:8000 and the proxied development domain. No APK/AAB, EAS build, or deployment was run.
- Authenticated live PvP was not exercised in this implementation; server authority remains enforced in the app code.
- Kept the environment's `.replit` port-mapping update after confirming the running Expo server is reachable through the proxy.

## Earlier milestone — unified runtime foundation

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
- RESULT: the runtime was integrated into Arena/BattlefieldCanvas, the
  world-to-PvP result path, pack ceremony, tutorial, boss presentation and
  dev-only Game Lab in the milestone above.

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

- IMPLEMENTATION BASE SHA: `c9c2003`
- PREVIOUS RUNTIME MILESTONE SHA: `9457b1f60b12dfc18cd86cdb0e806cb731ff4f0f`
- GAME LAB TIMELINE IMPLEMENTATION SHA: `159bcf37a7f4cf20cd0aab83e1a0e1bb32d80c89`, pushed and verified on `origin/main`.
- BRANCH: `main`
- WORKTREE CLEAN: no; an unrelated `.replit` port-8080 mapping remains unstaged and was not changed by this milestone.

## Files changed in the previous Game Lab timeline milestone

- `mobile/app/dev/game-lab.tsx`
- `mobile/scripts/verify-mobile-game-runtime.mjs`
- `mobile/docs/SESSION_CHECKPOINT.md`
- `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`
- `.replit`

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

- No authenticated end-to-end PvP challenge has been run on a device; the client
  continues to accept results only from the existing server resolver.
- World-boss combat remains a local presentation. No server-owned boss
  simulation/settlement path has been verified; never submit client-calculated
  damage, wins, rewards, or economy values as settlement.
- Actors now have separate procedural torso, arm, cloak, and weapon motion, but
  dedicated rigged/sprite clips and separated character art are not connected.
- Native-device acceptance remains unverified. Whole-app typecheck and the Expo
  workflow are now available in this checkout.

## Exact next milestone

Run the world → authenticated PvP → server-resolved result → world return flow
in Expo Go on a signed-in device, then record the acceptance results. Treat any
server-owned boss simulation/settlement as a separately scoped backend change;
do not add client-authoritative outcomes or alter Supabase RPC/schema without
an approved server-side contract.