using System;

namespace VexForge.Foundation
{
    [Serializable]
    public sealed class VexForgeUser
    {
        public string id;
        public string email;
    }

    [Serializable]
    public sealed class VexForgeSession
    {
        public string access_token;
        public string refresh_token;
        public long expires_at;
        public VexForgeUser user;

        public bool IsUsable
        {
            get
            {
                return !string.IsNullOrWhiteSpace(access_token)
                    && !string.IsNullOrWhiteSpace(refresh_token)
                    && user != null
                    && !string.IsNullOrWhiteSpace(user.id);
            }
        }

        public bool IsExpiredOrNearExpiry()
        {
            if (expires_at <= 0)
            {
                return true;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            return expires_at <= now + 60;
        }
    }

    [Serializable]
    public sealed class VexForgeAuthResponse
    {
        public string access_token;
        public string refresh_token;
        public long expires_at;
        public int expires_in;
        public VexForgeUser user;
        public string error;
        public string error_description;
        public string msg;
        public string message;
    }

    [Serializable]
    public sealed class VexForgePlayer
    {
        public string id;
        public string display_name;
        public string role;
        public string status;
        public string created_at;
    }

    [Serializable]
    public sealed class VexForgeProgress
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
    public sealed class VexForgeCard
    {
        public string id;
        public string code;
        public string name;
        public string faction;
        public string rarity;
        public int power;
        public int affinity;
        public int prestige;
        public int charge;
        public string image_url;
    }

    [Serializable]
    public sealed class VexForgeCardArray
    {
        public VexForgeCard[] items;
    }

    [Serializable]
    public sealed class VexForgePlayerArray
    {
        public VexForgePlayer[] items;
    }

    [Serializable]
    public sealed class VexForgeProgressArray
    {
        public VexForgeProgress[] items;
    }

    [Serializable]
    internal sealed class EnsurePlayerRowRequest
    {
        public string p_email;
        public string p_display_name;
    }
}