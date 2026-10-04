# VEXFORGE Expo Runtime · Architecture

> HISTORICAL / MIGRATION REFERENCE (2026-10-04). This release architecture is
> retained to compare behavior; it does not define the active Android runtime.
> Follow `VEXFORGE_CONTEXT.md` for current runtime direction.

## Source boundary
The Expo runtime in this release was the active mobile client at the time of
publication. Its implementation preserves the live Supabase contracts and the
established VEXFORGE gameplay vocabulary without copying a second local rules
authority.

## Authority boundary
- Supabase remains authoritative for authentication, catalog, ownership, progression, wallet, PvP resolution, settlement, rewards and other server-owned state.
- The client does not mint, settle or fabricate economic balances.
- Battle presentation consumes `BattleEvent[]`; it does not replace the server resolver.
- Local presentation harnesses are explicitly labeled and never used as production outcomes.

## Rendering model
The renderer uses React Native for orchestration and interaction, Reanimated for transform/opacity motion, and Skia for low-level procedural scene layers. The target is 2D/2.5D rather than a Unity-like 3D engine.

## Mobile model
Canonical authoring reference: 1080×2340, portrait. Runtime layout remains responsive and respects the device safe area.

## Asset model
The APK contains only lightweight core artwork and small framework assets. Official card art is resolved from the server-provided `image_url` and cached at runtime. Large environment/content packages are treated as downloadable content rather than mandatory APK payload.

## Quality model
- LOW: lower effects density, lower background scale, fewer simultaneous card images.
- MEDIUM: default balance.
- HIGH: maximum enabled visual budget.

The quality tier changes presentation budget, not game rules.
