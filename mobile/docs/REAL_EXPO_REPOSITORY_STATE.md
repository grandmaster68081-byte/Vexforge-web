# Real Expo Repository State

Evidence date: 2026-09-30  
Source branch: `main`  
Source repository: `https://github.com/grandmaster68081-byte/Vexforge-web.git`

## Git state at audit start

- Local SHA: `800369a22a44317fd44939d50c78a562a2636531`
- Remote `origin/main` SHA: `800369a22a44317fd44939d50c78a562a2636531`
- Worktree: clean before this authority-document milestone.
- The preceding commit imported the official remote tree into this persistent
  project and preserved the active execution order under `mobile/docs`.

## Current implementation state on official `main`

- Runtime milestone code is on `main` at `9457b1f60b12dfc18cd86cdb0e806cb731ff4f0f`, verified against `origin/main` before checkpoint finalization.
- `mobile/game/**` is the shared Expo runtime, with 2.5D scene projection,
  per-actor state, camera presets, event timelines and presentation tracks.
- `BattlefieldCanvas` renders the BACK, MID, PLAYFIELD, ACTORS, FRONT_FX and
  HUD layers; actors use independent procedural torso, arm, cloak and weapon
  motion over the existing project card art.
- Event cameras can focus the acting or targeted unit. VFX, audio, haptics and
  HUD acknowledgement are represented as synchronized timeline tracks.
- Reduced-motion preferences disable camera and actor transitions, flashes,
  and animated VFX while preserving static event feedback.
- Development-only Game Lab exposes layer toggles, target selection for local
  drills, cue inspection, pack presentation and a non-settling boss fixture.
- PvP settlement remains restricted to the existing authoritative resolver.
  The boss fixture and tactical drills do not grant rewards or persist results.

## Confirmed mobile foundation

- `mobile/app.json` declares VEXFORGE `1.10.0`, Android package
  `com.vexforge.android`, Expo SDK 54 runtime configuration and the Supabase
  update endpoint. Its icon/splash/adaptive icon fields use the derived PNG
  documented in `mobile/docs/ASSET_PROVENANCE.md`.
- `mobile/package.json` pins React Native `0.81.5`, React `19.1.0`,
  TypeScript `5.9.2`, Expo `~54.0.37`, Expo Asset `~12.0.13`, Expo Router
  `6.0.24`, Reanimated `4.1.1`, Worklets `0.5.1`, Gesture Handler `2.28.0`,
  Skia `2.2.12` and Supabase JS `2.58.0`.
- The current route structure includes Nexus, Arena, Archive, Forge, Legacy,
  Missions, Store, Economy, World, Social, Meta, Tutorial and Auth.
- Existing battle foundation includes `arena.tsx`, `BattlefieldCanvas`,
  `BattleEffects`, `battleDirector`, event classification, replay controls,
  tactical training state and a repository path for authoritative PvP.
- `mobile/src/services/supabase.ts` uses the public Expo Supabase client
  configuration and does not contain a service-role credential.
- Official mobile assets and release asset QA files are present in the remote
  tree.

## Known gaps at this checkpoint

- No authenticated end-to-end PvP challenge has been run from the Expo app.
- World-boss combat remains a local presentation; no server-owned boss
  simulation or settlement path has been verified.
- Actor motion is procedural and layered over card art; dedicated rigged or
  sprite clips and separated character artwork remain unconnected.
- Pack opening, boss presentation, tutorial play loop and Game Lab have
  automated source/runtime checks, but still need a native-device acceptance
  session.
- In this Replit checkout, dependencies were restored with
  `npm --prefix mobile ci --no-audit --no-fund` from the existing lockfile
  (782 packages). Whole-app TypeScript checking now passes and the Expo
  workflow starts successfully.
- `mobile/README.md` retains historical 1.9.0 release wording; it is not used
  as current manifest evidence.

## Verification performed

- GitHub `main` was fetched and matched the local branch.
- The remote mobile manifests, runtime candidates and verifiers were inspected.
- Supabase Management API returned HTTP 200 and project status
  `ACTIVE_HEALTHY`.
- At the earlier repository-alignment checkpoint, Expo dependency resolution,
  Expo Doctor and the full mobile typecheck passed.
- Current runtime milestone checks: mobile static verifier passed, game-runtime
  acceptance checks passed, battle audit passed 2,500 runs, interactive audit
  passed 500 runs, release audit passed, and standalone runtime TypeScript
  checks passed.
- Current full typecheck passes. Expo Doctor passes 18/18 checks, and the Expo
  workflow reaches Metro with Expo Go and web previews available.
- The Game Lab runtime verifier now covers playback boundaries and its
  play/pause/step/reset timeline controls; the full verifier passes 18 checks.
- No EAS build, APK, AAB, store deployment or production deployment was run.