# PROJECT OPERATING CONTRACT

All entries below are `HUMAN_DIRECTIVE` copied into this continuity record. They are not implementation recommendations.

## Product

- VEXFORGE is a premium dark medieval fantasy TCG/DCCG.
- Objectives: Tier 1, premium, scalable, Android, own identity, real videogame experience, not an administrative dashboard.
- Presentation principle: WORLD → OBJECT → CARD → INTERACTION → INFORMATION.
- Information serves the world and the game.

## Runtime and authority

- Unity is the active canonical Android runtime.
- Expo / React Native is legacy/reference and must not be reactivated as Android runtime.
- Supabase/backend is authoritative for rules, results, persistence, economy, progression, settlement, rewards and validation.
- Unity owns presentation, input, animation, VFX, audio, timeline, camera, navigation, representation, playback and replay.
- Unity must not become a second source of truth.

## Battle, cards and navigation

- One Battle Engine is used with mode profiles, modifiers and objectives.
- Official cards are real content. The operational historical reference is 127 cards, but this audit verifies counts by source and does not assume a single total.
- Card presentation must account for virtualization, pooling, on-demand loading, controlled cache, release, memory, VFX and Android performance.
- Canonical `GameRoute` values: Boot, Nexus, Collection, Deck, Battle, Missions, Economy, Profile.
- Archive / Forge / Battlefield can be product labels; historical duplicate internal routes are not to be created without explicit authorization.

## Input and Nexus

- Use the modern Unity Input System.
- Do not introduce a new architecture based on `UnityEngine.Input`.
- Input contracts must actually agree across router, galleries, interaction, surfaces and presentation.
- Nexus is world presentation. `NexusPresentationRoot` must not accidentally disable shared input.
- Do not reactivate `NexusWorldController` as a parallel architecture when absent from the current design.

## Completion states

Use only: `DESIGNED`, `IMPLEMENTED`, `IMPLEMENTED_UNVERIFIED`, `EDITOR_VERIFIED`, `BUILD_VERIFIED`, `DEVICE_VERIFIED`, `PRODUCTION_READY`. Never elevate a state without evidence.

## Replit and builds

- Replit is a mechanical executor; it does not interpret, decide, redesign, improvise or change scope.
- Android build is manual. AUTO-BUILD is OFF. SCHEDULE is OFF.
- This audit collects, documents and publishes evidence. It does not create game code, refactor, generate an APK or design a new architecture.
