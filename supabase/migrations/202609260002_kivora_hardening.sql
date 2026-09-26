-- KIVORA HARDENING / SETTLEMENT / ABUSE CONTROLS
-- Same Supabase project, isolated faucet schema only.

alter table faucet.wallets add column if not exists debt_points numeric(24,4) not null default 0;
alter table faucet.provider_events add column if not exists available_at timestamptz not null default now();
alter table faucet.provider_events add column if not exists settled_at timestamptz;
alter table faucet.provider_events add column if not exists reversed_at timestamptz;

create table if not exists faucet.rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);
revoke all on faucet.rate_limits from public, anon, authenticated;
grant all on faucet.rate_limits to service_role;

insert into faucet.settings(key,value) values
 ('reward_hold_hours','72'::jsonb),
 ('daily_login_limit','10'::jsonb),
 ('withdrawal_enabled','true'::jsonb)
on conflict (key) do nothing;

create or replace function faucet.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  r faucet.rate_limits%rowtype;
  now_ts timestamptz := now();
begin
  if p_limit <= 0 or p_window_seconds <= 0 then return false; end if;
  select * into r from faucet.rate_limits where key=p_key for update;
  if not found then
    insert into faucet.rate_limits(key,window_started_at,hit_count,updated_at)
    values(p_key,now_ts,1,now_ts);
    return true;
  end if;
  if extract(epoch from (now_ts-r.window_started_at)) >= p_window_seconds then
    update faucet.rate_limits set window_started_at=now_ts,hit_count=1,updated_at=now_ts where key=p_key;
    return true;
  end if;
  if r.hit_count >= p_limit then return false; end if;
  update faucet.rate_limits set hit_count=hit_count+1,updated_at=now_ts where key=p_key;
  return true;
end;
$$;
revoke all on function faucet.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function faucet.consume_rate_limit(text,integer,integer) to service_role;

