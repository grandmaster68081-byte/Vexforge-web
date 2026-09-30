# VEXFORGE · Tier-1 Reference Audit 1.7

Date: 2026-09-29

## Reference findings

### MARVEL SNAP
Unity's published case study says Second Dinner uses Addressables plus build/content-delivery infrastructure to support a live game with 200+ base cards and 1,000+ variants, with new content added weekly. The relevant lesson for VEXFORGE is not Unity itself; it is a content pipeline where card identity, animation, assets and delivery are versioned and independently shippable.

VEXFORGE response:
- runtime scene/content packs are explicitly separated from core client code;
- canonical artwork remains server/catalog controlled;
- release asset registry is hashed and auditable;
- battle presentation is event-driven rather than screen-driven;
- no new card or economy data is fabricated locally.

### HEARTHSTONE
Public technical descriptions and Blizzard's current patch notes show a long-lived client/server architecture and continued Unity runtime evolution. A match-session model is especially important: gameplay state and non-match services are distinct concerns, while the server remains authoritative.

VEXFORGE response:
- `vexforge_battle_resolve` remains the authoritative match boundary;
- `BattleEvent[]` is the presentation/replay contract;
- client presentation never mutates settlement state;
- local tactical simulation is explicitly a training harness, not production authority.

### YU-GI-OH! MASTER DUEL
Konami's official site explicitly separates Tutorial and Duel Strategy, then uses Solo Mode stories, animations and loaner decks to teach archetypes and advanced mechanics. It also supports live events and a large card pool.

VEXFORGE response:
- the 19-step tutorial is an ecosystem route, not a modal lock;
- combat drills are playable rather than text-only;
- the tutorial links directly into the real product routes;
- the lore/codex layer is connected to world, cards, bosses and progression.

### SKYWEAVER
Skyweaver's documentation demonstrates a player-owned economy with wallet custody, a marketplace, explicit transaction states and separation between tradable and non-tradable resources.

VEXFORGE response:
- wallet/market settlement remains Supabase-owned;
- client mutation concurrency is now guarded to prevent duplicate taps;
- the runtime never invents token values, settlement or pack odds;
- retry/idempotency remains a backend requirement and is explicitly documented rather than simulated locally.

## Engineering upgrades in 1.7

1. Added `battleDirector.ts`: a deterministic presentation scheduler with event classification, priority, major-event interrupt protection and playback timing.
2. Added `mutationGate.ts`: a client-side concurrency barrier for economic/progression mutations. It prevents overlapping submissions but does not pretend to replace server idempotency.
3. Removed the hard-coded `S1_2026` season ranking query. Active season metadata now supplies the ranking key; if the backend does not publish one, rankings remain empty rather than showing a stale season.
4. Replaced Math.random-only mutation references with monotonic per-session references to improve tracing and reduce accidental duplicate references.
5. Expanded the release documentation to distinguish benchmark-derived engineering lessons from proprietary implementation details that are not public.

## Remaining hard gates

The following cannot honestly be certified from a static ZIP:
- native Android build success;
- EAS prebuild/build success;
- real Supabase authenticated smoke tests;
- server-side idempotency after network loss;
- production boss/raid settlement;
- device GPU/frame-time measurements.

Those require the actual configured environment and hardware.
