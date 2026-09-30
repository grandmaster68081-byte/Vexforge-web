# VEXFORGE Session Checkpoint

Date: 2026-09-30  
Execution contract: `mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`

## Latest continuity correction — documentation only

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

- No completed unified `mobile/game/**` 2.5D runtime.
- No required runtime integrity verifier.
- Battle vertical slice, actor animation, camera, timeline, audio and VFX
  acceptance evidence remain incomplete.
- Pack opening, boss, tutorial and Game Lab acceptance evidence remain
  incomplete.

## Exact next milestone

Run the mobile static verifier and dependency/compatibility audit, then create
the smallest compatible runtime core without changing the Supabase authority
boundary. Commit and push that bounded milestone to `main` before continuing.