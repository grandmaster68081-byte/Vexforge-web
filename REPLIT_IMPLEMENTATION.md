# VEXFORGE — Replit implementation contract / Tier 1 Master V5

## Mission

Replace the current VEXFORGE public website with the supplied V5.1 official game portal. This package is an implementation package, not a visual suggestion.

The website must read as a finished game property: artwork first, clear player pathways, strong TCG presentation, and no engineering or build-system language in the public experience.

The Unity Android project is out of scope. Do not edit `unity/`.

## Required execution rules

1. Work on the canonical `main` branch only.
2. Back up/tag the current web state before replacement.
3. Treat this package directory as the web source of truth.
4. Replace the existing public website source/config with these package files.
5. Remove the former dashboard UI/routes/providers from the public website.
6. Do not reintroduce development/status panels, technical copy, fake metrics, placeholder URLs, or fake product facts.
7. Do not redesign the supplied V5.1 composition during execution. Treat this package as the visual source of truth.
8. Do not invent artwork, fake screenshots, release dates, player counts, social accounts, card facts, or store URLs.
9. Do not add authentication to the public portal.
10. Do not create new data tables or mutate the existing database schema.
11. Do not touch `unity/`.

## Public routes

`/` `/game` `/cards` `/world` `/news` `/media` `/download` `/download/android` `/support` `/privacy` `/terms` plus SPA fallback.

## Download state

`DOWNLOAD_TARGETS.googlePlay` and `DOWNLOAD_TARGETS.directAndroid` must remain empty until real official URLs exist. The download surfaces may show a clear pre-release state, but empty targets must never behave like links.

## Player-facing boundary

Public pages may discuss the game, collection, battles, world, factions, news, media, support, and official availability. They must not expose Unity, Supabase, REST/API implementation, database structure, backend architecture, build systems, deployment details, runtime details, internal asset IDs, environment variables, repository details, or implementation status.

## Visual acceptance

### Mobile — 720 × 1640 reference

- The hero is edge-to-edge and artwork-led.
- The artwork uses the available viewport rather than sitting inside a desktop-style card.
- Player-facing copy stays inside a 14px side gutter.
- Primary actions become a clean vertical stack.
- Card art preserves a true 2:3 TCG relationship.
- Faction and discovery imagery remains dominant.
- No debug/status/engineering language is visible.

### Desktop — 1440 × 900 reference

- Navigation stays secondary to the game art.
- Hero occupies most of the opening frame.
- Discovery uses one lead visual and supporting visuals.
- Card presentation uses a featured lead plus supporting cards.
- Factions are image-led editorial panels rather than SaaS cards.
- World is a full-width cinematic scene.
- Download is a controlled release gate until URLs exist.

## Verification

From the supplied web root run:

```bash
npm install
npm run verify
npm run typecheck
npm run build
npm run verify:build
```

All commands must pass before merge.
