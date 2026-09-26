# VEXFORGE OFFICIAL PORTAL — V5.6 VISUAL FINAL / ART-DIRECTED WORLD CLASS

## Decision implemented
V5.6 changes the visual-source model of the portal:

**ONLY official VEXFORGE card artwork is consumed from Supabase Storage.**
All other platform imagery is local/generated and versioned with the portal. The 14 stable platform slots are populated with bespoke VEXFORGE scenes generated from the supplied reference pack and the art-generation bible in this package.

This is intentional: the current non-card storage artwork is not considered a quality source for the final portal.

## North star
The portal must read as the **front gate to VEXFORGE**, not as a website template.

The visitor should feel that they have crossed into a place: a monumental dark-medieval card-game world with architectural depth, warm firelight, cold arcane blue, stone, forged metal, aged gold, crimson cloth, mist and enormous environmental scale.

### Three principles
1. **Scene first.** Every major chapter starts from an environment, not a UI panel.
2. **Card second.** The official VEXFORGE cards are the unique canonical visual identity object and the collection chapter gives them the strongest visual treatment.
3. **Copy third.** Text explains and navigates the experience; it never replaces the visual world.

## What is deliberately NOT carried over from Storage
Do not use cover/main.jpg, lobby/main.jpg, misc/* or regions/* from Supabase as platform art. Those assets may remain backend assets, but they are outside the V5.6 portal art source.

## Required visual ingredients
- Full-bleed cinematic environments.
- Foreground / midground / background separation.
- Monumental architecture rather than generic fantasy scenery.
- Visible material variation: stone, worn metal, bronze, cloth, glass/crystal, wet floor, smoke/mist.
- Warm light sources: braziers, windows, molten forge, lanterns.
- Cool light sources: arcane crystal, portal seams, moonlight.
- Controlled gold edge highlights.
- Crimson banner cloth as a recurring VEXFORGE motif.
- Subtle glyph/rune language derived from the VEXFORGE card identity, without copying card text/artwork.
- Real motion: slow camera drift, depth/parallax, ambient light breathing, image movement on hover, card lift and reflective sweep.
- Reduced-motion fallbacks.

## Forbidden
- Flat black section fills.
- SaaS/admin/dashboard visual language.
- Empty negative space used as a substitute for art direction.
- Generic stock fantasy backgrounds.
- Cyberpunk neon.
- Rainbow gradients.
- Fake screenshots or fake gameplay footage.
- Invented release dates, player counts, social metrics, marketplace claims or other factual game information.
- Any non-card artwork fetched from Supabase Storage.

## Card identity boundary
The card gallery may fetch official card records and canonical card image URLs from the existing Supabase contract. Do not regenerate, repaint, recolor, crop into new card art, or replace official card artwork with AI artwork.

The platform's generated environmental art should **support the cards**, not compete with their canonical identity.
