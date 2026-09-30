# VEXFORGE Expo 1.8.0 — Tier-1 Runtime Hardening

## Purpose

1.8 is an engineering hardening release built from the 1.7 Tier-1 reference audit. It does not replace the VEXFORGE world with competitor copies and does not invent backend contracts.

## Improvements

- Expo Image replaces high-frequency React Native image surfaces for disk/memory caching and controlled downscaling.
- Card artwork prefetch is bounded by the active quality tier.
- Battle results and pack-open results are schema-guarded before presentation.
- Mutation concurrency gates now cover deck saves, battle resolution/forfeit, daily/season claims, raids, market operations, deposits, withdrawals, packs, shop orders, fusion and evolution.
- Battle status FX now distinguish poison, burn and stun presentation tones.
- Explicit runtime performance budgets define target FPS, animated units, particle counts, prefetch counts and background scale.
- Cinematic planning is centralized in `cinematicDirector.ts`.
- Canonical-content authority is documented separately from historical/superseded lore documents.
- Tier-1 audit script checks the release for hardcoded season keys, superseded runtime lore, missing result guards, un-gated mutations and legacy image surfaces.

## Deliberate non-changes

- No Supabase schema or RPC contract was invented or changed.
- No local settlement engine was promoted to production authority.
- No official card artwork was repainted or replaced.
- No Unity runtime code was reintroduced.

## Hard evidence still required outside the static package

- npm install / dependency resolution
- Expo Doctor
- TypeScript compile with installed dependencies
- EAS Android preview/production build
- authenticated Supabase smoke tests
- server-side retry/idempotency tests after network loss
- real boss/raid settlement contract verification
- Android device GPU/frame-time/memory profiling
