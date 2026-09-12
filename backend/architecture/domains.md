# Domain architecture

    Each folder under `src/domains/<name>/` owns one domain end to end:
    `repository.ts` (Supabase access) -> optional `use<Name>.ts` hook -> route in `src/routes/`.

    ## Status as of chat40 (2026-07-18)

    | Domain | Status | Notes |
    |---|---|---|
    | auth | ready | Supabase Auth email/password. ensure_player_row RPC on sign-up. Trigger on_auth_user_created auto-provisions players row. AccountRoute v2 live (sign-in / sign-up tabs + reset password + signed-in dashboard). |
    | home | ready | Dashboard summary: player profile + active missions. |
    | cards | ready | Wired to cards + player_cards. Route live. Design System v2 applied chat38. |
    | missions | ready | Wired to missions table. Route live. Design System v2 applied chat38. |
    | market | ready | Reads market_listings. Writes via create_listing / buy_listing / cancel_listing RPCs. Design System v2 applied chat38. |
    | packs | ready | Reads pack_catalog + vexforge_pack_orders. Orders via vexforge_create_pack_order RPC (USDT payment). Design System v2 applied chat38. |
    | pvp | ready | Reads pvp_seasons (Season 1 live) + pvp_rankings + pvp_matches. Match resolution via RPC. Design System v2 applied chat40. |
    | clans | ready | Reads clans + clan_members + clan_wars. Clan creation via create_clan RPC (SECURITY DEFINER). Design System v2 applied chat40. Empty state with found-a-clan CTA. |
    | profile | ready | Reads players scoped by auth.uid(). Design System v2 applied chat40. Auth gate + quick links grid. |
    | progress | ready | Reads player_progress RLS-scoped. Design System v2 applied chat40. XP bars + stat grid. |
    | economy | ready (reads only) | Reads player_wallet + economy_ledger. Write-blocked at RLS level by design. Design System v2 applied chat40. |
    | settings | ready | Reads + writes player_settings. Toggle UI with save button. Design System v2 applied chat40. |
    | assets | restricted | Shows Acceso Restringido screen. Admin-only, no public RLS path intended. |
    | inventory | ready | RLS policy added chat37 (user_id = auth.uid()). GRANT SELECT TO authenticated added chat38. Design System v2 applied chat40. Rarity cards grouped by type. |
    | fusion | ready | FusionRoute UX complete. fuse_cards RPC created chat38 (SECURITY DEFINER). Design System v2 applied chat38. |

    ## Design System v2 — COMPLETE
    All 15 domains now have consistent visual treatment:
    - Full-bleed hero banners with dark overlay
    - Cinzel Decorative / Rajdhani / IBM Plex Mono typography
    - Ember gold accent system (#c9901f / var(--ember-gold))
    - Dark layer palette (var(--layer-1/2/3))
    - .forge-section-header section titles
    - Auth gates with Link to /account
    - Domain-specific themed empty states

    Do not change a domain status without re-checking pg_policies directly against live Supabase state.