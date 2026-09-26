# VEXFORGE — V5.4 Visual Assembly Specification

This is the current visual implementation contract. Earlier versions remain historical reference only.

## Composition
Desktop reference frame: 1440px content ceiling.

Header: 84px desktop / 76px mobile. The mobile menu is a branded navigation chamber, not a plain drawer.

Home hero: minimum `100svh`, full-bleed official VEXFORGE cover art. When an approved featured card image is returned, it may appear as the hero focal object on desktop.

Home chapter rhythm: prologue scene → journey rail → discovery gates → card vault → faction gallery → cinematic world reveal → Android access scene.

Interior heroes: image-led, one dominant statement, short supporting line.

Cinematic scenes: large environmental artwork, restrained veil, framed corners and subtle pointer parallax.

Cards: official artwork only, 2:3 base ratio. The archive is a collectible shelf, not a generic product list.

World: five approved region images presented as a visual browse rail plus a cinematic transition scene.

Factions: four image-led panels with approved icons.

News: current content may be empty, but the page architecture must remain visually complete without fabricating stories or dates.

Support: FAQ is paired with a world image and quick visual routes.

Media: image mosaic; keep the gallery dense and visual.

## Visual density rule
No principal chapter may read as a featureless black field. Each major chapter needs visible artwork, an image-backed object, material depth or a combination within its first viewport.

## Typography
Display: Cinzel / Cinzel Decorative.
Utility: Rajdhani.
Metadata: IBM Plex Mono.

## Color
Base: deep blue-black / obsidian.
Material mid: blue-steel / stone / forged-metal.
Hierarchy: aged gold.
Atmosphere: cold blue plus restrained faction colors.

Do not introduce rainbow gradients, cyberpunk neon, glossy glass-heavy UI or unrelated accent colors.

## Motion
Allowed: opacity, translate, scale, tiny rotateX/rotateY, subtle image crop movement.
Not allowed: infinite particle systems, large parallax amplitudes, scroll-jacking or flashing.

`prefers-reduced-motion` must remove decorative motion.

## Content discipline
Player-facing copy may describe the game, cards, battle, world, factions, media, news, download status and support. Do not fabricate unavailable facts to fill visual space.
