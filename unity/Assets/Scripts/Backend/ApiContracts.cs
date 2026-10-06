using System;

namespace Vexforge.Backend
{
    [Serializable]
    public sealed class AuthResponse
    {
        public string id;
        public string email;
        public string access_token;
        public string refresh_token;
        public int expires_in;
        public string user_id;
        public UserResponse user;
    }

    [Serializable]
    public sealed class UserResponse
    {
        public string id;
        public string email;
    }

    [Serializable]
    public sealed class PlayerProfile
    {
        public string id;
        public string display_name;
        public string email;
        public string role;
        public string status;
        public string created_at;
        public bool is_admin;
        public bool is_super_admin;
    }

    [Serializable]
    public sealed class PlayerProgress
    {
        public int level;
        public int xp;
        public int xp_to_next;
        public int energy;
        public int max_energy;
        public int tutorial_step;
        public string starter_region;
    }

    [Serializable]
    public sealed class PlayerStats
    {
        public int pvp_wins;
        public int missions_completed;
        public int cards_owned;
        public int market_sales;
        public int boss_kills;
        public int packs_opened;
    }

    [Serializable]
    public sealed class PlayerRank
    {
        public bool ok;
        public string player_id;
        public int mmr;
        public string tier;
        public string tier_color;
        public string tier_icon;
        public int tier_min;
        public int shields;
        public int wins;
        public int losses;
        public string season_id;
    }

    [Serializable]
    public sealed class CardRecord
    {
        public string id;
        public string code;
        public string name;
        public string faction;
        public string rarity;
        public string specialization;
        public int power;
        public int affinity;
        public int prestige;
        public int charge;
        public string lore;
        public string image_url;
        public string card_tier;
        public string card_domain;
        public bool marketable;
        public bool fusion_enabled;
    }

    [Serializable]
    public sealed class PlayerCardRecord
    {
        public string id;
        public string card_id;
        public int quantity;
        public bool locked;
        public bool listed;
        public CardRecord card;
    }

    [Serializable]
    public sealed class DeckSlot
    {
        public int slot_number;
        public bool is_champion;
        public string card_id;
        public string code;
        public string name;
        public string rarity;
        public string faction;
        public int power;
        public string image_url;
    }

    [Serializable]
    public sealed class DeckValidation
    {
        public bool valid;
        public string[] errors;
        public int card_count;
        public int mythic_count;
        public int legendary_count;
    }

    [Serializable]
    public sealed class SaveDeckResult
    {
        public bool ok;
        public int slots_saved;
        public string reason;
    }

    [Serializable]
    public sealed class MissionRecord
    {
        public string id;
        public string code;
        public string name;
        public string mission_type;
        public int energy_cost;
        public int reward_xp;
        public int reward_vex_ingame;
        public int reward_vex_tradeable;
        public int cooldown_seconds;
        public string difficulty;
        public string mission_group;
    }

    [Serializable]
    public sealed class WalletRecord
    {
        public decimal vex_ingame;
        public decimal vex_tradeable;
        public decimal reserved_ingame;
        public decimal reserved_tradeable;
    }

    [Serializable]
    public sealed class EconomyStatsRecord
    {
        public bool ok;
        public int entry_count;
        public decimal total_credited;
        public decimal total_debited;
        public decimal net_ingame;
        public decimal net_tradeable;
        public decimal largest_credit;
        public EconomyEntryTypeStats[] by_type;
    }

    [Serializable]
    public sealed class EconomyEntryTypeStats
    {
        public string entry_type;
        public string currency;
        public int count;
        public decimal total_amount;
    }

    [Serializable]
    public sealed class MarketCardProjection
    {
        public string name;
        public string rarity;
        public string image_url;
    }

    [Serializable]
    public sealed class MarketPlayerCardProjection
    {
        public string card_id;
        public MarketCardProjection cards;
    }

    [Serializable]
    public sealed class MarketListingRecord
    {
        public string id;
        public string player_id;
        public string player_card_id;
        public decimal price;
        public decimal fee;
        public string status;
        public bool locked;
        public MarketPlayerCardProjection player_cards;
    }

    [Serializable]
    public sealed class TreasuryWalletRecord
    {
        public string chain;
        public string token_symbol;
        public string wallet_address;
        public string token_standard;
    }

    [Serializable]
    public sealed class EconomyDepositRecord
    {
        public string id;
        public decimal amount_usdt;
        public decimal vex_credited;
        public string chain;
        public string token_symbol;
        public string tx_hash;
        public string status;
        public string created_at;
    }

    [Serializable]
    public sealed class WithdrawalRequestRecord
    {
        public string id;
        public string player_id;
        public decimal tradeable_amount;
        public decimal usdt_gross;
        public decimal fee_usdt;
        public decimal usdt_net;
        public string status;
        public string rejected_reason;
        public string payout_tx_hash;
        public string created_at;
        public string processed_at;
    }

    [Serializable]
    public sealed class EconomyActionResult
    {
        public bool ok;
        public string reason;
        public string status;
        public string listing_id;
        public string deposit_id;
        public string request_id;
        public decimal price;
        public decimal fee;
        public decimal tradeable_amount;
        public decimal usdt_gross;
        public decimal fee_usdt;
        public decimal usdt_net;
    }

    [Serializable]
    public sealed class PackRecord
    {
        public string pack_key;
        public string pack_name;
        public float price_vex;
        public float price_usdt;
        public int card_count;
        public string notes;
    }

