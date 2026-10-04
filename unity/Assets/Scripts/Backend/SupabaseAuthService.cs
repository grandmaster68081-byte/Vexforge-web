using System;
using System.Threading.Tasks;
using UnityEngine;
using Vexforge.Core;
using Vexforge.Session;

namespace Vexforge.Backend
{
    public enum AuthRegistrationOutcome
    {
        SignedIn,
        ConfirmationRequired,
        Rejected
    }

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

        public async Task<AuthRegistrationOutcome> SignUpAsync(string email, string password)
        {
            var response = await client.PostAsync(
                "auth/v1/signup",
                "{\"email\":" + SupabaseClient.Quote(email) + ",\"password\":" + SupabaseClient.Quote(password) + "}",
                false);
            if (!response.Ok)
            {
                AppLogger.Warning("Sign-up request failed with status " + response.StatusCode);
                return AuthRegistrationOutcome.Rejected;
            }

            var payload = JsonUtility.FromJson<AuthResponse>(response.Body ?? string.Empty);
            if (payload == null)
            {
                AppLogger.Warning("Sign-up response did not contain an account.");
                return AuthRegistrationOutcome.Rejected;
            }

            var userId = payload.user != null && !string.IsNullOrWhiteSpace(payload.user.id)
                ? payload.user.id
                : !string.IsNullOrWhiteSpace(payload.user_id)
                    ? payload.user_id
                    : payload.id;

            if (!string.IsNullOrWhiteSpace(payload.access_token))
            {
                return ApplyAuthPayload(payload)
                    ? AuthRegistrationOutcome.SignedIn
                    : AuthRegistrationOutcome.Rejected;
            }

            return !string.IsNullOrWhiteSpace(userId)
                ? AuthRegistrationOutcome.ConfirmationRequired
                : AuthRegistrationOutcome.Rejected;
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

        public async Task SignOutAsync()
        {
            Task<SupabaseResponse> logoutTask = null;
            try
            {
                if (Current != null && !string.IsNullOrWhiteSpace(Current.accessToken))
                    logoutTask = client.PostAsync("auth/v1/logout", "{}", true);
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Remote sign-out could not start: " + exception.GetType().Name);
            }

            ClearLocalSession();
            if (logoutTask == null)
                return;

            try
            {
                var response = await logoutTask;
                if (!response.Ok)
                    AppLogger.Warning("Remote sign-out failed with status " + response.StatusCode);
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Remote sign-out failed: " + exception.GetType().Name);
            }
        }

        private bool ApplyAuthResponse(SupabaseResponse response)
        {
            if (!response.Ok)
            {
                AppLogger.Warning("Supabase auth unavailable: " + response.StatusCode);
                return false;
            }

            return ApplyAuthPayload(JsonUtility.FromJson<AuthResponse>(response.Body ?? string.Empty));
        }

        private bool ApplyAuthPayload(AuthResponse payload)
        {
            var userId = payload != null && payload.user != null && !string.IsNullOrWhiteSpace(payload.user.id)
                ? payload.user.id
                : payload != null && !string.IsNullOrWhiteSpace(payload.user_id)
                    ? payload.user_id
                    : payload == null ? null : payload.id;
            if (payload == null ||
                string.IsNullOrWhiteSpace(payload.access_token) ||
                string.IsNullOrWhiteSpace(payload.refresh_token) ||
                string.IsNullOrWhiteSpace(userId))
            {
                AppLogger.Warning("Supabase auth response did not contain a session.");
                return false;
            }

            Current = new SessionSnapshot
            {
                accessToken = payload.access_token,
                refreshToken = payload.refresh_token,
                userId = userId,
                email = payload.user != null && !string.IsNullOrWhiteSpace(payload.user.email)
                    ? payload.user.email
                    : payload.email ?? string.Empty
            };
            client.AccessToken = Current.accessToken;
            sessionStore.Save(Current);
            return true;
        }

        private void ClearLocalSession()
        {
            Current = null;
            client.AccessToken = null;
            sessionStore.Clear();
        }
    }
}