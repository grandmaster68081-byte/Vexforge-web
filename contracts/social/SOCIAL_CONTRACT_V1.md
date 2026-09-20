# VEXFORGE Social Contract v1.2 — Playable Alpha

## Player-facing surfaces

### Hall de Aliados

- player search by display name;
- online indicator;
- send friend request;
- accept/decline incoming request;
- cancel outgoing request;
- remove friend;
- direct-chat entry.

Search results include the authoritative request id so pending incoming/outgoing actions remain actionable.

### Susurros

- one-to-one private conversation between accepted friends;
- canonical player pair;
- unread state;
- persisted messages;
- block-aware access;
- 1–1000 character messages;
- two-second Alpha sender rate limit.

### World Chat

- authenticated global channel;
- available from a compact world-chat dock on every authenticated route;
- 1–280 characters;
- two-second sender rate limit;
- recent bounded window;
- blocked senders suppressed from the viewer feed.

### Clan Hall

- discover visible clans;
- join clan;
- create clan through `social_create_clan` wrapper over the existing `create_clan` contract;
- leave clan;
- member list;
- clan chat;
- active clan-war status from existing `clan_wars` state.

### Presence

Server-maintained `last_seen_at` heartbeat with a short online freshness window.

## Authority

Supabase owns:

- social relationships;
- block state;
- permissions;
- message persistence;
- unread state;
- presence timestamps;
- clan membership;
- clan-war state;
- moderation reports;
- rate limits.

Unity sends explicit user intent and renders server responses.

## Real-time strategy

The current Unity transport is authenticated HTTP/RPC only, so the Alpha uses bounded polling.

Typical polling:

- Friends: ~5 seconds;
- DM/World/Clan: ~2.5 seconds while the Social overlay is open;
- Presence heartbeat: ~30 seconds while authenticated.

The Social UI avoids tearing down and recreating the visible UI when the polled dataset has not changed.

A future Realtime implementation may use Supabase private Broadcast channels. It must preserve the same data authority and security boundary.

## Security rules

- player identity is always derived server-side;
- direct client table access remains closed;
- security-definer functions pin `search_path = ''`;
- authenticated grants are explicit;
- blocked users cannot search, open, read or send in the affected private/social feeds;
- report RPCs validate that the reporter can legitimately see the referenced message.

## Migration rule

The feature is versioned as a single Supabase migration:

`supabase/migrations/20260920010000_vexforge_social_alpha.sql`

Apply with the Supabase CLI after `supabase db push --dry-run`.

Never use ad-hoc Dashboard SQL for the Alpha migration.
