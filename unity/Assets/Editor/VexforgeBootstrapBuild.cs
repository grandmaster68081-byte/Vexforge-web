#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using Vexforge.Presentation.Editor;

namespace Vexforge.Bootstrap.Editor
{
    public static class VexforgeBootstrapBuild
    {
        private const string ScenePath = "Assets/Scenes/VexforgeBootstrap.unity";
        private const string ApplicationId = "com.vexforge.android";

        public static void BuildAndroid()
        {
            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: START");
            var projectRoot = Directory.GetParent(UnityEngine.Application.dataPath).FullName;
            var sceneFile = Path.Combine(projectRoot, ScenePath.Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(sceneFile))
            {
                throw new FileNotFoundException(
                    "The official Unity project must contain its real Vexforge scene and required " +
                    "dependencies before an APK can be built. The builder will not generate a placeholder scene.",
                    sceneFile);
            }

            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: initial AssetDatabase.Refresh START");
            AssetDatabase.Refresh();
            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: initial AssetDatabase.Refresh PASS");

            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: R5 asset setup START");
            VexforgeR5ProjectSetup.EnsureAll();
            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: R5 asset setup PASS");
            VexforgeR5FoundationGate.ValidateOrThrow();
            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: R5 foundation validation PASS");

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };

            EditorUserBuildSettings.buildAppBundle = false;
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            PlayerSettings.companyName = "Vexforge";
            PlayerSettings.productName = "VEXFORGE";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.bundleVersionCode = 4;
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, ApplicationId);
            PlayerSettings.SetScriptingBackend(
                BuildTargetGroup.Android,
                ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            var outputPath = Path.Combine(projectRoot, "Builds", "Vexforge.apk");
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));

            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: BuildPipeline.BuildPlayer START");
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            });
            UnityEngine.Debug.Log("VEXFORGE ANDROID BUILD: BuildPipeline.BuildPlayer RETURNED");

            var summary = report.summary;
            UnityEngine.Debug.Log(
                $"VEXFORGE Android build result={summary.result} " +
                $"editor={UnityEngine.Application.unityVersion} " +
                $"scripting=IL2CPP architecture=ARM64 output={outputPath} " +
                $"warnings={summary.totalWarnings} errors={summary.totalErrors} " +
                $"size={summary.totalSize} bytes");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"VEXFORGE Android build failed with result {summary.result}.");
            }
        }
    }
}
#endif
