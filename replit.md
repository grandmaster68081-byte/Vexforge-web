# VEXFORGE — Expo Game Runtime

This repository is currently being advanced as the VEXFORGE Expo/React Native
game runtime. The active execution contract is
`mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`.

## Active scope

- Work only on `mobile/**`, its current Supabase consumers, official mobile
  card data/art, project-provided VEXFORGE assets, and the 2.5D game runtime.
- The active scope authority is `mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md`.
- The repository state and evidence are recorded in
  `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`.
- The current session checkpoint is
  `mobile/docs/SESSION_CHECKPOINT.md`.
- The official branch is `main`; every completed milestone must be committed
  and pushed to `origin/main`.
- Responses to the user are in Spanish.

Frozen for this work:

- `unity/**`
- `src/**` and `public/**` web portal code
- historical web/Unity implementations
- old Expo ZIP releases

Do not use frozen areas as gameplay or design authorities, and do not build a
second runtime beside `mobile/**`.

## Run & verify

From `mobile/`:

- `npm install` — install the pinned Expo runtime dependencies when needed.
- `npm run verify` — run the repository's static mobile release verifier.
- `npm run typecheck` — run the mobile TypeScript check.
- `npm run doctor` — run Expo Doctor.

Do not run EAS preview/production builds, APK/AAB generation, store deployment,
or production deployment until the user explicitly authorizes the build gate.

## Runtime stack

- Expo SDK 54.0.37
- React Native 0.81.5
- React 19.1.0
- Expo Router 6.0.24
- Expo Asset 12.0.13
- Reanimated 4.1.1 + Worklets 0.5.1
- Gesture Handler 2.28.0
- React Native Skia 2.2.12
- Supabase JS 2.58.0

## Where things live

- `mobile/app/` — Expo Router screens and navigation.
- `mobile/src/engine/` — battle presentation and tactical runtime logic.
- `mobile/src/render/` — battlefield, world, effects, audio and diegetic
  presentation components.
- `mobile/src/services/` — Supabase client and repository boundary.
- `mobile/assets/` — official and project-provided mobile assets.
- `mobile/scripts/` — mobile static verifiers and audits.
- `mobile/docs/` — active scope, runtime contracts, audits and checkpoints.
- `supabase/`, `backend/`, `src/`, `public/`, and `unity/` — historical or
  frozen repository zones for this execution order.

## Architecture decisions

- Supabase remains authoritative for authentication, ownership, combat
  settlement, rewards and economy; presentation must not calculate them.
- The existing `arena.tsx`, `BattlefieldCanvas`, `BattleEffects`,
  `battleDirector` and repository boundary are the foundation to extend.
- Official card artwork is canonical and must not be repainted or silently
  replaced by generated art.
- A local laboratory or training presentation must be labelled as such and
  cannot be promoted to competitive settlement.
- Quality tiers may change presentation budgets only, never game rules.
- Every bounded milestone receives targeted validation, a checkpoint update,
  a commit and a push to `main`.

## Supabase

- Project: `rscuzqnfccqvltkdcdny`
- URL: `https://rscuzqnfccqvltkdcdny.supabase.co`
- Runtime code requires the public client configuration; PATs are never stored
  in source files or runtime bundles.

## Gotchas

- `mobile/README.md` contains historical 1.9.0 wording; the package and app
  manifests at `1.10.0` are the current release evidence.
- The current runtime has a deterministic local tactical lab and an
  authoritative PvP path. Do not describe the lab as server settlement.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- Do not reset, rebase, merge, cherry-pick or force-push the official branch.
