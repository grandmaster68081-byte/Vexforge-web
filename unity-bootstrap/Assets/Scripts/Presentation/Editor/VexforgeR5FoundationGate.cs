#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Vexforge.Core;

namespace Vexforge.Presentation.Editor
{
    /// <summary>
    /// Deterministic R5 foundation gate.
    ///
    /// Ensure mode materializes the existing R5 technical assets through
    /// VexforgeR5ProjectSetup. Validate mode performs read-only verification.
    /// No runtime gameplay, backend state, or content data is modified here.
    /// </summary>
    public static class VexforgeR5FoundationGate
    {
        private const string Root = "Assets/Resources/Vexforge";
        private const string PipelinePath = Root + "/Rendering/VexforgeUrp.asset";
        private const string ResourcesPath = Root + "/VexforgePresentationResources.asset";
        private const string MaterialsRoot = Root + "/Materials";
        private const string BootstrapScenePath = "Assets/Scenes/VexforgeBootstrap.unity";
        private const string EnvironmentPath = "Assets/Resources/VexforgeEnvironment.json";
        private const string HotspotLayer = "VexforgeHotspot";

        private static readonly string[] RequiredMaterialNames =
        {
            "CardBody",
            "CardArt",
            "CardFrame",
            "WorldSurface",
            "WorldAccent"
        };

        [MenuItem("VEXFORGE/Validation/Ensure + Validate R5 Foundation", priority = 120)]
        public static void EnsureAndValidate()
        {
            VexforgeR5ProjectSetup.EnsureAll();
            ValidateOrThrow();
        }

        [MenuItem("VEXFORGE/Validation/Validate R5 Foundation", priority = 121)]
        public static void ValidateOnly()
        {
            ValidateOrThrow();
        }

        /// <summary>
        /// Headless/batch entry point. Run with Unity's -executeMethod switch.
        /// </summary>
        public static void ExecuteBatch()
        {
            EnsureAndValidate();
        }

        public static void ValidateOrThrow()
        {
            var failures = new List<string>();

            ValidateRoutes(failures);
            ValidateRequiredAssets(failures);
            ValidatePresentationResources(failures);
            ValidateRenderPipeline(failures);
            ValidateHotspotLayer(failures);
            ValidateRequiredProjectFiles(failures);

            if (failures.Count == 0)
            {
                Debug.Log("VEXFORGE R5.3 FOUNDATION GATE: PASS");
                return;
            }

            var message = "VEXFORGE R5.3 FOUNDATION GATE: FAIL\n- " +
                          string.Join("\n- ", failures);
            Debug.LogError(message);
            throw new InvalidOperationException(message);
        }

        private static void ValidateRoutes(List<string> failures)
        {
            var expected = new[]
            {
                "Boot",
                "Nexus",
                "Collection",
                "Deck",
                "Battle",
                "Missions",
                "Economy",
                "Profile"
            };

            var actual = Enum.GetNames(typeof(GameRoute));
            if (actual.Length != expected.Length)
            {
                failures.Add(
                    "CANONICAL_ROUTE_ENUM_MISMATCH: expected exactly 8 GameRoute values, found " +
                    actual.Length + ".");
                return;
            }

            for (var i = 0; i < expected.Length; i++)
            {
                if (actual[i] != expected[i])
                {
                    failures.Add(
                        "CANONICAL_ROUTE_ENUM_MISMATCH: index " + i +
                        " expected '" + expected[i] + "' found '" + actual[i] + "'.");
                }

                var numericValue = (int)Enum.Parse(typeof(GameRoute), expected[i]);
                if (numericValue != i)
                {
                    failures.Add(
                        "CANONICAL_ROUTE_ENUM_VALUE_MISMATCH: " + expected[i] +
                        " expected numeric value " + i + " found " + numericValue + ".");
                }
            }
        }

        private static void ValidateRequiredAssets(List<string> failures)
        {
            if (AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath) == null)
            {
                failures.Add("PRESENTATION_RESOURCES_NOT_MATERIALIZED: missing " + PipelinePath);
            }
            else
            {
                ValidateAssetGuid(failures, PipelinePath);
            }

            for (var i = 0; i < RequiredMaterialNames.Length; i++)
            {
                var name = RequiredMaterialNames[i];
                var path = MaterialsRoot + "/" + name + ".mat";
                if (AssetDatabase.LoadAssetAtPath<Material>(path) == null)
                {
                    failures.Add("PRESENTATION_RESOURCES_NOT_MATERIALIZED: missing " + path);
                }
                else
                {
                    ValidateAssetGuid(failures, path);
                }
            }

            if (AssetDatabase.LoadAssetAtPath<VexforgePresentationResources>(ResourcesPath) == null)
            {
                failures.Add("PRESENTATION_RESOURCES_NOT_MATERIALIZED: missing " + ResourcesPath);
            }
            else
            {
                ValidateAssetGuid(failures, ResourcesPath);
            }
        }

