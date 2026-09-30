# VEXFORGE 1.9 — Content Pipeline

The pipeline follows the public lesson from MARVEL SNAP: content must be independently versioned, auditable and shippable without turning the gameplay client into a content database.

## Layers

1. Canonical server data — cards, rules, missions, bosses, economy and live operations.
2. Local presentation pack — environment plates, cinematic plates, FX and sound cues.
3. Runtime manifest — paths, dimensions, hashes and release version.
4. Presentation director — turns authoritative events into timing, animation and VFX.
5. Device budget — quality tier caps decoded artwork, animated units, particles and background scale.

## Asset policy

- Card artwork: server/catalog controlled.
- Environment artwork: bundled local assets.
- Cinematic plates: bundled local assets.
- No placeholder.com, random image URLs or fabricated public facts.
- Low/medium/high derivatives must remain visually identical in composition.

## Release gate

A release is not complete until:
- every required route exists;
- every local import resolves;
- every release asset exists;
- hashes are recorded;
- secret scan is clean;
- battle result validation passes;
- economic mutations are client-gated;
- the real Expo/EAS build passes in the configured environment;
- authenticated Supabase smoke tests pass;
- device performance is measured.
