# VEXFORGE — Unity R5 Canonical Runtime Reconciliation

Status: IMPLEMENTED_UNVERIFIED

Base commit:
`af4787a0c2788dd8b3b406e42e0e82f9267d092e`

## Canonical product

VEXFORGE is an Android video game built on Unity.

Unity is the only active client runtime.

Expo / React Native / `mobile/**` are legacy reference material only.

Supabase remains the authoritative backend for gameplay outcomes, economy,
progression, persistence, rewards and settlement.

## Presentation architecture

The active client presentation path is:

`WORLD → OBJECT → CARD → INTERACTION → INFORMATION`

The canonical Unity presentation layer lives under:

`unity/Assets/Scripts/Presentation/`

The main runtime shell owns the single Presentation Runtime host.
`NexusPresentationRoot` is the active Nexus foundation.
`NexusDevelopmentFallback` is development-only.

## Navigation

The existing `Vexforge.Core.GameRoute` enum remains authoritative:

- `Nexus`
- `Collection` (displayed as ARCHIVE)
- `Deck` (displayed as FORGE)
- `Battle` (displayed as BATTLEFIELD)
- `Missions`
- `Economy`
- `Profile`

Presentation must not invent route enum aliases.

## Cards

The Supabase catalog remains the source of truth.

The complete catalog remains accessible as data.

Only the visible/preload window is instantiated through a bounded card pool.

Art mode is explicit and never inferred from `card_tier`.

Official card art is loaded on demand through the bounded resolver/cache.

## Rendering/input

Input System is the active presentation input technology.

URP 17.3.0 is pinned in the manifest.

Runtime Presentation does not use `UnityEngine.Input`, `Shader.Find` or
`MaterialPropertyBlock`.

The Editor-only setup tool may use `Shader.Find` strictly while authoring
serialized material assets.

## Verification

Static validation is required before commit.

Unity Editor compilation remains unverified until Unity
`6000.3.0f1` opens the project and compiles all assemblies.

Android build and physical device verification are later gates.
