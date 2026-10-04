# VEXFORGE · Expo Game Runtime 1.9.0 (Historical Reference)

> HISTORICAL / MIGRATION REFERENCE (2026-10-04). This directory is not the
> active Android runtime. Expo behavior is retained for Unity parity work only.
> Follow `../VEXFORGE_CONTEXT.md`; do not use these build instructions to
> generate an APK/AAB during the Unity migration.

This directory contains the Expo 1.9.0 reference implementation used to compare
behavior during the Unity migration. It is not the active Android runtime and
its build instructions below do not authorize APK/AAB generation.

## Release identity

- Runtime: Expo SDK 54 / React Native 0.81.5
- Release: `1.9.0`
- Android package: `com.vexforge.android`
- Android versionCode: `10`
- Backend authority: Supabase
- Client role: presentation, input, navigation and replay; never competitive settlement authority

## Tier-1 hardening in 1.9

- Expo Image for performant, cached image surfaces.
- Bounded card-art prefetch.
- BattleResult and pack-result schema guards.
- Concurrency gates across all identified client mutation entry points.
- Explicit performance budgets by LOW/MEDIUM/HIGH quality tier.
- Central cinematic planning.
- EAS Update runtime compatibility locked to appVersion.
- Preview/production channels aligned with the existing Supabase update service.
- Stronger client-boundary validation for raid, market, deposit, withdrawal, shop and fusion inputs.
- Poison/burn/stun-specific combat FX.
- Explicit separation between current canonical content and historical/superseded lore documents.

## Quality gate

Run, in order:

```text
npm install
npm run verify
npm run audit:tier1
npm run audit:battle
npm run audit:interactive
npm run audit:economy
npm run audit:tier1
npm run audit:runtime
npm run audit:release
npm run audit:live-economy
npm run audit:battle
npm run audit:interactive
npm run audit:economy
npm run audit:economy-policy
npm run typecheck
npx expo-doctor
npm run build:preview
```

Then test the APK on a physical Android device before production AAB.

## Official references

- `docs/TIER1_REFERENCE_RESEARCH_1.9.md`
- `docs/TIER1_REFERENCE_AUDIT_1.9.md`
- `docs/CANONICAL_CONTENT_AUTHORITY_1.9.md`
- `docs/CONTENT_PIPELINE_1.9.md`
- `docs/RELEASE_NOTES_1.9.0.md`
- `docs/OFFICIAL_RUNTIME_SCENE_CINEMATIC_CONTACT_1.8.jpg`

## Non-negotiable boundaries

- Do not invent Supabase RPCs or payload contracts.
- Do not move settlement, ownership, rewards, pack odds or wallet balances into local code.
- Do not repaint or fabricate official card artwork.
- Unity was retired when this Expo release was documented; the current runtime
  direction is Unity, as defined in `../VEXFORGE_CONTEXT.md`.
- Do not use historical/superseded lore as live runtime data.
- Do not turn the Arena into a dashboard.

## Backend gate

The supplied current contract does not expose a verified authoritative boss-damage/reward settlement RPC. Boss combat shown without that contract remains a presentation/training layer. A production economic boss encounter must not be fabricated in Expo.
