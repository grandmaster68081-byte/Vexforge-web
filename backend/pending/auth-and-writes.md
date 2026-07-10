# Pending: auth and writes

Wiring an auth provider (Supabase Auth) is the single highest-leverage next
step. It unblocks four domains at once: profile, progress, economy, settings.

Once auth exists:
1. Replace the body of each `blocked_auth` repository function
   (`src/domains/{profile,progress,economy,settings}/repository.ts`) with a
   real `supabase.from(...)` call. Column names are already documented in
   `verified_read_path_specs_v1` inside Supabase — do not re-guess them.
2. Re-verify `market_write_owner`'s INSERT qual (it was not fully captured in
   chat 21's policy dump) before implementing `createListing()` in
   `src/domains/market/repository.ts`.
3. Wire `MarketRoute` and `AssetsRoute` to their already-ready repositories
   (`listOpenListings`, `listEnabledAssets`) — the backend work is done, only
   the route component is still a placeholder.

Never wire a write path without re-checking `pg_policies` for that exact
table first — RLS may have changed since this doc was written.
