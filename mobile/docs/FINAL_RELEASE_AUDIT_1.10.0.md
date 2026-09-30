# VEXFORGE — Final Release Audit 1.10.0

Date: 2026-09-29

## Release intent

This package is the final Expo mobile client/runtime package produced for the current VEXFORGE contracts. It is not a substitute for the target Android/EAS environment or live Supabase credentials.

## Tier-1 reference integration

The audit incorporated public engineering/design practices from:

- MARVEL SNAP: scalable content/variant delivery and presentation-first card effects.
- Hearthstone: server-provided gameplay values with client-side visual effects.
- MTG Arena: explicit Game Rules Engine boundary.
- Yu-Gi-Oh! MASTER DUEL: Tutorial → Duel Strategy → story/animation/Loaner Deck teaching layers.
- Skyweaver/Axie: explicit ownership/market/economy state boundaries.
- Expo/Supabase: native/runtime compatibility, image caching, RLS and Realtime authorization.

No proprietary code, assets or private implementation details are copied.

## Final runtime changes

1. Expo Router pinned to the SDK 54 recommended `6.0.24`.
2. Expo Image pinned to `3.0.11` for deterministic direct dependency resolution.
3. EAS runtime remains `appVersion`; Android versionCode advances to `11`.
4. Client-side mutation gating covers competitive, progression, economic and social writes.
5. Legacy direct raid contribution is blocked.
6. Social reads receive conservative foreground refresh without inventing unverified Realtime contracts.
7. BattleResult and pack result guards remain mandatory before presentation.
8. Canonical content closure: 13 scenes + 39 derivatives + 8 cinematics.
9. Historical/superseded lore strings remain prohibited in runtime code.
10. Season ranking is dynamically selected from the active backend season metadata.

## Static evidence

- Battle deterministic audit: 2,500/2,500.
- Interactive tactical audit: 500/500.
- Economy audit: 10,000/10,000.
- Economy policy audit: PASS.
- Static release verification: PASS after the final package is assembled.
- Final ship audit: PASS after the final package is assembled.
- ZIP integrity: MUST PASS before handoff.

## External gates — deliberately not faked

- `npm install`/dependency resolution in a networked target environment.
- full project TypeScript typecheck with installed dependencies.
- `npx expo-doctor`.
- EAS Android preview APK.
- Android physical-device FPS/RAM/GPU validation.
- authenticated Supabase smoke test.
- live Battle Run/settlement, Boss/Raid server paths, RLS and network-retry validation.
- production AAB.

A failure in any external gate blocks public launch. The ZIP itself must not be edited to hide such a failure.
