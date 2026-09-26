-- KIVORA / FAUCET
-- Isolated from VEXFORGE tables and Supabase Auth. This migration creates a private logical domain
-- inside the same Supabase project. Browser clients do not receive database credentials; Cloudflare
-- Pages Functions use the Supabase server key.

create extension if not exists pgcrypto;

create schema if not exists faucet;

revoke all on schema faucet from public, anon, authenticated;
grant usage on schema faucet to service_role;

grant usage on schema faucet to postgres;

create table if not exists faucet.accounts (
  id uuid primary key default gen_random_uuid(),
  public_id varchar(32) not null unique,
  username varchar(20) not null,
  email text not null,
  password_hash text not null,
  password_salt text not null,
  password_iterations integer not null default 150000,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists faucet_accounts_email_lower_idx on faucet.accounts (lower(email));
create unique index if not exists faucet_accounts_username_lower_idx on faucet.accounts (lower(username));

create table if not exists faucet.sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references faucet.accounts(id) on delete cascade,
  token_hash text not null unique,
  csrf_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists faucet_sessions_account_idx on faucet.sessions(account_id);
create index if not exists faucet_sessions_expiry_idx on faucet.sessions(expires_at);

create table if not exists faucet.wallets (
  account_id uuid primary key references faucet.accounts(id) on delete cascade,
  available_points numeric(24,4) not null default 0,
  pending_points numeric(24,4) not null default 0,
  lifetime_earned_points numeric(24,4) not null default 0,
  lifetime_withdrawn_points numeric(24,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists faucet.provider_events (
  id bigint generated always as identity primary key,
  provider text not null,
  trans_id text not null,
  status_code integer not null,
  account_id uuid not null references faucet.accounts(id) on delete restrict,
  offer_name text,
  offer_type text,
  reward numeric(24,8) not null default 0,
  reward_name text,
  reward_value numeric(24,8) not null default 0,
  payout_usd numeric(24,8) not null default 0,
  debug boolean not null default false,
  created_at timestamptz not null default now(),
  unique(provider, trans_id, status_code)
);
create index if not exists faucet_provider_events_account_idx on faucet.provider_events(account_id, created_at desc);

create table if not exists faucet.ledger_entries (
  id bigint generated always as identity primary key,
  account_id uuid not null references faucet.accounts(id) on delete restrict,
  entry_type text not null check (entry_type in ('reward','chargeback','withdrawal','withdrawal_reversal','adjustment')),
  source text not null,
  external_id text,
  points_delta numeric(24,4) not null,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists faucet_ledger_account_idx on faucet.ledger_entries(account_id, created_at desc);
create index if not exists faucet_ledger_external_idx on faucet.ledger_entries(external_id);

create table if not exists faucet.withdrawals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references faucet.accounts(id) on delete restrict,
  amount_points numeric(24,4) not null check (amount_points > 0),
  asset varchar(16) not null,
  network varchar(32) not null,
  destination varchar(256) not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected','cancelled')),
  tx_hash varchar(300),
  admin_note varchar(500),
  reviewed_by uuid references faucet.accounts(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists faucet_withdrawals_account_idx on faucet.withdrawals(account_id, created_at desc);
create index if not exists faucet_withdrawals_status_idx on faucet.withdrawals(status, created_at desc);

create table if not exists faucet.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into faucet.settings(key,value) values
 ('withdrawal_min_points','5000'::jsonb),
 ('points_per_usd_display','1000'::jsonb),
 ('target_user_share_bps','3500'::jsonb),
 ('currency_name','"Kivora Points"'::jsonb),
 ('supported_payouts','[{"asset":"USDC","network":"Base"},{"asset":"USDC","network":"Solana"},{"asset":"BTC","network":"Bitcoin"},{"asset":"LTC","network":"Litecoin"}]'::jsonb)
on conflict (key) do nothing;

alter table faucet.accounts enable row level security;
alter table faucet.sessions enable row level security;
alter table faucet.wallets enable row level security;
alter table faucet.provider_events enable row level security;
alter table faucet.ledger_entries enable row level security;
alter table faucet.withdrawals enable row level security;
alter table faucet.settings enable row level security;

revoke all on all tables in schema faucet from public, anon, authenticated;
grant all on all tables in schema faucet to service_role;
grant all on all sequences in schema faucet to service_role;

create or replace function faucet.request_withdrawal(
  p_account_id uuid,
  p_amount_points numeric,
  p_asset text,
  p_network text,
  p_destination text
) returns faucet.withdrawals
language plpgsql
security definer
set search_path = ''
as $$
declare
  w faucet.wallets%rowtype;
  min_points numeric;
  inserted faucet.withdrawals;
begin
  select coalesce((value #>> '{}')::numeric,5000) into min_points from faucet.settings where key='withdrawal_min_points';
  if p_amount_points < min_points then raise exception 'minimum withdrawal is % points', min_points; end if;

  select * into w from faucet.wallets where account_id=p_account_id for update;
  if not found then raise exception 'wallet not found'; end if;
  if w.available_points < p_amount_points then raise exception 'insufficient available points'; end if;

  update faucet.wallets
    set available_points=available_points-p_amount_points,
        pending_points=pending_points+p_amount_points,
        updated_at=now()
    where account_id=p_account_id;

  insert into faucet.withdrawals(account_id,amount_points,asset,network,destination,status)
  values(p_account_id,p_amount_points,upper(p_asset),p_network,p_destination,'pending')
  returning * into inserted;

  insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
  values(p_account_id,'withdrawal','Internal wallet',inserted.id::text,-p_amount_points,'reserved',jsonb_build_object('asset',upper(p_asset),'network',p_network));

  return inserted;
end;
$$;

create or replace function faucet.admin_update_withdrawal(
  p_withdrawal_id uuid,
  p_admin_account_id uuid,
  p_action text,
  p_note text default null,
  p_tx_hash text default null
) returns faucet.withdrawals
language plpgsql
security definer
set search_path = ''
as $$
declare
  w faucet.withdrawals%rowtype;
  updated faucet.withdrawals;
begin
  select * into w from faucet.withdrawals where id=p_withdrawal_id for update;
  if not found then raise exception 'withdrawal not found'; end if;

  if p_action='approve' then
    if w.status <> 'pending' then raise exception 'only pending withdrawals can be approved'; end if;
    update faucet.withdrawals set status='approved',reviewed_by=p_admin_account_id,reviewed_at=now(),admin_note=p_note where id=w.id returning * into updated;
  elsif p_action='reject' then
    if w.status not in ('pending','approved') then raise exception 'withdrawal cannot be rejected in status %', w.status; end if;
    update faucet.withdrawals set status='rejected',reviewed_by=p_admin_account_id,reviewed_at=now(),admin_note=p_note where id=w.id returning * into updated;
    update faucet.wallets set available_points=available_points+w.amount_points,pending_points=greatest(0,pending_points-w.amount_points),updated_at=now() where account_id=w.account_id;
    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(w.account_id,'withdrawal_reversal','Admin review',w.id::text,w.amount_points,'reversed',jsonb_build_object('reason',coalesce(p_note,'rejected')));
  elsif p_action='paid' then
    if w.status <> 'approved' then raise exception 'only approved withdrawals can be marked paid'; end if;
    update faucet.withdrawals set status='paid',paid_at=now(),admin_note=coalesce(p_note,admin_note),tx_hash=coalesce(nullif(p_tx_hash,''),tx_hash) where id=w.id returning * into updated;
    update faucet.wallets set pending_points=greatest(0,pending_points-w.amount_points),lifetime_withdrawn_points=lifetime_withdrawn_points+w.amount_points,updated_at=now() where account_id=w.account_id;
  else
    raise exception 'unsupported action';
  end if;
  return updated;
end;
$$;

create or replace function faucet.apply_bitcotasks_postback(
  p_account_id uuid,
  p_trans_id text,
  p_offer_name text,
  p_offer_type text,
  p_reward numeric,
  p_reward_name text,
  p_reward_value numeric,
  p_payout_usd numeric,
  p_user_ip text,
  p_country text,
  p_status integer,
  p_debug integer,
  p_raw_payload jsonb
) returns faucet.provider_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_event faucet.provider_events;
  delta numeric := abs(coalesce(p_reward,0));
begin
  if delta <= 0 then raise exception 'reward must be positive'; end if;

  insert into faucet.provider_events(provider,trans_id,status_code,account_id,offer_name,offer_type,reward,reward_name,reward_value,payout_usd,debug)
  values('bitcotasks',p_trans_id,p_status,p_account_id,p_offer_name,p_offer_type,delta,p_reward_name,coalesce(p_reward_value,0),coalesce(p_payout_usd,0),coalesce(p_debug,0)<>0)
  on conflict(provider,trans_id,status_code) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select * into inserted_event from faucet.provider_events where provider='bitcotasks' and trans_id=p_trans_id and status_code=p_status limit 1;
    return inserted_event;
  end if;

  if p_status=1 then
    update faucet.wallets
      set available_points=available_points+delta,
          lifetime_earned_points=lifetime_earned_points+delta,
          updated_at=now()
      where account_id=p_account_id;
    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(p_account_id,'reward','BitcoTasks',p_trans_id,delta,'confirmed',jsonb_build_object('offer_type',p_offer_type,'offer_name',p_offer_name,'provider_payout_usd',coalesce(p_payout_usd,0),'provider_reward_name',p_reward_name));
  elsif p_status=2 then
    update faucet.wallets
      set available_points=available_points-delta,
          updated_at=now()
      where account_id=p_account_id;
    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(p_account_id,'chargeback','BitcoTasks',p_trans_id,-delta,'confirmed',jsonb_build_object('offer_type',p_offer_type,'offer_name',p_offer_name,'provider_payout_usd',coalesce(p_payout_usd,0)));
  else
    raise exception 'unsupported BitcoTasks postback status %', p_status;
  end if;

  return inserted_event;
end;
$$;

revoke all on function faucet.request_withdrawal(uuid,numeric,text,text,text) from public, anon, authenticated;
revoke all on function faucet.admin_update_withdrawal(uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) from public, anon, authenticated;
grant execute on function faucet.request_withdrawal(uuid,numeric,text,text,text) to service_role;
grant execute on function faucet.admin_update_withdrawal(uuid,uuid,text,text,text) to service_role;
grant execute on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) to service_role;

comment on schema faucet is 'Kivora isolated domain. Not shared with VEXFORGE application data or Supabase Auth.';
