# VEXFORGE V5.6 — CURRENT SOURCE OF TRUTH

## Authority
V5.6 is the sole current visual implementation authority in this package. All V5.1–V5.4 visual documents are historical context only.

## Non-negotiable visual source rule
**Supabase Storage may be consumed by the public portal for official VEXFORGE card artwork only.**
No platform hero, environment, faction background, footer art, media background, support art, news art, download art, mobile art or decorative image may be read from the current non-card Storage directories.

Platform/environment artwork is local and generated. The package contains reference art, temporary high-quality fallback plates and the art-generation bible that Replit must use to replace those temporary plates with bespoke final scenes.

## Product intent
The portal is the visual front gate to VEXFORGE. It must feel like entering an original premium dark-medieval fantasy TCG world before it feels like visiting a website.

## Visual law
- Scene first. Object second. Copy third.
- Every major viewport has visible visual information: environment, collectible object, framed image, atmospheric material or a deliberate combination.
- Never use a flat black rectangle as the primary visual surface.
- Use deep blue-black as shadow material, not as an empty field.
- Warm firelight and cool arcane blue create depth.
- Aged gold is structural, not decorative glitter.
- Crimson cloth and stone/metal architecture provide recurring VEXFORGE motifs.
- Motion must be physical and restrained: camera drift, depth shift, light breathing, card lift, image crop movement and reflective catches.
- Mobile must retain visual density through intentional crops, scroll rails and scene-first composition.

## Card identity law
Official card records and official card image URLs remain canonical. Do not generate, repaint, alter or replace official VEXFORGE card artwork.

## Technical law
Do not modify Supabase schema/RPC/auth contracts, public card filtering rules, player-state logic, existing routes, or unrelated backend/game logic.

## Required final generation workflow
1. Keep the supplied reference images inside `public/art/references/`.
2. Use `docs/ART_GENERATION_BIBLE.md` to generate bespoke platform scenes.
3. Replace temporary local plates one-for-one; preserve filenames and component APIs.
4. Keep platform imagery local.
5. Keep official card imagery remote and card-only.
6. Run `npm run verify`, `npm run typecheck`, `npm run build`, and `npm run verify:build`.
