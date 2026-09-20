# VEXFORGE Critical Findings

Extracted 2026-09-20T13:37:53.575Z from live Supabase and repository main. No mutation was executed.

## VF-CRIT-001 — CRITICAL
- **System:** Supabase/RLS
- **Source:** player_economy_state policy + grants
- **Current behavior:** authenticated has ALL table privileges and own-row ALL policy; economic balance/state fields are client-writable by direct table mutation.
- **Expected authority:** server-authoritative economic state
- **Risk:** balance inflation, lock bypass, daily-cap bypass
- **Exact evidence:**
```json
{
  "rls": [
    {
      "schemaname": "public",
      "tablename": "player_economy_state",
      "rls_enabled": true,
      "force_rls": false
    }
  ],
  "policies": [
    {
      "schemaname": "public",
      "tablename": "player_economy_state",
      "policyname": "player_own_economy_state",
      "permissive": "PERMISSIVE",
      "roles": [
        "authenticated"
      ],
      "cmd": "ALL",
      "qual": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))",
      "with_check": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))"
    }
  ],
  "grants": [
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "anon",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "anon",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "anon",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "authenticated",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_economy_state",
      "grantee": "service_role",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    }
  ]
}
```
- **Recommended next action:** Do not change in this audit. Review and lock direct writes in a separate approved security task.

## VF-CRIT-002 — CRITICAL
- **System:** Supabase/RLS
- **Source:** player_cards policy + grants
- **Current behavior:** authenticated own-row ALL policy permits direct writes to quantity, locked, listed and source_tracking.
- **Expected authority:** server-authoritative inventory
- **Risk:** card duplication, lock/listing bypass, inventory forgery
- **Exact evidence:**
```json
{
  "rls": [
    {
      "schemaname": "public",
      "tablename": "player_cards",
      "rls_enabled": true,
      "force_rls": false
    }
  ],
  "policies": [
    {
      "schemaname": "public",
      "tablename": "player_cards",
      "policyname": "player_cards_own_write",
      "permissive": "PERMISSIVE",
      "roles": [
        "authenticated"
      ],
      "cmd": "ALL",
      "qual": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))",
      "with_check": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))"
    },
    {
      "schemaname": "public",
      "tablename": "player_cards",
      "policyname": "read_all",
      "permissive": "PERMISSIVE",
      "roles": [
        "public"
      ],
      "cmd": "SELECT",
      "qual": "true",
      "with_check": null
    }
  ],
  "grants": [
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "anon",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "anon",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "anon",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "authenticated",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "player_cards",
      "grantee": "service_role",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    }
  ]
}
```
- **Recommended next action:** Separate remediation task; no mutation performed.

## VF-CRIT-003 — CRITICAL
- **System:** Ads
- **Source:** vexforge_ad_views INSERT policy
- **Current behavior:** client can insert completed, watched_pct and vex_awarded when player_auth_id equals auth.uid().
- **Expected authority:** server/provider-verified ad completion
- **Risk:** unbounded reward farming/replay
- **Exact evidence:**
```json
{
  "rls": [
    {
      "schemaname": "public",
      "tablename": "vexforge_ad_views",
      "rls_enabled": true,
      "force_rls": false
    }
  ],
  "policies": [
    {
      "schemaname": "public",
      "tablename": "vexforge_ad_views",
      "policyname": "Players insert own ad views",
      "permissive": "PERMISSIVE",
      "roles": [
        "public"
      ],
      "cmd": "INSERT",
      "qual": null,
      "with_check": "(auth.uid() = player_auth_id)"
    },
    {
      "schemaname": "public",
      "tablename": "vexforge_ad_views",
      "policyname": "Players select own ad views",
      "permissive": "PERMISSIVE",
      "roles": [
        "public"
      ],
      "cmd": "SELECT",
      "qual": "(auth.uid() = player_auth_id)",
      "with_check": null
    }
  ],
  "grants": [
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "anon",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "authenticated",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_ad_views",
      "grantee": "service_role",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    }
  ]
}
```
- **Recommended next action:** Separate remediation task; no mutation performed.

