using UnityEngine;

namespace Vexforge.Core
{
    [System.Serializable]
    public sealed class RuntimeEnvironmentData
    {
        public string supabaseUrl;
        public string supabaseAnonKey;
        public string rulesVersion;
        public string environmentName;
        public bool allowNetwork = true;
    }

    public static class RuntimeEnvironment
    {
        private static RuntimeEnvironmentData cached;

        public static RuntimeEnvironmentData Current
        {
            get
            {
                if (cached == null)
                {
                    var asset = Resources.Load<TextAsset>("VexforgeEnvironment");
                    cached = asset == null
                        ? new RuntimeEnvironmentData { environmentName = "unconfigured", allowNetwork = false }
                        : JsonUtility.FromJson<RuntimeEnvironmentData>(asset.text);
                    if (cached == null)
                    {
                        cached = new RuntimeEnvironmentData { environmentName = "invalid", allowNetwork = false };
                    }
                }

                return cached;
            }
        }

        public static bool IsConfigured
        {
            get
            {
                var data = Current;
                return data.allowNetwork &&
                       !string.IsNullOrWhiteSpace(data.supabaseUrl) &&
                       !string.IsNullOrWhiteSpace(data.supabaseAnonKey);
            }
        }
    }
}