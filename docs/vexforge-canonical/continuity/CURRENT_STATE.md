# VEXFORGE CURRENT STATE

Audit entry point for continuity. All facts are tagged by source class.

## Identity

- `REPO_CURRENT / repository:` github.com/grandmaster68081-byte/Vexforge-web
- `REPO_CURRENT / branch:` `main`
- `REPO_CURRENT / audit ID:` `continuity-20260923T000000Z`
- `REPO_CURRENT / current audited SHA:` recorded by the continuity publication commit
- `REPO_CURRENT / UTC:` `2026-09-23`
- `REPO_CURRENT / origin/main at intake:` `6343c3634a0cf4c64a7a830cdf9f0a23cf429d6e`
- `REPO_CURRENT / worktree:` clean before this continuity update

## Runtime

- `REPO_CURRENT / Unity:` `6000.3.0f1`
- `REPO_CURRENT / Input System:` `1.20.0` in `com.unity.inputsystem`
- `REPO_CURRENT / URP:` `17.3.0` in `com.unity.render-pipelines.universal`
- `REPO_CURRENT / Android package:` `com.vexforge.android`
- `REPO_CURRENT / Android settings:` bundle version `0.1.0`, version code `4`, min SDK `26`, target SDK `35`, IL2CPP backend, `activeInputHandler: 2`

## Product architecture

- `HUMAN_DIRECTIVE / active runtime:` Unity Android
- `HUMAN_DIRECTIVE / legacy runtime:` Expo / React Native
- `HUMAN_DIRECTIVE / authority:` Supabase/backend for authority, rules, results, persistence, economy, progression, settlement, rewards and validation
- `HUMAN_DIRECTIVE / Unity role:` presentation, input, animation, VFX, audio, timeline, camera, navigation, representation, playback and replay
- `HUMAN_DIRECTIVE / battle model:` one Battle Engine plus mode profiles, modifiers and objectives
- `HUMAN_DIRECTIVE / canonical routes:` Boot, Nexus, Collection, Deck, Battle, Missions, Economy, Profile

## Current evidence status

- `REPO_CURRENT / Unity:` VERIFIED from project files and source inventory; Unity Editor not run
- `REPO_CURRENT / navigation:` VERIFIED from source/scene search; no interpretation of duplicate labels
- `REPO_CURRENT / input:` VERIFIED from source/config search
- `REPO_CURRENT / cards:` MISMATCH/UNKNOWN by source category; remote backend includes exact 127-card tables, local legacy/Unity counts are not equivalent
- `REPO_CURRENT / backend:` VERIFIED for local Supabase migrations/function path inventory
- `SUPABASE_LIVE / schema and security:` VERIFIED structurally through read-only Management API metadata queries
- `SUPABASE_LIVE / Storage:` VERIFIED through read-only Management API SQL inventory; direct Storage REST key path returned 401
- `SUPABASE_LIVE / Edge Functions:` VERIFIED inventory; source download unavailable in this audit
- `REPO_CURRENT / Unity inventory evidence:` historical run 34 completed successfully in `inventory` mode; it is not a release build
- `REPO_CURRENT / current diagnostic evidence:` run 37 (`35857542570`) was cancelled before producing valid diagnostic evidence
- `UNKNOWN / current release build:` no current `normal` or `final` APK has been accepted
- `UNKNOWN / device:` not verified; no device evidence exists

## Canonical shader-variant build flow

- `REPO_CURRENT / implementation:` the canonical workflow and Unity editor entry points support `normal`, `diagnostic`, `baseline`, `inventory`, `shard` and `final`
- `REPO_CURRENT / inventory purpose:` measure the complete observed shader-variant set without treating the inventory APK as a product release
- `REPO_CURRENT / Android gate:` `normal`, `shard` and `final` require a confirmed optimized variant count greater than zero and strictly below `35000`
- `REPO_CURRENT / stripping baseline:` baseline evidence is kept separate from optimized evidence; safe stripping preserves runtime-created post-processing variants
- `REPO_CURRENT / shard execution:` one sequential GitHub Actions job; do not use a parallel matrix because concurrent Unity writers must not share `Library`
- `REPO_CURRENT / final-build contract:` final APK compilation disables shard filtering and is the only build artifact eligible for APK evidence
- `REPO_CURRENT / safety rule:` never create a replacement Unity project, Build Automation target, GitHub connection, or parallel `Library` writer

## 2026-09-23 continuity update

- `REPO_CURRENT / canonical branch:` only `main` exists; `unity/` is the canonical Unity project directory, not a separate branch
- `REPO_CURRENT / previous inventory run:` run `34`, ID `35738958946`, commit `9b2583ca...`, completed `success` in `inventory` mode
- `REPO_CURRENT / run 34 inventory:` `seenVariants=285367`, `uniqueFingerprints=285279`, `processedSnippets=351`, `selectedVariants=0`, `removedVariants=285367`, Unity `6000.3.0f1`, Android, warnings `3`, errors `1`, failure empty
- `REPO_CURRENT / run 34 artifact:` contained the Unity log, `inventory.json`, `inventory.tsv` with `285279` data rows, and `VEXFORGE-inventory.apk` of `46594995` bytes
- `REPO_CURRENT / run 34 evidence status:` the remote run `35738958946` and artifact `10698924155` were deleted during the prior audit and now return HTTP `404`; the counts remain historical notes, not current approval evidence
- `REPO_CURRENT / run 37:` diagnostic run `35857542570` was explicitly cancelled and produced no accepted variant count
- `REPO_CURRENT / interpretation rule:` the run 34 count predates the current safe-stripping and `<35000` gate commits; a new canonical inventory is required before any Android build decision

## Historical context

- `HISTORICAL_DOCUMENT / previous package stop:` R5.2.1 apply stopped on source drift; that package was not applied here
- `REPO_CURRENT / history evidence:` raw Git history is in `snapshots/continuity-20260919T062954Z/git-log.txt`, `git-log-stat`, `git-log-name-status` and `git-reflog`

The publication commit SHA is recorded by Git history and in the final audit report. This file describes the audited product base, not a new game implementation.
