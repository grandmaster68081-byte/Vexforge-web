# VEXFORGE Active Expo Game Scope

> HISTORICAL / SUPERSEDED (2026-10-04). This file records the prior Expo-only
> execution direction. It is retained as behavior/source evidence only.
> Current runtime authority: `VEXFORGE_CONTEXT.md` and
> `docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md`.

Status: HISTORICAL / SUPERSEDED
Authority: none for current runtime work

## Active

- Expo/React Native mobile game runtime.
- Current implementation under `mobile/**`.
- Current mobile Supabase consumers and their authoritative contracts.
- Official VEXFORGE card data and artwork already consumed by mobile.
- Project-provided VEXFORGE mobile assets.
- The 2.5D presentation, interaction, battlefield, pack, boss, tutorial and
  QA work defined by the active execution order.

## Legacy or out of scope

- `unity/**` — Unity game client retained as legacy/reference; read-only for
  new work. Do not build on it or move new Expo content into it.
- Web portal implementation under `src/**` and `public/**`.
- Historical web and Unity implementations.
- Prior Expo ZIP releases and their claims.
- Historical documentation when it conflicts with current mobile code or the
  active execution order.

## Scope rules

1. Treat Unity as legacy; do not modify, migrate, rebuild or use it as active
   Expo content.
2. Do not modify, replicate or use the web portal as a mobile design source.
3. Do not create `game-v2`, `game2d`, `prototype` or another parallel engine.
4. Reuse the current mobile navigation, Supabase client/repository, battle
   contract, `BattleResult`, `BattleTurn`, replay data, haptics, reduced-motion
   behavior and error states where valid.
5. Presentation never calculates damage, winners, rewards, ownership or
   economy settlement.
6. A static image, whole-image transform, or dashboard surface is not proof of
   a finished 2.5D runtime.

## Current release evidence

- Package/app release: `1.10.0`.
- Expo SDK: `54.0.37`.
- React Native: `0.81.5`.
- Supabase project: `rscuzqnfccqvltkdcdny`.
- Live project status was checked through the Supabase Management API on
  2026-09-30 and returned `ACTIVE_HEALTHY`.