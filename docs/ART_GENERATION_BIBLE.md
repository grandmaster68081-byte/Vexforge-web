# VEXFORGE V5.6 — ART GENERATION BIBLE FOR REPLIT

## Purpose
This document is the executable art brief for Replit's image-generation workflow. The package contains three high-quality VEXFORGE-specific visual references and one current-portal QA contact sheet. Use the references for **quality, lighting, density, material realism and cinematic composition**. Do not copy another game's branding, characters or exact layouts.

### Supplied references
- `public/art/references/REF_A_SWEeping_CITADEL.png` — monumental exterior citadel / gate / mountain valley / warm-vs-cool lighting.
- `public/art/references/REF_B_ARENA_CITADEL.png` — grand arena / fortress scale / ceremonial approach / layered depth.
- `public/art/references/REF_C_FORGE_CATHEDRAL.png` — interior forge-cathedral / molten light / stone / chains / blue crystal / reflective floor.
- `public/art/references/REF_CURRENT_PORTAL_QA_CONTACT_SHEET.jpg` — the current portal visual problem set; use it to avoid returning to sparse dark sections.

## Master prompt language
Use this visual DNA in every generated asset:

> VEXFORGE original dark medieval fantasy card-game world, monumental gothic architecture, ancient stone, forged black metal, aged bronze and antique gold, deep crimson banners, restrained arcane blue energy, cinematic volumetric atmosphere, physically believable materials, large environmental scale, foreground/midground/background depth, realistic lighting, premium AAA game key art quality, richly detailed but readable composition, dramatic warm-versus-cool light contrast, wet stone or worn surfaces where appropriate, subtle fog and embers, sophisticated and mysterious, no modern objects, no futuristic UI, no cyberpunk neon, no cartoon style, no text, no logos, no characters that resemble known franchises, original VEXFORGE setting.

## Asset plan
The 14 stable platform scenes listed below are now bespoke local VEXFORGE artwork. Future improvements must replace them one-for-one without changing component APIs, filenames or the card-only Supabase boundary.

### 01 — Portal hero / Citadel Gate
Ultra-wide establishing scene. A colossal VEXFORGE gate on a cliffside citadel, distant mountains and waterfalls, floating stone fragments, ceremonial banners, braziers and a central blue arcane seam. Leave a quiet-but-detailed area for headline typography on the left.

### 02 — Forge Cathedral
Interior forge cathedral with a monumental furnace, molten metal, suspended chains, black stone columns, bronze machinery, blue crystals and wet reflective floor. Warm firelight must dominate lower midground while cool blue magic defines the upper architecture.

### 03 — Battle Arena
Circular ritual arena inside the fortress, banners, stairway, braziers, giant statues, cathedral in the far background, moonlight and blue portal energy. Composition should create a strong visual runway toward the arena center.

### 04 — World Atlas
A panoramic view that shows multiple regions and vertical depth: mountain valley, fortress terraces, bridges, waterfalls and a distant citadel. This is the visual bridge between collection and world.

### 05 — News / Chronicle Courtyard
Architectural courtyard / archive chamber with tall banners, stone steps, lanterns, carved panels and an open view into the world. Designed for editorial cards but visually complete without fake news.

### 06 — Media / Gallery Chamber
A dramatic gallery hall with framed empty display spaces, statues, banners, spotlights and a distant magical vista. Artwork should make an empty media archive look intentional rather than unfinished.

### 07 — Download / Forge Access
A ceremonial approach to a huge gate or forge portal, with a clear foreground platform where the download action can sit. Use strong warm light and a distinct cool portal seam.

### 08 — Support / Sanctum
Quiet but visually rich stone sanctuary / archive space, warm window light, blue rune crystal, carved columns, long shadow shapes and enough open space for FAQ content.

### 09 — Warrior environment
Battle-ready fortress terrace with steel, shield forms, crimson banners and warm firelight. No character portrait is required; environment should communicate the faction.

### 10 — Mage environment
Arcane chamber with blue crystal geometry, storm-like magical light, manuscripts or stone inscriptions and deep blue atmosphere. No futuristic holograms.

### 11 — Paladin environment
High ceremonial hall with aged gold, ivory stone, banners and a controlled radiant light source. Noble, disciplined, imposing.

### 12 — Rogue environment
Shadowed rooftop / narrow fortress passage with wet stone, green-black atmosphere, hidden alcoves, distant city lights and narrow shafts of moonlight. Sophisticated rather than horror.

## Art direction for generated scenes
- Prefer wide 21:9 or 16:9 source images so desktop crops retain architectural context.
- Generate at the highest resolution supported by the Replit environment.
- No embedded text.
- No interface elements.
- No game HUD.
- No random cards floating in the environment.
- No recognizable real-world buildings.
- No franchise characters.
- Avoid excessive darkness: black can appear in metal/shadows, but the image must preserve midtone detail.
- Keep at least 35–50% of the frame materially legible after a dark text overlay.
- Create visual hooks near the edges so scrolling feels cinematic.

## Asset naming contract
Use stable files matching this package:
`01-home-citadel-dawn.jpg` through `14-mobile-chamber.jpg`.
All platform scenes stay local and generated; only official card artwork may be consumed from Supabase Storage.
