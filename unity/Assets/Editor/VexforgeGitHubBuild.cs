#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Vexforge.Editor
{
    public static class VexforgeGitHubBuild
    {
        public static void BuildAndroid()
        {
            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var buildDirectory = Path.Combine(projectRoot, "Builds");
            var outputPath = Path.Combine(buildDirectory, "VEXFORGE-GitHub.apk");

            Directory.CreateDirectory(buildDirectory);

            var scenes = EditorBuildSettings.scenes
                .Where(scene => scene.enabled)
                .Select(scene => scene.path)
                .Where(File.Exists)
                .ToArray();

            if (scenes.Length == 0)
            {
                throw new InvalidOperationException(
                    "VEXFORGE GitHub build cannot start because no enabled scenes were found.");
            }

            EditorUserBuildSettings.buildAppBundle = false;
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            PlayerSettings.SetScriptingBackend(
                BuildTargetGroup.Android,
                ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = outputPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            });

            var summary = report.summary;
            Debug.Log(
                $"VEXFORGE GitHub Android build result={summary.result} " +
                $"warnings={summary.totalWarnings} errors={summary.totalErrors} " +
                $"size={summary.totalSize} bytes output={outputPath}");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"VEXFORGE GitHub Android build failed with result {summary.result}.");
            }
        }
    }
}
#endif