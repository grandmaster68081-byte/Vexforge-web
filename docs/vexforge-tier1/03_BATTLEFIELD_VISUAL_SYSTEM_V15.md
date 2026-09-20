# BATTLEFIELD VISUAL SYSTEM · V15

## Visual hierarchy

The battlefield uses a physically readable hierarchy:

- a dark arena plane establishes scale;
- a concentric sanctum establishes the central conflict;
- player and opponent zones anchor the cards;
- forged-metal rings identify important spaces;
- a boss sanctum or opponent crown marks the opposing focus;
- supporting pillars and seals provide depth without becoming UI clutter.

## Runtime technique

The current project already uses URP. V15 uses URP Lit/Unlit materials, runtime meshes, lights, shadows and a global Volume profile. No additional package is required.

## Missing-asset policy

The local Unity asset set is acknowledged as incomplete. V15 therefore has two layers:

1. authored support imagery supplied in the package;
2. deterministic procedural fallback geometry/materials.

A missing optional visual may not create a white rectangle, empty panel or admin card. It falls back to a deliberate VEXFORGE material/shape.

## Official cards

No replacement art is generated for the 127 official card assets. The existing resolver remains the source. Visual enhancement happens around the card: frame treatment, scale, depth, controlled glow and event-linked emphasis.

## Mobile performance

Quality is graded by device capability. The lowest tier avoids expensive post-processing and reduces frame-rate target. Balanced and Cinematic tiers enable additional post effects and shadow distance. Nothing in V15 assumes a high-end desktop GPU.