## VF-CRIT-004 — CRITICAL
- **System:** NFT
- **Source:** vexforge_nft_wallet_links and vexforge_nft_mint_queue policies
- **Current behavior:** own INSERT checks player_id but do not constrain verified/status/tx_hash/token_id fields.
- **Expected authority:** server wallet verification and mint settlement
- **Risk:** forged verification/mint state
- **Exact evidence:**
```json
{
  "rls": [
    {
      "schemaname": "public",
      "tablename": "vexforge_nft_wallet_links",
      "rls_enabled": true,
      "force_rls": false
    }
  ],
  "policies": [
    {
      "schemaname": "public",
      "tablename": "vexforge_nft_wallet_links",
      "policyname": "nft_wallet_own_insert",
      "permissive": "PERMISSIVE",
      "roles": [
        "public"
      ],
      "cmd": "INSERT",
      "qual": null,
      "with_check": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))"
    },
    {
      "schemaname": "public",
      "tablename": "vexforge_nft_wallet_links",
      "policyname": "nft_wallet_own_read",
      "permissive": "PERMISSIVE",
      "roles": [
        "public"
      ],
      "cmd": "SELECT",
      "qual": "(player_id IN ( SELECT players.id\n   FROM players\n  WHERE (players.auth_user_id = auth.uid())))",
      "with_check": null
    }
  ],
  "grants": [
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "anon",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "authenticated",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "DELETE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "INSERT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "TRUNCATE",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_nft_wallet_links",
      "grantee": "service_role",
      "privilege_type": "UPDATE",
      "is_grantable": "NO"
    }
  ]
}
```
- **Recommended next action:** Separate remediation task; no mutation performed.

## VF-HIGH-001 — HIGH
- **System:** Supply consistency
- **Source:** aggregate live query
- **Current behavior:** 9 wallet/state mismatches, 4 wallet rows without state, and 6 locked cards without active listing.
- **Expected authority:** wallet/state/inventory conservation
- **Risk:** unexplained supply and stuck inventory
- **Exact evidence:**
```json
{
  "joined_players": 16,
  "balance_mismatch_rows": 9,
  "state_without_wallet": "[REDACTED_PRIVATE_OR_WALLET_VALUE]",
  "wallet_without_state": "[REDACTED_PRIVATE_OR_WALLET_VALUE]"
}
```
- **Recommended next action:** Run a separate forensic reconciliation with player-level evidence under approved privacy constraints.

## VF-HIGH-002 — HIGH
- **System:** Marketplace
- **Source:** vexforge_market_policy + live RPCs
- **Current behavior:** server policy is 8%; create_listing accepts caller-supplied fee and buy_listing honors it when valid. Protocol legacy reference is 5%.
- **Expected authority:** single server policy
- **Risk:** fee inconsistency and UI/server disagreement
- **Exact evidence:**
```json
{
  "market_policy": [
    {
      "policy_key": "market_fee_pct",
      "policy_value_numeric": 0.08,
      "policy_value_text": "8 percent fee on successful sale",
      "policy_value_json": {},
      "updated_at": "2026-06-23T13:18:58.036227+00:00"
    },
    {
      "policy_key": "market_listing_hours",
      "policy_value_numeric": 72,
      "policy_value_text": "Default listing duration in hours",
      "policy_value_json": {},
      "updated_at": "2026-06-23T13:18:58.036227+00:00"
    },
    {
      "policy_key": "market_max_listing_hours",
      "policy_value_numeric": 168,
      "policy_value_text": "Maximum listing duration in hours",
      "policy_value_json": {},
      "updated_at": "2026-06-23T13:18:58.036227+00:00"
    },
    {
      "policy_key": "market_min_price",
      "policy_value_numeric": 1,
      "policy_value_text": "Minimum listing price",
      "policy_value_json": {},
      "updated_at": "2026-06-23T13:18:58.036227+00:00"
    }
  ],
  "function": "create_listing/buy_listing/vexforge_market_fee"
}
```
- **Recommended next action:** Reconcile fee contract in a separate approved task.

