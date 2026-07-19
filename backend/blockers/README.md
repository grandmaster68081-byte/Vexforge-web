# Open blockers — session 38 (2026-07-18)

| Blocker | Domains | Status | What unblocks it |
|---|---|---|---|
| inventory table not exposed via PostgREST | inventory | OPEN | GRANT SELECT ON public.inventory TO authenticated; then reload schema cache |
| No fuse_cards RPC | fusion | OPEN | Create fuse_cards(p_card_a_id uuid, p_card_b_id uuid) RPC. See backend/pending/backend-gaps.md. |
| 18 SECURITY DEFINER views flagged | backend | LOW | Convert to SECURITY INVOKER or document justification per view |
| vexforge_web_registry not INSERT-accessible with service_role | continuity | LOW | GRANT INSERT, UPDATE ON public.vexforge_web_registry TO service_role; |

## RESOLVED (prior sessions)
- No auth provider -> RESOLVED S27
- No player row auto-provisioning -> RESOLVED S37: on_auth_user_created trigger + ensure_player_row RPC
- market write path not verified -> RESOLVED S37: create_listing RPC
- inventory zero RLS policies -> RESOLVED S37: authenticated_read_own_inventory added
- clans no write path -> RESOLVED S37: create_clan RPC
- No PvP season data -> RESOLVED S37: Season 1 inserted