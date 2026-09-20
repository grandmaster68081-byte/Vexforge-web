-- VEXFORGE SOCIAL ALPHA v1
-- Scope: friends, private DMs, global chat, clan chat, blocking, presence, reports.
-- Applied through Supabase migrations only. No direct dashboard schema edits.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists public.social_friend_requests (
    id uuid primary key default extensions.gen_random_uuid(),
    requester_player_id uuid not null references public.players(id) on delete cascade,
    addressee_player_id uuid not null references public.players(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    constraint social_friend_requests_not_self check (requester_player_id <> addressee_player_id)
);
create index if not exists social_friend_requests_addressee_idx on public.social_friend_requests(addressee_player_id, status, created_at desc);
create index if not exists social_friend_requests_requester_idx on public.social_friend_requests(requester_player_id, status, created_at desc);
create unique index if not exists social_friend_requests_pending_pair_idx
    on public.social_friend_requests(requester_player_id, addressee_player_id)
    where status = 'pending';

create table if not exists public.social_friendships (
    player_low_id uuid not null references public.players(id) on delete cascade,
    player_high_id uuid not null references public.players(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (player_low_id, player_high_id),
    constraint social_friendships_order check (player_low_id < player_high_id)
);
create index if not exists social_friendships_high_idx on public.social_friendships(player_high_id);

create table if not exists public.social_blocks (
    blocker_player_id uuid not null references public.players(id) on delete cascade,
    blocked_player_id uuid not null references public.players(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (blocker_player_id, blocked_player_id),
    constraint social_blocks_not_self check (blocker_player_id <> blocked_player_id)
);
create index if not exists social_blocks_blocked_idx on public.social_blocks(blocked_player_id);

create table if not exists public.social_private_conversations (
    id uuid primary key default extensions.gen_random_uuid(),
    player_low_id uuid not null references public.players(id) on delete cascade,
    player_high_id uuid not null references public.players(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint social_private_conversations_order check (player_low_id < player_high_id),
    constraint social_private_conversations_unique_pair unique (player_low_id, player_high_id)
);

create table if not exists public.social_private_messages (
    id uuid primary key default extensions.gen_random_uuid(),
    conversation_id uuid not null references public.social_private_conversations(id) on delete cascade,
    sender_player_id uuid not null references public.players(id) on delete cascade,
    body text not null check (char_length(btrim(body)) between 1 and 1000),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);
create index if not exists social_private_messages_conversation_idx on public.social_private_messages(conversation_id, created_at desc);
create index if not exists social_private_messages_sender_idx on public.social_private_messages(sender_player_id, created_at desc);

create table if not exists public.social_private_reads (
    conversation_id uuid not null references public.social_private_conversations(id) on delete cascade,
    player_id uuid not null references public.players(id) on delete cascade,
    last_read_at timestamptz not null default now(),
    primary key (conversation_id, player_id)
);

create table if not exists public.social_global_messages (
    id uuid primary key default extensions.gen_random_uuid(),
    sender_player_id uuid not null references public.players(id) on delete cascade,
    body text not null check (char_length(btrim(body)) between 1 and 280),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);
create index if not exists social_global_messages_created_idx on public.social_global_messages(created_at desc);

create table if not exists public.social_clan_messages (
    id uuid primary key default extensions.gen_random_uuid(),
    clan_id uuid not null references public.clans(id) on delete cascade,
    sender_player_id uuid not null references public.players(id) on delete cascade,
    body text not null check (char_length(btrim(body)) between 1 and 500),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);
create index if not exists social_clan_messages_created_idx on public.social_clan_messages(clan_id, created_at desc);

create table if not exists public.social_presence (
    player_id uuid primary key references public.players(id) on delete cascade,
    last_seen_at timestamptz not null default now()
);

create table if not exists public.social_chat_reports (
    id uuid primary key default extensions.gen_random_uuid(),
    reporter_player_id uuid not null references public.players(id) on delete cascade,
    scope text not null check (scope in ('global','private','clan')),
    message_id uuid not null,
    reason text not null check (char_length(btrim(reason)) between 3 and 240),
    created_at timestamptz not null default now(),
    unique (reporter_player_id, scope, message_id)
);

create or replace function private.social_current_player_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select p.id
    from public.players p
    where p.auth_user_id = (select auth.uid())
    limit 1;
$$;

create or replace function private.social_is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.social_blocks b
        where (b.blocker_player_id = p_a and b.blocked_player_id = p_b)
           or (b.blocker_player_id = p_b and b.blocked_player_id = p_a)
    );
$$;

create or replace function public.social_search_players(p_query text default '', p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_query text := btrim(coalesce(p_query, ''));
    v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
begin
    if v_player is null then
        return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED');
    end if;

    return jsonb_build_object(
        'ok', true,
        'players', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', p.id,
                'display_name', coalesce(p.display_name, 'Guerrero'),
                'role', coalesce(p.role, 'player'),
                'friend_state', case
                    when exists (select 1 from public.social_friendships f where f.player_low_id = least(v_player, p.id) and f.player_high_id = greatest(v_player, p.id)) then 'friends'
                    when exists (select 1 from public.social_friend_requests r where r.requester_player_id = v_player and r.addressee_player_id = p.id and r.status = 'pending') then 'pending_outgoing'
                    when exists (select 1 from public.social_friend_requests r where r.requester_player_id = p.id and r.addressee_player_id = v_player and r.status = 'pending') then 'pending_incoming'
                    else 'none'
                end,
                'request_id', coalesce((
                    select r.id
                    from public.social_friend_requests r
                    where r.status = 'pending'
                      and ((r.requester_player_id = v_player and r.addressee_player_id = p.id)
                        or (r.requester_player_id = p.id and r.addressee_player_id = v_player))
                    order by r.created_at desc
                    limit 1
                )::text, null),
                'is_online', coalesce((select sp.last_seen_at >= now() - interval '90 seconds' from public.social_presence sp where sp.player_id = p.id), false)
            ) order by lower(coalesce(p.display_name, '')) asc)
            from public.players p
            where p.id <> v_player
              and v_query <> ''
              and p.display_name ilike '%' || v_query || '%'
              and not exists (
                  select 1 from public.social_blocks b
                  where (b.blocker_player_id = v_player and b.blocked_player_id = p.id)
                     or (b.blocker_player_id = p.id and b.blocked_player_id = v_player)
              )
            limit v_limit
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_list_friend_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then
        return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED');
    end if;

    return jsonb_build_object(
        'ok', true,
        'friends', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', p.id,
                'display_name', coalesce(p.display_name, 'Guerrero'),
                'role', coalesce(p.role, 'player'),
                'is_online', coalesce((select sp.last_seen_at >= now() - interval '90 seconds' from public.social_presence sp where sp.player_id = p.id), false),
                'last_seen_at', (select sp.last_seen_at from public.social_presence sp where sp.player_id = p.id)
            ) order by lower(coalesce(p.display_name, '')) asc)
            from public.players p
            where p.id in (
                select case when f.player_low_id = v_player then f.player_high_id else f.player_low_id end
                from public.social_friendships f
                where f.player_low_id = v_player or f.player_high_id = v_player
            )
            and not exists (
                select 1 from public.social_blocks b
                where (b.blocker_player_id = v_player and b.blocked_player_id = p.id)
                   or (b.blocker_player_id = p.id and b.blocked_player_id = v_player)
            )
        ), '[]'::jsonb),
        'incoming_requests', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', r.id,
                'player_id', r.requester_player_id,
                'display_name', coalesce(p.display_name, 'Guerrero'),
                'created_at', r.created_at
            ) order by r.created_at desc)
            from public.social_friend_requests r
            join public.players p on p.id = r.requester_player_id
            where r.addressee_player_id = v_player and r.status = 'pending'
        ), '[]'::jsonb),
        'outgoing_requests', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', r.id,
                'player_id', r.addressee_player_id,
                'display_name', coalesce(p.display_name, 'Guerrero'),
                'created_at', r.created_at
            ) order by r.created_at desc)
            from public.social_friend_requests r
            join public.players p on p.id = r.addressee_player_id
            where r.requester_player_id = v_player and r.status = 'pending'
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_send_friend_request(p_target_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_reverse_id uuid;
    v_request_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if p_target_player_id is null or p_target_player_id = v_player then return jsonb_build_object('ok', false, 'reason', 'INVALID_TARGET'); end if;
    if not exists (select 1 from public.players p where p.id = p_target_player_id) then return jsonb_build_object('ok', false, 'reason', 'PLAYER_NOT_FOUND'); end if;
    if private.social_is_blocked(v_player, p_target_player_id) then return jsonb_build_object('ok', false, 'reason', 'BLOCKED'); end if;
    if exists (select 1 from public.social_friendships f where f.player_low_id = least(v_player, p_target_player_id) and f.player_high_id = greatest(v_player, p_target_player_id)) then
        return jsonb_build_object('ok', false, 'reason', 'ALREADY_FRIENDS');
    end if;

    select r.id into v_reverse_id
    from public.social_friend_requests r
    where r.requester_player_id = p_target_player_id and r.addressee_player_id = v_player and r.status = 'pending'
    limit 1;

    if v_reverse_id is not null then
        update public.social_friend_requests set status = 'accepted', responded_at = now() where id = v_reverse_id;
        insert into public.social_friendships(player_low_id, player_high_id)
        values (least(v_player, p_target_player_id), greatest(v_player, p_target_player_id))
        on conflict do nothing;
        return jsonb_build_object('ok', true, 'state', 'accepted');
    end if;

    if exists (select 1 from public.social_friend_requests r where r.requester_player_id = v_player and r.addressee_player_id = p_target_player_id and r.status = 'pending') then
        return jsonb_build_object('ok', false, 'reason', 'REQUEST_ALREADY_PENDING');
    end if;

    insert into public.social_friend_requests(requester_player_id, addressee_player_id)
    values (v_player, p_target_player_id)
    on conflict (requester_player_id, addressee_player_id) where status = 'pending' do nothing
    returning id into v_request_id;

    if v_request_id is null then
        return jsonb_build_object('ok', false, 'reason', 'REQUEST_ALREADY_PENDING');
    end if;

    return jsonb_build_object('ok', true, 'state', 'pending', 'request_id', v_request_id);
end;
$$;

create or replace function public.social_respond_friend_request(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_req public.social_friend_requests%rowtype;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    select * into v_req from public.social_friend_requests r where r.id = p_request_id and r.addressee_player_id = v_player and r.status = 'pending' for update;
    if not found then return jsonb_build_object('ok', false, 'reason', 'REQUEST_NOT_FOUND'); end if;

    if p_accept then
        update public.social_friend_requests set status = 'accepted', responded_at = now() where id = p_request_id;
        insert into public.social_friendships(player_low_id, player_high_id)
        values (least(v_req.requester_player_id, v_req.addressee_player_id), greatest(v_req.requester_player_id, v_req.addressee_player_id))
        on conflict do nothing;
        return jsonb_build_object('ok', true, 'state', 'accepted');
    end if;

    update public.social_friend_requests set status = 'declined', responded_at = now() where id = p_request_id;
    return jsonb_build_object('ok', true, 'state', 'declined');
end;
$$;

create or replace function public.social_cancel_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_count integer;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    update public.social_friend_requests
       set status = 'cancelled', responded_at = now()
     where id = p_request_id and requester_player_id = v_player and status = 'pending';
    get diagnostics v_count = row_count;
    return jsonb_build_object('ok', v_count = 1, 'reason', case when v_count = 1 then null else 'REQUEST_NOT_FOUND' end);
end;
$$;

create or replace function public.social_remove_friend(p_friend_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_count integer;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    delete from public.social_friendships
     where player_low_id = least(v_player, p_friend_player_id)
       and player_high_id = greatest(v_player, p_friend_player_id);
    get diagnostics v_count = row_count;
    return jsonb_build_object('ok', v_count = 1, 'reason', case when v_count = 1 then null else 'FRIEND_NOT_FOUND' end);
end;
$$;

create or replace function public.social_block_player(p_target_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if p_target_player_id is null or p_target_player_id = v_player then return jsonb_build_object('ok', false, 'reason', 'INVALID_TARGET'); end if;
    insert into public.social_blocks(blocker_player_id, blocked_player_id) values (v_player, p_target_player_id) on conflict do nothing;
    delete from public.social_friendships where player_low_id = least(v_player, p_target_player_id) and player_high_id = greatest(v_player, p_target_player_id);
    update public.social_friend_requests set status = 'cancelled', responded_at = now()
      where status = 'pending' and ((requester_player_id = v_player and addressee_player_id = p_target_player_id) or (requester_player_id = p_target_player_id and addressee_player_id = v_player));
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.social_unblock_player(p_target_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_count integer;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    delete from public.social_blocks where blocker_player_id = v_player and blocked_player_id = p_target_player_id;
    get diagnostics v_count = row_count;
    return jsonb_build_object('ok', v_count = 1);
end;
$$;

create or replace function public.social_get_or_create_private_conversation(p_friend_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_conversation_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if p_friend_player_id is null or p_friend_player_id = v_player then return jsonb_build_object('ok', false, 'reason', 'INVALID_TARGET'); end if;
    if not exists (select 1 from public.social_friendships f where f.player_low_id = least(v_player, p_friend_player_id) and f.player_high_id = greatest(v_player, p_friend_player_id)) then
        return jsonb_build_object('ok', false, 'reason', 'NOT_FRIENDS');
    end if;
    if private.social_is_blocked(v_player, p_friend_player_id) then return jsonb_build_object('ok', false, 'reason', 'BLOCKED'); end if;

    insert into public.social_private_conversations(player_low_id, player_high_id)
    values (least(v_player, p_friend_player_id), greatest(v_player, p_friend_player_id))
    on conflict (player_low_id, player_high_id) do update set updated_at = now()
    returning id into v_conversation_id;

    insert into public.social_private_reads(conversation_id, player_id)
    values (v_conversation_id, v_player)
    on conflict do nothing;

    return jsonb_build_object('ok', true, 'conversation_id', v_conversation_id);
end;
$$;

create or replace function public.social_list_private_conversations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    return jsonb_build_object(
        'ok', true,
        'conversations', coalesce((
            select jsonb_agg(jsonb_build_object(
                'conversation_id', c.id,
                'other_player_id', case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end,
                'other_display_name', coalesce(p.display_name, 'Guerrero'),
                'last_message', coalesce(lastm.body, ''),
                'last_message_at', lastm.created_at,
                'unread_count', (
                    select count(*) from public.social_private_messages um
                    where um.conversation_id = c.id
                      and um.sender_player_id <> v_player
                      and um.created_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
                      and um.deleted_at is null
                )
            ) order by coalesce(lastm.created_at, c.created_at) desc)
            from public.social_private_conversations c
            join public.players p on p.id = case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end
            left join lateral (
                select m.body, m.created_at from public.social_private_messages m
                where m.conversation_id = c.id and m.deleted_at is null
                order by m.created_at desc limit 1
            ) lastm on true
            left join public.social_private_reads r on r.conversation_id = c.id and r.player_id = v_player
            where (c.player_low_id = v_player or c.player_high_id = v_player)
              and not private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_list_private_messages(p_conversation_id uuid, p_limit integer default 60)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_limit integer := greatest(1, least(coalesce(p_limit, 60), 100));
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if not exists (select 1 from public.social_private_conversations c where c.id = p_conversation_id and (c.player_low_id = v_player or c.player_high_id = v_player)) then
        return jsonb_build_object('ok', false, 'reason', 'CONVERSATION_FORBIDDEN');
    end if;
    if exists (
        select 1 from public.social_private_conversations c
        where c.id = p_conversation_id
          and private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
    ) then
        return jsonb_build_object('ok', false, 'reason', 'BLOCKED');
    end if;
    return jsonb_build_object(
        'ok', true,
        'messages', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', m.id,
                'sender_player_id', m.sender_player_id,
                'sender_display_name', coalesce(p.display_name, 'Guerrero'),
                'body', m.body,
                'created_at', m.created_at,
                'is_mine', m.sender_player_id = v_player
            ) order by m.created_at asc)
            from (
                select * from public.social_private_messages m0
                where m0.conversation_id = p_conversation_id and m0.deleted_at is null
                order by m0.created_at desc limit v_limit
            ) m
            join public.players p on p.id = m.sender_player_id
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_mark_private_read(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if not exists (select 1 from public.social_private_conversations c where c.id = p_conversation_id and (c.player_low_id = v_player or c.player_high_id = v_player)) then
        return jsonb_build_object('ok', false, 'reason', 'CONVERSATION_FORBIDDEN');
    end if;
    if exists (
        select 1 from public.social_private_conversations c
        where c.id = p_conversation_id
          and private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
    ) then
        return jsonb_build_object('ok', false, 'reason', 'BLOCKED');
    end if;
    insert into public.social_private_reads(conversation_id, player_id, last_read_at)
    values (p_conversation_id, v_player, now())
    on conflict (conversation_id, player_id) do update set last_read_at = excluded.last_read_at;
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.social_send_private_message(p_conversation_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_body text := btrim(coalesce(p_body, ''));
    v_message_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if char_length(v_body) < 1 or char_length(v_body) > 1000 then return jsonb_build_object('ok', false, 'reason', 'MESSAGE_LENGTH'); end if;
    if not exists (select 1 from public.social_private_conversations c where c.id = p_conversation_id and (c.player_low_id = v_player or c.player_high_id = v_player)) then
        return jsonb_build_object('ok', false, 'reason', 'CONVERSATION_FORBIDDEN');
    end if;
    if exists (
        select 1 from public.social_private_conversations c
        where c.id = p_conversation_id and private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
    ) then return jsonb_build_object('ok', false, 'reason', 'BLOCKED'); end if;
    if exists (select 1 from public.social_private_messages where conversation_id = p_conversation_id and sender_player_id = v_player and created_at > now() - interval '2 seconds') then
        return jsonb_build_object('ok', false, 'reason', 'RATE_LIMIT');
    end if;

    insert into public.social_private_messages(conversation_id, sender_player_id, body)
    values (p_conversation_id, v_player, v_body)
    returning id into v_message_id;
    update public.social_private_conversations set updated_at = now() where id = p_conversation_id;
    return jsonb_build_object('ok', true, 'message_id', v_message_id, 'created_at', now());
end;
$$;

create or replace function public.social_list_global_messages(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_limit integer := greatest(1, least(coalesce(p_limit, 50), 80));
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    return jsonb_build_object(
        'ok', true,
        'messages', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', m.id,
                'sender_player_id', m.sender_player_id,
                'sender_display_name', coalesce(p.display_name, 'Guerrero'),
                'body', m.body,
                'created_at', m.created_at,
                'is_mine', m.sender_player_id = v_player
            ) order by m.created_at asc)
            from (
                select m0.*
                from public.social_global_messages m0
                where m0.deleted_at is null
                  and not private.social_is_blocked(v_player, m0.sender_player_id)
                order by m0.created_at desc
                limit v_limit
            ) m
            join public.players p on p.id = m.sender_player_id
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_send_global_message(p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_body text := btrim(coalesce(p_body, ''));
    v_message_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if char_length(v_body) < 1 or char_length(v_body) > 280 then return jsonb_build_object('ok', false, 'reason', 'MESSAGE_LENGTH'); end if;
    if exists (select 1 from public.social_global_messages where sender_player_id = v_player and created_at > now() - interval '2 seconds') then
        return jsonb_build_object('ok', false, 'reason', 'RATE_LIMIT');
    end if;
    insert into public.social_global_messages(sender_player_id, body) values (v_player, v_body) returning id into v_message_id;
    return jsonb_build_object('ok', true, 'message_id', v_message_id, 'created_at', now());
end;
$$;

create or replace function public.social_get_my_clan()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_clan_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    select cm.clan_id into v_clan_id from public.clan_members cm where cm.player_id = v_player limit 1;
    if v_clan_id is null then return jsonb_build_object('ok', true, 'has_clan', false); end if;
    return jsonb_build_object(
        'ok', true,
        'has_clan', true,
        'clan', (
            select jsonb_build_object(
                'id', c.id,
                'code', c.code,
                'name', c.name,
                'prestige', c.prestige,
                'role', (select cm.role from public.clan_members cm where cm.clan_id = c.id and cm.player_id = v_player limit 1),
                'member_count', (select count(*) from public.clan_members cm2 where cm2.clan_id = c.id)
            ) from public.clans c where c.id = v_clan_id
        )
    );
end;
$$;

create or replace function public.social_list_clan_messages(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_clan_id uuid;
    v_limit integer := greatest(1, least(coalesce(p_limit, 50), 80));
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    select cm.clan_id into v_clan_id from public.clan_members cm where cm.player_id = v_player limit 1;
    if v_clan_id is null then return jsonb_build_object('ok', false, 'reason', 'NO_CLAN'); end if;
    return jsonb_build_object(
        'ok', true,
        'messages', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', m.id,
                'sender_player_id', m.sender_player_id,
                'sender_display_name', coalesce(p.display_name, 'Guerrero'),
                'body', m.body,
                'created_at', m.created_at,
                'is_mine', m.sender_player_id = v_player
            ) order by m.created_at asc)
            from (
                select * from public.social_clan_messages m0 where m0.clan_id = v_clan_id and m0.deleted_at is null and not private.social_is_blocked(v_player, m0.sender_player_id) order by m0.created_at desc limit v_limit
            ) m
            join public.players p on p.id = m.sender_player_id
        ), '[]'::jsonb)
    );
end;
$$;

create or replace function public.social_send_clan_message(p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_clan_id uuid;
    v_body text := btrim(coalesce(p_body, ''));
    v_message_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if char_length(v_body) < 1 or char_length(v_body) > 500 then return jsonb_build_object('ok', false, 'reason', 'MESSAGE_LENGTH'); end if;
    select cm.clan_id into v_clan_id from public.clan_members cm where cm.player_id = v_player limit 1;
    if v_clan_id is null then return jsonb_build_object('ok', false, 'reason', 'NO_CLAN'); end if;
    if exists (select 1 from public.social_clan_messages where clan_id = v_clan_id and sender_player_id = v_player and created_at > now() - interval '2 seconds') then
        return jsonb_build_object('ok', false, 'reason', 'RATE_LIMIT');
    end if;
    insert into public.social_clan_messages(clan_id, sender_player_id, body) values (v_clan_id, v_player, v_body) returning id into v_message_id;
    return jsonb_build_object('ok', true, 'message_id', v_message_id, 'created_at', now());
end;
$$;

create or replace function public.social_touch_presence()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    insert into public.social_presence(player_id, last_seen_at) values (v_player, now())
    on conflict (player_id) do update set last_seen_at = excluded.last_seen_at;
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.social_report_message(p_scope text, p_message_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_reason text := btrim(coalesce(p_reason, ''));
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if p_scope not in ('global','private','clan') then return jsonb_build_object('ok', false, 'reason', 'INVALID_SCOPE'); end if;
    if p_message_id is null or char_length(v_reason) < 3 or char_length(v_reason) > 240 then return jsonb_build_object('ok', false, 'reason', 'INVALID_REPORT'); end if;

    if p_scope = 'global' then
        if not exists (
            select 1 from public.social_global_messages m
            where m.id = p_message_id
              and m.deleted_at is null
              and not private.social_is_blocked(v_player, m.sender_player_id)
        ) then
            return jsonb_build_object('ok', false, 'reason', 'MESSAGE_NOT_FOUND');
        end if;
    elsif p_scope = 'private' then
        if not exists (
            select 1
            from public.social_private_messages m
            join public.social_private_conversations c on c.id = m.conversation_id
            where m.id = p_message_id
              and (c.player_low_id = v_player or c.player_high_id = v_player)
              and m.deleted_at is null
              and not private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
        ) then
            return jsonb_build_object('ok', false, 'reason', 'MESSAGE_NOT_FOUND');
        end if;
    elsif p_scope = 'clan' then
        if not exists (
            select 1
            from public.social_clan_messages m
            join public.clan_members cm on cm.clan_id = m.clan_id and cm.player_id = v_player
            where m.id = p_message_id
              and m.deleted_at is null
              and not private.social_is_blocked(v_player, m.sender_player_id)
        ) then
            return jsonb_build_object('ok', false, 'reason', 'MESSAGE_NOT_FOUND');
        end if;
    end if;

    insert into public.social_chat_reports(reporter_player_id, scope, message_id, reason)
    values (v_player, p_scope, p_message_id, v_reason)
    on conflict do nothing;
    return jsonb_build_object('ok', true);
end;
$$;

alter table public.social_friend_requests enable row level security;
alter table public.social_friendships enable row level security;
alter table public.social_blocks enable row level security;
alter table public.social_private_conversations enable row level security;
alter table public.social_private_messages enable row level security;
alter table public.social_private_reads enable row level security;
alter table public.social_global_messages enable row level security;
alter table public.social_clan_messages enable row level security;
alter table public.social_presence enable row level security;
alter table public.social_chat_reports enable row level security;

-- The client uses RPCs for social mutations and reads, so table privileges remain closed.
revoke all on table public.social_friend_requests from anon, authenticated;
revoke all on table public.social_friendships from anon, authenticated;
revoke all on table public.social_blocks from anon, authenticated;
revoke all on table public.social_private_conversations from anon, authenticated;
revoke all on table public.social_private_messages from anon, authenticated;
revoke all on table public.social_private_reads from anon, authenticated;
revoke all on table public.social_global_messages from anon, authenticated;
revoke all on table public.social_clan_messages from anon, authenticated;
revoke all on table public.social_presence from anon, authenticated;
revoke all on table public.social_chat_reports from anon, authenticated;

revoke all on function private.social_current_player_id() from public, anon, authenticated;
revoke all on function private.social_is_blocked(uuid, uuid) from public, anon, authenticated;

revoke all on function public.social_search_players(text, integer) from public, anon;
revoke all on function public.social_list_friend_data() from public, anon;
revoke all on function public.social_send_friend_request(uuid) from public, anon;
revoke all on function public.social_respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.social_cancel_friend_request(uuid) from public, anon;
revoke all on function public.social_remove_friend(uuid) from public, anon;
revoke all on function public.social_block_player(uuid) from public, anon;
revoke all on function public.social_unblock_player(uuid) from public, anon;
revoke all on function public.social_get_or_create_private_conversation(uuid) from public, anon;
revoke all on function public.social_list_private_conversations() from public, anon;
revoke all on function public.social_list_private_messages(uuid, integer) from public, anon;
revoke all on function public.social_mark_private_read(uuid) from public, anon;
revoke all on function public.social_send_private_message(uuid, text) from public, anon;
revoke all on function public.social_list_global_messages(integer) from public, anon;
revoke all on function public.social_send_global_message(text) from public, anon;
revoke all on function public.social_get_my_clan() from public, anon;
revoke all on function public.social_list_clan_messages(integer) from public, anon;
revoke all on function public.social_send_clan_message(text) from public, anon;
revoke all on function public.social_touch_presence() from public, anon;
revoke all on function public.social_report_message(text, uuid, text) from public, anon;

grant execute on function public.social_search_players(text, integer) to authenticated;
grant execute on function public.social_list_friend_data() to authenticated;
grant execute on function public.social_send_friend_request(uuid) to authenticated;
grant execute on function public.social_respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.social_cancel_friend_request(uuid) to authenticated;
grant execute on function public.social_remove_friend(uuid) to authenticated;
grant execute on function public.social_block_player(uuid) to authenticated;
grant execute on function public.social_unblock_player(uuid) to authenticated;
grant execute on function public.social_get_or_create_private_conversation(uuid) to authenticated;
grant execute on function public.social_list_private_conversations() to authenticated;
grant execute on function public.social_list_private_messages(uuid, integer) to authenticated;
grant execute on function public.social_mark_private_read(uuid) to authenticated;
grant execute on function public.social_send_private_message(uuid, text) to authenticated;
grant execute on function public.social_list_global_messages(integer) to authenticated;
grant execute on function public.social_send_global_message(text) to authenticated;
grant execute on function public.social_get_my_clan() to authenticated;
grant execute on function public.social_list_clan_messages(integer) to authenticated;
grant execute on function public.social_send_clan_message(text) to authenticated;
grant execute on function public.social_touch_presence() to authenticated;
grant execute on function public.social_report_message(text, uuid, text) to authenticated;

create or replace function public.social_create_clan(p_name text, p_description text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_data jsonb;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if exists (select 1 from public.clan_members cm where cm.player_id = v_player) then
        return jsonb_build_object('ok', false, 'reason', 'ALREADY_IN_CLAN');
    end if;
    if char_length(btrim(coalesce(p_name, ''))) < 1 then
        return jsonb_build_object('ok', false, 'reason', 'CLAN_NAME_REQUIRED');
    end if;
    select public.create_clan(btrim(coalesce(p_name, '')), btrim(coalesce(p_description, ''))) into v_data;
    if v_data is null then return jsonb_build_object('ok', false, 'reason', 'CLAN_CREATE_FAILED'); end if;
    return v_data;
end;
$$;

revoke all on function public.social_create_clan(text, text) from public, anon;
grant execute on function public.social_create_clan(text, text) to authenticated;

create or replace function public.social_join_clan(p_clan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_data jsonb;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if not exists (select 1 from public.clans c where c.id = p_clan_id) then return jsonb_build_object('ok', false, 'reason', 'CLAN_NOT_FOUND'); end if;
    select public.join_clan(p_clan_id, v_player) into v_data;
    if v_data is null then return jsonb_build_object('ok', false, 'reason', 'JOIN_NOT_REPORTED'); end if;
    return v_data;
end;
$$;

create or replace function public.social_leave_clan()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_data jsonb;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    select public.leave_clan(v_player) into v_data;
    if v_data is null then return jsonb_build_object('ok', false, 'reason', 'LEAVE_NOT_REPORTED'); end if;
    return v_data;
end;
$$;

revoke all on function public.social_join_clan(uuid) from public, anon;
revoke all on function public.social_leave_clan() from public, anon;
grant execute on function public.social_join_clan(uuid) to authenticated;
grant execute on function public.social_leave_clan() to authenticated;

create or replace function public.social_get_clan_hall()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_player uuid := private.social_current_player_id();
    v_clan_id uuid;
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    select cm.clan_id into v_clan_id from public.clan_members cm where cm.player_id = v_player limit 1;
    if v_clan_id is null then
        return jsonb_build_object(
            'ok', true,
            'has_clan', false,
            'available_clans', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'id', c.id,
                    'code', c.code,
                    'name', c.name,
                    'prestige', c.prestige,
                    'member_count', (select count(*) from public.clan_members cm where cm.clan_id = c.id)
                ) order by c.prestige desc)
                from (
                    select c0.* from public.clans c0 order by c0.prestige desc limit 20
                ) c
            ), '[]'::jsonb)
        );
    end if;

    return jsonb_build_object(
        'ok', true,
        'has_clan', true,
        'clan', (
            select jsonb_build_object(
                'id', c.id,
                'code', c.code,
                'name', c.name,
                'prestige', c.prestige,
                'role', (select cm.role from public.clan_members cm where cm.clan_id = c.id and cm.player_id = v_player limit 1),
                'member_count', (select count(*) from public.clan_members cm2 where cm2.clan_id = c.id),
                'members', coalesce((
                    select jsonb_agg(jsonb_build_object(
                        'player_id', cm3.player_id,
                        'display_name', coalesce(p.display_name, 'Guerrero'),
                        'role', cm3.role,
                        'contribution_accumulated', cm3.contribution_accumulated
                    ) order by cm3.contribution_accumulated desc)
                    from (
                        select cm0.* from public.clan_members cm0 where cm0.clan_id = c.id order by cm0.contribution_accumulated desc limit 30
                    ) cm3
                    join public.players p on p.id = cm3.player_id
                ), '[]'::jsonb),
                'active_wars', coalesce((
                    select jsonb_agg(jsonb_build_object(
                        'id', w.id,
                        'reference_id', w.reference_id,
                        'status', w.status,
                        'clan_a_id', w.clan_a_id,
                        'clan_b_id', w.clan_b_id,
                        'clan_a_name', coalesce(ca.name, 'Clan A'),
                        'clan_b_name', coalesce(cb.name, 'Clan B'),
                        'created_at', w.created_at,
                        'resolved_at', w.resolved_at
                    ) order by w.created_at desc)
                    from public.clan_wars w
                    left join public.clans ca on ca.id = w.clan_a_id
                    left join public.clans cb on cb.id = w.clan_b_id
                    where (w.clan_a_id = c.id or w.clan_b_id = c.id)
                      and coalesce(w.status, '') not in ('resolved', 'completed', 'cancelled')
                    limit 10
                ), '[]'::jsonb)
            ) from public.clans c where c.id = v_clan_id
        )
    );
end;
$$;

revoke all on function public.social_get_clan_hall() from public, anon;
grant execute on function public.social_get_clan_hall() to authenticated;
