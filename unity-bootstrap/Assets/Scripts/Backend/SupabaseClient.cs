using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine.Networking;
using Vexforge.Core;

namespace Vexforge.Backend
{
    public sealed class SupabaseResponse
    {
        public bool Ok;
        public long StatusCode;
        public string Body;
        public string Error;
    }

    public sealed class SupabaseClient
    {
        private readonly RuntimeEnvironmentData environment;
        private string accessToken;

        public SupabaseClient(RuntimeEnvironmentData environment)
        {
            this.environment = environment;
        }

        public string AccessToken
        {
            get { return accessToken; }
            set { accessToken = value; }
        }

        public async Task<SupabaseResponse> GetAsync(string path, bool authenticated = true)
        {
            var request = UnityWebRequest.Get(environment.supabaseUrl.TrimEnd('/') + "/" + path.TrimStart('/'));
            return await SendAsync(request, authenticated);
        }

        public async Task<SupabaseResponse> PostAsync(string path, string json, bool authenticated = true)
        {
            var request = new UnityWebRequest(environment.supabaseUrl.TrimEnd('/') + "/" + path.TrimStart('/'), "POST");
            request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json ?? "{}"));
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            return await SendAsync(request, authenticated);
        }

        public async Task<SupabaseResponse> RpcAsync(string functionName, string json, bool authenticated = true)
        {
            return await PostAsync("rest/v1/rpc/" + functionName, json, authenticated);
        }

        private async Task<SupabaseResponse> SendAsync(UnityWebRequest request, bool authenticated)
        {
            request.timeout = 15;
            request.SetRequestHeader("apikey", environment.supabaseAnonKey);
            if (authenticated && !string.IsNullOrWhiteSpace(accessToken))
            {
                request.SetRequestHeader("Authorization", "Bearer " + accessToken);
            }

            var completed = await UnityWebRequestAsync.Send(request);
            var body = completed.downloadHandler == null ? string.Empty : completed.downloadHandler.text;
            var error = completed.result == UnityWebRequest.Result.Success ? string.Empty : completed.error;
            var response = new SupabaseResponse
            {
                Ok = completed.result == UnityWebRequest.Result.Success,
                StatusCode = completed.responseCode,
                Body = body,
                Error = error
            };
            completed.Dispose();
            return response;
        }

        public static string Quote(string value)
        {
            return "\"" + (value ?? string.Empty).Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
        }
    }
}