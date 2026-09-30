# VEXFORGE Battle Runtime

## Canonical flow

Opponent discovery → selection → idempotency key → `vexforge_battle_resolve` → authoritative `BattleResult` → ordered `BattleEvent[]` → presentation timeline → result/refresh.

## Canonical formation vocabulary
Champion / Vanguard / Sentinel / Reserve are preserved as first-class concepts because they are part of the current canonical game contract.

## Client responsibilities
1. Gather player intent.
2. Send the exact authoritative request.
3. Preserve idempotency.
4. Present every event in order.
5. Never silently invent a missing event.
6. Refresh authoritative state after the result.

## Event rendering
The presentation classifier recognizes the current VEXFORGE event families: boss/encounter start, victory, play/cast/summon/deploy, attack/strike/hit/damage, guard/defend/shield/sentinel, heal/restore/regenerate, and death/destroy/remove/defeat. Unknown events become a neutral presentation pulse instead of being discarded.

## Why this can still feel complex
The game client is not restricted to a single button and a result. The future visual runtime can expose formation, targets, card focus, response windows, timeline replay, phase changes, reaction states, reserve transitions and reward ceremonies while the authoritative resolver remains on the server.


## 1.6.0 presentation layer
Major server events are now routed through `BattleCinematic`: boss phase, victory and defeat receive dedicated cinematic plates. `BattleEffects` adds impact shockwaves and status auras. These layers consume the existing event stream and do not create a second battle state.
