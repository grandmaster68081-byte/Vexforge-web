# Visual assets -- what is closed vs. what is still pending generation

Verified directly against Supabase Storage (storage.objects), not against the
older vexforge_asset_files table, which had some stale entries that did not
match real uploaded files.

## Closed this pass (real files, wired into the frontend)

- Cards: 24/24 have a real image (cards.image_url / tg_cards.image_path),
  now rendered in CardsRoute.
- Assets gallery (/assets): boosts (4), frames (6), icons (7), logo (5),
  progression (3), plus single hero images for chests, cover, lobby, market,
  rewards, tutorial, wallet -- all registered as individual rows in
  vexforge_official_asset_manifest (previously this table only had 19
  zip-bundle rows, unusable for rendering).
- Logo wired into the side nav brand.
- Cover image wired as the Account (sign-in) screen background.
- Lobby image wired as the Home dashboard hero banner.

## Explicitly pending -- no individual images exist yet, only a zip bundle

These packs have a `.zip` registered but were never unzipped into individual
files in Storage (verified: zero non-zip objects under their folder):

- backgrounds
- clans
- events
- founders (the founder BADGE/cosmetic asset -- not the 24 founder cards,
  which already have real art)
- misc
- sessions
- ui_system

## Explicitly pending -- no image exists at all, in any form

- Faction icons (Guerrero, Mago, Paladín, Pícaro)
- Region art (Forge Core, Iron Veins, Shadow Fracture, Cinders Realm,
  Warbound Zone)
- Boss/enemy art for any region
- Clan/guild war visuals, world boss encounters, raid art
- Season/event art beyond the single generic "events" bundle

## Rule for whoever generates these next

Per the project owner: the CARD IMAGE is the single source of truth for a
card (name, rarity, faction, stats, lore all come from what is depicted in
the image, nothing is invented separately). The same principle should extend
to any new asset: generate the image first, on the same visual/tonal line as
the existing 24 cards and the cover/logo already in Storage, then read its
identity from it -- do not invent names/stats/lore ahead of the art.