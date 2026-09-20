# BATTLE EXPERIENCE · V15

## Battle is the center

Every combat mode must feel like the same VEXFORGE game while carrying a different dramatic identity. PvP is the competitive duel, missions are authored expeditions, raids are pressure against a larger entity, bosses are spectacle encounters and clan wars are faction-scale conflicts. Their presentation may differ, but the authority path remains the same.

## Player loop

1. Enter Battlefield.
2. Receive server-reported opponents.
3. Inspect the matchup using only available state.
4. Select an opponent.
5. Confirm the challenge.
6. Submit one idempotent server resolve.
7. Receive the authoritative result/event stream.
8. Present the battle event-by-event.
9. Unlock navigation only after `PresentationCompleted`.
10. Refresh GameState and return to the normal loop.

## Strategy principle

A TCG becomes strategically meaningful when deck construction, matchup recognition and turn-level decisions interact. V15 therefore exposes a pre-match readout using the player's real catalog and deck plus server-reported opponent metadata. It does not pretend to know hidden cards, counters or future RNG when the contract does not provide that information.

## No local combat truth

The client cannot determine who wins, how much damage occurred, which reward was earned, MMR changes, NFT ownership, token balance or pack contents. Those remain server responsibilities.

## Failure behavior

- server returns null: keep the idempotency key and allow safe retry;
- server returns rejection: clear the operation key and report the server reason;
- app restarts during an unresolved operation: recover the account-scoped pending operation and reuse the same key;
- presentation completion missing: do not invent a result or unlock the route with a timer;
- auth is lost: hide battle surfaces and stop local presentation activity.
