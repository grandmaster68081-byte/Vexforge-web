# Visual assets — what is closed vs. what is still pending generation

Verified directly against Supabase Storage (storage.objects).
Last updated: chat34.

## Closed in chat31 (pre-existing)
- Cards: 24/24 images rendered in CardsRoute.
- Assets gallery: boosts (4), frames (6), icons (7), logo (5), progression (3).
- Single hero images: chests, cover, lobby, market, rewards, tutorial, wallet.

## Generated and uploaded in chat34 — all live in Storage with official public URLs

**Faction icons** (transparent PNG):
- Guerrero → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_guerrero.png
- Mago     → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_mago.png
- Paladín  → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_paladin.png
- Pícaro   → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/factions/icon_picaro.png

**Route background banners** (16:9 hero):
- PvP     → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_pvp.jpg
- Missions → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_missions.jpg
- Packs   → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_packs.jpg
- Clans   → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_clans.jpg

**Region art** (5 regions):
- Forge Core      → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/regions/region_forge_core.jpg
- Iron Veins      → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/regions/region_iron_veins.jpg
- Shadow Fracture → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/regions/region_shadow_fracture.jpg
- Cinders Realm   → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/regions/region_cinders_realm.jpg
- Warbound Zone   → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/regions/region_warbound_zone.jpg

**Events/season:**
- Season banner → https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/events/events_season_hero.jpg

## Frontend wired in chat34
- CardsRoute: faction filter bar + icons per card + rarity color coding.
- MissionsRoute: hero banner + 5-region clickable grid + styled mission list.
- PvpRoute: hero banner + events banner fallback + leaderboard table.
- PacksRoute: hero banner + visual pack card grid + orders table.
- ClansRoute: hero banner + improved data tables.
- styles.css: +220 lines — all new visual classes.

## Still pending (owner must generate or decide)
- founders_badge, misc, sessions, ui_system (only zip bundles, no individual art)
- Boss/enemy art for any region
- Raid, guild war, world boss visuals