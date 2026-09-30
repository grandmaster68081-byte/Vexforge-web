# Replit — VEXFORGE 1.10.0 Official Assembly

1. Replace the target repository `mobile/` directory with this package's `mobile/` directory exactly.
2. Do not merge selected files from an older VEXFORGE mobile release.
3. Keep existing Supabase/backend/contracts outside `mobile/` unchanged.
4. Set `EXPO_PUBLIC_SUPABASE_ANON_KEY` only in the secure build environment.
5. Run `npm install` in the networked target environment.
6. Run, in order:
   - `npm run verify`
   - `npm run audit:tier1`
   - `npm run audit:runtime`
   - `npm run audit:release`
   - `npm run audit:final`
   - `npm run audit:live-economy`
   - `npm run audit:battle`
   - `npm run audit:interactive`
   - `npm run audit:economy`
   - `npm run audit:economy-policy`
   - `npm run typecheck`
   - `npx expo-doctor`
7. Build preview: `eas build --platform android --profile preview`.
8. Install the APK on a physical Android device and verify login, navigation, collection, deck, Battle Run, mission settlement, pack opening, economy, marketplace, social and replay behavior.
9. Verify network loss/retry behavior and confirm no duplicate reward/settlement.
10. Build production: `eas build --platform android --profile production`.

## Prohibited

Do not invent RPC names, card data, fees, odds, rewards, bosses, raid damage, lore, scenes, assets or formulas. Do not re-enable the blocked direct raid contribution method.
