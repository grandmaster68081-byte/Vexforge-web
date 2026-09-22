# VEXFORGE CURRENT STATE

Audit entry point for continuity. All facts are tagged by source class.

## Identity

- `REPO_CURRENT / repository:` github.com/grandmaster68081-byte/Vexforge-web
- `REPO_CURRENT / branch:` `main`
- `REPO_CURRENT / audit ID:` `continuity-20260919T062954Z`
- `REPO_CURRENT / current audited SHA:` `82c7fc29d82c3a52dfd8dca557439618c5807807`
- `REPO_CURRENT / UTC:` `2026-09-19T06:29:54Z`
- `REPO_CURRENT / origin/main at intake:` `82c7fc29d82c3a52dfd8dca557439618c5807807`
- `REPO_CURRENT / worktree:` clean at intake

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
- `UNKNOWN / build automation:` repository evidence only; no build started
- `UNKNOWN / device:` not verified; no APK/AAB generated

## Experimental shader-cache build flow

- `REPO_CURRENT / shader-cache experiment:` EXPERIMENTAL — implementation exists, but no successful shard evidence has been accepted yet
- `REPO_CURRENT / experiment purpose:` warm deterministic partitions of the total shader-variant set sequentially, then run one unfiltered Android build using the same Unity `Library` continuity
- `REPO_CURRENT / experiment execution:` one sequential GitHub Actions job; do not use a parallel matrix because concurrent Unity writers must not share `Library`
- `REPO_CURRENT / shard contract:` `VEXFORGE_SHADER_SHARD_INDEX` and `VEXFORGE_SHADER_SHARD_COUNT` select a stable variant partition through the Editor shader preprocessor
- `REPO_CURRENT / final-build contract:` the final APK build disables shard filtering and is the only build artifact considered for APK evidence
- `REPO_CURRENT / validation threshold:` the first two shard runs must finish successfully, with checkpoint summaries proving the first and second 2% stages completed against the same chain; this is the minimum evidence for a provisional 4% continuity claim
- `REPO_CURRENT / production status:` not verified; cache size, source inspection, or a successful intermediate warmup alone must not be reported as a complete build
- `REPO_CURRENT / safety rule:` never create a replacement Unity project, Build Automation target, GitHub connection, or parallel `Library` writer for this experiment

## Historical context

- `HISTORICAL_DOCUMENT / previous package stop:` R5.2.1 apply stopped on source drift; that package was not applied here
- `REPO_CURRENT / history evidence:` raw Git history is in `snapshots/continuity-20260919T062954Z/git-log.txt`, `git-log-stat`, `git-log-name-status` and `git-reflog`

The publication commit SHA is recorded by Git history and in the final audit report. This file describes the audited product base, not a new game implementation.