## VF-HIGH-003 — HIGH
- **System:** Packs
- **Source:** vexforge_pack_catalog + vexforge_open_pack
- **Current behavior:** catalog column card_count is 5 for all observed rows while metadata.card_count varies; open function reads the column.
- **Expected authority:** one canonical pack card-count field
- **Risk:** wrong number of cards granted compared with metadata/UI expectations
- **Exact evidence:**
```json
[
  {
    "pack_key": "expedition_pack",
    "pack_name": "Expedition Pack",
    "price_usdt": 9.99,
    "active": true,
    "notes": "Garantiza al menos una Rara. Pack recomendado.",
    "metadata": {
      "card_count": 7,
      "rarity_weights": {
        "Epic": 0.06,
        "Rare": 0.18,
        "Common": 0.4,
        "Mythic": 0,
        "Uncommon": 0.35,
        "Legendary": 0.01
      }
    },
    "created_at": "2026-06-23T13:49:32.750091+00:00",
    "updated_at": "2026-07-19T14:51:33.055058+00:00",
    "price_vex": 999,
    "card_count": 5,
    "official_exchange_ratio": 100,
    "ratio_matches_official_100": true,
    "metadata_card_count_matches_column": false
  },
  {
    "pack_key": "forge_pack",
    "pack_name": "Forge Pack",
    "price_usdt": 24.99,
    "active": true,
    "notes": "Épicas garantizadas. Para forjadores serios.",
    "metadata": {
      "card_count": 8,
      "rarity_weights": {
        "Epic": 0.15,
        "Rare": 0.35,
        "Common": 0.15,
        "Mythic": 0.01,
        "Uncommon": 0.3,
        "Legendary": 0.04
      }
    },
    "created_at": "2026-06-23T13:49:32.750091+00:00",
    "updated_at": "2026-07-19T14:51:33.055058+00:00",
    "price_vex": 2499,
    "card_count": 5,
    "official_exchange_ratio": 100,
    "ratio_matches_official_100": true,
    "metadata_card_count_matches_column": false
  },
  {
    "pack_key": "founder_pack",
    "pack_name": "Founder Pack",
    "price_usdt": 49.99,
    "active": true,
    "notes": "Acceso anticipado. Legendaria garantizada + cosmético exclusivo.",
    "metadata": {
      "card_count": 10,
      "rarity_weights": {
        "Epic": 0.35,
        "Rare": 0.3,
        "Common": 0,
        "Mythic": 0.05,
        "Uncommon": 0.1,
        "Legendary": 0.2
      }
    },
    "created_at": "2026-06-23T13:49:32.750091+00:00",
    "updated_at": "2026-07-19T14:51:33.055058+00:00",
    "price_vex": 4999,
    "card_count": 5,
    "official_exchange_ratio": 100,
    "ratio_matches_official_100": true,
    "metadata_card_count_matches_column": false
  },
  {
    "pack_key": "scout_pack",
    "pack_name": "Scout Pack",
    "price_usdt": 4.99,
    "active": true,
    "notes": "Mayor chance de raras. Para exploradores.",
    "metadata": {
      "card_count": 5,
      "rarity_weights": {
        "Epic": 0.02,
        "Rare": 0.08,
        "Common": 0.65,
        "Mythic": 0,
        "Uncommon": 0.25,
        "Legendary": 0
      }
    },
    "created_at": "2026-06-23T13:49:32.750091+00:00",
    "updated_at": "2026-07-19T14:51:33.055058+00:00",
    "price_vex": 499,
    "card_count": 5,
    "official_exchange_ratio": 100,
    "ratio_matches_official_100": true,
    "metadata_card_count_matches_column": true
  },
  {
    "pack_key": "seed_pack",
    "pack_name": "Seed Pack",
    "price_usdt": 1.99,
    "active": true,
    "notes": "Pack básico. Comunes y uncommons. Perfecto para comenzar.",
    "metadata": {
      "card_count": 3,
      "rarity_weights": {
        "Epic": 0,
        "Rare": 0.03,
        "Common": 0.85,
        "Mythic": 0,
        "Uncommon": 0.12,
        "Legendary": 0
      }
    },
    "created_at": "2026-06-23T13:49:32.750091+00:00",
    "updated_at": "2026-07-19T14:51:33.055058+00:00",
    "price_vex": 199,
    "card_count": 5,
    "official_exchange_ratio": 100,
    "ratio_matches_official_100": true,
    "metadata_card_count_matches_column": false
  }
]
```
- **Recommended next action:** Confirm intended source of truth before any change.

