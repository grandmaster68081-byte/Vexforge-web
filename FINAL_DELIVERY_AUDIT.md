# VEXFORGE Official Portal V5.1 — Delivery Audit

## Why V5.1 exists

A review of the previous mobile presentation showed a layout that read like a constrained product dashboard and exposed implementation/status details. V5.1 removes those patterns from the public experience.

## V5.1 public experience

- Full-bleed game-art hero at the first viewport.
- Compact navigation with a dedicated download route.
- Clear player pathways into game, cards, world, news and media.
- Large image-led discovery modules.
- TCG card presentation with 2:3 artwork relationship.
- Four image-led faction panels.
- Full-width world scene.
- Controlled Android release gate with empty store targets until official URLs exist.
- No fake news, fake metrics, fake dates, fake store links, or technical status panels.

## Static validation executed in this environment

- TypeScript/TSX syntax parser: PASS.
- Portal isolation: PASS.
- Internal link audit: PASS.
- Public-copy audit: PASS.
- Public card contract: PASS.
- Responsive composition contract: PASS.
- Quality/public-surface audit: PASS.

## Build boundary

A production npm build could not be executed in this environment because the dependency registry was unreachable from the container. Replit/CI must run the complete install, verify, typecheck, build, and build-verification sequence before merge. The package deliberately fails closed on several public-surface checks so a build cannot be considered complete without those validations.
