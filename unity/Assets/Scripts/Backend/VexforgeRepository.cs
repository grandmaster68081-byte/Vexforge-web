using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Vexforge.Backend
{
    public sealed class VexforgeRepository
    {
        private readonly SupabaseClient client;

        public VexforgeRepository(SupabaseClient client)
        {
            this.client = client;
        }

        public async Task<string> GetCurrentPlayerIdAsync(string authUserId)
        {
            var response = await client.GetAsync("rest/v1/players?select=id&auth_user_id=eq." + Uri.EscapeDataString(authUserId) + "&limit=1");
            var players = Array<PlayerIdRecord>(response);
            return players.Length > 0 ? players[0].id : null;
        }

        public async Task<PlayerProfile> GetPlayerProfileAsync(string authUserId)
        {
            var response = await client.GetAsync("rest/v1/players?select=id,display_name,email,role,status,created_at,is_admin,is_super_admin&auth_user_id=eq." + Uri.EscapeDataString(authUserId) + "&limit=1");
            return First<PlayerProfile>(response);
        }

        public async Task<PlayerProgress> GetPlayerProgressAsync(string playerId)
        {
            var response = await client.GetAsync("rest/v1/player_progress?select=level,xp,xp_to_next,energy,max_energy,tutorial_step,starter_region&player_id=eq." + Uri.EscapeDataString(playerId) + "&limit=1");
            return First<PlayerProgress>(response);
        }

        public async Task<CardRecord[]> GetCatalogAsync()
        {
            var response = await client.GetAsync("rest/v1/cards?select=id,code,name,faction,rarity,specialization,power,affinity,prestige,charge,lore,image_url,card_tier,card_domain,marketable,fusion_enabled&active=eq.true&order=name.asc&limit=1000");
            return Array<CardRecord>(response);
        }

        public async Task<PlayerCardRecord[]> GetCollectionAsync(string playerId)
        {
            var response = await client.GetAsync("rest/v1/player_cards?select=id,card_id,quantity,locked,listed&player_id=eq." + Uri.EscapeDataString(playerId));
            var rows = Array<PlayerCardRecord>(response);
            var catalog = await GetCatalogAsync();
            for (var i = 0; i < rows.Length; i++)
            {
                rows[i].card = FindCard(catalog, rows[i].card_id);
            }
            return rows;
        }

        public async Task<DeckSlot[]> GetDeckAsync(string playerId)
        {
            var response = await client.GetAsync("rest/v1/player_deck?select=slot_number,card_id,is_champion&player_id=eq." + Uri.EscapeDataString(playerId) + "&order=slot_number.asc");
            var rows = Array<DeckSlot>(response);
            var catalog = await GetCatalogAsync();
            for (var i = 0; i < rows.Length; i++)
            {
                var card = FindCard(catalog, rows[i].card_id);
                if (card == null) continue;
                rows[i].code = card.code;
                rows[i].name = card.name;
                rows[i].rarity = card.rarity;
                rows[i].faction = card.faction;
                rows[i].power = card.power;
                rows[i].image_url = card.image_url;
            }
            return rows;
        }

        public async Task<DeckValidation> ValidateDeckAsync(string[] cardIds)
        {
            var response = await client.RpcAsync("validate_deck", "{\"p_card_ids\":" + JsonArray(cardIds) + "}");
            return Json<DeckValidation>(response);
        }

        public async Task<SaveDeckResult> SaveDeckAsync(string[] cardIds)
        {
            var response = await client.RpcAsync("save_deck", "{\"p_card_ids\":" + JsonArray(cardIds) + "}");
            return Json<SaveDeckResult>(response);
        }

        public async Task<BattleResult> ResolveBattleAsync(string challengerId, string opponentId, string idempotencyKey)
        {
            var json = "{\"p_challenger_id\":" + SupabaseClient.Quote(challengerId) +
                       ",\"p_opponent_id\":" + SupabaseClient.Quote(opponentId) +
                       ",\"p_idempotency_key\":" + SupabaseClient.Quote(idempotencyKey) + "}";
            var response = await client.RpcAsync("vexforge_battle_resolve", json);
            return Json<BattleResult>(response);
        }

        public async Task<FormationWriteResult> StoreFormationAsync(string matchId, FormationSnapshot formation)
        {
            var json = "{\"p_match_id\":" + SupabaseClient.Quote(matchId) +
                       ",\"p_formation\":" + JsonUtility.ToJson(formation) + "}";
            var response = await client.RpcAsync("vexforge_pvp_store_formation", json);
            return Json<FormationWriteResult>(response);
        }

        public async Task<FormationWriteResult> ForfeitBattleAsync(string opponentId, string idempotencyKey)
        {
            var json = "{\"p_opponent_id\":" + SupabaseClient.Quote(opponentId) +
                       ",\"p_idempotency_key\":" + SupabaseClient.Quote(idempotencyKey) + "}";
            var response = await client.RpcAsync("vexforge_pvp_forfeit", json);
            return Json<FormationWriteResult>(response);
        }

        public async Task<MissionRecord[]> GetMissionsAsync()
        {
            var response = await client.GetAsync("rest/v1/missions?select=id,code,name,mission_type,energy_cost,reward_xp,reward_vex_ingame,reward_vex_tradeable,cooldown_seconds,difficulty,mission_group&active=eq.true&system_locked=eq.false&production_ready=eq.true&order=mission_order.asc");
            return Array<MissionRecord>(response);
        }

        public async Task<WalletRecord> GetWalletAsync(string playerId)
        {
            var response = await client.GetAsync("rest/v1/player_wallet?select=vex_ingame,vex_tradeable,reserved_ingame,reserved_tradeable&player_id=eq." + Uri.EscapeDataString(playerId) + "&limit=1");
            return First<WalletRecord>(response);
        }

        private static CardRecord FindCard(CardRecord[] catalog, string id)
        {
            if (catalog == null) return null;
            for (var i = 0; i < catalog.Length; i++)
            {
                if (catalog[i] != null && catalog[i].id == id) return catalog[i];
            }
            return null;
        }

        private static string JsonArray(string[] values)
        {
            if (values == null || values.Length == 0) return "[]";
            var result = "[";
            for (var i = 0; i < values.Length; i++)
            {
                if (i > 0) result += ",";
                result += SupabaseClient.Quote(values[i]);
            }
            return result + "]";
        }

        private static T Json<T>(SupabaseResponse response) where T : class
        {
            if (response == null || !response.Ok || string.IsNullOrWhiteSpace(response.Body)) return null;
            return JsonUtility.FromJson<T>(response.Body);
        }

        private static T First<T>(SupabaseResponse response) where T : class
        {
            var items = Array<T>(response);
            return items.Length > 0 ? items[0] : null;
        }

        private static T[] Array<T>(SupabaseResponse response) where T : class
        {
            if (response == null || !response.Ok) return new T[0];
            return JsonArrayUtility.FromJson<T>(response.Body);
        }

        [Serializable]
        private sealed class PlayerIdRecord
        {
            public string id;
        }
    }
}