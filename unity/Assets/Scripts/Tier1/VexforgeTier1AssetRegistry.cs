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
        public string schema_version;
        public VexforgeTier1AssetEntry[] assets;
        public VexforgeTier1CardArtSource official_card_art_source;
    }

    [Serializable]
    public sealed class VexforgeTier1CardArtSource
    {
        public int known_count;
        public bool local_card_art_copy_forbidden;
        public bool replacement_artwork_for_official_127;
    }

    public sealed class VexforgeTier1AssetRegistry
    {
        private readonly Dictionary<string, VexforgeTier1AssetEntry> entries = new Dictionary<string, VexforgeTier1AssetEntry>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, Texture2D> textures = new Dictionary<string, Texture2D>(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<string> warnings = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private readonly List<string> validationErrors = new List<string>();
        private bool initialized;

        public bool IsManifestValid { get; private set; }
        public bool HasCriticalAssetFailures { get; private set; }
        public IReadOnlyList<string> ValidationErrors { get { return validationErrors.AsReadOnly(); } }

        public void Initialize()
        {
            if (initialized) return;
            initialized = true;
            IsManifestValid = false;

            var manifest = Resources.Load<TextAsset>("VexforgeTier1/VexforgeTier1AssetManifest");
            if (manifest == null)
            {
                AddValidationError("VEXFORGE Tier1 asset manifest is missing from Resources.");
                return;
            }

            try
            {
                var parsed = JsonUtility.FromJson<VexforgeTier1AssetManifest>(manifest.text);
                if (parsed == null)
                {
                    AddValidationError("VEXFORGE Tier1 asset manifest could not be parsed.");
                    return;
                }

                if (!string.Equals(parsed.schema_version, "3.0", StringComparison.Ordinal))
                    AddValidationError("Unsupported VEXFORGE Tier1 asset manifest schema: " + parsed.schema_version);

                if (parsed.assets == null || parsed.assets.Length == 0)
                {
                    AddValidationError("VEXFORGE Tier1 asset manifest contains no usable asset entries.");
                    return;
                }

                foreach (var entry in parsed.assets)
                {
                    if (entry == null ||
                        string.IsNullOrWhiteSpace(entry.asset_id) ||
                        string.IsNullOrWhiteSpace(entry.domain) ||
                        string.IsNullOrWhiteSpace(entry.resources_key))
                    {
                        AddValidationError("VEXFORGE Tier1 asset manifest contains an entry with a missing ID, domain, or Resources key.");
                        continue;
                    }

                    if (entries.ContainsKey(entry.asset_id))
                    {
                        AddValidationError("VEXFORGE Tier1 asset manifest contains a duplicate asset ID: " + entry.asset_id);
                        continue;
                    }

                    entries.Add(entry.asset_id, entry);
                }

                ValidateFallbacks();
                IsManifestValid = validationErrors.Count == 0;
            }
            catch (Exception ex)
            {
                AddValidationError("VEXFORGE Tier1 asset manifest parse failed: " + ex.GetType().Name);
                IsManifestValid = false;
            }
        }

        public Texture2D LoadTexture(string assetId, string fallbackAssetId = null)
        {
            Initialize();

            if (!IsManifestValid)
            {
                WarnOnce("manifest_invalid", "VEXFORGE Tier1 texture load blocked because the asset manifest is invalid.", true);
                return null;
            }

            VexforgeTier1AssetEntry entry;
            if (string.IsNullOrWhiteSpace(assetId) || !entries.TryGetValue(assetId, out entry))
            {
                WarnOnce("unregistered:" + assetId, "VEXFORGE Tier1 texture is not registered: " + assetId, true);
                return null;
            }

            var direct = TryLoadTexture(entry.resources_key);
            if (direct != null) return direct;

            if (entry.identity_critical)
            {
                HasCriticalAssetFailures = true;
                WarnOnce(
                    "critical_texture:" + assetId,
                    "VEXFORGE critical local texture is missing or not loadable: asset_id=" + assetId +
                    " resources_key=" + entry.resources_key,
                    true);
                return null;
            }

            var requestedFallbackId = !string.IsNullOrWhiteSpace(fallbackAssetId)
                ? fallbackAssetId
                : entry.fallback_id;
            if (string.IsNullOrWhiteSpace(requestedFallbackId)) return null;

            VexforgeTier1AssetEntry fallback;
            if (!entries.TryGetValue(requestedFallbackId, out fallback) ||
                fallback.identity_critical ||
                !string.Equals(entry.domain, fallback.domain, StringComparison.OrdinalIgnoreCase))
            {
                WarnOnce(
                    "fallback_rejected:" + assetId + ":" + requestedFallbackId,
                    "VEXFORGE Tier1 refused an invalid or cross-domain texture fallback: asset_id=" +
                    assetId + " fallback_id=" + requestedFallbackId,
                    true);
                return null;
            }

            var fallbackTexture = TryLoadTexture(fallback.resources_key);
            if (fallbackTexture == null)
            {
                WarnOnce(
                    "fallback_missing:" + assetId + ":" + requestedFallbackId,
                    "VEXFORGE Tier1 optional same-domain fallback is unavailable: asset_id=" +
                    assetId + " fallback_id=" + requestedFallbackId,
                    false);
            }

            return fallbackTexture;
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

        private void ValidateFallbacks()
        {
            foreach (var entry in entries.Values)
            {
                if (string.IsNullOrWhiteSpace(entry.fallback_id)) continue;

                VexforgeTier1AssetEntry fallback;
                if (!entries.TryGetValue(entry.fallback_id, out fallback))
                {
                    AddValidationError("VEXFORGE Tier1 fallback is not registered: asset_id=" + entry.asset_id);
                    continue;
                }

                if (entry.identity_critical ||
                    fallback.identity_critical ||
                    !string.Equals(entry.domain, fallback.domain, StringComparison.OrdinalIgnoreCase))
                {
                    AddValidationError(
                        "VEXFORGE Tier1 fallback crosses a critical or domain boundary: asset_id=" +
                        entry.asset_id + " fallback_id=" + entry.fallback_id);
                }
            }
        }

        private void AddValidationError(string message)
        {
            validationErrors.Add(message);
            Debug.LogError(message);
        }

        private void WarnOnce(string key, string message, bool isError)
        {
            if (!warnings.Add(key)) return;
            if (isError) Debug.LogError(message);
            else Debug.LogWarning(message);
        }
    }
}
