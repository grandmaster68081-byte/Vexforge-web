# VEXFORGE — Replit implementation contract / Tier 1 Gold Master

## Purpose

Replace the current VEXFORGE web application surface with the supplied official public portal.

The Unity Android project is out of scope and must not be edited by this package.

## What Replit must do

1. Work on the canonical `main` branch only.
2. Back up/tag the current web state before replacement.
3. Replace the website source with the contents of this package's `src`, `public`, root config and scripts.
4. Remove the old web-client routes/components/providers that belong to the former dashboard application.
5. Do not redesign the supplied UI. The package is the design specification, including spacing, responsive breakpoints, motion amplitude, hero composition, card hierarchy and disabled-download behavior.
6. Do not invent images, copy, metrics, download links, social links or database tables.
7. Do not add authentication to the portal.
8. Do not touch `unity/`.

## Required public routes

`/` `/game` `/cards` `/world` `/news` `/media` `/download` `/download/android` `/support` `/privacy` `/terms` plus SPA fallback.

The `/download` and `/download/android` routes are informational until official distribution links exist. `DOWNLOAD_TARGETS.googlePlay` and `DOWNLOAD_TARGETS.directAndroid` must remain empty.

## Supabase

Do not create tables.

The portal may perform one public, read-only card query against the existing `cards` endpoint. It must expose only the fields actually required by this portal: `id, name, rarity, faction, image_url, power`, filter `active = true`, restrict rarity to Mythic/Legendary, and accept artwork only from the canonical VEXFORGE card-art path.

No player session, wallet, inventory, marketplace, PvP, admin or economic state belongs in this website.

The client fallback configuration is a publishable client key, never a secret, service-role or administrative key.

## Assets

Use the supplied `src/lib/assets.ts` URLs as the canonical public asset map. Do not copy these remote images into the repository. If an asset is unavailable, preserve the code fallback; do not substitute stock or generated art.

## Visual requirements

Treat the supplied CSS as final design direction:

- full-bleed cinematic hero
- deep night background
- gold/ember hierarchy
- controlled violet/blue atmosphere
- Cinzel/Cinzel Decorative display type
- Rajdhani and IBM Plex Mono utility type
- angular precision framing
- asymmetric editorial composition
- high-rarity card presentation
- faction and world visual rails
- restrained micro-scenes
- no generic SaaS card layout
- no particle field
- no fake statistics
- no excessive glassmorphism

## Performance

Keep the direct public REST card query bounded and timed out.
Keep eager image loading limited to the first visual priority.
Use lazy loading for secondary media.
Respect `prefers-reduced-motion`.
Do not add an animation framework.

## Verification

Run from the new web root:

```bash
npm install
npm run verify
npm run typecheck
npm run build
npm run verify:build
```

`npm run verify` includes the literal internal-route audit (`verify:links`) in addition to portal, syntax, copy, Supabase public-contract, and quality checks.

All commands must pass before the merge.

## Definition of done

The deployed website must present only the public VEXFORGE portal and no former dashboard functionality. The visible download CTA must remain non-interactive while the official URLs are empty; only populate the configured targets when real official URLs exist. The visual hierarchy must match the supplied Tier 1 specification without Replit inventing substitute UI or artwork.
