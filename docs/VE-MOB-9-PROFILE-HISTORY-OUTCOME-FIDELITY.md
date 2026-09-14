# VE-MOB-9 — PROFILE HISTORY OUTCOME FIDELITY

## Target

The combat history panel in `mobile/app/(tabs)/profile.tsx`.

## Current behavior

The panel treated every resolved match without a winner as a defeat and colored a neutral ELO change of `0` as a penalty.

## Visual and data delta

History now presents:

- `Victoria` only when the live winner is the current player;
- `Derrota` only when a live winner exists and is the opponent;
- `Empate` when the match is resolved without a winner;
- `Pendiente` when the match is not resolved;
- neutral ELO in the accent color, with positive and negative changes retaining their existing meanings.

## Source of truth

The display uses only `pvp_matches.status`, `winner`, `elo_change_a`, `elo_change_b`, `created_at`, and the existing opponent name projection from `loadSocialSnapshot`. No result is inferred from missing data.

## Acceptance

- Resolved draw and unresolved matches are not displayed as defeats.
- ELO `0` is not displayed as a penalty.
- Existing live profile data, routes, panels, refresh, sign-out, accessibility, and safe-area behavior remain unchanged.
- The block remains `IMPLEMENTED_UNVERIFIED` until APK/device QA.