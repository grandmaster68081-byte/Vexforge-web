# VEXFORGE OFFICIAL PORTAL V5.4 — REPLIT IMPLEMENTATION ORDER

## Authority
This package is the current visual handoff. V5.4 supersedes the V5.1/V5.2/V5.3 visual interpretations. Historical reports remain only for traceability.

## Mission
Ship a premium, art-directed VEXFORGE official game portal that feels like the entrance to a finished dark-medieval fantasy TCG universe — not a SaaS dashboard, not an editorial blog, not a dark template.

## Hard visual rules
1. No principal section may read as a blank black field.
2. Every principal section must have a visible material or artwork residency in the first viewport: full-bleed art, framed art, atmospheric art, a card object, or an art-backed module.
3. Black is an accent/contrast material, never the dominant page surface.
4. Existing official VEXFORGE artwork is the identity source. Do not invent art, faction names, card names, lore, dates, statistics, downloads, or live events.
5. Preserve Supabase, auth, RPC, data contracts, routes, and public-card source behavior.
6. Keep mobile deliberate: visual rails, strong crops, no tiny desktop cards stacked into a long empty column.
7. Do not replace visual meaning with decorative icons or dashboards.

## V5.4 improvements over V5.3
- stronger mid-tone stone/blue material system to remove dead-black stretches;
- brighter artwork exposure and lower overlay density;
- alternating chapter surfaces so pages do not repeat one dark gradient;
- more visible artwork in content zones, including atmospheric image residency behind text chapters;
- stronger card-object prominence on the Cards surface and, when available, the Home hero;
- more editorial-grade gallery and news/support transitions;
- richer footer end-cap with VEXFORGE world imagery rather than a black dead-end;
- stricter visual-residency verifier and public-asset contract checks.

## Implementation order
A. Read `CURRENT_SOURCE_OF_TRUTH.md`.
B. Preserve all backend/public contracts.
C. Install dependencies and run `npm run verify`.
D. Run `npm run typecheck` and `npm run build`.
E. Inspect `/`, `/game`, `/cards`, `/world`, `/news`, `/media`, `/download`, `/support` at 375px, 430px, 768px, 1024px and desktop.
F. Reject any viewport showing a large unintentional black/empty field between artwork chapters.
G. Commit only after the visual and code checks pass.

## Known environment limitation in this delivery
The package source was statically audited here, but dependency-backed `typecheck`/`build` were not executable in the model runtime because npm dependencies were not present and the registry/cache was unavailable. Replit must perform those two checks before deployment.
