# Open blockers — updated chat59/bloque-B.5 (2026-07-20)

    ## ACTIVE BLOCKERS

    | Blocker | Domains | Status | What unblocks it |
    |---|---|---|---|
    | 18+ SECURITY DEFINER functions | backend | DOCUMENTED — intentional | All public RPCs require SECURITY DEFINER to bypass RLS on behalf of authenticated users. This is correct architecture. Resolved chat60. |

    ## RESOLVED (all sessions)
    - **BUG-4** get_player_stats column player_a_id does not exist → **RESOLVED chat59**: pvp_matches uses player_a/player_b/winner (verified via DB introspection). Function confirmed correct.
    - PvP listArenaPlayers direct players query (RLS violation) → **RESOLVED chat56**
    - vexforge_find_opponents RPC missing → **RESOLVED chat56**
    - vexforge_start_battle RPC missing → **RESOLVED chat56**
    - inventory table not exposed via PostgREST → RESOLVED S38
    - No fuse_cards RPC → RESOLVED S42
    - No auth provider → RESOLVED S27
    - No player row auto-provisioning → RESOLVED S37
    - market write path not verified → RESOLVED S37
    - clans display names (players_self RLS) → RESOLVED S45 via get_public_player_names
    - BUG-1 get_home_stats → RESOLVED S48
    - BUG-2 claim_daily_quest → RESOLVED S48
    - BUG-3 security_invoker views 91/91 → RESOLVED S48
    - BUG-CRITICO-CHAT54 pl.username→pl.display_name → RESOLVED S54
    - WorldBossesRoute schema mismatch (max_hp/element/reward_vex/status) → **RESOLVED chat59 B.5**
    