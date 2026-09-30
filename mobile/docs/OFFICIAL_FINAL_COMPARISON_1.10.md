# VEXFORGE 1.10 — Tier-1 Reference Comparison

This is a descriptive engineering comparison, not a score or ranking.

| Area | Public reference principle | VEXFORGE implementation |
|---|---|---|
| Rules authority | MTG Arena: dedicated rules engine | Supabase Battle Run / `vexforge_battle_resolve`; mobile presentation only |
| Visual event response | Hearthstone: gameplay values feed client VFX | `BattleEvent[]` → presentation classifier → cinematic/VFX/audio |
| Teaching | MASTER DUEL: Tutorial + Duel Strategy + story/Loaner content | Tutorial + tactical theatre + lore + missions + card/world identity |
| Content scale | MARVEL SNAP: large card/variant content pipeline | canonical content manifest, scene tiers, prefetch/cache discipline |
| Ownership/economy | Skyweaver/Axie: explicit wallet/market/treasury boundaries | Supabase settlement/RLS; mobile never settles balances |
| Live service delivery | Expo runtime/version compatibility | `appVersion` runtime + explicit EAS channels |
| Social | Supabase RLS/Reatime authorization model | verified RPC reads/writes + conservative foreground refresh |

## Identity rule

References inform engineering patterns. VEXFORGE retains its own world, cards, terminology, lore, economy contracts, visual language and narrative continuity.
