# VEXFORGE · Live gameplay boundary

The current Expo runtime uses the **server-authoritative battle resolution** contract. The client submits an opponent and an idempotency key, receives a `BattleResult`, then presents its ordered `BattleEvent[]` replay.

That is intentionally preserved in the Expo runtime. No client-side rule engine, damage calculation, reward minting, wallet mutation or RNG is used as a substitute for the authoritative server.

The Expo renderer is nevertheless structured for a richer interactive TCG runtime: formation presentation, card focus, target states, event timeline, replay scrubbing, reaction windows and visual state transitions can all exist independently of the authoritative resolver.

A true live action-window mode must not be enabled until the active backend exposes an authoritative contract for player actions, validation, turn state, legal targets, timing windows and resulting events.

The implementation must never silently turn a replay into a fake live battle.
