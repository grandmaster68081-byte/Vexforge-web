# V15 PRODUCTION CLOSURE

## Product target

VEXFORGE is presented as a premium TCG world, not a management console. The design vocabulary is deliberately narrow: obsidian, aged black iron, restrained old gold, controlled crimson threat and contained arcane energy. Information appears when it supports a player decision. Visual richness comes from composition, depth, materials, animation and feedback rather than filling every surface with panels.

## Architecture

`Player intent → Navigation/GameState → VexforgeRepository → Supabase authoritative contract → BattleResult/BattleEvent[] → BattlePresentationDirector → Battlefield/VFX/Camera/Audio → PresentationCompleted`

Tier-1 presentation code cannot author combat rules, RNG, MMR, rewards, ownership, prices, token balances or withdrawals.

## What V15 closes

- five-domain presentation rail: Nexus, Batalla, Archivo, Forja, Perfil;
- administrative HUD chrome suppression without deleting functional Collection/Forge/Profile bodies;
- real server-driven opponent discovery and battle resolve;
- account-scoped retry journal;
- navigation lock through battle presentation completion;
- 3D Battlefield foundation with deterministic procedural geometry;
- mode-specific encounter dressing from the canonical event vocabulary;
- card immersion without replacing official art;
- account-scoped tutorial with a real battle checkpoint;
- secondary-room visual surfaces;
- commerce, treasury, ads and compliance guardrails;
- microtask continuity and static integrity validation.

## Non-goals

The package does not invent missing backend endpoints. Where Store, Raid or Clan-War write contracts are not exposed by the current Unity repository, V15 provides the presentation architecture and records the release gate instead of creating a fake client API.
