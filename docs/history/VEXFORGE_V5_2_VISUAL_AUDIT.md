# VEXFORGE V5.2 — Full Visual Audit / Premium Tier-1 Upgrade

## Audit basis

Reviewed:
- V5.1 source package and implementation documents.
- Public page architecture and route set.
- Existing CSS system and component hierarchy.
- Supabase-backed public card loading contract.
- Supplied mobile recording of the V5.1 portal.

This audit is intentionally visual/product-facing. It does not propose changing the VEXFORGE backend, economy, authentication, Unity project, database schema, RPCs or game logic.

## Overall diagnosis

V5.1 is structurally disciplined and already avoids several common failures: it is not a SaaS dashboard, it has an artwork-first hero, it uses a coherent type system, it keeps download URLs empty until official URLs exist, and it avoids fabricated metrics.

The remaining gap is **premium visual density and material continuity**.

The mobile recording makes this especially clear: the first hero establishes a strong VEXFORGE identity, but after the hero the experience repeatedly returns to very dark fields with isolated text blocks. The viewer's eye therefore loses the feeling of travelling through a game world.

The correct improvement is not to add more widgets. It is to make the existing content feel physically connected by artwork, stone/metal surfaces, controlled illumination, framing and stronger transitions.

## Findings by area

### 1. Home hero — strong foundation, needs more breathing room for artwork

V5.1's hero already communicates the product. The principal refinement is to reduce unnecessary darkening and let the official cover artwork carry more of the first impression.

V5.2:
- raises artwork brightness/saturation slightly;
- softens the black overlay;
- keeps text legible through a directional veil rather than a global dark wash;
- keeps the gold hierarchy;
- preserves the cinematic composition.

### 2. Introduction — previously read as a text chapter on black

The introduction contained good content but insufficient material framing.

V5.2 adds:
- a warmer stone/obsidian background field;
- a framed artwork treatment;
- an existing VEXFORGE ForgeGlyph seal;
- a more substantial engraved pillar rail;
- subtle gold construction lines.

No new asset or invented fact is introduced.

### 3. Discovery — needed stronger visual continuity

The discovery cards were visually correct but could still feel like three web cards.

V5.2 treats them as framed portals into the world:
- larger image presence;
- stronger internal frame;
- warm corner line;
- brighter official artwork;
- darker text protection only at the lower reading zone.

### 4. Collection — blank/near-black card states are unacceptable for a premium portal

The recording shows a card position that can become visually empty when a public card has no approved artwork URL.

V5.2 changes this behavior. If a card is missing its approved image, the component uses the existing official VEXFORGE cover as a visual fallback and clearly labels it as official artwork. This prevents an empty black rectangle without inventing card art.

The real public card image remains preferred whenever present.

### 5. Factions — identity needed to become more visual

The faction artwork is already useful. V5.2 increases its visual authority with:
- faction-specific accent variables from the existing tone metadata;
- stronger image exposure;
- engraved inner frames;
- better separation between the four panels;
- deeper but localized lower text protection.

### 6. World — should feel like a location reveal, not another dark section

The world scene now uses more of the official image and less global black overlay. The section is treated as a cinematic environmental reveal with a gold structural edge.

### 7. Interior pages — the biggest consistency problem

The same near-black base was repeated across Game, Cards, World, News, Media, Download and Support.

V5.2 establishes a common material language:
- night blue/obsidian field;
- stone-blue intermediate surfaces;
- aged-gold hierarchy;
- warm edge lighting;
- image-led heroes;
- restrained borders.

This creates a recognizable VEXFORGE portal system without turning the site into a UI dashboard.

### 8. Mobile — the key acceptance target

The recording demonstrates that mobile is where visual emptiness is most obvious.

V5.2 specifically addresses mobile by:
- keeping artwork brighter;
- reducing section voids;
- increasing framed image presence;
- preserving image-led discovery cards;
- retaining two-column faction rhythm where practical;
- using a one-column fallback only when the image needs sufficient area;
- ensuring card missing states remain visually populated.

## What V5.2 deliberately does NOT add

- No fake player counts.
- No fake economy numbers.
- No fake launch date.
- No fake social links.
- No fabricated card artwork.
- No fake screenshots.
- No technical status panels.
- No dashboard widgets.
- No particle/star-field background.
- No neon cyberpunk treatment.
- No excessive glassmorphism.
- No changes to Unity or Supabase architecture.

## Premium acceptance test

The portal passes the visual intent only if a visitor can understand the sequence as:

**VEXFORGE world → game → collection → factions → world → official release**

without encountering a section that visually collapses into a featureless black void.

The page should feel like one authored game property, not a collection of independent web sections.
