# VEXFORGE Official Portal — Tier 1 Gold Master / Final Audit

## Product boundary

Single-purpose public game portal. The web presents VEXFORGE; Unity remains the playable client.

## Player-facing boundary

The shipped portal contains no login, auth UI, dashboard, admin controls, market, inventory, PvP, wallet, economy or gameplay controls. It also avoids implementation vocabulary in player-facing components.

The only dynamic data surface is the public, read-only card showcase. It requests only the fields required for display, filters to active Mythic/Legendary cards, validates the returned shape, and only accepts artwork from the canonical VEXFORGE card-art URL prefix.

## Download safety

`DOWNLOAD_TARGETS.googlePlay` and `DOWNLOAD_TARGETS.directAndroid` are empty. The header control is non-interactive while those values are empty. The route exists so official distribution URLs can be attached later without changing the information architecture.

## Asset policy

No raster artwork is stored in the package. Visual content comes from the existing canonical VEXFORGE Supabase Storage URLs or the existing public card-art catalog.

## Final refinement pass

- Removed decorative particle/star-field CSS and the corresponding DOM layer.
- Diversified official artwork by page/surface to avoid repetitive template composition.
- Switched client configuration naming from legacy `ANON_KEY` to `PUBLISHABLE_KEY`; the shipped fallback uses a `sb_publishable_...` value.
- Added noindex behavior for unknown SPA routes.
- Strengthened mobile navigation into a full-height editorial panel with existing VEXFORGE artwork.
- Added a route-safe hash scroll dependency and clearer focus treatment.

## Static verification actually executed in this environment

- TypeScript/TSX transpile syntax parser: PASS — 25 TS/TSX files.
- Portal isolation: PASS — 26 source files scanned.
- Literal internal-link audit: PASS — 8 internal paths checked.
- Public-copy isolation: PASS — 21 player-facing files scanned.
- Supabase public contract: PASS.
- Additional quality/security scan: PASS — 31 portal files scanned.
- CSS parser (tinycss2): PASS — 344+ stylesheet rules parsed without CSS parse errors.
- Local import resolution: PASS.
- Local raster payload check: PASS — none present.
- CSS brace balance: PASS.

## Runtime verification boundary

A full production Vite build and browser pixel QA were not claimed here because this audit environment could not install the npm dependency graph or reach the npm registry. Replit/CI must run `npm install`, `npm run verify`, `npm run typecheck`, `npm run build`, and `npm run verify:build` before merging.

## Security boundary

The only Supabase credential in client code is a publishable client key fallback. Supabase documents publishable keys as safe to expose in public components when RLS/privileges are correctly configured, while secret/service-role keys must remain server-side. The portal performs read-only public access and does not hold a user session.
