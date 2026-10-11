using System;
using System.Collections.Generic;
using UnityEngine;

namespace Vexforge.Tier1
{
    [Serializable]
    public sealed class VexforgeTier1AssetEntry
    {
        public string asset_id;
        public string domain;
        public string resources_key;
        public string fallback_id;
        public string quality;
        public bool identity_critical;
    }

    [Serializable]
    public sealed class VexforgeTier1AssetManifest
    {
        public string manifest_version;
        public VexforgeTier1AssetEntry[] assets;
    }

    public sealed class VexforgeTier1AssetRegistry
    {
        private readonly Dictionary<string, VexforgeTier1AssetEntry> entries = new Dictionary<string, VexforgeTier1AssetEntry>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, Texture2D> textures = new Dictionary<string, Texture2D>(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<string> warnings = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private bool initialized;

        public void Initialize()
        {
            if (initialized) return;
            initialized = true;
            var manifest = Resources.Load<TextAsset>("VexforgeTier1/VexforgeTier1AssetManifest");
            if (manifest == null)
            {
                WarnOnce("manifest", "VEXFORGE Tier1 asset manifest is missing from Resources.");
                return;
            }
            try
            {
                var parsed = JsonUtility.FromJson<VexforgeTier1AssetManifest>(manifest.text);
                if (parsed == null || parsed.assets == null)
                {
                    WarnOnce("manifest_parse", "VEXFORGE Tier1 asset manifest contains no usable asset entries.");
                    return;
                }
                foreach (var entry in parsed.assets)
                {
                    if (entry == null || string.IsNullOrWhiteSpace(entry.asset_id)) continue;
                    entries[entry.asset_id] = entry;
                }
            }
            catch (Exception ex)
            {
                WarnOnce("manifest_exception", "VEXFORGE Tier1 asset manifest parse failed: " + ex.Message);
            }
        }

        public Texture2D LoadTexture(string assetId, string fallbackAssetId = null)
        {
            Initialize();
            var entry = Get(assetId);
            var direct = TryLoadTexture(entry == null ? null : entry.resources_key);
            if (direct != null) return direct;
            WarnOnce("texture:" + assetId, "VEXFORGE Tier1 texture is missing or unregistered: " + assetId);
            var explicitFallback = Get(fallbackAssetId);
            var fallbackTexture = TryLoadTexture(explicitFallback == null ? null : explicitFallback.resources_key);
            if (fallbackTexture != null) return fallbackTexture;
            if (entry != null && !string.IsNullOrWhiteSpace(entry.fallback_id) &&
                !string.Equals(entry.fallback_id, assetId, StringComparison.OrdinalIgnoreCase))
            {
                var manifestFallback = Get(entry.fallback_id);
                fallbackTexture = TryLoadTexture(manifestFallback == null ? null : manifestFallback.resources_key);
                if (fallbackTexture != null) return fallbackTexture;
            }
            return null;
        }

        public VexforgeTier1AssetEntry Get(string assetId)
        {
            Initialize();
            VexforgeTier1AssetEntry entry;
            return !string.IsNullOrWhiteSpace(assetId) && entries.TryGetValue(assetId, out entry) ? entry : null;
        }

        private Texture2D TryLoadTexture(string key)
        {
            if (string.IsNullOrWhiteSpace(key)) return null;
            Texture2D cached;
            if (textures.TryGetValue(key, out cached) && cached != null) return cached;
            var loaded = Resources.Load<Texture2D>(key);
            if (loaded != null) textures[key] = loaded;
            return loaded;
        }

        private void WarnOnce(string key, string message)
        {
            if (warnings.Add(key)) Debug.LogWarning(message);
        }
    }
}
