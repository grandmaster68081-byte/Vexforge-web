-- KIVORA FOLLOW-UP HARDENING
-- Atomic account + wallet creation and server-side invariants for the v1.3 flow.

create or replace function faucet.create_account_with_wallet(
  p_public_id text,
  p_username text,
  p_email text,
  p_password_hash text,
  p_password_salt text,
  p_password_iterations integer
) returns faucet.accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  created faucet.accounts;
begin
  insert into faucet.accounts(
    public_id,
    username,
    email,
    password_hash,
    password_salt,
    password_iterations
  )
  values (
    p_public_id,
    lower(trim(p_username)),
    lower(trim(p_email)),
    p_password_hash,
    p_password_salt,
    p_password_iterations
  )
  returning * into created;

  insert into faucet.wallets(account_id)
  values (created.id);

  return created;
end;
$$;

revoke all on function faucet.create_account_with_wallet(text,text,text,text,text,integer)
  from public, anon, authenticated;
grant execute on function faucet.create_account_with_wallet(text,text,text,text,text,integer)
  to service_role;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'faucet_wallets_available_points_nonnegative'
  ) then
    alter table faucet.wallets
      add constraint faucet_wallets_available_points_nonnegative
      check (available_points >= 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'faucet_wallets_pending_points_nonnegative'
  ) then
    alter table faucet.wallets
      add constraint faucet_wallets_pending_points_nonnegative
      check (pending_points >= 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'faucet_wallets_debt_points_nonnegative'
  ) then
    alter table faucet.wallets
      add constraint faucet_wallets_debt_points_nonnegative
      check (debt_points >= 0) not valid;
  end if;
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
  if not exists (
    select 1
    from faucet.accounts
    where id = p_admin_account_id
      and role = 'admin'
      and status = 'active'
  ) then
    raise exception 'admin account is not active';
  end if;

  select * into w
  from faucet.withdrawals
  where id = p_withdrawal_id
  for update;
  if not found then raise exception 'withdrawal not found'; end if;

  if p_action = 'approve' then
    if w.status <> 'pending' then raise exception 'only pending withdrawals can be approved'; end if;
    update faucet.withdrawals
      set status = 'approved', reviewed_by = p_admin_account_id, reviewed_at = now(), admin_note = p_note
      where id = w.id
      returning * into updated;
  elsif p_action = 'reject' then
    if w.status not in ('pending', 'approved') then
      raise exception 'withdrawal cannot be rejected in status %', w.status;
    end if;
    update faucet.withdrawals
      set status = 'rejected', reviewed_by = p_admin_account_id, reviewed_at = now(), admin_note = p_note
      where id = w.id
      returning * into updated;
    update faucet.wallets
      set available_points = available_points + w.amount_points,
          pending_points = greatest(0, pending_points - w.amount_points),
          updated_at = now()
      where account_id = w.account_id;
    insert into faucet.ledger_entries(account_id, entry_type, source, external_id, points_delta, status, metadata)
      values (w.account_id, 'withdrawal_reversal', 'Admin review', w.id::text, w.amount_points, 'reversed',
        jsonb_build_object('reason', coalesce(p_note, 'rejected')));
  elsif p_action = 'paid' then
    if w.status <> 'approved' then raise exception 'only approved withdrawals can be marked paid'; end if;
    if nullif(trim(coalesce(p_tx_hash, '')), '') is null then
      raise exception 'transaction hash is required before marking a payout paid';
    end if;
    update faucet.withdrawals
      set status = 'paid', paid_at = now(), admin_note = coalesce(p_note, admin_note), tx_hash = trim(p_tx_hash)
      where id = w.id
      returning * into updated;
    update faucet.wallets
      set pending_points = greatest(0, pending_points - w.amount_points),
          lifetime_withdrawn_points = lifetime_withdrawn_points + w.amount_points,
          updated_at = now()
      where account_id = w.account_id;
  else
    raise exception 'unsupported action';
  end if;
  return updated;
end;
$$;

