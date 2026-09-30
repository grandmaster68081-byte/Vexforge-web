# VEXFORGE 1.5.0 · OFFICIAL SCENE REVIEW

The contact sheet in `OFFICIAL_SCENE_REEL_CONTACT_1.5.jpg` is a review artifact built from the exact runtime scene masters shipped with this package.

`nexus` establishes the primary world gate and monumental scale.
`arena` is the combat/ritual floor and boss-entry stage.
`archive` and `store` use the vault/chest language so cards and acquisitions feel like objects of the world rather than flat UI cards.
`forge` and `missions` share the industrial-forged visual vocabulary for creation and progression.
`founders` and `world` provide exterior world continuity and geography.
`economy`, `social`, `meta` and `tutorial` are deliberately derived from the same architectural universe rather than generic dashboard surfaces.
`events` is the dedicated live-ops/seasonal visual plate.

Runtime uses each scene through the tier registry in `src/core/constants.ts`; the active quality tier selects the matching derivative in `assets/content-packs/<scene>/`.
