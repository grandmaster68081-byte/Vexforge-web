# TUTORIAL AND PLAYER JOURNEY · V15

## Rite of Entry

The tutorial is an onboarding ritual, not a slideshow. It introduces a real system, sends the player into that system and only then explains the consequence.

## Eight stages

1. Nexus: understand the physical hub.
2. Archive: inspect real cards.
3. Forge: inspect the real formation editor and validation path.
4. Strategy: understand matchup thinking without revealing unavailable hidden data.
5. Battle Gate: choose a real server-reported rival.
6. Battlefield: launch the same battle flow used outside the tutorial.
7. Loop: see the result return to GameState.
8. Rite complete: return to Nexus.

## Battle checkpoint

The tutorial subscribes to the V15 Battle Gate completion event. It does not infer that a battle finished because the player changed routes or because a timer expired.

## Persistence

Tutorial state is account-scoped using the same deterministic identity scope strategy as battle continuity. This prevents one device's test account from accidentally inheriting another account's tutorial completion state.
