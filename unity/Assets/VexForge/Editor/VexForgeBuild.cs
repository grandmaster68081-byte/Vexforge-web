using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace VexForge.Editor
{
    public static class VexForgeBuild
    {
        private const string ScenePath = "Assets/VexForge/FoundationScene.unity";
        private const string OutputPath = "Builds/Android/VEXFORGE-Foundation.apk";
        private const string PackageId = "com.vexforge.android";
        private const string ProductVersion = "1.0.2";
        private const int VersionCode = 5;

        [MenuItem("VEXFORGE/Foundation/Build Android")]
        public static void BuildAndroid()
        {
            ValidateFoundation();

            var scenePath = EnsureFoundationScene();

            ConfigureAndroid();

            var output = Path.GetFullPath(Path.Combine(Application.dataPath, "../" + OutputPath));
            Directory.CreateDirectory(Path.GetDirectoryName(output));

            var report = BuildPipeline.BuildPlayer(
                new BuildPlayerOptions
                {
                    scenes = new[] { scenePath },
                    locationPathName = output,
                    target = BuildTarget.Android,
                    options = BuildOptions.StrictMode
                });

            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new BuildFailedException(
                    "VEXFORGE Foundation Android build failed: " +
                    report.summary.result);
            }

            WriteBuildMetadata(output, report);

            Debug.Log("VEXFORGE FOUNDATION BUILD OK");
            Debug.Log("APK: " + output);
        }

        public static void ValidateFoundation()
        {
            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android
                && !Application.isBatchMode)
            {
                EditorUserBuildSettings.SwitchActiveBuildTarget(
                    BuildTargetGroup.Android,
                    BuildTarget.Android);
            }

            RequireDirectory("Assets/VexForge");
            RequireDirectory("Assets/VexForge/Runtime");
            RequireDirectory("Assets/VexForge/Editor");

            var iconPath = "Assets/VexForge/Brand/icon.jpg";
            if (!File.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "../" + iconPath))))
            {
                throw new BuildFailedException(
                    "Missing official VEXFORGE asset: " + iconPath);
            }

            PlayerSettings.productName = "VEXFORGE";
            PlayerSettings.companyName = "VEXFORGE";
            PlayerSettings.applicationIdentifier = PackageId;
            PlayerSettings.bundleVersion = ProductVersion;
            PlayerSettings.Android.bundleVersionCode = VersionCode;

            var version = PlayerSettings.bundleVersion;
            if (version != ProductVersion)
            {
                throw new BuildFailedException("Unexpected Unity version string: " + version);
            }

            if (PlayerSettings.applicationIdentifier != PackageId)
            {
                throw new BuildFailedException(
                    "Unexpected Android application identifier: " +
                    PlayerSettings.applicationIdentifier);
            }

            if (PlayerSettings.Android.bundleVersionCode != VersionCode)
            {
                throw new BuildFailedException("Unexpected Android versionCode.");
            }

            EnsureUrpPipeline();

            Debug.Log("VEXFORGE FOUNDATION VALIDATION OK");
            Debug.Log("Package: " + PackageId);
            Debug.Log("Version: " + ProductVersion);
            Debug.Log("VersionCode: " + VersionCode);
            Debug.Log("Unity project version: " +
                      File.ReadAllText("ProjectSettings/ProjectVersion.txt"));
        }

        private static string EnsureFoundationScene()
        {
            Directory.CreateDirectory("Assets/VexForge");

            var scene = EditorSceneManager.NewScene(
                NewSceneSetup.EmptyScene,
                NewSceneMode.Single);

            var shell = new GameObject("VEXFORGE.Foundation");
            shell.AddComponent<VexForge.Foundation.VexForgeGameShell>();

            var cameraObject = new GameObject("Foundation.Camera");
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.018f, 0.02f, 0.035f);
            camera.nearClipPlane = 0.01f;
            camera.farClipPlane = 100f;

            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();

            return ScenePath;
        }

        private static void EnsureUrpPipeline()
        {
            const string directory = "Assets/VexForge/Settings";
            const string rendererPath = directory + "/VexForgeRenderer.asset";
            const string pipelinePath = directory + "/VexForgeURP.asset";

            Directory.CreateDirectory(directory);

            var pipeline =
                AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(pipelinePath);

            if (pipeline == null)
            {
                var rendererData =
                    AssetDatabase.LoadAssetAtPath<UniversalRendererData>(rendererPath);

                if (rendererData == null)
                {
                    rendererData = ScriptableObject.CreateInstance<UniversalRendererData>();
                    AssetDatabase.CreateAsset(rendererData, rendererPath);
                    AssetDatabase.SaveAssets();
                }

                pipeline = ScriptableObject.CreateInstance<UniversalRenderPipelineAsset>();

                var serialized = new SerializedObject(pipeline);
                var list = serialized.FindProperty("m_RendererDataList");

                if (list == null)
                {
                    throw new BuildFailedException(
                        "Unity URP internal renderer list was not found.");
                }

                list.arraySize = 1;
                list.GetArrayElementAtIndex(0).objectReferenceValue = rendererData;
                serialized.ApplyModifiedPropertiesWithoutUndo();

                AssetDatabase.CreateAsset(pipeline, pipelinePath);
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();
            }

            GraphicsSettings.defaultRenderPipeline = pipeline;
            QualitySettings.renderPipeline = pipeline;
        }

        private static void ConfigureAndroid()
        {
            EditorUserBuildSettings.SwitchActiveBuildTarget(
                BuildTargetGroup.Android,
                BuildTarget.Android);

            PlayerSettings.productName = "VEXFORGE";
            PlayerSettings.companyName = "VEXFORGE";
            PlayerSettings.applicationIdentifier = PackageId;
            PlayerSettings.bundleVersion = ProductVersion;
            PlayerSettings.Android.bundleVersionCode = VersionCode;

            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel35;

            PlayerSettings.SetScriptingBackend(
                BuildTargetGroup.Android,
                ScriptingImplementation.IL2CPP);

            PlayerSettings.Android.androidIsGame = true;

            var icon = AssetDatabase.LoadAssetAtPath<Texture2D>(
                "Assets/VexForge/Brand/icon.jpg");

            if (icon == null)
            {
                throw new BuildFailedException(
                    "Official VEXFORGE icon could not be loaded.");
            }

#pragma warning disable CS0618
            PlayerSettings.SetIconsForTargetGroup(
                BuildTargetGroup.Android,
                new[] { icon });
#pragma warning restore CS0618
        }

        private static void WriteBuildMetadata(
            string apkPath,
            BuildReport report)
        {
            var sha256 = ComputeSha256(apkPath);

            var metadata =
                "{\n" +
                "  \"product\": \"VEXFORGE\",\n" +
                "  \"runtime\": \"Unity 6.3 LTS\",\n" +
                "  \"editor\": \"6000.3.24f1\",\n" +
                "  \"renderPipeline\": \"URP 17.3.0\",\n" +
                "  \"applicationId\": \"" + PackageId + "\",\n" +
                "  \"version\": \"" + ProductVersion + "\",\n" +
                "  \"versionCode\": " + VersionCode + ",\n" +
                "  \"buildResult\": \"" + report.summary.result + "\",\n" +
                "  \"totalSizeBytes\": " + new FileInfo(apkPath).Length + ",\n" +
                "  \"apkSha256\": \"" + sha256 + "\"\n" +
                "}\n";

            var metadataPath = Path.Combine(
                Path.GetDirectoryName(apkPath),
                "vexforge-foundation-build-info.json");

            File.WriteAllText(metadataPath, metadata);
        }

        private static string ComputeSha256(string path)
        {
            using (var stream = File.OpenRead(path))
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                return BitConverter.ToString(sha.ComputeHash(stream))
                    .Replace("-", string.Empty)
                    .ToLowerInvariant();
            }
        }

        private static void RequireDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                throw new BuildFailedException(
                    "Required Unity directory missing: " + path);
            }
        }
    }
}