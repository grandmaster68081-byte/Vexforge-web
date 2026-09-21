# VEXFORGE — Portal Visual Spec

## Creative target

Premium digital TCG publisher portal. Small number of surfaces. Each one should feel authored, not assembled from generic cards.

## Visual rhythm

1. Full-bleed cinematic opening.
2. Thin navigation rail.
3. Editorial statement.
4. One cinematic micro-scene.
5. High-rarity card display.
6. Faction rail.
7. Media feature.
8. Download band.
9. Compact footer.

Secondary routes repeat this rhythm with one page hero plus one or two strong information sections.

## Motion

Motion is used as a cue, not decoration:

- pointer parallax on the desktop hero;
- reveal-on-scroll for editorial blocks;
- card image scale and restrained sheen on hover;
- no continuous particle system;
- no looping fake energy around every component;
- no animation that blocks content or interaction;
- reduced-motion behavior is explicitly supported.

## Typography

- `Cinzel Decorative` only for the primary brand headline when appropriate.
- `Cinzel` for section/page headlines.
- `Rajdhani` for navigation, labels and compact UI.
- `IBM Plex Mono` for codes, technical labels and micro metadata.

## Color discipline

Base:
- `#05070b`
- `#090d13`
- `#0b1118`

Accent:
- `#c9901f`
- `#f0c050`

Supporting:
- `#7b4fd4`
- `#e84040`
- `#5b8bf5`
- `#3dc96b`

The supporting colors belong to faction/rarity contexts; do not turn them into a rainbow UI.

## Shape language

Use hard-edged / clipped geometry on high-value controls and editorial frames. Avoid excessive rounded rectangles. A few 12–16px radii are acceptable for content surfaces, but the portal should not resemble a SaaS dashboard.

## Responsive target

Mobile is first-class. The layout must remain legible at narrow Android widths and expand to a 1200–1240px editorial grid on desktop.
