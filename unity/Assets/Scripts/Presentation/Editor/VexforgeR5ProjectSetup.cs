#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Vexforge.Presentation.Editor
{
    /// <summary>
    /// Editor-only deterministic setup. Shader.Find is intentionally confined to editor
    /// asset authoring; no runtime Presentation class uses it.
    /// </summary>
    public static class VexforgeR5ProjectSetup
    {
        private const string Root = "Assets/Resources/Vexforge";
        private const string RenderingRoot = Root + "/Rendering";
        private const string MaterialsRoot = Root + "/Materials";

        private const string PipelinePath =
            RenderingRoot + "/VexforgeUrp.asset";

        private const string ResourcesPath =
            Root + "/VexforgePresentationResources.asset";

        [MenuItem("VEXFORGE/Presentation/Ensure R5 Assets", priority = 100)]
        public static void EnsureAll()
        {
            EnsureFolder("Assets/Resources", "Vexforge");
            EnsureFolder(Root, "Rendering");
            EnsureFolder(Root, "Materials");

            var pipeline = EnsureUrpAsset();

            EnsureMaterials();
            EnsurePresentationResources();
            EnsureHotspotLayer();

            if (pipeline != null)
            {
                GraphicsSettings.defaultRenderPipeline = pipeline;
                QualitySettings.renderPipeline = pipeline;
                EditorUtility.SetDirty(pipeline);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log(
                "VEXFORGE R5 assets ensured. "
                + "Open the project and perform an Editor compile before promotion.");
        }

        private static UniversalRenderPipelineAsset EnsureUrpAsset()
        {
            var asset =
                AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(
                    PipelinePath);

            if (asset == null)
            {
                asset = ScriptableObject.CreateInstance<UniversalRenderPipelineAsset>();
                AssetDatabase.CreateAsset(asset, PipelinePath);
                AssetDatabase.SaveAssets();
                asset.LoadBuiltinRendererData();
            }

            asset.useSRPBatcher = true;

            if (asset.renderScale <= 0f)
                asset.renderScale = 1f;

            EditorUtility.SetDirty(asset);
            return asset;
        }

        private static void EnsureHotspotLayer()
        {
            var assets =
                AssetDatabase.LoadAllAssetsAtPath(
                    "ProjectSettings/TagManager.asset");

            if (assets == null || assets.Length == 0)
                throw new System.InvalidOperationException(
                    "VEXFORGE cannot access ProjectSettings/TagManager.asset.");

            var serialized = new SerializedObject(assets[0]);
            var layers = serialized.FindProperty("layers");

            if (layers == null)
                throw new System.InvalidOperationException(
                    "VEXFORGE cannot access TagManager layers.");

            for (var i = 8; i < layers.arraySize; i++)
            {
                var layer = layers.GetArrayElementAtIndex(i);

                if (layer.stringValue == "VexforgeHotspot")
                    return;
            }

            for (var i = 8; i < layers.arraySize; i++)
            {
                var layer = layers.GetArrayElementAtIndex(i);

                if (string.IsNullOrEmpty(layer.stringValue))
                {
                    layer.stringValue = "VexforgeHotspot";
                    serialized.ApplyModifiedPropertiesWithoutUndo();
                    AssetDatabase.SaveAssets();
                    return;
                }
            }

            throw new System.InvalidOperationException(
                "VEXFORGE cannot allocate a free Unity layer for VexforgeHotspot.");
        }

        private static void EnsureMaterials()
        {
            CreateOrGetMaterial(
                MaterialPath("CardBody"),
                "Universal Render Pipeline/Lit",
                new Color(0.07f, 0.055f, 0.045f, 1f),
                0.25f,
                0.45f);

            CreateOrGetMaterial(
                MaterialPath("CardArt"),
                "Universal Render Pipeline/Unlit",
                Color.white,
                0f,
                0f);

            CreateOrGetMaterial(
                MaterialPath("CardFrame"),
                "Universal Render Pipeline/Lit",
                new Color(0.72f, 0.48f, 0.12f, 1f),
                0.55f,
                0.40f);

            CreateOrGetMaterial(
                MaterialPath("WorldSurface"),
                "Universal Render Pipeline/Lit",
                new Color(0.055f, 0.045f, 0.045f, 1f),
                0.15f,
                0.35f);

            CreateOrGetMaterial(
                MaterialPath("WorldAccent"),
                "Universal Render Pipeline/Lit",
                new Color(0.42f, 0.10f, 0.07f, 1f),
                0.35f,
                0.32f);
        }

        private static void EnsurePresentationResources()
        {
            var resources =
                AssetDatabase.LoadAssetAtPath<VexforgePresentationResources>(
                    ResourcesPath);

            if (resources == null)
            {
                resources =
                    ScriptableObject.CreateInstance<VexforgePresentationResources>();

                AssetDatabase.CreateAsset(resources, ResourcesPath);
            }

            var so = new SerializedObject(resources);

            so.FindProperty("cardBodyMaterial").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Material>(
                    MaterialPath("CardBody"));

            so.FindProperty("cardArtMaterial").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Material>(
                    MaterialPath("CardArt"));

            so.FindProperty("cardFrameMaterial").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Material>(
                    MaterialPath("CardFrame"));

            so.FindProperty("worldSurfaceMaterial").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Material>(
                    MaterialPath("WorldSurface"));

            so.FindProperty("worldAccentMaterial").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Material>(
                    MaterialPath("WorldAccent"));

            so.ApplyModifiedPropertiesWithoutUndo();

            EditorUtility.SetDirty(resources);
        }

        private static Material CreateOrGetMaterial(
            string path,
            string shaderName,
            Color baseColor,
            float metallic,
            float smoothness)
        {
            var material =
                AssetDatabase.LoadAssetAtPath<Material>(path);

            if (material != null)
                return material;

            var shader = Shader.Find(shaderName);

            if (shader == null)
                throw new System.InvalidOperationException(
                    "Required URP shader not found: " + shaderName);

            material = new Material(shader);
            material.name =
                System.IO.Path.GetFileNameWithoutExtension(path);

            if (material.HasProperty("_BaseColor"))
                material.SetColor("_BaseColor", baseColor);

            if (material.HasProperty("_Metallic"))
                material.SetFloat("_Metallic", metallic);

            if (material.HasProperty("_Smoothness"))
                material.SetFloat("_Smoothness", smoothness);

            material.enableInstancing = true;

            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static string MaterialPath(string name)
        {
            return MaterialsRoot + "/" + name + ".mat";
        }

        private static void EnsureFolder(string parent, string name)
        {
            var path = parent + "/" + name;

            if (!AssetDatabase.IsValidFolder(path))
                AssetDatabase.CreateFolder(parent, name);
        }
    }
}
#endif
