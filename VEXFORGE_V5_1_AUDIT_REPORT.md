# VEXFORGE Portal V5.1 — Final pre-handoff audit

## What was rejected from the previous delivery

The previous public composition was not acceptable as a finished TCG portal because it exposed implementation/status-style copy and used overly dense, dashboard-like mobile sections. The review specifically rejected visible concepts such as build/runtime language, publication state labels, missing-art notices, and copy that described the website's own implementation rather than the game.

## What V5.1 changes

- The public surface is written only for players, collectors, and visitors.
- The first viewport is artwork-led, full-bleed, and built around VEXFORGE's game identity.
- Navigation is reduced to the core public areas; Gallery remains available without adding another primary-nav item.
- Download surfaces no longer render dead-link controls. They present the official Android channels as informational destinations until real URLs exist.
- Image failures degrade to a neutral branded surface instead of browser broken-image UI where the image is rendered directly by the home page.
- The mobile contract is explicit for 720×1640, with 14px page gutters, vertical CTAs, 2:3 card proportions, and image-dominant sections.
- Duplicate or weak prelaunch wording was removed from the player-facing surface.
- Privacy and Terms are excluded from the sitemap until their final legal text is supplied; they remain routable for future completion.
- `/download/android` is excluded from the sitemap to avoid duplicate-indexed download content.

## Public-surface rule

No player-facing source under `src/pages`, `src/components`, or `src/data` may expose Unity, Supabase, REST/API, database, backend, runtime, deployment, build-system, Replit, repository, environment-variable, asset-ID, debugging, or internal delivery language.

## Verification executed

PASS — TypeScript/TSX syntax parser

PASS — Portal isolation

PASS — Internal-link audit

PASS — Public-copy audit

PASS — Dedicated public-surface audit

PASS — Public card-data contract

PASS — Responsive composition contract for 720×1640 and 1440×900

PASS — Quality audit

PASS — CSS brace balance

PASS — package.json JSON validation

## Build limitation

A production Vite build was not executed in this container because the npm dependency registry was unavailable. This is intentionally not hidden: Replit must run `npm install`, `npm run verify`, `npm run typecheck`, `npm run build`, and `npm run verify:build` and inspect the live result at 720×1640 and 1440×900 before merging.
