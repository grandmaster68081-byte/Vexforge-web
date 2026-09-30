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

- There is no completed `mobile/game/**` unified 2.5D runtime module yet.
- The active order's required `scripts/verify-mobile-game-runtime.mjs` does
  not yet exist.
- The Arena has a local deterministic tactical lab/PVE presentation and a
  separate authoritative PvP resolver path; this is not yet the requested
  complete world-to-battle vertical slice.
- Existing effects and replay code need to be reconciled with the required
  actor state machine, camera state system, data-driven timeline tracks,
  audio director and reduced-motion/skip behavior.
- Pack opening, boss presentation, tutorial play loop and QA inspection route
  are not yet verified against the active 2.5D acceptance criteria.
- `mobile/README.md` retains historical 1.9.0 release wording; it is not used
  as current manifest evidence.

## Verification performed

- GitHub `main` was fetched and matched the local branch.
- The remote mobile manifests, runtime candidates and verifiers were inspected.
- Supabase Management API returned HTTP 200 and project status
  `ACTIVE_HEALTHY`.
- Expo dependency resolver reported all packages up to date after alignment.
- Expo Doctor passed all 18 checks after removing the unsupported
  `targetSdkVersion`, fixing icon formats and deduplicating `expo-asset`.
- Mobile typecheck passed.
- The static mobile verifier passed.
- No EAS build, APK, AAB, store deployment or production deployment was run.