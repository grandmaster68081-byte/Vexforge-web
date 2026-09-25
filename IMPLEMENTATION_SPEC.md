# VEXFORGE — Official Portal V5 Tier 1 / Implementation Specification

## 1. Product role

The website is the public game portal for VEXFORGE. It is not a second game client and it is not a dashboard.

## 2. Visual system

V5 is artwork-first. The first viewport must communicate the game through official art, typography, composition and clear entry points before explanatory copy.

Core characteristics:

- full-bleed cinematic hero;
- dark night palette with warm gold hierarchy;
- restrained violet/blue atmosphere;
- Cinzel / Cinzel Decorative for display, Rajdhani for utility, IBM Plex Mono for metadata;
- angular precision lines without turning the page into a HUD;
- large image-led discovery, faction and world modules;
- high-rarity cards presented at the native TCG 2:3 relationship;
- no generic SaaS dashboard cards;
- no fake metrics, technical-status panels, particles or excessive glassmorphism.

## 3. Mobile composition

Reference mobile viewport: 720 × 1640.

The hero is full bleed. Text is placed over the artwork with a 14px outer gutter; artwork is not boxed inside a narrow desktop shell. Discovery, factions, world and release surfaces each have a distinct vertical rhythm. The layout collapses intentionally at 820px and 560px.

## 4. Routes

`/` `/game` `/cards` `/world` `/news` `/media` `/download` `/download/android` `/support` `/privacy` `/terms` and SPA fallback.

## 5. Download

`DOWNLOAD_TARGETS.googlePlay` and `DOWNLOAD_TARGETS.directAndroid` remain empty until official URLs exist. The visual release gate is non-interactive while empty.

## 6. Assets and cards

Use the canonical asset URLs in `src/lib/assets.ts`. Public cards are read-only and limited to active Mythic/Legendary entries and the required display fields. Only artwork beginning with the canonical public VEXFORGE card-art prefix is accepted.

## 7. Player-facing copy boundary

Player-facing files must never mention Unity, Supabase, REST, API, database, backend, runtime, deployment, build systems, implementation status, or internal asset IDs.

## 8. Verification

Run `npm install`, then `npm run verify`, `npm run typecheck`, `npm run build`, and `npm run verify:build`. The supplied static verification suite includes a responsive composition contract.
