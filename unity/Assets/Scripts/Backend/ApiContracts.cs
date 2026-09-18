using System;

namespace Vexforge.Backend
{
    [Serializable]
    public sealed class AuthResponse
    {
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
    public sealed class ApiError
    {
        public string message;
        public string error;
        public string hint;
        public string details;
    }
}