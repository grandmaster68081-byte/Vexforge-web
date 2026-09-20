using System;
using System.Threading.Tasks;

namespace Vexforge.Backend
{
    [Serializable]
    public sealed class SocialActionResult
    {
        public bool ok;
        public string reason;
        public string state;
        public string request_id;
        public string conversation_id;
        public string message_id;
        public string clan_id;
    }

    [Serializable]
    public sealed class SocialFriend
    {
        public string id;
        public string display_name;
        public string role;
        public bool is_online;
        public string last_seen_at;
    }

    [Serializable]
    public sealed class SocialFriendRequest
    {
        public string id;
        public string player_id;
        public string display_name;
        public string created_at;
    }

    [Serializable]
    public sealed class SocialSearchPlayer
    {
        public string id;
        public string display_name;
        public string role;
        public string friend_state;
        public string request_id;
        public bool is_online;
    }

    [Serializable]
    public sealed class SocialFriendData
    {
        public bool ok;
        public string reason;
        public SocialFriend[] friends;
        public SocialFriendRequest[] incoming_requests;
        public SocialFriendRequest[] outgoing_requests;
    }

    [Serializable]
    public sealed class SocialSearchData
    {
        public bool ok;
        public string reason;
        public SocialSearchPlayer[] players;
    }

    [Serializable]
    public sealed class SocialConversation
    {
        public string conversation_id;
        public string other_player_id;
        public string other_display_name;
        public string last_message;
        public string last_message_at;
        public int unread_count;
    }

    [Serializable]
    public sealed class SocialConversationData
    {
        public bool ok;
        public string reason;
        public SocialConversation[] conversations;
    }

    [Serializable]
    public sealed class SocialMessage
    {
        public string id;
        public string sender_player_id;
        public string sender_display_name;
        public string body;
        public string created_at;
        public bool is_mine;
    }

    [Serializable]
    public sealed class SocialMessageData
    {
        public bool ok;
        public string reason;
        public SocialMessage[] messages;
    }

    [Serializable]
    public sealed class SocialClanMember
    {
        public string player_id;
        public string display_name;
        public string role;
        public int contribution_accumulated;
    }

    [Serializable]
    public sealed class SocialClanWar
    {
        public string id;
        public string reference_id;
        public string status;
        public string clan_a_id;
        public string clan_b_id;
        public string clan_a_name;
        public string clan_b_name;
        public string created_at;
        public string resolved_at;
    }

    [Serializable]
    public sealed class SocialClan
    {
        public string id;
        public string code;
        public string name;
        public int prestige;
        public string role;
        public int member_count;
        public SocialClanMember[] members;
        public SocialClanWar[] active_wars;
    }

    [Serializable]
    public sealed class SocialClanDiscovery
    {
        public string id;
        public string code;
        public string name;
        public int prestige;
        public int member_count;
    }

    [Serializable]
    public sealed class SocialClanData
    {
        public bool ok;
        public string reason;
        public bool has_clan;
        public SocialClan clan;
        public SocialClanDiscovery[] available_clans;
    }

    /// <summary>
    /// Social data gateway. All authoritative social operations remain server-side RPCs.
    /// Unity only renders the result and sends explicit user intent.
    /// </summary>
    public sealed class VexforgeSocialRepository
    {
        private readonly SupabaseClient client;

        public VexforgeSocialRepository(SupabaseClient client)
        {
            this.client = client;
        }

        public Task<SocialFriendData> GetFriendDataAsync()
        {
            return Call<SocialFriendData>("social_list_friend_data", "{}");
        }

        public Task<SocialSearchData> SearchPlayersAsync(string query, int limit = 20)
        {
            return Call<SocialSearchData>(
                "social_search_players",
                "{\"p_query\":" + SupabaseClient.Quote(query ?? string.Empty) + ",\"p_limit\":" + limit + "}");
        }

        public Task<SocialActionResult> SendFriendRequestAsync(string playerId)
        {
            return Call<SocialActionResult>(
                "social_send_friend_request",
                "{\"p_target_player_id\":" + SupabaseClient.Quote(playerId) + "}");
        }

        public Task<SocialActionResult> RespondFriendRequestAsync(string requestId, bool accept)
        {
            return Call<SocialActionResult>(
                "social_respond_friend_request",
                "{\"p_request_id\":" + SupabaseClient.Quote(requestId) + ",\"p_accept\":" + (accept ? "true" : "false") + "}");
        }

        public Task<SocialActionResult> CancelFriendRequestAsync(string requestId)
        {
            return Call<SocialActionResult>(
                "social_cancel_friend_request",
                "{\"p_request_id\":" + SupabaseClient.Quote(requestId) + "}");
        }