## VF-HIGH-004 — HIGH
- **System:** Withdrawals
- **Source:** vexforge_request_withdrawal security mode and table grants
- **Current behavior:** request RPC is SECURITY INVOKER but writes official withdrawal and ledger tables where authenticated grants shown by metadata are read/reference-only.
- **Expected authority:** verified callable settlement path
- **Risk:** withdrawal request can fail at runtime or behave differently by caller role
- **Exact evidence:**
```json
{
  "routine": {
    "routine_schema": "public",
    "routine_name": "vexforge_request_withdrawal",
    "identity_arguments": "p_player_id uuid, p_tradeable_amount numeric",
    "security_type": "INVOKER",
    "return_signature": "jsonb",
    "language": "plpgsql",
    "definition": "CREATE OR REPLACE FUNCTION public.vexforge_request_withdrawal(p_player_id uuid, p_tradeable_amount numeric)\n RETURNS jsonb\n LANGUAGE plpgsql\n SET search_path TO 'public', 'pg_temp'\nAS $function$\ndeclare\n    v_min_tradeable numeric;\n    v_fee_pct numeric;\n    v_trade_rate numeric;\n    v_before numeric;\n    v_locked_before numeric;\n    v_after numeric;\n    v_locked_after numeric;\n    v_usdt_gross numeric;\n    v_fee_usdt numeric;\n    v_usdt_net numeric;\n    v_treasury_wallet text;\n    v_request_id uuid;\nbegin\n    select coalesce(policy_value_numeric, 2500)\n    into v_min_tradeable\n    from vexforge_commercial_policy\n    where policy_key = 'withdrawal_min_tradeable';\n\n    select coalesce(policy_value_numeric, 0.08)\n    into v_fee_pct\n    from vexforge_commercial_policy\n    where policy_key = 'withdrawal_fee_pct';\n\n    select coalesce(policy_value_numeric, 100)\n    into v_trade_rate\n    from vexforge_commercial_policy\n    where policy_key = 'usdt_to_tradeable_rate';\n\n    if p_tradeable_amount < v_min_tradeable then\n        raise exception 'Minimum withdrawal is % tradeable', v_min_tradeable;\n    end if;\n\n    select coalesce(trade_balance, 0), coalesce(trade_balance_locked, 0)\n    into v_before, v_locked_before\n    from player_economy_state\n    where player_id = p_player_id\n    for update;\n\n    if v_before < p_tradeable_amount then\n        raise exception 'Insufficient tradeable balance';\n    end if;\n\n    v_after := v_before - p_tradeable_amount;\n    v_locked_after := v_locked_before + p_tradeable_amount;\n\n    update player_economy_state\n    set trade_balance = v_after,\n        trade_balance_locked = v_locked_after,\n        withdrawal_pending = true,\n        updated_at = now()\n    where player_id = p_player_id;\n\n    select wallet_address\n    into v_treasury_wallet\n    from vexforge_treasury\n    where active = true\n    order by created_at asc\n    limit 1;\n\n    v_usdt_gross := round(p_tradeable_amount / v_trade_rate, 8);\n    v_fee_usdt := round(v_usdt_gross * v_fee_pct, 8);\n    v_usdt_net := greatest(round(v_usdt_gross - v_fee_usdt, 8), 0);\n\n    insert into vexforge_withdrawal_requests_official (\n        id,\n        player_id,\n        tradeable_amount,\n        usdt_gross,\n        fee_usdt,\n        usdt_net,\n        treasury_wallet_address,\n        status,\n        reviewed,\n        metadata,\n        created_at,\n        updated_at\n    )\n    values (\n        gen_random_uuid(),\n        p_player_id,\n        p_tradeable_amount,\n        v_usdt_gross,\n        v_fee_usdt,\n        v_usdt_net,\n        v_treasury_wallet,\n        'pending_review',\n        false,\n        jsonb_build_object(\n            'trade_rate', v_trade_rate,\n            'fee_pct', v_fee_pct\n        ),\n        now(),\n        now()\n    )\n    returning id into v_request_id;\n\n    -- FASE 3: trazabilidad contable del paso \"solicitud creada\" (antes ausente)\n    insert into economy_ledger (\n        reference_id, player_id, entry_type, currency, amount,\n        balance_before, balance_after, source_table, source_id, metadata, created_at, is_final\n    ) values (\n        v_request_id::text,\n        p_player_id,\n        'withdrawal_request',\n        'vex_tradeable',\n        p_tradeable_amount,\n        v_before,\n        v_after,\n        'vexforge_withdrawal_requests_official',\n        v_request_id::text,\n        jsonb_build_object('usdt_gross', v_usdt_gross, 'fee_usdt', v_fee_usdt, 'usdt_net', v_usdt_net),\n        now(),\n        true\n    );\n\n    return jsonb_build_object(\n        'ok', true,\n        'request_id', v_request_id,\n        'player_id', p_player_id,\n        'tradeable_amount', p_tradeable_amount,\n        'usdt_gross', v_usdt_gross,\n        'fee_usdt', v_fee_usdt,\n        'usdt_net', v_usdt_net,\n        'status', 'pending_review'\n    );\nend;\n$function$\n"
  },
  "grants": [
    {
      "table_schema": "public",
      "table_name": "economy_ledger",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "economy_ledger",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_withdrawal_requests_official",
      "grantee": "authenticated",
      "privilege_type": "REFERENCES",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_withdrawal_requests_official",
      "grantee": "authenticated",
      "privilege_type": "SELECT",
      "is_grantable": "NO"
    },
    {
      "table_schema": "public",
      "table_name": "vexforge_withdrawal_requests_official",
      "grantee": "authenticated",
      "privilege_type": "TRIGGER",
      "is_grantable": "NO"
    }
  ]
}
```
- **Recommended next action:** Verify with a non-mutating privilege/callability test or controlled staging test; no live mutation was attempted.

## VF-MED-001 — MEDIUM
- **System:** Live data coverage
- **Source:** aggregate queries
- **Current behavior:** no current rows in deposits, withdrawals, referrals, rewards, pack orders, NFT contracts or mint queue where reported.
- **Expected authority:** operational records
- **Risk:** lifecycle completion cannot be proven from current live rows
- **Exact evidence:**
```json
{
  "deposits": [],
  "withdrawals": [],
  "referrals": {
    "rows": 0,
    "reward_granted_rows": 0,
    "first_pack_rewarded_rows": 0
  },
  "rewards": {
    "rewards_table": {
      "rows": 0,
      "amount_total": 0
    },
    "mission_rewards": {
      "rows": 0,
      "amount_total": 0
    },
    "raid_rewards": {
      "rows": 0,
      "amount_total": 0
    },
    "telegram_rewards_log": {
      "rows": 0,
      "amount_total": 0
    }
  },
  "packs": null,
  "nft": {
    "contracts": null,
    "wallet_links": "[REDACTED_PRIVATE_OR_WALLET_VALUE]",
    "mint_queue": null
  }
}
```
- **Recommended next action:** Keep as UNKNOWN; do not infer inactivity beyond this snapshot.
