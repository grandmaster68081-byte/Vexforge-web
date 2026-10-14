using System;
using System.Collections.Generic;
using UnityEngine;

namespace Vexforge.Presentation
{
    [Serializable]
    public sealed class VexforgeWorldMeshManifest
    {
        public string schema_version;
        public string product;
        public VexforgeWorldMeshEntry[] assets;
    }

    [Serializable]
    public sealed class VexforgeWorldMeshEntry
    {
        public string asset_id;
        public string domain;
        public string resources_key;
        public string source_file;
        public string[] material_slots;
        public string[] consumers;
    }

    /// <summary>
    /// Loads authored Unity model assets from the VEXFORGE world-mesh catalog.
    /// This class contains no gameplay state and never substitutes a missing model.
    /// </summary>
    public static class VexforgeWorldMeshFactory
    {
        private const string ManifestResourcesKey =
            "VexforgeTier1/Models/VexforgeWorldMeshManifest";

        private static VexforgeWorldMeshManifest manifest;

        public static GameObject Instantiate(
            string assetId,
            Transform parent,
            Vector3 localPosition,
            Quaternion localRotation,
            Vector3 localScale,
            Func<string, Material> materialResolver)
        {
            if (string.IsNullOrWhiteSpace(assetId))
                throw new ArgumentException("A world-mesh asset ID is required.", nameof(assetId));
            if (parent == null)
                throw new ArgumentNullException(nameof(parent));
            if (materialResolver == null)
                throw new ArgumentNullException(nameof(materialResolver));

            var entry = FindEntry(assetId);
            if (entry == null ||
                !string.Equals(entry.domain, "world/environment", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(entry.domain, "world/portal", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "VEXFORGE world mesh is not registered for an environment domain: " + assetId);
            }

            if (string.IsNullOrWhiteSpace(entry.resources_key) ||
                entry.resources_key.Contains("..") ||
                entry.resources_key.StartsWith("/", StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "VEXFORGE world-mesh Resources key is invalid: asset_id=" + assetId);
            }

            var source = Resources.Load<GameObject>(entry.resources_key);
            if (source == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE critical world mesh failed to import: asset_id=" + assetId +
                    " resources_key=" + entry.resources_key);
            }

            ValidateImportedModel(source, entry);
            var instance = UnityEngine.Object.Instantiate(source, parent, false);
            instance.name = assetId;
            instance.transform.localPosition = localPosition;
            instance.transform.localRotation = localRotation;
            instance.transform.localScale = localScale;
            ApplyMaterials(instance, assetId, materialResolver);
            return instance;
        }

        private static VexforgeWorldMeshEntry FindEntry(string assetId)
        {
            EnsureManifest();
            if (manifest.assets == null)
                return null;

            for (var i = 0; i < manifest.assets.Length; i++)
            {
                var entry = manifest.assets[i];
                if (entry != null &&
                    string.Equals(entry.asset_id, assetId, StringComparison.Ordinal))
                    return entry;
            }

            return null;
        }

        private static void EnsureManifest()
        {
            if (manifest != null)
                return;

            var textAsset = Resources.Load<TextAsset>(ManifestResourcesKey);
            if (textAsset == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE world-mesh manifest is missing from Resources: " +
                    ManifestResourcesKey);
            }

            manifest = JsonUtility.FromJson<VexforgeWorldMeshManifest>(textAsset.text);
            if (manifest == null ||
                !string.Equals(manifest.schema_version, "1.0", StringComparison.Ordinal) ||
                !string.Equals(manifest.product, "VEXFORGE", StringComparison.Ordinal) ||
                manifest.assets == null ||
                manifest.assets.Length == 0)
            {
                manifest = null;
                throw new InvalidOperationException(
                    "VEXFORGE world-mesh manifest is invalid or unsupported.");
            }
        }

        private static void ValidateImportedModel(
            GameObject source,
            VexforgeWorldMeshEntry entry)
        {
            var filters = source.GetComponentsInChildren<MeshFilter>(true);
            var renderers = source.GetComponentsInChildren<MeshRenderer>(true);
            var geometryCount = 0;
            for (var i = 0; i < filters.Length; i++)
            {
                if (filters[i].sharedMesh == null ||
                    filters[i].sharedMesh.vertexCount < 3 ||
                    filters[i].sharedMesh.triangles == null ||
                    filters[i].sharedMesh.triangles.Length < 3)
                    continue;

                geometryCount++;
            }

            if (geometryCount == 0 || renderers.Length == 0)
            {
                throw new InvalidOperationException(
                    "VEXFORGE world mesh contains no renderable imported geometry: asset_id=" +
                    entry.asset_id);
            }

            var expectedSlots = entry.material_slots ?? new string[0];
            var foundSlots = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < renderers.Length; i++)
            {
                var sourceMaterials = renderers[i].sharedMaterials;
                if (sourceMaterials == null || sourceMaterials.Length == 0)
                {
                    throw new InvalidOperationException(
                        "VEXFORGE world mesh has a renderer without material slots: asset_id=" +
                        entry.asset_id);
                }

                for (var materialIndex = 0; materialIndex < sourceMaterials.Length; materialIndex++)
                {
                    var sourceMaterial = sourceMaterials[materialIndex];
                    if (sourceMaterial == null)
                        continue;
                    for (var slot = 0; slot < expectedSlots.Length; slot++)
                    {
                        if (sourceMaterial.name.IndexOf(
                                expectedSlots[slot],
                                StringComparison.Ordinal) >= 0)
                        {
                            foundSlots.Add(expectedSlots[slot]);
                            break;
                        }
                    }
                }
            }

            if (foundSlots.Count == 0)
            {
                throw new InvalidOperationException(
                    "VEXFORGE world mesh has no recognized VEXFORGE material slots: asset_id=" +
                    entry.asset_id);
            }

            for (var i = 0; i < expectedSlots.Length; i++)
            {
                if (!foundSlots.Contains(expectedSlots[i]))
                {
                    throw new InvalidOperationException(
                        "VEXFORGE world mesh is missing a required imported material slot: asset_id=" +
                        entry.asset_id + " material=" + expectedSlots[i]);
                }
            }
        }

        private static void ApplyMaterials(
            GameObject instance,
            string assetId,
            Func<string, Material> materialResolver)
        {
            var renderers = instance.GetComponentsInChildren<MeshRenderer>(true);
            for (var rendererIndex = 0; rendererIndex < renderers.Length; rendererIndex++)
            {
                var renderer = renderers[rendererIndex];
                var importedMaterials = renderer.sharedMaterials;
                var resolvedMaterials = new Material[importedMaterials.Length];
                for (var materialIndex = 0; materialIndex < importedMaterials.Length; materialIndex++)
                {
                    var imported = importedMaterials[materialIndex];
                    if (imported == null)
                    {
                        throw new InvalidOperationException(
                            "VEXFORGE world mesh has a null imported material: asset_id=" + assetId);
                    }

                    resolvedMaterials[materialIndex] = materialResolver(imported.name);
                    if (resolvedMaterials[materialIndex] == null)
                    {
                        throw new InvalidOperationException(
                            "VEXFORGE world mesh material is not mapped to a production shader: asset_id=" +
                            assetId + " material=" + imported.name);
                    }
                }

                renderer.sharedMaterials = resolvedMaterials;
            }
        }
    }
}
