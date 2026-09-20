using System.Threading.Tasks;
using UnityEngine;
using Vexforge.Core;
using Vexforge.Session;

namespace Vexforge.Backend
{
    public sealed class SessionSnapshot
    {
        public string accessToken;
        public string refreshToken;
        public string userId;
        public string email;
    }

    public sealed class SupabaseAuthService
    {
        private readonly SupabaseClient client;
        private readonly ISessionStore sessionStore;
        public SessionSnapshot Current { get; private set; }

        public SupabaseAuthService(SupabaseClient client, ISessionStore sessionStore)
        {
            this.client = client;
            this.sessionStore = sessionStore;
        }

        public async Task<bool> SignInAsync(string email, string password)
        {
            var response = await client.PostAsync(
                "auth/v1/token?grant_type=password",
                "{\"email\":" + SupabaseClient.Quote(email) + ",\"password\":" + SupabaseClient.Quote(password) + "}",
                false);
            return ApplyAuthResponse(response);
        }

        public async Task<bool> RestoreAsync()
        {
            var persisted = sessionStore.Load();
            if (persisted == null || string.IsNullOrWhiteSpace(persisted.refreshToken))
                return false;

            var restored = await RefreshAsync(persisted.refreshToken);
            if (!restored)
                sessionStore.Clear();
            return restored;
        }

        public async Task<bool> RefreshAsync(string refreshToken)
        {
            var response = await client.PostAsync(
                "auth/v1/token?grant_type=refresh_token",
                "{\"refresh_token\":" + SupabaseClient.Quote(refreshToken) + "}",
                false);
            return ApplyAuthResponse(response);
        }

        public void SignOut()
        {
            Current = null;
            client.AccessToken = null;
            sessionStore.Clear();
        }

        private bool ApplyAuthResponse(SupabaseResponse response)
        {
            if (!response.Ok)
            {
                AppLogger.Warning("Supabase auth unavailable: " + response.StatusCode);
                return false;
            }

            var payload = JsonUtility.FromJson<AuthResponse>(response.Body);
            if (payload == null || string.IsNullOrWhiteSpace(payload.access_token))
            {
                AppLogger.Warning("Supabase auth response did not contain a session.");
                return false;
            }

            Current = new SessionSnapshot
            {
                accessToken = payload.access_token,
                refreshToken = payload.refresh_token,
                userId = payload.user != null ? payload.user.id : payload.user_id,
                email = payload.user != null ? payload.user.email : string.Empty
            };
            client.AccessToken = Current.accessToken;
            sessionStore.Save(Current);
            return true;
        }
    }
}