    [Serializable]
    public sealed class PackPurchaseResult
    {
        public bool ok;
        public string order_id;
        public string pack_key;
        public float vex_spent;
        public float balance_after;
        public string reason;
    }

    [Serializable]
    public sealed class PackOrderRecord
    {
        public string id;
        public string pack_key;
        public string status;
        public string created_at;
    }

    [Serializable]
    public sealed class PackOpenResult
    {
        public bool ok;
        public OpenedCard[] cards;
        public string pack_key;
        public int card_count;
        public string reason;
    }

    [Serializable]
    public sealed class OpenedCard
    {
        public string id;
        public string card_id;
        public string code;
        public string name;
        public string rarity;
        public string faction;
        public int power;
        public string image_url;
    }

    [Serializable]
    public sealed class WorldBossRecord
    {
        public string id;
        public string boss_code;
        public string name;
        public string region_id;
        public int tier;
        public int power_level;
        public int hp;
        public bool active;
        public string image_url;
    }

    [Serializable]
    public sealed class BattleResult
    {
        public bool ok;
        public string status;
        public string match_id;
        public string winner_id;
        public bool you_won;
        public int total_turns;
        public BattleEvent[] events;
        public string engine;
        public BattleTurn[] turns;
        public BattleUnitState[] final_units;
        public string error;
    }

    [Serializable]
    public sealed class BattleTurn
    {
        public int turn;
        public string actor;
        public string action;
        public string target;
        public int amount;
    }

    [Serializable]
    public sealed class BattleUnitState
    {
        public string id;
        public int hp;
        public int max_hp;
        public string status;
    }

    [Serializable]
    public sealed class FormationSnapshot
    {
        public string champion_id;
        public string vanguard_id;
        public string sentinel_id;
        public string[] reserve_ids;
    }

    [Serializable]
    public sealed class FormationWriteResult
    {
        public bool ok;
        public string error;
    }

    [Serializable]
    public sealed class BattleEvent
    {
        public string event_type;
        public string actor_id;
        public string target_id;
        public int amount;
        public int round;
        public string payload;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatResponse
    {
        public bool ok;
        public bool idempotent;
        public bool is_my_turn;
        public bool rewards_granted;
        public string error;
        public string session_id;
        public string mode;
        public string ruleset_version;
        public string profile;
        public string status;
        public string phase;
        public string current_actor_side;
        public string you_are_side;
        public string winner_side;
        public int round;
        public int turn_index;
        public long event_seq;
        public string state_hash;
        public VexforgeTurnCombatBoard board;
        public VexforgeTurnCombatAction[] legal_actions;
        public VexforgeTurnCombatEvent[] events;
        public VexforgeTurnCombatOutcome outcome;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatBoard
    {
        public VexforgeTurnCombatUnit[] a;
        public VexforgeTurnCombatUnit[] b;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatUnit
    {
        public string unit_id;
        public string card_id;
        public int slot_number;
        public string side;
        public string name;
        public string faction;
        public string rarity;
        public string image_url;
        public string slot;
        public bool is_champion;
        public bool in_reserve;
        public bool alive;
        public bool hidden;
        public bool guard;
        public bool lifesteal;
        public bool shielded;
        public int hp;
        public int max_hp;
        public int atk;
        public int def;
        public int spd;
        public int power;
        public string[] keywords;
        public VexforgeTurnCombatStatBreakdown stat_breakdown;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatStatBreakdown
    {
        public VexforgeTurnCombatBaseStats base_stats;
        public VexforgeTurnCombatFormationStats formation;
        public VexforgeTurnCombatEffectStats effects;
        public VexforgeTurnCombatEffectiveStats effective;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatBaseStats
    {
        public int hp;
        public int atk;
        public int def;
        public int spd;
        public int power;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatFormationStats
    {
        public int reserve_count;
        public int reserve_hp;
        public int reserve_atk;
        public int reserve_def;
        public int same_faction_percent;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatEffectStats
    {
        public int guard_def;
        public int surge_speed;
        public bool guard_active;
        public bool drain;
        public bool veil;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatEffectiveStats
    {
        public int hp;
        public int max_hp;
        public int atk;
        public int def;
        public int spd;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatAction
    {
        public string action_id;
        public string kind;
        public string unit_id;
        public string target_id;
        public string source_unit_id;
        public string target_unit_id;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatEvent
    {
        public long event_seq;
        public string actor_side;
        public string event_type;
        public string state_hash;
        public VexforgeTurnCombatEventPayload event_payload;
        public VexforgeTurnCombatEventState state;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatEventPayload
    {
        public string kind;
        public string attacker_id;
        public string target_id;
        public string deployed_unit_id;
        public string replaced_unit_id;
        public string reserve_activated;
        public string response;
        public string response_side;
        public string completion_reason;
        public string winner_side;
        public string slot;
        public int damage;
        public int healing;
        public int round;
        public int active_hp_a;
        public int active_hp_b;
        public bool critical;
        public bool shield_blocked;
        public bool target_defeated;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatEventState
    {
        public string status;
        public string phase;
        public int round;
        public int turn_index;
        public string current_actor_side;
        public string winner_side;
        public VexforgeTurnCombatBoard board;
    }

    [Serializable]
    public sealed class VexforgeTurnCombatOutcome
    {
        public string winner_side;
        public string completion_reason;
        public bool rewards_granted;
    }

    [Serializable]
    public sealed class ApiError
    {
        public string message;
        public string error;
        public string hint;
        public string details;
    }
}