        public Task<SocialActionResult> RemoveFriendAsync(string playerId)
        {
            return Call<SocialActionResult>(
                "social_remove_friend",
                "{\"p_friend_player_id\":" + SupabaseClient.Quote(playerId) + "}");
        }

        public Task<SocialActionResult> BlockPlayerAsync(string playerId)
        {
            return Call<SocialActionResult>(
                "social_block_player",
                "{\"p_target_player_id\":" + SupabaseClient.Quote(playerId) + "}");
        }

        public Task<SocialActionResult> UnblockPlayerAsync(string playerId)
        {
            return Call<SocialActionResult>(
                "social_unblock_player",
                "{\"p_target_player_id\":" + SupabaseClient.Quote(playerId) + "}");
        }

        public Task<SocialConversationData> GetConversationsAsync()
        {
            return Call<SocialConversationData>("social_list_private_conversations", "{}");
        }

        public Task<SocialActionResult> GetOrCreateConversationAsync(string friendPlayerId)
        {
            return Call<SocialActionResult>(
                "social_get_or_create_private_conversation",
                "{\"p_friend_player_id\":" + SupabaseClient.Quote(friendPlayerId) + "}");
        }

        public Task<SocialMessageData> GetPrivateMessagesAsync(string conversationId, int limit = 60)
        {
            return Call<SocialMessageData>(
                "social_list_private_messages",
                "{\"p_conversation_id\":" + SupabaseClient.Quote(conversationId) + ",\"p_limit\":" + limit + "}");
        }

        public Task<SocialActionResult> MarkPrivateReadAsync(string conversationId)
        {
            return Call<SocialActionResult>(
                "social_mark_private_read",
                "{\"p_conversation_id\":" + SupabaseClient.Quote(conversationId) + "}");
        }

        public Task<SocialActionResult> SendPrivateMessageAsync(string conversationId, string body)
        {
            return Call<SocialActionResult>(
                "social_send_private_message",
                "{\"p_conversation_id\":" + SupabaseClient.Quote(conversationId) + ",\"p_body\":" + SupabaseClient.Quote(body) + "}");
        }

        public Task<SocialMessageData> GetGlobalMessagesAsync(int limit = 50)
        {
            return Call<SocialMessageData>(
                "social_list_global_messages",
                "{\"p_limit\":" + limit + "}");
        }

        public Task<SocialActionResult> SendGlobalMessageAsync(string body)
        {
            return Call<SocialActionResult>(
                "social_send_global_message",
                "{\"p_body\":" + SupabaseClient.Quote(body) + "}");
        }

        public Task<SocialClanData> GetMyClanAsync()
        {
            return Call<SocialClanData>("social_get_clan_hall", "{}");
        }

        public Task<SocialActionResult> CreateClanAsync(string name, string description)
        {
            return Call<SocialActionResult>(
                "social_create_clan",
                "{\"p_name\":" + SupabaseClient.Quote(name) + ",\"p_description\":" + SupabaseClient.Quote(description) + "}");
        }

        public Task<SocialActionResult> JoinClanAsync(string clanId)
        {
            return Call<SocialActionResult>(
                "social_join_clan",
                "{\"p_clan_id\":" + SupabaseClient.Quote(clanId) + "}");
        }

        public Task<SocialActionResult> LeaveClanAsync()
        {
            return Call<SocialActionResult>("social_leave_clan", "{}");
        }

        public Task<SocialMessageData> GetClanMessagesAsync(int limit = 50)
        {
            return Call<SocialMessageData>(
                "social_list_clan_messages",
                "{\"p_limit\":" + limit + "}");
        }

        public Task<SocialActionResult> SendClanMessageAsync(string body)
        {
            return Call<SocialActionResult>(
                "social_send_clan_message",
                "{\"p_body\":" + SupabaseClient.Quote(body) + "}");
        }

        public Task<SocialActionResult> TouchPresenceAsync()
        {
            return Call<SocialActionResult>("social_touch_presence", "{}");
        }

        public Task<SocialActionResult> ReportMessageAsync(string scope, string messageId, string reason)
        {
            return Call<SocialActionResult>(
                "social_report_message",
                "{\"p_scope\":" + SupabaseClient.Quote(scope) + ",\"p_message_id\":" + SupabaseClient.Quote(messageId) + ",\"p_reason\":" + SupabaseClient.Quote(reason) + "}");
        }

        private async Task<T> Call<T>(string functionName, string json) where T : class
        {
            if (client == null) return null;
            var response = await client.RpcAsync(functionName, json);
            if (response == null || !response.Ok || string.IsNullOrWhiteSpace(response.Body))
                return null;
            try
            {
                return UnityEngine.JsonUtility.FromJson<T>(response.Body);
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
