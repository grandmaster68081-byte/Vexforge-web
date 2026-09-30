# VEXFORGE 1.8.0 · FINAL INTEGRATION CONTRACT

This package is the implementation source. Replit must assemble it, not reinterpret it.

## Exact order

1. Replace the target project's `mobile/` directory contents with the contents of this package's `mobile/` directory.
2. Keep every file under `assets/vexforge/scenes/` and `assets/content-packs/` exactly as delivered.
3. Keep the supplied `app.json`, `eas.json`, custom embedded-bundle plugin and Expo 54 dependency family.
4. Supply only the target environment's `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. Install dependencies in the target environment. This release does not include `node_modules` and does not invent a lockfile because the audit container could not reach the npm registry.
6. Run `npm run verify`.
7. Run `npm run audit:battle`.
8. Run `npm run audit:interactive`.
9. Run `npm run audit:economy`.
10. Run `npm run audit:economy-policy`.
11. Run `npm run typecheck`.
12. Run the configured EAS preview APK build.
13. Test the APK on a physical Android device.
14. Only after smoke tests pass, run the production AAB build.

## Do not change

- Battle state / event source-of-truth architecture.
- Supabase RPC names or payload contracts.
- Server-authoritative ownership, rewards, wallet or marketplace settlement.
- Official card artwork URLs.
- Scene filenames or visual registry.
- Pack odds or economic formulas.
- Tutorial sequence.

## Product behavior already implemented

The arena's live field, current actor, targets and FX now derive from the same interactive tactical session. PvP uses a clearly marked sealed server replay. Boss showcase scenes use Atlas identity without pretending local reward settlement exists. Pack opening is a staged vault ceremony and pulls reveal cards from the server response. Missions and world entries use scene cinematics.

## Backend gate

The client contract supplied with this release exposes no official boss-damage/reward settlement RPC. Do not invent one inside the mobile client. Boss reward settlement requires an authoritative backend contract before economy-bearing boss encounters can be enabled.


## 1.8 hardening gate
Run `npm run audit:tier1` after install. It checks result guards, mutation gates, current canonical-content boundaries, Expo Image adoption and version identity.
