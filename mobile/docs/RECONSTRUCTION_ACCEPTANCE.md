# VEXFORGE Expo Reconstruction · Acceptance gates

A release candidate is accepted only when:

- the project passes static TypeScript syntax validation;
- `npm run typecheck` passes in a fully installed Expo environment;
- `npx expo-doctor` has no unexplained dependency mismatch;
- Android prebuild succeeds;
- the Android preview build produces an installable APK;
- authentication reaches Supabase;
- card catalog resolves real data;
- deck validation/save round-trip succeeds;
- opponent discovery succeeds;
- authoritative PvP resolution returns a complete result or a canonical error;
- returned events are replayed in order;
- leaving and re-entering a screen does not corrupt state;
- the low/medium/high quality profile changes only presentation budget;
- the app never invents balances, rewards, card identities, or battle outcomes;
- large content stays outside the mandatory core APK whenever the canonical asset can be streamed or cached.
