using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace VexForge.Foundation
{
    public sealed class VexForgeSupabaseClient
    {
        public const string SupabaseUrl = "https://rscuzqnfccqvltkdcdny.supabase.co";
        public const string SupabasePublishableKey = "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

        private const int TimeoutSeconds = 15;

        public IEnumerator SignIn(
            string email,
            string password,
            Action<VexForgeSession> success,
            Action<string> failure)
        {
            yield return AuthRequest(
                "token?grant_type=password",
                JsonUtility.ToJson(new PasswordRequest
                {
                    email = email.Trim(),
                    password = password
                }),
                session =>
                {
                    if (!session.IsUsable)
                    {
                        failure?.Invoke("Supabase no devolvió una sesión válida.");
                        return;
                    }

                    success?.Invoke(session);
                },
                failure);
        }

        public IEnumerator SignUp(
            string email,
            string password,
            Action<VexForgeSession> success,
            Action<string> failure)
        {
            yield return AuthRequest(
                "signup",
                JsonUtility.ToJson(new PasswordRequest
                {
                    email = email.Trim(),
                    password = password
                }),
                session =>
                {
                    success?.Invoke(session);
                },
                failure);
        }

        public IEnumerator RefreshSession(
            VexForgeSession oldSession,
            Action<VexForgeSession> success,
            Action<string> failure)
        {
            if (oldSession == null || string.IsNullOrWhiteSpace(oldSession.refresh_token))
            {
                failure?.Invoke("No existe refresh token.");
                yield break;
            }

            yield return AuthRequest(
                "token?grant_type=refresh_token",
                JsonUtility.ToJson(new RefreshRequest
                {
                    refresh_token = oldSession.refresh_token
                }),
                success,
                failure);
        }

        public IEnumerator EnsurePlayer(
            VexForgeSession session,
            string email,
            Action success,
            Action<string> failure)
        {
            var body = JsonUtility.ToJson(new EnsurePlayerRowRequest
            {
                p_email = email.Trim(),
                p_display_name = email.Trim().Split('@')[0]
            });

            yield return RpcRequest(
                "ensure_player_row",
                body,
                session,
                _ => success?.Invoke(),
                failure);
        }

        public IEnumerator LoadPlayer(
            VexForgeSession session,
            Action<VexForgePlayer> success,
            Action<string> failure)
        {
            var query =
                "/rest/v1/players?select=id%2Cdisplay_name%2Crole%2Cstatus%2Ccreated_at" +
                "&auth_user_id=eq." +
                Uri.EscapeDataString(session.user.id) +
                "&limit=1";

            yield return GetRequest(
                query,
                session,
                text =>
                {
                    var wrapper = JsonUtility.FromJson<VexForgePlayerArray>("{\"items\":" + text + "}");
                    var player = wrapper != null && wrapper.items != null && wrapper.items.Length > 0
                        ? wrapper.items[0]
                        : null;

                    if (player == null)
                    {
                        failure?.Invoke("No se encontró el perfil de jugador.");
                        return;
                    }

                    success?.Invoke(player);
                },
                failure);
        }

        public IEnumerator LoadProgress(
            VexForgeSession session,
            string playerId,
            Action<VexForgeProgress> success,
            Action<string> failure)
        {
            var query =
                "/rest/v1/player_progress?select=level%2Cxp%2Cxp_to_next%2Cenergy%2Cmax_energy%2Ctutorial_step%2Cstarter_region" +
                "&player_id=eq." +
                Uri.EscapeDataString(playerId) +
                "&limit=1";

            yield return GetRequest(
                query,
                session,
                text =>
                {
                    var wrapper = JsonUtility.FromJson<VexForgeProgressArray>("{\"items\":" + text + "}");
                    var progress = wrapper != null && wrapper.items != null && wrapper.items.Length > 0
                        ? wrapper.items[0]
                        : null;

                    success?.Invoke(progress);
                },
                failure);
        }

        public IEnumerator LoadCards(
            Action<VexForgeCard[]> success,
            Action<string> failure)
        {
            const string query =
                "/rest/v1/cards?select=id%2Ccode%2Cname%2Cfaction%2Crarity%2Cpower%2Caffinity%2Cprestige%2Ccharge%2Cimage_url" +
                "&active=eq.true&order=name.asc&limit=1000";

            yield return GetRequest(
                query,
                null,
                text =>
                {
                    var wrapper = JsonUtility.FromJson<VexForgeCardArray>("{\"items\":" + text + "}");
                    success?.Invoke(wrapper?.items ?? Array.Empty<VexForgeCard>());
                },
                failure);
        }

        private IEnumerator AuthRequest(
            string path,
            string body,
            Action<VexForgeSession> success,
            Action<string> failure)
        {
            using (var request = new UnityWebRequest(SupabaseUrl + "/auth/v1/" + path, "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = TimeoutSeconds;

                AddBaseHeaders(request);

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    failure?.Invoke(ParseError(request));
                    yield break;
                }

                try
                {
                    var response = JsonUtility.FromJson<VexForgeAuthResponse>(request.downloadHandler.text);

                    if (string.IsNullOrWhiteSpace(response.access_token)
                        || string.IsNullOrWhiteSpace(response.refresh_token)
                        || response.user == null)
                    {
                        if (!string.IsNullOrWhiteSpace(response.message))
                        {
                            failure?.Invoke(response.message);
                        }
                        else
                        {
                            failure?.Invoke("Supabase no devolvió una sesión válida.");
                        }

                        yield break;
                    }

                    if (response.expires_at <= 0)
                    {
                        response.expires_at = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + Math.Max(60, response.expires_in);
                    }

                    success?.Invoke(new VexForgeSession
                    {
                        access_token = response.access_token,
                        refresh_token = response.refresh_token,
                        expires_at = response.expires_at,
                        user = response.user
                    });
                }
                catch (Exception ex)
                {
                    failure?.Invoke("Respuesta Auth inválida: " + ex.Message);
                }
            }
        }

        private IEnumerator RpcRequest(
            string rpcName,
            string body,
            VexForgeSession session,
            Action<string> success,
            Action<string> failure)
        {
            using (var request = new UnityWebRequest(
                       SupabaseUrl + "/rest/v1/rpc/" + rpcName,
                       "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = TimeoutSeconds;

                AddBaseHeaders(request);

                if (session != null)
                {
                    request.SetRequestHeader("Authorization", "Bearer " + session.access_token);
                }

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    failure?.Invoke(ParseError(request));
                    yield break;
                }

                success?.Invoke(request.downloadHandler.text);
            }
        }

        private IEnumerator GetRequest(
            string path,
            VexForgeSession session,
            Action<string> success,
            Action<string> failure)
        {
            using (var request = UnityWebRequest.Get(SupabaseUrl + path))
            {
                request.timeout = TimeoutSeconds;
                AddBaseHeaders(request);

                if (session != null)
                {
                    request.SetRequestHeader("Authorization", "Bearer " + session.access_token);
                }

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    failure?.Invoke(ParseError(request));
                    yield break;
                }

                success?.Invoke(request.downloadHandler.text);
            }
        }

        private static void AddBaseHeaders(UnityWebRequest request)
        {
            request.SetRequestHeader("apikey", SupabasePublishableKey);
            request.SetRequestHeader("Content-Type", "application/json");
        }

        private static string ParseError(UnityWebRequest request)
        {
            var fallback = "Solicitud a Supabase rechazada (" + request.responseCode + ").";
            var body = request.downloadHandler != null ? request.downloadHandler.text : string.Empty;

            if (string.IsNullOrWhiteSpace(body))
            {
                return fallback;
            }

            try
            {
                var error = JsonUtility.FromJson<VexForgeAuthResponse>(body);

                if (!string.IsNullOrWhiteSpace(error.error_description))
                    return error.error_description;

                if (!string.IsNullOrWhiteSpace(error.message))
                    return error.message;

                if (!string.IsNullOrWhiteSpace(error.msg))
                    return error.msg;

                if (!string.IsNullOrWhiteSpace(error.error))
                    return error.error;
            }
            catch
            {
                // Use raw response below.
            }

            return fallback + " " + body;
        }

        [Serializable]
        private sealed class PasswordRequest
        {
            public string email;
            public string password;
        }

        [Serializable]
        private sealed class RefreshRequest
        {
            public string refresh_token;
        }
    }
}