revoke all on function faucet.admin_update_withdrawal(uuid,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function faucet.admin_update_withdrawal(uuid,uuid,text,text,text)
  to service_role;

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
  original faucet.provider_events;
  delta numeric := abs(coalesce(p_reward, 0));
  hold_hours numeric := 72;
begin
  if delta <= 0 then raise exception 'reward must be positive'; end if;
  select coalesce((value #>> '{}')::numeric, 72)
    into hold_hours
    from faucet.settings
    where key = 'reward_hold_hours';

  insert into faucet.provider_events(
    provider, trans_id, status_code, account_id, offer_name, offer_type, reward,
    reward_name, reward_value, payout_usd, debug, available_at
  )
  values (
    'bitcotasks', p_trans_id, p_status, p_account_id, p_offer_name, p_offer_type, delta,
    p_reward_name, coalesce(p_reward_value, 0), coalesce(p_payout_usd, 0),
    coalesce(p_debug, 0) <> 0,
    case when p_status = 1 then now() + (hold_hours || ' hours')::interval else now() end
  )
  on conflict (provider, trans_id, status_code) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select * into inserted_event
    from faucet.provider_events
    where provider = 'bitcotasks' and trans_id = p_trans_id and status_code = p_status
    limit 1;
    return inserted_event;
  end if;

  if p_status = 1 then
    if not exists (select 1 from faucet.wallets where account_id = p_account_id) then
      raise exception 'wallet not found';
    end if;
    update faucet.wallets
      set pending_points = pending_points + delta,
          lifetime_earned_points = lifetime_earned_points + delta,
          updated_at = now()
      where account_id = p_account_id;
    insert into faucet.ledger_entries(account_id, entry_type, source, external_id, points_delta, status, metadata)
      values (
        p_account_id, 'reward', 'BitcoTasks', p_trans_id, delta, 'pending',
        jsonb_build_object(
          'offer_type', p_offer_type,
          'offer_name', p_offer_name,
          'provider_payout_usd', coalesce(p_payout_usd, 0),
          'provider_reward_name', p_reward_name,
          'available_at', inserted_event.available_at
        )
      );
  elsif p_status = 2 then
    select * into original
    from faucet.provider_events
    where provider = 'bitcotasks' and trans_id = p_trans_id and status_code = 1
    order by created_at
    limit 1
    for update;

    if original.id is null then
      insert into faucet.ledger_entries(account_id, entry_type, source, external_id, points_delta, status, metadata)
        values (
          p_account_id, 'chargeback', 'BitcoTasks', p_trans_id, -delta, 'confirmed',
          jsonb_build_object('orphan_chargeback', true)
        );
    else
      if original.account_id <> p_account_id then
        raise exception 'chargeback account mismatch';
      end if;
      if original.reward <> delta then
        raise exception 'chargeback reward mismatch';
      end if;
      if original.settled_at is null and original.reversed_at is null then
        update faucet.wallets
          set pending_points = greatest(0, pending_points - original.reward),
              updated_at = now()
          where account_id = p_account_id;
        update faucet.ledger_entries
          set status = 'reversed'
          where account_id = p_account_id
            and entry_type = 'reward'
            and source = 'BitcoTasks'
            and external_id = p_trans_id
            and status = 'pending';
        update faucet.provider_events set reversed_at = now() where id = original.id;
      else
        update faucet.wallets
          set available_points = available_points - least(available_points, delta),
              debt_points = debt_points + greatest(0, delta - available_points),
              updated_at = now()
          where account_id = p_account_id;
        update faucet.provider_events set reversed_at = now() where id = original.id;
      end if;
      insert into faucet.ledger_entries(account_id, entry_type, source, external_id, points_delta, status, metadata)
        values (
          p_account_id, 'chargeback', 'BitcoTasks', p_trans_id, -delta, 'confirmed',
          jsonb_build_object(
            'provider_payout_usd', coalesce(p_payout_usd, 0),
            'original_reward', original.reward
          )
        );
    end if;
  else
    raise exception 'unsupported BitcoTasks postback status %', p_status;
  end if;
  return inserted_event;
end;
$$;

revoke all on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb)
  from public, anon, authenticated;
grant execute on function faucet.apply_bitcotasks_postback(uuid,text,text,text,numeric,text,numeric,numeric,text,text,integer,integer,jsonb)
  to service_role;