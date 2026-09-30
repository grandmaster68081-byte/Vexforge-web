# VEXFORGE · BACKEND SOURCE REQUIREMENT

The client intentionally treats Supabase as authoritative for mutable game truth.

## Critical RPC bindings

Battle:

- `get_pvp_opponents`
- `vexforge_battle_resolve`
- `vexforge_pvp_forfeit`
- `vexforge_pvp_store_formation`

Economy:

- `vexforge_buy_pack_with_vex`
- `vexforge_open_pack`
- `create_listing`
- `buy_listing`
- `cancel_listing`
- `vexforge_submit_deposit`
- `vexforge_request_withdrawal`
- `safe_wallet_transaction` remains server-only

Progression/content:

- `execute_mission`
- `claim_mission_reward`
- `claim_daily_quest`
- `vexforge_apply_fusion`
- `vexforge_evolve_card`
- `vexforge_join_raid`
- `vexforge_contribute_raid`
- `claim_season_pass_reward`

Social:

- private message and conversation RPCs
- global chat RPCs
- clan creation/join/message RPCs
- friend request/search RPCs

No frontend implementation may replace these with local settlements.
