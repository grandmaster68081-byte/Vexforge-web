#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEditor;
using UnityEditor.Build;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.Presentation;
using Vexforge.Tier1;

namespace Vexforge.Tier1.Editor
{
    public static class VexforgeCardArtCatalogGate
    {
        private const long TextureCacheBudgetBytes = 192L * 1024L * 1024L;
        private const int BatchSize = 2;
        private static bool running;

        [MenuItem("VEXFORGE/Production/Verify Official Card Art Catalog")]
        public static async void Run()
        {
            if (running)
            {
                Debug.LogWarning("VEXFORGE card-art catalog validation is already running.");
                return;
            }

            running = true;
            try
            {
                await RunAsync();
            }
            catch (Exception exception)
            {
                Debug.LogError(
                    "VEXFORGE card-art catalog validation failed unexpectedly: " +
                    exception.GetType().Name);
                EditorUtility.DisplayDialog(
                    "Card-art validation failed",
                    "The Unity card-art validation stopped unexpectedly. See the Editor Console for the failure type.",
                    "Close");
            }
            finally
            {
                EditorUtility.ClearProgressBar();
                running = false;
            }
        }

        private static async Task RunAsync()
        {
            if (!RuntimeEnvironment.IsConfigured)
            {
                Debug.LogError("VEXFORGE card-art catalog validation blocked: Supabase runtime configuration is unavailable.");
                EditorUtility.DisplayDialog(
                    "Card-art validation blocked",
                    "The project's public Supabase runtime configuration is missing or disabled.",
                    "Close");
                return;
            }

            var manifestAsset = Resources.Load<TextAsset>("VexforgeTier1/VexforgeTier1AssetManifest");
            var manifest = manifestAsset == null
                ? null
                : JsonUtility.FromJson<VexforgeTier1AssetManifest>(manifestAsset.text);
            var registry = new VexforgeTier1AssetRegistry();
            registry.Initialize();
            if (manifest == null || !registry.IsManifestValid)
            {
                Debug.LogError("VEXFORGE card-art catalog validation blocked: the Tier1 asset manifest is invalid.");
                EditorUtility.DisplayDialog(
                    "Card-art validation blocked",
                    "Fix the Tier1 asset manifest before validating card artwork.",
                    "Close");
                return;
            }

            if (manifest.official_card_art_source == null ||
                manifest.official_card_art_source.known_count <= 0 ||
                !manifest.official_card_art_source.local_card_art_copy_forbidden ||
                manifest.official_card_art_source.replacement_artwork_for_official_127)
            {
                Debug.LogError("VEXFORGE card-art catalog validation blocked: the official card-art contract is invalid.");
                EditorUtility.DisplayDialog(
                    "Card-art validation blocked",
                    "The manifest must identify the live catalog size and keep official card art remote.",
                    "Close");
                return;
            }

            try
            {
                VexforgeTier1BuildValidator.ValidateVisualAssetsOrThrow();
            }
            catch (BuildFailedException exception)
            {
                Debug.LogError(exception.Message);
                EditorUtility.DisplayDialog(
                    "Card-art validation blocked",
                    "One or more local Unity assets are missing or failed import validation. See the Editor Console.",
                    "Close");
                return;
            }

            var resources = VexforgePresentationResources.LoadRuntime();
            if (resources == null || !resources.IsComplete)
            {
                Debug.LogError("VEXFORGE card-art catalog validation blocked: presentation materials are incomplete.");
                EditorUtility.DisplayDialog(
                    "Card-art validation blocked",
                    "Run VEXFORGE/Presentation/Ensure R5 Assets and assign the complete card presentation materials.",
                    "Close");
                return;
            }

            var repository = new VexforgeRepository(new SupabaseClient(RuntimeEnvironment.Current));
            var cache = new VexforgeTextureLruCache(TextureCacheBudgetBytes);
            var resolver = new VexforgeCardArtResolver(cache, BatchSize);
            var root = new GameObject("VexforgeCardArtCatalogGate")
            {
                hideFlags = HideFlags.HideAndDontSave
            };
            var failures = new List<string>();
            var cardsSucceeded = 0;
            var cardsAttempted = 0;

            try
            {
                var catalog = await repository.GetCatalogAsync();
                if (catalog == null || catalog.Length == 0)
                {
                    failures.Add("catalog_empty");
                    Debug.LogError("VEXFORGE card-art catalog validation failed: Supabase returned no active cards.");
                    return;
                }

                if (catalog.Length != manifest.official_card_art_source.known_count)
                {
                    failures.Add("catalog_count_mismatch");
                    Debug.LogError(
                        "VEXFORGE card-art catalog count mismatch: live_active=" + catalog.Length +
                        " manifest=" + (manifest.official_card_art_source == null
                            ? "missing"
                            : manifest.official_card_art_source.known_count.ToString()));
                }

                var views = new[]
                {
                    VexforgeCardView.CreateRuntime(root.transform),
                    VexforgeCardView.CreateRuntime(root.transform)
                };

                for (var batchStart = 0; batchStart < catalog.Length; batchStart += BatchSize)
                {
                    var count = Math.Min(BatchSize, catalog.Length - batchStart);
                    var tasks = new Task<bool>[count];

                    for (var offset = 0; offset < count; offset++)
                    {
                        var card = catalog[batchStart + offset];
                        var view = views[offset];
                        view.gameObject.SetActive(true);
                        EditorUtility.DisplayProgressBar(
                            "VEXFORGE card-art catalog",
                            "Decoding and assigning official card art " + (batchStart + offset + 1) +
                            " / " + catalog.Length,
                            (float)(batchStart + offset + 1) / catalog.Length);
                        tasks[offset] = view.BindAsync(
                            card,
                            null,
                            false,
                            false,
                            false,
                            resolver,
                            CardArtMode.FullCardArtwork);
                    }

                    var results = await Task.WhenAll(tasks);
                    for (var offset = 0; offset < count; offset++)
                    {
                        cardsAttempted++;
                        if (results[offset]) cardsSucceeded++;
                        else failures.Add(catalog[batchStart + offset] == null
                            ? "card_record_missing"
                            : catalog[batchStart + offset].id);
                        views[offset].ResetForPool();
                    }
                }

                if (failures.Count == 0 && cardsAttempted == manifest.official_card_art_source.known_count)
                {
                    Debug.Log(
                        "VEXFORGE CARD ART CATALOG PASS — " + cardsSucceeded +
                        "/" + cardsAttempted +
                        " official cards decoded and assigned through VexforgeCardView in batches of " +
                        BatchSize + ".");
                    EditorUtility.DisplayDialog(
                        "Card-art validation passed",
                        cardsSucceeded + " official cards decoded and assigned in bounded batches.",
                        "Close");
                }
                else
                {
                    foreach (var failure in failures)
                        Debug.LogError("VEXFORGE CARD ART CATALOG FAIL — card_id/status=" + failure);
                    Debug.LogError(
                        "VEXFORGE CARD ART CATALOG FAIL — decoded_and_assigned=" + cardsSucceeded +
                        "/" + cardsAttempted + "; failures=" + failures.Count + ".");
                    EditorUtility.DisplayDialog(
                        "Card-art validation failed",
                        cardsSucceeded + " / " + cardsAttempted +
                        " cards passed. See the Editor Console for the individual card IDs and failure statuses.",
                        "Close");
                }
            }
            finally
            {
                resolver.Dispose();
                cache.Dispose();
                if (root != null) UnityEngine.Object.DestroyImmediate(root);
            }
        }
    }
}
#endif
