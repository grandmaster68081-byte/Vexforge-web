# SUPABASE SCHEMA

- `SUPABASE_LIVE` structural metadata was collected through read-only Management API queries.
- `BLOCKED` official `supabase db dump --linked` was not run because the Supabase CLI is unavailable and the project was not linked automatically.
- `SUPABASE_LIVE` remote schemas and relation counts:
- `SUPABASE_LIVE` `auth`: 27 relations; 271 information_schema columns
- `SUPABASE_LIVE` `cron`: 2 relations; 19 information_schema columns
- `SUPABASE_LIVE` `econ_sim`: 3 relations; 12 information_schema columns
- `SUPABASE_LIVE` `extensions`: 2 relations; 51 information_schema columns
- `SUPABASE_LIVE` `public`: 318 relations; 2865 information_schema columns
- `SUPABASE_LIVE` `realtime`: 8 relations; 71 information_schema columns
- `SUPABASE_LIVE` `storage`: 8 relations; 71 information_schema columns
- `SUPABASE_LIVE` `supabase_migrations`: 1 relations; 6 information_schema columns
- `SUPABASE_LIVE` `vault`: 2 relations; 17 information_schema columns
- `SUPABASE_LIVE` `vexforge_audit`: 71 relations; 470 information_schema columns

## Public relation names

- `SUPABASE_LIVE` `achievements`, `action_locks`, `admin_actions`, `admin_economy_overview`, `admin_economy_view`, `admin_logs`, `admin_market_overview`, `admin_market_queue_view`, `admin_players_overview`, `admin_players_view`, `admin_withdrawal_queue_view`, `admin_withdrawals`, `audit_supabase_snapshot`, `battle_events`, `battle_history`, `battle_runs`, `canon_economy_state`, `canon_player_profile`, `canonical_reality`, `canonical_table_registry`, `card_evolution_paths`, `card_synergy_rules`, `card_usage_log`, `cards`, `cards_canonical`, `clan_members`, `clan_wars`, `clans`, `combat_effects`, `combat_participants`, `combat_results`, `combat_sessions`, `combat_turns`, `component_registry`, `config`, `context_execution_map`, `context_system`, `cosmetics`, `creatures`, `currency_definitions`, `daily_quests`, `direct_challenges`, `econ_core_final`, `econ_core_stable`, `econ_market_guard_complete`, `economy_absorption_ratio_view`, `economy_alerts`, `economy_ast_nodes`, `economy_balance_state`, `economy_compiled_modules`, `economy_dynamic_rules`, `economy_emergent_rules`, `economy_flow_events`, `economy_global_metrics`, `economy_global_state`, `economy_kernel_state`, `economy_ledger`, `economy_lock_state_machine`, `economy_loop_events`, `economy_meta_evolution`, `economy_processes`, `economy_reconciliation_log`, `economy_rule_history`, `economy_safety_flags`, `economy_sinks`, `economy_sources`, `economy_state`, `economy_state_machine`, `economy_system_state`, `energy_state`, `equipped_cosmetics`, `event_buffer`, `event_dedup`, `event_log`, `events`, `faction_perks`, `factions`, `friendships`, `game_loop_health`, `game_loop_state`, `game_loop_summary`, `game_state`, `guild_wars`, `idempotency_keys`, `inventory`, `isolation_enforcer`, `kernel_economy_lock`, `kernel_event_state`, `kernel_market_guard`, `kernel_mission_runtime`, `kernel_reality_guard`, `kernel_runtime_events`, `kernel_system_status`, `kernel_wallet_sync`, `lore_codex`, `market_dynamic_state`, `market_guard_final`, `market_items`, `market_listings`, `market_loop_events`, `meta_ai_state`, `meta_dashboard`, `meta_state`, `meta_system_state`, `mission_completion_log`, `mission_gates`, `mission_rewards`, `mission_runs`, `missions`, `player_achievements`, `player_active_boosts`, `player_cards`, `player_consumables`, `player_cosmetics`, `player_daily_ai_claims`, `player_daily_quests`, `player_deck`, `player_economy_state`, `player_factions`, `player_notifications` …

## Structural evidence

- tables: `snapshots/continuity-20260919T062954Z/remote_tables.json`
- columns and defaults: `snapshots/continuity-20260919T062954Z/remote_columns.json`
- constraints: `snapshots/continuity-20260919T062954Z/remote_constraints.json` and `remote_constraint_columns.json`
- indexes: `snapshots/continuity-20260919T062954Z/remote_indexes.json`
- triggers: `snapshots/continuity-20260919T062954Z/remote_triggers.json`
- routines metadata without routine bodies: `snapshots/continuity-20260919T062954Z/remote_routines.json`
- blocked official SQL dump marker: `snapshots/continuity-20260919T062954Z/remote-schema.sql`

No structural result was converted into a migration or applied to the remote project.
