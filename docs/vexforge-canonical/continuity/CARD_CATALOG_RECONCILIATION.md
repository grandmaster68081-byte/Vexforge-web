# CARD CATALOG RECONCILIATION

The audit records separate source counts. It does not select a single canonical count when sources differ.

| Source | Count | Status |
|---|---:|---|
| BACKEND COUNT (`SUPABASE_LIVE`) | exact counts below | VERIFIED |
| LEGACY COUNT (`LEGACY_EXPO`) | UNKNOWN | UNKNOWN |
| UNITY COUNT (`REPO_CURRENT`) | UNKNOWN | UNKNOWN |
| STORAGE COUNT (`SUPABASE_LIVE`) | 127 relevant records in capped name inventory | VERIFIED / SCOPE-LIMITED |
| DOCUMENTED COUNT (`HUMAN_DIRECTIVE`) | 127 historical reference | VERIFIED AS DIRECTIVE, NOT ASSUMED AS TOTAL |

## Backend card-related exact counts

- `SUPABASE_LIVE` `card_evolution_paths` = `55` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `cards` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `cards_canonical` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `card_synergy_rules` = `20` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `card_usage_log` = `0` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `player_cards` = `446` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `tg_cards` = `24` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `tg_player_cards` = `446` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `v_card_master` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_bridge_cards` = `151` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_card_fusion_log` = `0` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_card_fusion_policy` = `5` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_card_supply_official` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_card_supply_policy` = `6` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_card_supply_summary` = `6` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_marketable_cards` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_official_cards_bridge` = `127` rows (exact read-only COUNT)
- `SUPABASE_LIVE` `vexforge_replit_cards` = `127` rows (exact read-only COUNT)

- `SUPABASE_LIVE` exact 127-card relations include `cards`, `cards_canonical`, `v_card_master`, `vexforge_card_supply_official`, `vexforge_marketable_cards`, `vexforge_official_cards_bridge` and `vexforge_replit_cards` where returned by the read-only count query.
- `CARD_COUNT_MISMATCH` source counts are not collapsed into one number because player-card, bridge, Telegram and official-card relations have different meanings.
- `UNKNOWN` no backend row payloads were read; only exact COUNT metadata was requested.

Evidence: `snapshots/continuity-20260919T062954Z/remote-card-counts.txt`, `remote-content-table-candidates.txt`, `content-source-candidates.txt`.
