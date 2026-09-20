# VEXFORGE Economic Master Map

## Sources of truth
- **Live backend:** Supabase project ref `rscuzqnfccqvltkdcdny`, queried over HTTPS via Management API.
- **Repository:** `grandmaster68081-byte/Vexforge-web`, branch `main`, snapshot commit `93b0077975da0f8773e7304d411e0abea083e17b`.
- **Active Android runtime:** `unity/**`, Unity 6000.3.0f1 according to repository metadata.
- **Legacy/reference runtime:** `mobile/**` and web `src/**`; not treated as live authority.

## Live economic layers
1. `player_wallet` — aggregate balances and reservations.
2. `player_economy_state` — balance mirror/state, locks, daily counters and withdrawal flags.
3. `economy_ledger` — ledger guarded by triggers/RLS; aggregate rows were exported only.
4. Marketplace — `market_listings`, `player_cards`, `create_listing`, `buy_listing`, `cancel_listing`, `vexforge_market_fee`.
5. Deposits — `vexforge_project_deposits`, `vexforge_submit_deposit`, `vexforge_get_my_deposits`.
6. Withdrawals — `vexforge_withdrawal_requests_official`, `vexforge_request_withdrawal` plus admin routines.
7. Packs — `vexforge_pack_catalog`, `vexforge_pack_orders`, `vexforge_buy_pack_with_vex`, `vexforge_open_pack`.
8. Rewards — mission/PvP/combat/referral/ad/raid tables and routines.
9. NFT — `vexforge_nft_contracts`, `vexforge_nft_wallet_links`, `vexforge_nft_mint_queue`.

## Current configured values
- VEX/USDT: 100 VEX per 1 USDT.
- Market fee policy: 8%.
- Withdrawal fee: 8%.
- Withdrawal minimum: 2,500 tradeable VEX / 25 USDT gross.
- Withdrawal cooldown: 72 hours; manual review configured.
- Deposit minimum: 1.99 USDT in system config; configured chain/token policy also reports BSC/USDT.
- Pack catalog: 5 rows, all active at extraction; ratios match 100, but `card_count` column conflicts with metadata counts.

## Android parity
Unity is connected to auth, profile/progress, cards, collection, deck, missions, wallet read, social and battle resolve. It is missing consumer paths for ledger/economy stats, marketplace, packs, deposits, withdrawals, ads, referrals and NFT. Battle resolve is connected but its DTO does not expose explicit reward/economy fields.

## Security and conservation state
- Critical client-write authority exists on player economy state, player cards, ad views and NFT link/mint queue fields.
- Aggregate live checks found no negative balances, but found 9 wallet/state mismatches, 4 wallet-only rows and 6 orphan locked cards.
- No live player-level data was exported.

## Protocol boundary
This extraction did not modify Supabase, repository files, Unity files, legacy mobile files, policies, RPCs or database rows. It did not build, compile or deploy anything.
