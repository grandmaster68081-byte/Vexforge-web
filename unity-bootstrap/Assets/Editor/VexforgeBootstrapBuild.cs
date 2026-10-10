#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;

namespace Vexforge.Bootstrap.Editor
{
    public static class VexforgeBootstrapBuild
    {
        private const string ScenePath = "Assets/Scenes/VexforgeBootstrap.unity";
        private const string ApplicationId = "com.vexforge.bootstrap";

        public static void BuildAndroid()
        {
            var projectRoot = Directory.GetParent(UnityEngine.Application.dataPath).FullName;
            var sceneFile = Path.Combine(projectRoot, ScenePath.Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(sceneFile))
            {
                throw new FileNotFoundException(
                    "The bootstrap must contain a real Vexforge scene before an APK can be built. " +
                    "Copy an official scene and its .meta file from unity/Assets, along with its " +
                    "required source dependencies. The builder will not generate a placeholder scene.",
                    sceneFile);
            }

            AssetDatabase.Refresh();
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };

            EditorUserBuildSettings.buildAppBundle = false;
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            PlayerSettings.companyName = "Vexforge";
            PlayerSettings.productName = "VEXFORGE Bootstrap";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.bundleVersionCode = 1;
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, ApplicationId);
            PlayerSettings.SetScriptingBackend(
                BuildTargetGroup.Android,
                ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            var outputPath = Path.Combine(projectRoot, "Builds", "Vexforge-bootstrap.apk");
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));

            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            });

            var summary = report.summary;
            UnityEngine.Debug.Log(
                $"VEXFORGE bootstrap Android build result={summary.result} " +
                $"editor={UnityEngine.Application.unityVersion} " +
                $"scripting=IL2CPP architecture=ARM64 output={outputPath} " +
                $"warnings={summary.totalWarnings} errors={summary.totalErrors} " +
                $"size={summary.totalSize} bytes");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"VEXFORGE bootstrap Android build failed with result {summary.result}.");
            }
        }
    }
}
#endif
