# VEXFORGE V5.6 — REPLIT HANDOFF

This ZIP is the complete visual handoff for the VEXFORGE Official Portal.

## What you are receiving
The package includes the current React portal source, local platform art plates, three high-quality generated visual references, faction glyphs, art-generation prompts, visual QA criteria, and implementation/verification rules.

## Most important instruction
Do NOT treat this as another color/CSS pass.

The desired transformation is:

**LANDING PAGE → ART-DIRECTED GAME WORLD**

The visual hierarchy must be:

**environment → collectible object → navigation/copy**

not:

**text block → black background → generic panel**

## Source boundaries
- `public/art/references/*` = supplied visual-quality references.
- `public/art/portal/*` = stable local platform-art slots. Replace temporary plates with final bespoke Replit-generated art one-for-one.
- `public/art/factions/*` = local VEXFORGE faction glyphs.
- `src/lib/cards.ts` = only source allowed to use the official VEXFORGE Supabase Storage card-art prefix.
- `src/lib/assets.ts` = local platform art map; do not reintroduce non-card Storage URLs.

## Generation requirements
Read `docs/ART_GENERATION_BIBLE.md` before generating any art.
Use the supplied references to match: cinematic density, believable materials, architectural scale, warm/cool lighting, atmospheric depth and premium AAA presentation.

Do not copy another game's branding, characters, assets or exact composition.

## Final generation set
Generate and replace the 14 stable slots:
01 hero / 02 forge / 03 arena / 04 world / 05 news / 06 media / 07 download / 08 support / 09 warrior / 10 mage / 11 paladin / 12 rogue / 13 footer / 14 mobile.

## Do not change
Do not change Supabase schema/RPC/auth contracts, card filtering logic, public route structure, Unity logic, player state, or existing data contracts.

## Acceptance
The portal is not accepted if any principal viewport becomes a flat black block, if a non-card Supabase Storage image is introduced, or if the official card images are replaced or altered.

Run all verification commands before merge/deploy.
