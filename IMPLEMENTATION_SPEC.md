# VEXFORGE V5.6 — IMPLEMENTATION SPEC

## Scope
Visual portal only. Preserve the existing public routes and card-read contract.

## Asset contract
`src/lib/assets.ts` is local-art-only. `src/lib/cards.ts` is the only source allowed to use the official Supabase card Storage prefix.

## Scene slots
01 hero / 02 forge / 03 arena / 04 world / 05 news / 06 media / 07 download / 08 support / 09–12 factions / 13 footer / 14 mobile.

## Generated art replacement
Final generated assets must keep the same filenames and visual intent. If Replit generates a higher-quality replacement, replace the file in-place and do not introduce new runtime URLs.

## Interaction contract
Preserve route navigation, keyboard focus, reduced-motion support, semantic headings and accessible labels.
