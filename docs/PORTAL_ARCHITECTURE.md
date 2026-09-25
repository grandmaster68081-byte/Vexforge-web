# Portal Architecture

`src/pages` contains only public editorial routes.

`src/components` contains reusable cinematic, card, navigation, reveal and publication-gate components.

`src/lib/assets.ts` is the canonical public asset map.

`src/lib/cards.ts` uses the public Supabase REST endpoint directly rather than the Supabase SDK. This keeps the public portal smaller and avoids exposing authentication capabilities it does not need.

No new database tables are required.

The portal never owns player state. Unity remains the playable client and Supabase remains authoritative for game state.
