# VEXFORGE — Visual Assembly Specification

This file is an implementation contract, not an invitation to redesign.

## Composition

Desktop reference frame: 1440px content ceiling; 44px horizontal page gutter outside the content shell. Mobile shell: 14px side gutter at the viewport edge, 28px effective content width from the root body.

Header: 84px desktop / 76px mobile. The mobile wordmark is centered and the menu remains left-aligned. The download control is visible only where it can remain a non-interactive release gate.

Home hero: minimum `100svh`, full-bleed official VEXFORGE cover art, left-anchored editorial copy on desktop, compact image-first composition on mobile. Do not add a carousel, video background, particle layer or fake status metrics.

Interior hero: `68svh` desktop / `62svh` mobile. One large statement, one short supporting line. The image must carry most of the atmosphere.

Cinematic scenes: `76svh` desktop / `68svh` mobile. The visual frame, sigil, depth gradients and pointer parallax are intentionally subtle. Motion amplitude must remain single-digit pixels.

Cards: official Mythic/Legendary artwork only, 2:3 base ratio, with the first featured card allowed to lead the desktop grid. Hover tilt is capped to approximately 4–5 degrees and disabled for touch/reduced-motion.

World: five region panels. Desktop uses a five-column visual rail; mobile collapses to two columns. Avoid generic icon cards.

Factions: four image-led panels with the official faction icon, name and a small index. The imagery is the content; overlays exist only to preserve legibility.

Media: editorial mosaic, not a masonry/SaaS gallery. Keep labels restrained and avoid hover tooltips.

## Typography

Display: Cinzel / Cinzel Decorative.
Utility: Rajdhani.
Metadata: IBM Plex Mono.

Do not replace the type hierarchy with system sans, gradients in text, oversized all-caps body copy, or trendy variable-font substitutions.

## Color

Base: near-black / night blue.
Hierarchy: warm gold/ember.
Atmosphere: restrained violet and cold blue.

Do not introduce rainbow gradients, neon outlines, glass-heavy surfaces or arbitrary accent colors.

## Motion

Allowed: opacity, translate, scale, tiny rotateX/rotateY, image crop movement.
Not allowed: infinite particle systems, parallax layers moving at large amplitudes, auto-playing media, flashing, scroll-jacking or animation frameworks.

`prefers-reduced-motion` must disable decorative motion and use immediate reveals.

## Content discipline

Player-facing copy may describe:
- the game
- the collection
- battle
- the world
- factions
- media
- news
- official download status
- support

Player-facing copy must not describe:
- Supabase
- REST/API implementation
- Addressables/CCD
- database structure
- backend architecture
- build systems
- internal asset IDs
- security policies
- implementation status

## Download state

The current release state is pre-publication.

All download targets are intentionally empty. The visual surface may say `PRÓXIMAMENTE`, but it must not be keyboard-focusable as if it were an active link and must not initiate a download.

When official URLs become available, populate only `DOWNLOAD_TARGETS` and keep the visual design unchanged.
