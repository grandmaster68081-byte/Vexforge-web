# VEXFORGE Tier-1 Reference Audit 1.9

Date: 2026-09-29

## Reference matrix

| Reference | Public lesson | VEXFORGE implementation |
|---|---|---|
| MARVEL SNAP | Content pipeline, independently shippable assets, VFX that communicate card function | Manifested local content packs, event-driven presentation, bounded prefetch, explicit asset QA |
| Hearthstone | Authoritative game results with client-side visual effects | BattleResult/BattleEvent contract + local Battle Director/FX |
| MASTER DUEL | Tutorial + strategy teaching + story/solo integration | 19-step live tutorial + interactive drills + lore/world routes |
| Skyweaver | Explicit ownership, wallet and marketplace boundaries | Supabase-owned settlement + client concurrency guards |
| MTG Arena | Dedicated rules engine and card implementation pipeline | Production combat remains authoritative; client tactical engine is training/presentation only |
| Axie Infinity | Economic sinks/emissions and explicit wallet/game boundaries | Tradeable vs in-game balances, backend policy, no local settlement |
| RollerCoin | Marketplace depends on progression, crafting and sinks | Market connected to collection, packs, missions, fusion/evolution and seasons |

## 1.9 findings from the 1.7 package

1. Image-heavy runtime surfaces still used React Native `Image`, leaving performance features of Expo Image unused.
2. Mutation gating was present but not universal across progression/raid/season/deck flows.
3. Server result shape was trusted directly by presentation code.
4. Status FX used one generic status color instead of distinguishing poison/burn/stun.
5. Performance limits existed as configuration but were not represented as a dedicated runtime budget contract.
6. Historical/superseded lore existed beside runtime docs, so the release needed an explicit authority boundary.
7. Boss combat is still a presentation/training harness where no authoritative boss resolver is supplied. This remains a backend gate, not a client-side fabrication.

## 1.9 changes

- `VexforgeImage` centralizes performant image loading.
- `contentPrefetch` bounds card prefetch.
- `runtimeGuards` validates battle and pack result shape.
- `mutationGate` is now wired across all identified client mutation entry points.
- `BattleEffects` distinguishes poison, burn and stun.
- `performanceBudget` formalizes device quality budgets.
- `cinematicDirector` centralizes presentation plans.
- New audit script enforces the above rules.

## Verdict discipline

This release is stronger architecturally and visually than 1.7 based on static code/asset inspection and deterministic audits. It is not a substitute for device/EAS/Supabase production verification. Those remain explicit gates.
