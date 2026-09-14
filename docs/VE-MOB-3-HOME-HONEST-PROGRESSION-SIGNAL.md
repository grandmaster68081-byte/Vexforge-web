# VE-MOB-3 — HONEST PROGRESSION SIGNAL

## Change boundary

- **Target:** Android Home / Foja progression HUD in `mobile/app/(tabs)/index.tsx`.
- **Allowed:** formatting of numeric signals and the progression rail's readiness state.
- **Do not touch:** Home routes, artwork, card identity, Supabase loaders, player data, missions, events, Auth, or web surfaces.

## Observable change

Home no longer renders missing numeric values as `0`. Numeric HUD values use `—` until a finite value arrives. The progression rail is rendered only when both XP values are present and finite; otherwise it communicates `PROGRESIÓN EN ESPERA`.

This preserves the distinction between a confirmed zero and an unconfirmed signal without changing the server data or client navigation.

## Evidence

- `node scripts/verify-mobile-home-official-assets.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.