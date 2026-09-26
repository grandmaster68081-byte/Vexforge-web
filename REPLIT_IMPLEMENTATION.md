# VEXFORGE V5.6 — REPLIT IMPLEMENTATION ORDER

## Objective
Replace the V5.4 presentation with the V5.6 art-directed visual system. This is a visual/product implementation. Preserve backend behavior and official card identity.

## Critical rule
Do not fetch non-card platform artwork from Supabase Storage. All non-card art is local/generated under `public/art/`. The only Supabase Storage asset prefix allowed by the portal is the official `/cards/` prefix in `src/lib/cards.ts`.

## Execution order
### 1. Read the source of truth
Read:
- `CURRENT_SOURCE_OF_TRUTH.md`
- `VEXFORGE_V5_6_VISUAL_FINAL.md`
- `docs/ART_GENERATION_BIBLE.md`
- `docs/VISUAL_ASSEMBLY_SPEC.md`
- `DESIGN_ACCEPTANCE_CHECKLIST.md`

### 2. Preserve application architecture
Do not replace React routing, public route structure, card data fetching, or backend contracts.

### 3. Generate the platform art
Use the supplied `public/art/references/` images as visual references. Generate new original VEXFORGE scenes for the asset manifest. No text, logos, game HUDs, franchise characters or copied compositions.

### 4. Keep the visual API stable
Every file in `public/art/portal/` is a stable art slot. Replit can replace the temporary plate with final generated art without modifying page code.

### 5. Implement motion
Use the existing React reveal/parallax behavior plus the V5.6 CSS atmosphere layer. Motion is subtle, spatial and interruptible. `prefers-reduced-motion` must disable it.

### 6. Validate
Run:
`npm run verify`
`npm run typecheck`
`npm run build`
`npm run verify:build`

Do not deploy if any visual-source, syntax, route, responsive or Supabase-contract verification fails.
