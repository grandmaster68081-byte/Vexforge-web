# Domain architecture

Each folder under `src/domains/<name>/` owns one domain end to end:
`repository.ts` (Supabase access) → optional `service.ts` (business logic) →
optional `use<Name>.ts` hook → consumed by a route in `src/routes/`.

## Status as of chat 27 (this session)

| Domain | Status | Notes |
|---|---|---|
| cards | ready | wired to real `cards` table, route live |
| missions | ready | wired to real `missions` table, route live |
| market | ready (reads) | `MarketRoute` wired chat 27 via `useMarket()`. `createListing()` still intentionally unimplemented -- INSERT policy qual not re-verified |
| assets | ready | `AssetsRoute` wired chat 27 via `useAssets()` |
| profile | ready | wired chat 27: real Supabase Auth (email/password) via `src/providers/AuthProvider.tsx`, reads `players` scoped by `auth.uid()` |
| progress | ready | wired chat 27, reads `player_progress` (RLS-scoped implicitly) |
| economy | ready (reads) | wired chat 27, reads `player_wallet` + `economy_ledger`. Read-only by design -- both tables are frontend-write-blocked at the RLS level |
| settings | ready (reads) | wired chat 27, reads `player_settings`. Write policy exists (ALL, owner-scoped) but not implemented this pass |
| auth | ready | `src/providers/AuthProvider.tsx` + `src/routes/AccountRoute.tsx`, email/password sign-in/sign-up/sign-out. Does not provision `players` rows automatically |
| inventory | blocked_no_path | unchanged -- only RLS policy is `service_role`-only; backend decision needed |
| fusion | blocked_no_path | unchanged -- same as inventory |

Do not change a domain's status without re-checking `pg_policies` directly --
never assume, always verify against live Supabase state.
