# Domain architecture

Each folder under `src/domains/<name>/` owns one domain end to end:
`repository.ts` (Supabase access) -> optional `use<Name>.ts` hook -> route in `src/routes/`.

## Status as of session 38 (2026-07-18)

| Domain | Status | Notes |
|---|---|---|
| auth | ready | Supabase Auth email/password. ensure_player_row RPC on sign-up. Trigger on_auth_user_created auto-provisions players row. |
| home | ready | Dashboard summary: player profile + active missions. |
| cards | ready | Wired to cards + player_cards. Route live. |
| missions | ready | Wired to missions table. Route live. |
| market | ready | Reads market_listings. Writes via create_listing / buy_listing / cancel_listing RPCs. |
| packs | ready | Reads pack_catalog + vexforge_pack_orders. Orders via vexforge_create_pack_order RPC (USDT payment). |
| pvp | ready | Reads pvp_seasons (Season 1 live) + pvp_rankings + pvp_matches. Match resolution via RPC. |
| clans | ready | Reads clans + clan_members + clan_wars. Clan creation via create_clan RPC (SECURITY DEFINER). |
| profile | ready | Reads players scoped by auth.uid(). Supabase Auth. |
| progress | ready | Reads player_progress RLS-scoped. |
| economy | ready (reads only) | Reads player_wallet + economy_ledger. Write-blocked at RLS level by design. |
| settings | ready | Reads + writes player_settings. Policy player_own_settings verified. |
| assets | restricted | Shows Acceso Restringido screen. Admin-only, no public RLS path intended. |
| inventory | blocked_not_exposed | RLS policy added S37 (user_id = auth.uid()), NOT exposed via PostgREST. Owner must GRANT SELECT to authenticated. |
| fusion | blocked_no_rpc | FusionRoute UX ready (improved S37). fuse() calls supabase.rpc("fuse_cards") but that RPC does not exist yet. |

Do not change a domain status without re-checking pg_policies directly against live Supabase state.
