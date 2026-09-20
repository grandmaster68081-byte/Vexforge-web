# VEXFORGE Social — Backend Architecture v1.2

Social is authoritative multiplayer state and therefore lives in Supabase.

Unity owns presentation and request orchestration only.

## New tables

- `public.social_friend_requests`
- `public.social_friendships`
- `public.social_blocks`
- `public.social_private_conversations`
- `public.social_private_messages`
- `public.social_private_reads`
- `public.social_global_messages`
- `public.social_clan_messages`
- `public.social_presence`
- `public.social_chat_reports`

## Social RPC surface

- `social_search_players`
- `social_list_friend_data`
- `social_send_friend_request`
- `social_respond_friend_request`
- `social_cancel_friend_request`
- `social_remove_friend`
- `social_block_player`
- `social_unblock_player`
- `social_get_or_create_private_conversation`
- `social_list_private_conversations`
- `social_list_private_messages`
- `social_mark_private_read`
- `social_send_private_message`
- `social_list_global_messages`
- `social_send_global_message`
- `social_create_clan`
- `social_get_my_clan`
- `social_get_clan_hall`
- `social_join_clan`
- `social_leave_clan`
- `social_list_clan_messages`
- `social_send_clan_message`
- `social_touch_presence`
- `social_report_message`

## Existing Clan authority

The current repository already contains the Clan domain and these existing contracts remain authoritative:

- `create_clan`
- `join_clan`
- `leave_clan`
- `vexforge_start_guild_war`

The Social layer wraps the existing Clan functions rather than replacing them.

## Security boundary

All social tables have RLS enabled.

Client table privileges remain closed; the Unity client calls narrow `SECURITY DEFINER` RPCs.

Every new security-definer function pins `search_path = ''` and schema-qualifies references.

Public/anonymous execution is revoked and authenticated execution is explicitly granted.

## Transport

The Alpha uses the existing Unity HTTP/RPC transport with bounded polling.

A later Realtime transport may use Supabase private Broadcast channels while retaining these same RPC/data contracts.
