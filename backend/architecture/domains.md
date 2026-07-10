# Domain architecture

Each folder under `src/domains/<name>/` owns one domain end to end:
`repository.ts` (Supabase access) → optional `service.ts` (business logic) →
optional `use<Name>.ts` hook → consumed by a route in `src/routes/`.

## Status as of chat 22 (this session)

| Domain | Status | Notes |
|---|---|---|
| cards | ready | wired to real `cards` table, route live |
| missions | ready | wired to real `missions` table, route live |
| market | ready (reads) | repository wired; route still shows blocked placeholder — wire `MarketRoute` next using `listOpenListings()` |
| assets | ready | repository wired; route still shows blocked placeholder — wire `AssetsRoute` next using `listEnabledAssets()` |
| profile | blocked_auth | repository stub documents the exact RLS policy waiting on auth |
| progress | blocked_auth | same pattern |
| economy | blocked_auth | same pattern |
| settings | blocked_auth | same pattern; table existence confirmed in chat 21 |
| inventory | blocked_no_path | no RLS policy for public/authenticated exists; backend decision needed |
| fusion | blocked_no_path | same as inventory |

Do not change a domain's status without re-checking `pg_policies` directly —
never assume, always verify against live Supabase state.