create or replace function faucet.settle_due_rewards(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e faucet.provider_events%rowtype;
  moved numeric := 0;
begin
  for e in select * from faucet.provider_events where account_id=p_account_id and status_code=1 and settled_at is null and reversed_at is null and available_at<=now() order by created_at for update loop
    update faucet.wallets set pending_points=greatest(0,pending_points-e.reward),available_points=available_points+e.reward,updated_at=now() where account_id=p_account_id;
    update faucet.ledger_entries set status='confirmed' where account_id=p_account_id and entry_type='reward' and source='BitcoTasks' and external_id=e.trans_id and status='pending';
    update faucet.provider_events set settled_at=now() where id=e.id;
  end loop;
end;
$$;
revoke all on function faucet.settle_due_rewards(uuid) from public,anon,authenticated;
grant execute on function faucet.settle_due_rewards(uuid) to service_role;

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
  enabled boolean := true;
  inserted faucet.withdrawals;
begin
  perform faucet.settle_due_rewards(p_account_id);
  select coalesce((value #>> '{}')::numeric,5000) into min_points from faucet.settings where key='withdrawal_min_points';
  select coalesce((value #>> '{}')::boolean,true) into enabled from faucet.settings where key='withdrawal_enabled';
  if not enabled then raise exception 'withdrawals are temporarily unavailable'; end if;
  if p_amount_points < min_points then raise exception 'minimum withdrawal is % points', min_points; end if;
  select * into w from faucet.wallets where account_id=p_account_id for update;
  if not found then raise exception 'wallet not found'; end if;
  if w.debt_points > 0 then raise exception 'account has a % point settlement balance', w.debt_points; end if;
  if w.available_points < p_amount_points then raise exception 'insufficient available points'; end if;
  update faucet.wallets set available_points=available_points-p_amount_points,pending_points=pending_points+p_amount_points,updated_at=now() where account_id=p_account_id;
  insert into faucet.withdrawals(account_id,amount_points,asset,network,destination,status)
  values(p_account_id,p_amount_points,upper(p_asset),p_network,p_destination,'pending') returning * into inserted;
  insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
  values(p_account_id,'withdrawal','Internal wallet',inserted.id::text,-p_amount_points,'reserved',jsonb_build_object('asset',upper(p_asset),'network',p_network));
  return inserted;
end;
$$;

create or replace function faucet.apply_bitcotasks_postback(
  p_account_id uuid,p_trans_id text,p_offer_name text,p_offer_type text,p_reward numeric,p_reward_name text,p_reward_value numeric,p_payout_usd numeric,p_user_ip text,p_country text,p_status integer,p_debug integer,p_raw_payload jsonb
) returns faucet.provider_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_event faucet.provider_events;
  original faucet.provider_events;
  delta numeric := abs(coalesce(p_reward,0));
  hold_hours numeric := 72;
  shortfall numeric := 0;
begin
  if delta <= 0 then raise exception 'reward must be positive'; end if;
  select coalesce((value #>> '{}')::numeric,72) into hold_hours from faucet.settings where key='reward_hold_hours';
  insert into faucet.provider_events(provider,trans_id,status_code,account_id,offer_name,offer_type,reward,reward_name,reward_value,payout_usd,debug,available_at)
  values('bitcotasks',p_trans_id,p_status,p_account_id,p_offer_name,p_offer_type,delta,p_reward_name,coalesce(p_reward_value,0),coalesce(p_payout_usd,0),coalesce(p_debug,0)<>0,case when p_status=1 then now()+(hold_hours||' hours')::interval else now() end)
  on conflict(provider,trans_id,status_code) do nothing returning * into inserted_event;
  if inserted_event.id is null then select * into inserted_event from faucet.provider_events where provider='bitcotasks' and trans_id=p_trans_id and status_code=p_status limit 1; return inserted_event; end if;

  if p_status=1 then
    update faucet.wallets set pending_points=pending_points+delta,lifetime_earned_points=lifetime_earned_points+delta,updated_at=now() where account_id=p_account_id;
    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
    values(p_account_id,'reward','BitcoTasks',p_trans_id,delta,'pending',jsonb_build_object('offer_type',p_offer_type,'offer_name',p_offer_name,'provider_payout_usd',coalesce(p_payout_usd,0),'provider_reward_name',p_reward_name,'available_at',inserted_event.available_at));
  elsif p_status=2 then
    select * into original from faucet.provider_events where provider='bitcotasks' and trans_id=p_trans_id and status_code=1 order by created_at limit 1 for update;
    if original.id is null then
      insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(p_account_id,'chargeback','BitcoTasks',p_trans_id,-delta,'confirmed',jsonb_build_object('orphan_chargeback',true));
    else
      if original.settled_at is null and original.reversed_at is null then
        update faucet.wallets set pending_points=greatest(0,pending_points-original.reward),updated_at=now() where account_id=p_account_id;
        update faucet.ledger_entries set status='reversed' where account_id=p_account_id and entry_type='reward' and source='BitcoTasks' and external_id=p_trans_id and status='pending';
        update faucet.provider_events set reversed_at=now() where id=original.id;
      else
        update faucet.wallets set available_points=available_points-least(available_points,delta),debt_points=debt_points+greatest(0,delta-available_points),updated_at=now() where account_id=p_account_id;
        update faucet.provider_events set reversed_at=now() where id=original.id;
      end if;
      insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(p_account_id,'chargeback','BitcoTasks',p_trans_id,-delta,'confirmed',jsonb_build_object('provider_payout_usd',coalesce(p_payout_usd,0),'original_reward',original.reward));
    end if;
  else raise exception 'unsupported BitcoTasks postback status %',p_status; end if;
  return inserted_event;
end;
$$;

revoke all on function faucet.request_withdrawal(uuid,numeric,text,text,text) from public,anon,authenticated;
revoke all on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function faucet.request_withdrawal(uuid,numeric,text,text,text) to service_role;
grant execute on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) to service_role;

create or replace function faucet.admin_summary()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'accounts',(select count(*) from faucet.accounts),
    'pendingWithdrawals',(select count(*) from faucet.withdrawals where status='pending'),
    'pointsOutstanding',(select coalesce(sum(available_points),0) from faucet.wallets),
    'pointsPending',(select coalesce(sum(pending_points),0) from faucet.wallets),
    'providerEvents',(select count(*) from faucet.provider_events)
  );
$$;
revoke all on function faucet.admin_summary() from public,anon,authenticated;
grant execute on function faucet.admin_summary() to service_role;

-- v1.3.0 payout boundary: the database accepts only asset/network pairs configured
-- in faucet.settings. This remains enforced even if a client bypasses the UI/API validator.
create or replace function faucet.request_withdrawal(
  p_account_id uuid,p_amount_points numeric,p_asset text,p_network text,p_destination text
) returns faucet.withdrawals
language plpgsql security definer set search_path = ''
as $$
declare
  w faucet.wallets%rowtype;
  min_points numeric;
  enabled boolean := true;
  inserted faucet.withdrawals;
  supported jsonb;
begin
  perform faucet.settle_due_rewards(p_account_id);
  select coalesce((value #>> '{}')::numeric,5000) into min_points from faucet.settings where key='withdrawal_min_points';
  select coalesce((value #>> '{}')::boolean,true) into enabled from faucet.settings where key='withdrawal_enabled';
  select value into supported from faucet.settings where key='supported_payouts';
  if not enabled then raise exception 'withdrawals are temporarily unavailable'; end if;
  if p_amount_points < min_points then raise exception 'minimum withdrawal is % points', min_points; end if;
  if not exists (select 1 from jsonb_array_elements(coalesce(supported,'[]'::jsonb)) x where upper(coalesce(x->>'asset',''))=upper(p_asset) and coalesce(x->>'network','')=p_network) then
    raise exception 'unsupported payout destination';
  end if;
  select * into w from faucet.wallets where account_id=p_account_id for update;
  if not found then raise exception 'wallet not found'; end if;
  if w.debt_points > 0 then raise exception 'account has a % point settlement balance', w.debt_points; end if;
  if w.available_points < p_amount_points then raise exception 'insufficient available points'; end if;
  update faucet.wallets set available_points=available_points-p_amount_points,pending_points=pending_points+p_amount_points,updated_at=now() where account_id=p_account_id;
  insert into faucet.withdrawals(account_id,amount_points,asset,network,destination,status)
  values(p_account_id,p_amount_points,upper(p_asset),p_network,p_destination,'pending') returning * into inserted;
  insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
  values(p_account_id,'withdrawal','Internal wallet',inserted.id::text,-p_amount_points,'reserved',jsonb_build_object('asset',upper(p_asset),'network',p_network));
  return inserted;
end;
$$;
revoke all on function faucet.request_withdrawal(uuid,numeric,text,text,text) from public,anon,authenticated;
grant execute on function faucet.request_withdrawal(uuid,numeric,text,text,text) to service_role;
