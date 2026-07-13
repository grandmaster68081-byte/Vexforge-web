# Pending: auth and writes

## Auth provider -- DONE (chat 27)
Wired `src/providers/AuthProvider.tsx` (Supabase Auth, email/password) and
`src/routes/AccountRoute.tsx` (sign-in/sign-up UI). This unblocked profile,
progress, economy, settings -- all four now read real Supabase data scoped
by `auth.uid()`, wired in chat 27.

## Still pending
1. **Player provisioning**: a signed-in auth user with no matching `players`
   row currently just gets an empty result with an explicit reason, not an
   error and not fake data. Whether/how to auto-create a `players` row on
   sign-up (trigger vs RPC vs manual) is an open owner decision.
2. **`market_write_owner`'s INSERT qual** was not fully captured in chat 21's
   policy dump. Re-check `pg_policies` for `market_listings` before
   implementing `createListing()` in `src/domains/market/repository.ts`.
3. **`player_settings` write**: the `player_own_settings` policy is `ALL`
   (not just `SELECT`), so writes are technically allowed once owner-scoped,
   but this pass only implemented reads.

Never wire a write path without re-checking `pg_policies` for that exact
table first -- RLS may have changed since this doc was written.
