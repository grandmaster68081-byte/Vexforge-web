# VE-MOB-7 — REPLAY TURN DETAIL

## Target

Arena Android replay in `mobile/app/(tabs)/battle.tsx`.

## Current behavior

The replay presented the authoritative battlefield and turn progress, but the detail component for the selected `BattleTurn` was not rendered in the active replay surface.

## Visual and functional delta

The active replay step now renders the existing `TurnView` with the current server-provided turn. It exposes the attacker, defender, damage type, event labels, and alive-unit counts without simulating or rewriting the battle.

## Data and asset contract

- Source: `activeBattleResult.turns` from the existing battle result contract.
- Preserved fields: `turnIndex`, `damage`, `events`, `alive_a`, `alive_b`, attacker and defender data.
- No new assets, card identities, routes, RPCs, Supabase objects, or client-side combat logic.
- Missing values remain explicit (`—`, `Efecto de carta`, or the existing unavailable-unit state).

## Acceptance

- `TurnView` is rendered from `currentTurn` in the replay.
- The mobile battle guard passes.
- Reduced-motion behavior remains unchanged.
- The result and authoritative replay flow remain unchanged.
- The block remains `IMPLEMENTED_UNVERIFIED` until APK/device QA.