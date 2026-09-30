# VEXFORGE · Canonical Gameplay Snapshot used by the new runtime

## Active client/server boundary

The current Expo runtime treats Supabase as the authority for gameplay outcomes. The client submits a challenge and idempotency key, receives a `BattleResult`, and presents the returned `BattleEvent[]`. The new Expo runtime preserves this authority boundary.

## Current formation vocabulary

The active client contract exposes Champion, Vanguard, Sentinel, and Reserve. Exact Forge Formation v6 resolution formulas remain server-owned.

## Explicit official combat design rules found in the archived official Tactical Combat V2 specification

- 8 active cards
- 1 leader
- 1 clan ability when applicable
- 10 strategic slots total
- base stats: HP, Attack, Defense, Speed, Ability Energy
- rounds
- initiative determined by speed
- action families: basic attack, special ability, buff, debuff, heal, shield, summon
- final damage: `Attack - Defense`, minimum 1
- critical chance: 5%
- critical damage: 150%
- a unit at 0 HP is removed
- victory when all opposing units are eliminated
- intended combat duration: 1–5 minutes

These rules remain an explicit historical design source and are not silently substituted for newer server-owned Forge Formation v6 behavior.

## PvE

Normal, Elite, Boss, Raid and Event are defined content types. World scaling increases enemy HP, enemy attack and tactical complexity. Rewards may include Gold, VEX, cards, fragments, chests and special items. The official energy specification records Normal 5, Elite 10, Boss 20, Raid 30; initial/max energy 100; regeneration 1 point every 5 minutes.

## PvP

Casual, Ranked, Event and Tournament are defined modes. Matchmaking considers power, level, rank and recent activity. Ranked produces seasonal points and special rewards. The anti-pay-to-win principle says spending can accelerate progression but does not create automatic victory.

## Long-term loop

Energy → missions → PvE → rewards → card improvement → chests → events → rankings → clan interaction → next session.

## Economy

The official economy defines VEX in-game, VEX tradeable, Gold and Energy. Sources include missions, combat, events, packs and progression. Sinks include energy, marketplace friction, fusion, upgrades and withdrawals. Current audited backend architecture requires authoritative wallet mutation, atomic ledger coupling, non-negative balances and idempotent repeatable rewards.

## Store

Pack outcome and entitlement authority stay server-side. The client never rolls pack outcomes or invents settlement.
