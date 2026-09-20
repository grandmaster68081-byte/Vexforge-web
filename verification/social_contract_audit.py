#!/usr/bin/env python3
"""Audit the social SQL/RPC contract and its Unity gateway."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "supabase/migrations/20260920010000_vexforge_social_alpha.sql"
REPOSITORY = ROOT / "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs"
HUB = ROOT / "unity/Assets/Scripts/UI/VexforgeSocialHub.cs"
errors: list[str] = []

sql = SQL.read_text(encoding="utf-8")
repository = REPOSITORY.read_text(encoding="utf-8")
hub = HUB.read_text(encoding="utf-8")

tables = [
    "social_friend_requests", "social_friendships", "social_blocks",
    "social_private_conversations", "social_private_messages",
    "social_private_reads", "social_global_messages", "social_clan_messages",
    "social_presence", "social_chat_reports",
]
for table in tables:
    if f"revoke all on table public.{table} from anon, authenticated;" not in sql:
        errors.append(f"table privilege not closed: {table}")

function_signatures = [
    "social_search_players(text, integer)", "social_list_friend_data()",
    "social_send_friend_request(uuid)", "social_respond_friend_request(uuid, boolean)",
    "social_cancel_friend_request(uuid)", "social_remove_friend(uuid)",
    "social_block_player(uuid)", "social_unblock_player(uuid)",
    "social_get_or_create_private_conversation(uuid)", "social_list_private_conversations()",
    "social_list_private_messages(uuid, integer)", "social_mark_private_read(uuid)",
    "social_send_private_message(uuid, text)", "social_list_global_messages(integer)",
    "social_send_global_message(text)", "social_create_clan(text, text)",
    "social_get_my_clan()", "social_get_clan_hall()", "social_join_clan(uuid)",
    "social_leave_clan()", "social_list_clan_messages(integer)",
    "social_send_clan_message(text)", "social_touch_presence()",
    "social_report_message(text, uuid, text)",
]
for signature in function_signatures:
    if f"grant execute on function public.{signature} to authenticated;" not in sql:
        errors.append(f"authenticated grant missing: {signature}")
    if f"revoke all on function public.{signature} from public, anon;" not in sql:
        errors.append(f"public/anon revoke missing: {signature}")

for match in re.finditer(
    r"create or replace function\s+([\w.]+\([^)]*\)).*?\$\$;",
    sql,
    re.I | re.S,
):
    block = match.group(0)
    if "security definer" in block.lower() and "set search_path = ''" not in block:
        errors.append(f"security-definer search_path missing: {match.group(1)}")

for token in [
    "create schema if not exists extensions;",
    "create schema if not exists private;",
    "request_id",
    "BLOCKED",
    "MESSAGE_NOT_FOUND",
    "interval '2 seconds'",
    "select public.create_clan(",
    "select public.join_clan(",
    "select public.leave_clan(",
]:
    if token not in sql:
        errors.append(f"migration contract token missing: {token}")

for token in [
    "social_list_friend_data", "social_send_friend_request",
    "social_respond_friend_request", "social_get_or_create_private_conversation",
    "social_send_private_message", "social_list_global_messages",
    "social_send_global_message", "social_create_clan", "social_get_clan_hall",
    "social_send_clan_message", "social_touch_presence", "social_report_message",
]:
    if token not in repository:
        errors.append(f"repository RPC missing: {token}")
if "from " in repository.lower():
    errors.append("repository contains a direct table-query fragment")

for token in [
    "HALL DE ALIADOS", "OpenFriends", "OpenGlobal", "OpenClan",
    "SearchPlayersAsync", "RespondRequestAsync", "CancelRequestAsync",
    "SendPrivateMessageAsync", "SendGlobalMessageAsync", "SendClanMessageAsync",
    "CreateClanAsync", "JoinClanAsync", "LeaveClanAsync",
    "TouchPresenceHeartbeatAsync", "lastRenderFingerprint",
    "ComputeActiveFingerprint", "presenceInFlight", "IsCurrent",
]:
    if token not in hub:
        errors.append(f"social hub lifecycle/feature missing: {token}")
if "RenderClanMessagesAsync" in hub:
    errors.append("duplicate clan-message renderer remains")
if "Physics.RaycastAll" in hub:
    errors.append("social UI uses Physics.RaycastAll")

print("SOCIAL_CONTRACT_FUNCTIONS", len(function_signatures))
if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    raise SystemExit(1)
print("PASS")