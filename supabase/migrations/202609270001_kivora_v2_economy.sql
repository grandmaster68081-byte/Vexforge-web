-- KIVORA v2 ECONOMY / TREASURY / POSTBACK HARDENING
-- Draft implementation contract for Replit.
-- Apply only after reviewing against the exact current schema and in staging first.
-- No VEXFORGE tables are touched.

begin;

create schema if not exists faucet;

-- Wallet separation: reward hold vs withdrawal reservation.
alter table faucet.wallets add column if not exists reward_pending_points numeric(24,4) not null default 0;
alter table faucet.wallets add column if not exists withdrawal_reserved_points numeric(24,4) not null default 0;

-- New accounts inherit the v2 runtime hashing policy. Existing rows retain their stored value.
alter table faucet.accounts alter column password_iterations set default 210000;

-- Provider event ordering/reversal metadata.
alter table faucet.provider_events add column if not exists reversal_pending boolean not null default false;
alter table faucet.provider_events add column if not exists reversal_of_event_id bigint references faucet.provider_events(id);
alter table faucet.provider_events add column if not exists user_share_bps_snapshot integer;

-- Withdrawal evidence/payment fields.
alter table faucet.withdrawals add column if not exists amount_usd_reference numeric(24,8);
alter table faucet.withdrawals add column if not exists crypto_amount numeric(32,12);
alter table faucet.withdrawals add column if not exists payment_rate_usd numeric(32,12);
alter table faucet.withdrawals add column if not exists payment_rate_source text;
alter table faucet.withdrawals add column if not exists treasury_movement_id uuid;
alter table faucet.withdrawals add column if not exists destination_verified_at timestamptz;
alter table faucet.withdrawals add column if not exists paid_by uuid references faucet.accounts(id) on delete set null;

create table if not exists faucet.provider_settlements (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  period_start timestamptz,
  period_end timestamptz,
  gross_activity_usd numeric(24,8) not null default 0,
  net_received_usd_equivalent numeric(24,8),
  settlement_asset varchar(16) not null,
  settlement_network varchar(32) not null,
  settlement_amount_crypto numeric(32,12),
  provider_fee_crypto numeric(32,12),
  settlement_reference text,
  received_at timestamptz not null default now(),
  source_note text,
  created_by uuid references faucet.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists faucet_provider_settlements_ref_idx
  on faucet.provider_settlements(provider, settlement_reference)
  where settlement_reference is not null;

create table if not exists faucet.treasury_movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('manual_seed','provider_receipt','payout_sent','payout_fee','adjustment')),
  asset varchar(16) not null,
  network varchar(32) not null,
  amount_crypto numeric(32,12) not null,
  usd_reference numeric(24,8),
  reference_id text,
  withdrawal_id uuid references faucet.withdrawals(id) on delete set null,
  provider_settlement_id uuid references faucet.provider_settlements(id) on delete set null,
  tx_hash text,
  note text,
  created_by uuid references faucet.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists faucet_treasury_movements_created_idx
  on faucet.treasury_movements(created_at desc);
create unique index if not exists faucet_treasury_payout_withdrawal_idx
  on faucet.treasury_movements(withdrawal_id)
  where movement_type = 'payout_sent' and withdrawal_id is not null;

-- Settings contract.
insert into faucet.settings(key,value) values
 ('points_per_usd_display','1000'::jsonb),
 ('target_user_share_bps','3500'::jsonb),
 ('bitcotasks_exchange_rate','350'::jsonb),
 ('withdrawal_min_points','10000'::jsonb),
 ('withdrawal_min_usd','10'::jsonb),
 ('reward_hold_hours','72'::jsonb),
 ('provider','"bitcotasks"'::jsonb),
 ('payout_mode','"provider_settlement_rail"'::jsonb),
 ('treasury_cash_gate_enabled','true'::jsonb)
on conflict (key) do update set value=excluded.value, updated_at=now();

-- Runtime placeholder: populate these two values only after BitcoTasks approval/settlement settings are known.
insert into faucet.settings(key,value) values
 ('payout_asset','""'::jsonb),
 ('payout_network','""'::jsonb)
on conflict (key) do nothing;

