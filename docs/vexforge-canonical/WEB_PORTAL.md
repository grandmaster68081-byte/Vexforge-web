# VEXFORGE — Official Public Web Portal

## Canonical role

VEXFORGE has one active game runtime: Unity Android under `unity/**`.

The web surface under `src/**` and `public/**` is the **official public portal**. It is not a second game client and must not replicate player authentication, inventory, wallet, marketplace actions, battles, admin controls, or other player-state operations.

## Portal responsibilities

- present the game;
- explain the core experience;
- present the public card catalog, prioritizing Mythic/Legendary;
- show official world/faction/media art;
- publish news/editorial updates stored in Git;
- provide concise support/FAQ information;
- expose legal pages;
- provide stable future download destinations.

## Backend policy

The portal uses Supabase only for public catalog reads and canonical public asset URLs. It does not persist sessions and does not create new portal tables.

Supabase remains the authority for Unity game state, economy, inventory, battle results, progression and other runtime-sensitive data.

## Download policy

Download destinations are centrally defined in `src/lib/assets.ts`. Empty URLs are intentional until official distribution destinations exist.

## Asset policy

The portal reuses canonical Storage assets already declared and verified by the repository's asset manifest. It must never substitute stock imagery for an unavailable official asset.

One original generated portal key-art image is included locally for atmospheric presentation. It is not a substitute for canonical in-game assets.

## Retirement policy

The former web application is retired at the client layer. Legacy routes should return the portal 404 and must not be preserved as aliases.

Database cleanup is separate and non-destructive until an explicit Unity/backend consumer audit proves that a table, RPC, function or storage object is truly web-only.
