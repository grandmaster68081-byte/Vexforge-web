# VEXFORGE 1.8 — REPLIT HANDOFF CONTRACT

This ZIP is the implementation source. Replit assembles it; Replit does not redesign it.

## Exact order

1. Replace the target `mobile/` directory with this release's `mobile/` directory.
2. Preserve `app.json`, `eas.json`, `plugins/withEmbeddedJsBundle.js`, the Expo 54 dependency family and Android package `com.vexforge.android`.
3. Supply only the target environment's `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Run `npm install`.
5. Run `npm run verify`.
6. Run `npm run audit:tier1`.
7. Run `npm run audit:battle`.
8. Run `npm run audit:interactive`.
9. Run `npm run audit:economy`.
10. Run `npm run audit:economy-policy`.
11. Run `npm run typecheck`.
12. Run `npx expo-doctor`.
13. Run the configured EAS preview APK build.
14. Install the APK on a physical Android device and smoke-test login, Nexus, Archive, Deck/Forge, Arena, Missions, World, Store, Economy and Social.
15. Verify authenticated Supabase reads/mutations against the existing RPC contracts.
16. Only after preview/device evidence passes, run the production AAB build.

## Do not invent

- RPC names or parameters
- card names, stats, rarity, supply, lore or prices
- boss settlement logic
- market fees or token values
- pack odds
- wallet balances
- replacement art
- new routes

## Product architecture

Supabase remains authoritative for competitive battle resolution, ownership, rewards, economy, progression and settlement. Expo is the presentation/input/replay layer.

The 1.8 client adds schema validation and mutation concurrency guards, but these are defensive client layers; they do not replace server-side idempotency or RLS.

## Backend gate

No verified authoritative boss-damage/reward resolver is present in the supplied mobile contract. Do not create one in Expo. The local boss camera is a deterministic presentation/training layer until the backend exposes and verifies the production contract.