-- One-time reconciliation for pre-v2 pending balances.
-- Existing withdrawal reservations are identified from active withdrawals; remaining pending points are treated as reward-held.
update faucet.wallets w
set withdrawal_reserved_points = coalesce((select sum(x.amount_points) from faucet.withdrawals x where x.account_id=w.account_id and x.status in ('pending','approved')),0),
    reward_pending_points = greatest(0, w.pending_points - coalesce((select sum(x.amount_points) from faucet.withdrawals x where x.account_id=w.account_id and x.status in ('pending','approved')),0)),
    updated_at = now();

update faucet.wallets
set pending_points = reward_pending_points + withdrawal_reserved_points,
    updated_at = now();

-- Keep pending_points as a projection for compatibility.
create or replace function faucet.recalc_pending_projection(p_account_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update faucet.wallets
  set pending_points = reward_pending_points + withdrawal_reserved_points,
      updated_at = now()
  where account_id = p_account_id;
$$;
revoke all on function faucet.recalc_pending_projection(uuid) from public,anon,authenticated;
grant execute on function faucet.recalc_pending_projection(uuid) to service_role;

-- v2 settlement: only reward-held provider events become available.
create or replace function faucet.settle_due_rewards_v2(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e faucet.provider_events%rowtype;
begin
  for e in
    select *
    from faucet.provider_events
    where account_id=p_account_id
      and provider='bitcotasks'
      and status_code=1
      and reversal_pending=false
      and settled_at is null
      and reversed_at is null
      and available_at <= now()
    order by created_at
    for update
  loop
    update faucet.wallets
      set reward_pending_points=greatest(0,reward_pending_points-e.reward),
          available_points=available_points+e.reward,
          pending_points=greatest(0,(reward_pending_points-e.reward)+withdrawal_reserved_points),
          updated_at=now()
    where account_id=p_account_id;

    update faucet.ledger_entries
      set status='confirmed'
    where account_id=p_account_id
      and entry_type='reward'
      and source='BitcoTasks'
      and external_id=e.trans_id
      and status='pending';

    update faucet.provider_events
      set settled_at=now()
    where id=e.id;
  end loop;
end;
$$;
revoke all on function faucet.settle_due_rewards_v2(uuid) from public,anon,authenticated;
grant execute on function faucet.settle_due_rewards_v2(uuid) to service_role;

-- v2 postback with safe ordering/reversal semantics.
create or replace function faucet.apply_bitcotasks_postback_v2(
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
  original faucet.provider_events;
  prior_reversal faucet.provider_events;
  delta numeric := abs(coalesce(p_reward,0));
  hold_hours numeric := 72;
  user_share_bps integer := 3500;
  final_points numeric;
begin
  if delta <= 0 then raise exception 'reward must be positive'; end if;
  if p_status not in (1,2) then raise exception 'unsupported BitcoTasks postback status %',p_status; end if;

  select coalesce((value #>> '{}')::numeric,72) into hold_hours from faucet.settings where key='reward_hold_hours';
  select coalesce((value #>> '{}')::integer,3500) into user_share_bps from faucet.settings where key='target_user_share_bps';

  -- For this contract, BitcoTasks reward is already the final Kivora Points amount because the app Exchange Rate is 350.
  final_points := delta;

  insert into faucet.provider_events(
    provider,trans_id,status_code,account_id,offer_name,offer_type,reward,reward_name,reward_value,payout_usd,debug,available_at,user_share_bps_snapshot
  )
  values(
    'bitcotasks',p_trans_id,p_status,p_account_id,p_offer_name,p_offer_type,final_points,p_reward_name,
    coalesce(p_reward_value,0),coalesce(p_payout_usd,0),coalesce(p_debug,0)<>0,
    case when p_status=1 then now()+(hold_hours||' hours')::interval else now() end,
    user_share_bps
  )
  on conflict(provider,trans_id,status_code) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select * into inserted_event
    from faucet.provider_events
    where provider='bitcotasks' and trans_id=p_trans_id and status_code=p_status
    limit 1;
    return inserted_event;
  end if;

  if p_status=1 then
    select * into prior_reversal
    from faucet.provider_events
    where provider='bitcotasks' and trans_id=p_trans_id and status_code=2
    order by created_at desc
    limit 1
    for update;

    if prior_reversal.id is not null then
      update faucet.provider_events
        set reversal_pending=false,
            reversal_of_event_id=inserted_event.id,
            reversed_at=now()
      where id=prior_reversal.id;

      update faucet.provider_events
        set reversal_pending=false,
            reversed_at=now(),
            reversal_of_event_id=prior_reversal.id
      where id=inserted_event.id;

      insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(
        p_account_id,'reward','BitcoTasks',p_trans_id,final_points,'reversed',
        jsonb_build_object('orphan_reversal_consumed',true,'provider_payout_usd',coalesce(p_payout_usd,0))
      );

      insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(
        p_account_id,'chargeback','BitcoTasks',p_trans_id,-final_points,'confirmed',
        jsonb_build_object('matched_late_credit',true,'provider_payout_usd',coalesce(p_payout_usd,0))
      );

      return inserted_event;
    end if;

    update faucet.wallets
      set reward_pending_points=reward_pending_points+final_points,
          lifetime_earned_points=lifetime_earned_points+final_points,
          pending_points=pending_points+final_points,
          updated_at=now()
    where account_id=p_account_id;

    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
    values(
      p_account_id,'reward','BitcoTasks',p_trans_id,final_points,'pending',
      jsonb_build_object('offer_type',p_offer_type,'offer_name',p_offer_name,'provider_payout_usd',coalesce(p_payout_usd,0),'provider_reward_name',p_reward_name,'available_at',inserted_event.available_at)
    );

  else
    select * into original
    from faucet.provider_events
    where provider='bitcotasks' and trans_id=p_trans_id and status_code=1
    order by created_at
    limit 1
    for update;

    if original.id is null then
      update faucet.provider_events
        set reversal_pending=true
      where id=inserted_event.id;

      insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
      values(
        p_account_id,'chargeback','BitcoTasks',p_trans_id,0,'reversal_pending',
        jsonb_build_object('orphan_chargeback',true,'incoming_reward',delta,'provider_payout_usd',coalesce(p_payout_usd,0))
      );
    else
      -- Use the original credited amount for the reversal, not an untrusted mismatch in the later payload.
      final_points := original.reward;

      if original.reversed_at is null then
        if original.settled_at is null then
          update faucet.wallets
            set reward_pending_points=greatest(0,reward_pending_points-final_points),
                pending_points=greatest(0,(reward_pending_points-final_points)+withdrawal_reserved_points),
                updated_at=now()
          where account_id=p_account_id;
        else
          update faucet.wallets
            set available_points=greatest(0,available_points-final_points),
                debt_points=debt_points+greatest(0,final_points-available_points),
                updated_at=now()
          where account_id=p_account_id;
        end if;

        update faucet.provider_events
          set reversed_at=now(),reversal_of_event_id=inserted_event.id
        where id=original.id;

        update faucet.provider_events
          set reversal_pending=false,reversal_of_event_id=original.id
        where id=inserted_event.id;

        update faucet.ledger_entries
          set status='reversed'
        where account_id=p_account_id
          and entry_type='reward'
          and source='BitcoTasks'
          and external_id=p_trans_id
          and status in ('pending','confirmed');

        insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
        values(
          p_account_id,'chargeback','BitcoTasks',p_trans_id,-final_points,'confirmed',
          jsonb_build_object('provider_payout_usd',coalesce(p_payout_usd,0),'original_reward',original.reward,'incoming_reward',delta,'mismatch',delta<>original.reward)
        );
      end if;
    end if;
  end if;

  return inserted_event;
end;
$$;
revoke all on function faucet.apply_bitcotasks_postback_v2(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function faucet.apply_bitcotasks_postback_v2(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb) to service_role;

-- v2 withdrawal lifecycle.
create or replace function faucet.request_withdrawal_v2(
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
  configured_asset text;
  configured_network text;
  inserted faucet.withdrawals;
  usd_ref numeric;
begin
  perform faucet.settle_due_rewards_v2(p_account_id);

  select coalesce((value #>> '{}')::numeric,10000) into min_points from faucet.settings where key='withdrawal_min_points';
  select coalesce((value #>> '{}')::boolean,true) into enabled from faucet.settings where key='withdrawal_enabled';
  select coalesce(value #>> '{}','') into configured_asset from faucet.settings where key='payout_asset';
  select coalesce(value #>> '{}','') into configured_network from faucet.settings where key='payout_network';
  select coalesce((value #>> '{}')::numeric,1000) into usd_ref from faucet.settings where key='points_per_usd_display';

  if not enabled then raise exception 'withdrawals are temporarily unavailable'; end if;
  if p_amount_points < min_points then raise exception 'minimum withdrawal is % points',min_points; end if;
  if configured_asset='' or configured_network='' then raise exception 'payout rail is not configured'; end if;
  if upper(p_asset) <> upper(configured_asset) or p_network <> configured_network then raise exception 'unsupported payout destination'; end if;

  select * into w from faucet.wallets where account_id=p_account_id for update;
  if not found then raise exception 'wallet not found'; end if;
  if w.debt_points > 0 then raise exception 'account has a % point settlement balance',w.debt_points; end if;
  if w.available_points < p_amount_points then raise exception 'insufficient available points'; end if;

  update faucet.wallets
  set available_points=available_points-p_amount_points,
      withdrawal_reserved_points=withdrawal_reserved_points+p_amount_points,
      pending_points=pending_points+p_amount_points,
      updated_at=now()
  where account_id=p_account_id;

  insert into faucet.withdrawals(account_id,amount_points,amount_usd_reference,asset,network,destination,status)
  values(p_account_id,p_amount_points,p_amount_points/usd_ref,upper(p_asset),p_network,p_destination,'pending')
  returning * into inserted;

  insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
  values(p_account_id,'withdrawal','Internal wallet',inserted.id::text,-p_amount_points,'reserved',jsonb_build_object('asset',upper(p_asset),'network',p_network,'usd_reference',inserted.amount_usd_reference));

  return inserted;
end;
$$;
revoke all on function faucet.request_withdrawal_v2(uuid,numeric,text,text,text) from public,anon,authenticated;
grant execute on function faucet.request_withdrawal_v2(uuid,numeric,text,text,text) to service_role;

-- Provider settlement recording.
create or replace function faucet.admin_record_provider_settlement(
  p_admin_account_id uuid,
  p_provider text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_gross_activity_usd numeric,
  p_net_received_usd_equivalent numeric,
  p_asset text,
  p_network text,
  p_amount_crypto numeric,
  p_provider_fee_crypto numeric,
  p_reference text,
  p_note text default null
) returns faucet.provider_settlements
language plpgsql security definer set search_path=''
as $$
declare r faucet.provider_settlements%rowtype;
begin
  insert into faucet.provider_settlements(provider,period_start,period_end,gross_activity_usd,net_received_usd_equivalent,settlement_asset,settlement_network,settlement_amount_crypto,provider_fee_crypto,settlement_reference,source_note,created_by)
  values(p_provider,p_period_start,p_period_end,coalesce(p_gross_activity_usd,0),p_net_received_usd_equivalent,upper(p_asset),p_network,p_amount_crypto,p_provider_fee_crypto,p_reference,p_note,p_admin_account_id)
  returning * into r;

  if p_amount_crypto is not null and p_amount_crypto > 0 then
    insert into faucet.treasury_movements(movement_type,asset,network,amount_crypto,usd_reference,reference_id,provider_settlement_id,note,created_by)
    values('provider_receipt',upper(p_asset),p_network,abs(p_amount_crypto),p_net_received_usd_equivalent,p_reference,r.id,coalesce(p_note,'BitcoTasks settlement received'),p_admin_account_id);
  end if;
  return r;
end;
$$;
revoke all on function faucet.admin_record_provider_settlement(uuid,text,timestamptz,timestamptz,numeric,numeric,text,text,numeric,numeric,text,text) from public,anon,authenticated;
grant execute on function faucet.admin_record_provider_settlement(uuid,text,timestamptz,timestamptz,numeric,numeric,text,text,numeric,numeric,text,text) to service_role;

-- Treasury movement recording.
create or replace function faucet.admin_record_treasury_movement(
  p_admin_account_id uuid,
  p_movement_type text,
  p_asset text,
  p_network text,
  p_amount_crypto numeric,
  p_usd_reference numeric default null,
  p_reference_id text default null,
  p_withdrawal_id uuid default null,
  p_provider_settlement_id uuid default null,
  p_tx_hash text default null,
  p_note text default null
) returns faucet.treasury_movements
language plpgsql security definer set search_path=''
as $$
declare r faucet.treasury_movements%rowtype;
begin
  if p_amount_crypto = 0 then raise exception 'treasury movement cannot be zero'; end if;
  insert into faucet.treasury_movements(movement_type,asset,network,amount_crypto,usd_reference,reference_id,withdrawal_id,provider_settlement_id,tx_hash,note,created_by)
  values(p_movement_type,upper(p_asset),p_network,p_amount_crypto,p_usd_reference,p_reference_id,p_withdrawal_id,p_provider_settlement_id,p_tx_hash,p_note,p_admin_account_id)
  returning * into r;
  return r;
end;
$$;
revoke all on function faucet.admin_record_treasury_movement(uuid,text,text,text,numeric,numeric,text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function faucet.admin_record_treasury_movement(uuid,text,text,text,numeric,numeric,text,uuid,uuid,text,text) to service_role;

-- v2 admin withdrawal lifecycle. Payment creation is atomic with the treasury payout movement.
create or replace function faucet.admin_update_withdrawal_v2(
  p_withdrawal_id uuid,
  p_admin_account_id uuid,
  p_action text,
  p_note text default null,
  p_tx_hash text default null,
  p_crypto_amount numeric default null,
  p_payment_rate_usd numeric default null,
  p_payment_rate_source text default null,
  p_fee_crypto numeric default 0
) returns faucet.withdrawals
language plpgsql
security definer
set search_path = ''
as $$
declare
  w faucet.withdrawals%rowtype;
  updated faucet.withdrawals;
  current_cash numeric;
  gate_enabled boolean := true;
  payout_movement faucet.treasury_movements%rowtype;
begin
  select * into w from faucet.withdrawals where id=p_withdrawal_id for update;
  if not found then raise exception 'withdrawal not found'; end if;

  select coalesce((value #>> '{}')::boolean,true) into gate_enabled
  from faucet.settings where key='treasury_cash_gate_enabled';

  if p_action='approve' then
    if w.status <> 'pending' then raise exception 'only pending withdrawals can be approved'; end if;
    update faucet.withdrawals
      set status='approved',reviewed_by=p_admin_account_id,reviewed_at=now(),admin_note=p_note
    where id=w.id
    returning * into updated;
    return updated;
  end if;

  if p_action='reject' then
    if w.status not in ('pending','approved') then raise exception 'withdrawal cannot be rejected in status %',w.status; end if;
    update faucet.withdrawals
      set status='rejected',reviewed_by=p_admin_account_id,reviewed_at=now(),admin_note=p_note
    where id=w.id
    returning * into updated;

    update faucet.wallets
      set available_points=available_points+w.amount_points,
          withdrawal_reserved_points=greatest(0,withdrawal_reserved_points-w.amount_points),
          pending_points=greatest(0,(pending_points-w.amount_points)),
          updated_at=now()
    where account_id=w.account_id;

    insert into faucet.ledger_entries(account_id,entry_type,source,external_id,points_delta,status,metadata)
    values(w.account_id,'withdrawal_reversal','Admin review',w.id::text,w.amount_points,'reversed',jsonb_build_object('reason',coalesce(p_note,'rejected')));
    return updated;
  end if;

  if p_action='paid' then
    if w.status <> 'approved' then raise exception 'only approved withdrawals can be marked paid'; end if;
    if p_tx_hash is null or length(trim(p_tx_hash)) < 8 then raise exception 'transaction hash is required'; end if;
    if p_crypto_amount is null or p_crypto_amount <= 0 then raise exception 'crypto payment amount is required'; end if;

    select coalesce(sum(amount_crypto),0)
      into current_cash
    from faucet.treasury_movements
    where upper(asset)=upper(w.asset) and network=w.network;

    if gate_enabled and current_cash < (p_crypto_amount + coalesce(p_fee_crypto,0)) then
      raise exception 'insufficient recorded treasury balance for this payout';
    end if;

    update faucet.withdrawals
      set status='paid',paid_at=now(),paid_by=p_admin_account_id,
          reviewed_by=coalesce(reviewed_by,p_admin_account_id),
          reviewed_at=coalesce(reviewed_at,now()),
          admin_note=coalesce(p_note,admin_note),
          tx_hash=trim(p_tx_hash),
          crypto_amount=p_crypto_amount,
          payment_rate_usd=p_payment_rate_usd,
          payment_rate_source=p_payment_rate_source
    where id=w.id
    returning * into updated;

    update faucet.wallets
      set withdrawal_reserved_points=greatest(0,withdrawal_reserved_points-w.amount_points),
          pending_points=greatest(0,pending_points-w.amount_points),
          lifetime_withdrawn_points=lifetime_withdrawn_points+w.amount_points,
          updated_at=now()
    where account_id=w.account_id;

    insert into faucet.treasury_movements(
      movement_type,asset,network,amount_crypto,usd_reference,reference_id,withdrawal_id,tx_hash,note,created_by
    )
    values(
      'payout_sent',w.asset,w.network,-abs(p_crypto_amount),w.amount_usd_reference,w.id::text,w.id,trim(p_tx_hash),coalesce(p_note,'manual payout'),p_admin_account_id
    )
    returning * into payout_movement;

    update faucet.withdrawals
      set treasury_movement_id=payout_movement.id
    where id=w.id;

    if coalesce(p_fee_crypto,0) > 0 then
      insert into faucet.treasury_movements(
        movement_type,asset,network,amount_crypto,withdrawal_id,tx_hash,note,created_by
      )
      values(
        'payout_fee',w.asset,w.network,-abs(p_fee_crypto),w.id::text,w.id,trim(p_tx_hash),'manual network/payout fee',p_admin_account_id
      );
    end if;
    return updated;
  end if;

  raise exception 'unsupported withdrawal action';
end;
$$;
revoke all on function faucet.admin_update_withdrawal_v2(uuid,uuid,text,text,text,numeric,numeric,text,numeric) from public,anon,authenticated;
grant execute on function faucet.admin_update_withdrawal_v2(uuid,uuid,text,text,text,numeric,numeric,text,numeric) to service_role;

-- Summary for the Treasury Control screen.
create or replace function faucet.admin_summary_v2()
returns jsonb
language sql security definer set search_path=''
as $$
select jsonb_build_object(
  'accounts',(select count(*) from faucet.accounts),
  'pendingWithdrawals',(select count(*) from faucet.withdrawals where status='pending'),
  'approvedWithdrawals',(select count(*) from faucet.withdrawals where status='approved'),
  'pointsAvailableLiability',(select coalesce(sum(available_points),0) from faucet.wallets),
  'pointsRewardPending',(select coalesce(sum(reward_pending_points),0) from faucet.wallets),
  'pointsWithdrawalReserved',(select coalesce(sum(withdrawal_reserved_points),0) from faucet.wallets),
  'pointsDebt',(select coalesce(sum(debt_points),0) from faucet.wallets),
  'providerEvents',(select count(*) from faucet.provider_events),
  'providerActivityUsd',(select coalesce(sum(payout_usd),0) from faucet.provider_events where provider='bitcotasks' and status_code=1),
  'providerSettlementsUsd',(select coalesce(sum(net_received_usd_equivalent),0) from faucet.provider_settlements where provider='bitcotasks'),
  'treasuryMovementCount',(select count(*) from faucet.treasury_movements),
  'payoutAsset',(select coalesce(value #>> '{}','') from faucet.settings where key='payout_asset'),
  'payoutNetwork',(select coalesce(value #>> '{}','') from faucet.settings where key='payout_network'),
  'treasuryBalanceCrypto',(select coalesce(sum(tm.amount_crypto),0) from faucet.treasury_movements tm where upper(tm.asset)=upper(coalesce((select value #>> '{}' from faucet.settings where key='payout_asset'),'')) and tm.network=coalesce((select value #>> '{}' from faucet.settings where key='payout_network'),'') ),
  'paidWithdrawals',(select count(*) from faucet.withdrawals where status='paid')
);
$$;
revoke all on function faucet.admin_summary_v2() from public,anon,authenticated;
grant execute on function faucet.admin_summary_v2() to service_role;

commit;
