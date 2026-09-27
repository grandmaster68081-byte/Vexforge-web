-- KIVORA v2.1.0 FINAL LAUNCH RAIL
-- Fixed owner decision: USDT / TRC20 only, manual payouts, zero starting treasury.
-- Mainnet USDT contract reference: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
-- Treasury address: TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD

begin;

insert into faucet.settings(key,value) values
 ('payout_asset', '"USDT"'::jsonb),
 ('payout_network', '"TRC20"'::jsonb),
 ('payout_mode', '"manual"'::jsonb),
 ('treasury_address', '"TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD"'::jsonb),
 ('treasury_asset', '"USDT"'::jsonb),
 ('treasury_network', '"TRC20"'::jsonb),
 ('treasury_usdt_contract', '"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"'::jsonb),
 ('treasury_starting_balance_crypto', '0'::jsonb),
 ('usdt_decimals', '6'::jsonb),
 ('usdt_usd_reference', '1'::jsonb),
 ('supported_payouts', '[{"asset":"USDT","network":"TRC20"}]'::jsonb),
 ('withdrawal_min_points', '10000'::jsonb),
 ('withdrawal_min_usd', '10'::jsonb),
 ('currency_round', '2'::jsonb)
on conflict (key) do update set value=excluded.value, updated_at=now();

commit;