        private static void ValidateAssetGuid(List<string> failures, string assetPath)
        {
            var guid = AssetDatabase.AssetPathToGUID(assetPath);
            if (string.IsNullOrEmpty(guid))
            {
                failures.Add("ASSET_GUID_MISSING: " + assetPath);
            }
        }

        private static void ValidatePresentationResources(List<string> failures)
        {
            var resources = AssetDatabase.LoadAssetAtPath<VexforgePresentationResources>(ResourcesPath);
            if (resources == null)
            {
                return;
            }

            if (!resources.IsComplete)
            {
                failures.Add("PRESENTATION_RESOURCES_INCOMPLETE: VexforgePresentationResources.IsComplete is false.");
                return;
            }

            ValidateMaterialReference(
                failures,
                resources.CardBodyMaterial,
                MaterialsRoot + "/CardBody.mat",
                "CardBodyMaterial");
            ValidateMaterialReference(
                failures,
                resources.CardArtMaterial,
                MaterialsRoot + "/CardArt.mat",
                "CardArtMaterial");
            ValidateMaterialReference(
                failures,
                resources.CardFrameMaterial,
                MaterialsRoot + "/CardFrame.mat",
                "CardFrameMaterial");
            ValidateMaterialReference(
                failures,
                resources.WorldSurfaceMaterial,
                MaterialsRoot + "/WorldSurface.mat",
                "WorldSurfaceMaterial");
            ValidateMaterialReference(
                failures,
                resources.WorldAccentMaterial,
                MaterialsRoot + "/WorldAccent.mat",
                "WorldAccentMaterial");
        }

        private static void ValidateMaterialReference(
            List<string> failures,
            Material material,
            string expectedPath,
            string fieldName)
        {
            if (material == null)
            {
                failures.Add("PRESENTATION_RESOURCE_REFERENCE_NULL: " + fieldName + ".");
                return;
            }

            var actualPath = AssetDatabase.GetAssetPath(material);
            if (!string.Equals(actualPath, expectedPath, StringComparison.Ordinal))
            {
                failures.Add(
                    "PRESENTATION_RESOURCE_REFERENCE_MISMATCH: " + fieldName +
                    " expected '" + expectedPath + "' found '" + actualPath + "'.");
            }
        }

        private static void ValidateRenderPipeline(List<string> failures)
        {
            var expected = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath);
            if (expected == null)
            {
                return;
            }

            if (!ReferenceEquals(GraphicsSettings.defaultRenderPipeline, expected))
            {
                failures.Add("URP_DEFAULT_PIPELINE_MISMATCH: GraphicsSettings.defaultRenderPipeline is not VexforgeUrp.asset.");
            }

            if (!ReferenceEquals(QualitySettings.renderPipeline, expected))
            {
                failures.Add("URP_QUALITY_PIPELINE_MISMATCH: QualitySettings.renderPipeline is not VexforgeUrp.asset.");
            }

            if (!ReferenceEquals(GraphicsSettings.currentRenderPipeline, expected))
            {
                failures.Add("URP_ACTIVE_PIPELINE_MISMATCH: GraphicsSettings.currentRenderPipeline is not VexforgeUrp.asset.");
            }

            if (expected.GetRenderer(0) == null)
            {
                failures.Add("URP_RENDERER_MISSING: VexforgeUrp.asset has no usable renderer at index 0.");
            }
        }

        private static void ValidateHotspotLayer(List<string> failures)
        {
            var tagManager = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
            if (tagManager == null || tagManager.Length == 0)
            {
                failures.Add("HOTSPOT_LAYER_UNVERIFIED: ProjectSettings/TagManager.asset unavailable.");
                return;
            }

            var serialized = new SerializedObject(tagManager[0]);
            var layers = serialized.FindProperty("layers");
            if (layers == null)
            {
                failures.Add("HOTSPOT_LAYER_UNVERIFIED: TagManager layers property unavailable.");
                return;
            }

            var found = false;
            for (var i = 8; i < layers.arraySize; i++)
            {
                var value = layers.GetArrayElementAtIndex(i).stringValue;
                if (string.Equals(value, HotspotLayer, StringComparison.Ordinal))
                {
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                failures.Add("HOTSPOT_LAYER_MISSING: expected Unity layer '" + HotspotLayer + "'.");
            }
        }

        private static void ValidateRequiredProjectFiles(List<string> failures)
        {
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(BootstrapScenePath) == null)
            {
                failures.Add("BOOTSTRAP_SCENE_MISSING: " + BootstrapScenePath);
            }

            if (!System.IO.File.Exists(EnvironmentPath))
            {
                failures.Add("ENVIRONMENT_CONFIG_MISSING: " + EnvironmentPath);
            }
        }
    }
}
#endif
