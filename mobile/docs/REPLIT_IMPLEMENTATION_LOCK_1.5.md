# VEXFORGE 1.6.0 · IMPLEMENTATION LOCK

This directory is the official mobile implementation artifact. The target assembler must copy the files exactly; it must not author substitute UI, art, animations, combat logic, economy logic or backend contracts.

## File ownership

`app/` is the route surface. `src/engine/` is gameplay/presentation logic. `src/services/repository.ts` is the client integration boundary. `assets/vexforge/` and `assets/content-packs/` are the official runtime visual/audio package. `assets/registered/` and `assets/canonical/` remain bundled source material and are not to be replaced.

## Required assembly

1. Replace the target `mobile/` directory contents with this `mobile/` package.
2. Preserve `app.json`, `eas.json`, the embedded bundle plugin, `tsconfig.json`, `package.json`, `app/`, `src/`, `assets/`, `scripts/` and `docs/`.
3. Supply only `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the target build environment.
4. Install dependencies in the target environment.
5. Run `npm run verify`.
6. Run the included battle and economy audits.
7. Run `npm run typecheck`.
8. Run the repository's existing Expo/EAS preview APK build and test the artifact on physical Android hardware.

## Forbidden assembler behavior

Do not regenerate or restyle local scenes. Do not replace official card artwork URLs with generated art. Do not invent RPCs. Do not move economy settlement into the client. Do not hard-code pack odds. Do not create a second combat state. Do not remove quality tiers. Do not replace the tutorial with a generic onboarding flow.
