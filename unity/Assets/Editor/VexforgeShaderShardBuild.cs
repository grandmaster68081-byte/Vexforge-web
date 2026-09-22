#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.Rendering;
using UnityEngine;

namespace Vexforge.Editor
{
    internal static class VexforgeShaderShardContext
    {
        internal static bool Enabled { get; private set; }
        internal static int ShardIndex { get; private set; }
        internal static int ShardCount { get; private set; }

        internal static long SeenVariants { get; private set; }
        internal static long SelectedVariants { get; private set; }
        internal static long RemovedVariants { get; private set; }
        internal static long ProcessedSnippets { get; private set; }

        internal static void Enable(int shardIndex, int shardCount)
        {
            Enabled = true;
            ShardIndex = shardIndex;
            ShardCount = shardCount;
            SeenVariants = 0;
            SelectedVariants = 0;
            RemovedVariants = 0;
            ProcessedSnippets = 0;
        }

        internal static void Disable()
        {
            Enabled = false;
        }

        internal static void Record(int seen, int selected, int removed)
        {
            ProcessedSnippets++;
            SeenVariants += seen;
            SelectedVariants += selected;
            RemovedVariants += removed;
        }
    }

    internal sealed class VexforgeShaderShardPreprocessor : IPreprocessShaders
    {
        public int callbackOrder => 0;

        public void OnProcessShader(
            Shader shader,
            ShaderSnippetData snippet,
            IList<ShaderCompilerData> data)
        {
            if (!VexforgeShaderShardContext.Enabled || data.Count == 0)
                return;

            var seen = data.Count;
            var selected = 0;

            for (var index = data.Count - 1; index >= 0; index--)
            {
                var key = VexforgeShaderShardBuild.CreateVariantKey(
                    shader,
                    snippet,
                    data[index]);

                if (VexforgeShaderShardBuild.GetShardIndex(key, VexforgeShaderShardContext.ShardCount)
                    == VexforgeShaderShardContext.ShardIndex)
                {
                    selected++;
                }
                else
                {
                    data.RemoveAt(index);
                }
            }

            VexforgeShaderShardContext.Record(
                seen,
                selected,
                seen - selected);
        }
    }

    public static class VexforgeShaderShardBuild
    {
        private const string WarmupMode = "warm";
        private const int MaxShardCount = 100;

        public static void WarmShaderShard()
        {
            var configuration = ReadConfiguration();
            configuration.Validate();

            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var warmupDirectory = Path.Combine(
                projectRoot,
                "Builds",
                "ShaderShardWarmup",
                $"shard-{configuration.ShardIndex:D3}-of-{configuration.ShardCount:D3}");
            var outputPath = Path.Combine(
                warmupDirectory,
                $"VEXFORGE-shader-shard-{configuration.ShardIndex:D3}.apk");

            Directory.CreateDirectory(warmupDirectory);
            if (File.Exists(outputPath))
                File.Delete(outputPath);

            VexforgeShaderShardContext.Enable(
                configuration.ShardIndex,
                configuration.ShardCount);

            BuildReport report = null;
            Exception failure = null;
            try
            {
                report = BuildAndroidInternal(outputPath);
            }
            catch (Exception exception)
            {
                failure = exception;
            }
            finally
            {
                WriteSummary(projectRoot, configuration, outputPath, report, failure);
                VexforgeShaderShardContext.Disable();
            }

            if (failure != null)
                throw failure;

            if (report == null || report.summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"VEXFORGE shader shard {configuration.ShardIndex + 1}/{configuration.ShardCount} " +
                    $"failed with result {report?.summary.result.ToString() ?? "NoReport"}.");
            }

            Debug.Log(
                $"VEXFORGE shader shard PASS " +
                $"index={configuration.ShardIndex} count={configuration.ShardCount} " +
                $"selected={VexforgeShaderShardContext.SelectedVariants} " +
                $"removed={VexforgeShaderShardContext.RemovedVariants}");
        }

        public static void BuildAndroid()
        {
            if (string.Equals(
                    Environment.GetEnvironmentVariable("VEXFORGE_SHADER_SHARD_MODE"),
                    WarmupMode,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "VEXFORGE final Android build cannot run with shader shard filtering enabled.");
            }

            VexforgeShaderShardContext.Disable();

            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var buildDirectory = Path.Combine(projectRoot, "Builds");
            var outputPath = Path.Combine(buildDirectory, "VEXFORGE-GitHub.apk");

            Directory.CreateDirectory(buildDirectory);
            if (File.Exists(outputPath))
                File.Delete(outputPath);

            var report = BuildAndroidInternal(outputPath);
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

        internal static string CreateVariantKey(
            Shader shader,
            ShaderSnippetData snippet,
            ShaderCompilerData compilerData)
        {
            var keywords = compilerData.shaderKeywordSet
                .GetShaderKeywords()
                .Select(keyword => keyword.name)
                .OrderBy(keyword => keyword, StringComparer.Ordinal)
                .ToArray();

            return string.Join(
                "|",
                shader.name,
                snippet.shaderType,
                snippet.passType,
                snippet.passName ?? string.Empty,
                string.Join(",", keywords));
        }

        internal static int GetShardIndex(string variantKey, int shardCount)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(variantKey));
                var unsigned = BitConverter.ToUInt32(hash, 0);
                return (int)(unsigned % (uint)shardCount);
            }
        }

        private static BuildReport BuildAndroidInternal(string outputPath)
        {
            var scenes = EditorBuildSettings.scenes
                .Where(scene => scene.enabled)
                .Select(scene => scene.path)
                .Where(File.Exists)
                .ToArray();

            if (scenes.Length == 0)
            {
                throw new InvalidOperationException(
                    "VEXFORGE Android build cannot start because no enabled scenes were found.");
            }

            EditorUserBuildSettings.buildAppBundle = false;
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            PlayerSettings.SetScriptingBackend(
                BuildTargetGroup.Android,
                ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            return BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = outputPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            });
        }

        private static ShaderShardConfiguration ReadConfiguration()
        {
            return new ShaderShardConfiguration(
                ReadInt("VEXFORGE_SHADER_SHARD_INDEX", -1),
                ReadInt("VEXFORGE_SHADER_SHARD_COUNT", -1),
                Environment.GetEnvironmentVariable("VEXFORGE_SHADER_SHARD_MODE"));
        }

        private static int ReadInt(string name, int fallback)
        {
            var value = Environment.GetEnvironmentVariable(name);
            return int.TryParse(value, out var parsed) ? parsed : fallback;
        }

        private static void WriteSummary(
            string projectRoot,
            ShaderShardConfiguration configuration,
            string outputPath,
            BuildReport report,
            Exception failure)
        {
            var summary = new ShaderShardSummary
            {
                shardIndex = configuration.ShardIndex,
                shardCount = configuration.ShardCount,
                editorVersion = Application.unityVersion,
                buildTarget = EditorUserBuildSettings.activeBuildTarget.ToString(),
                outputPath = outputPath,
                buildResult = report?.summary.result.ToString() ?? "Exception",
                warnings = report?.summary.totalWarnings ?? 0,
                errors = report?.summary.totalErrors ?? 0,
                seenVariants = VexforgeShaderShardContext.SeenVariants,
                selectedVariants = VexforgeShaderShardContext.SelectedVariants,
                removedVariants = VexforgeShaderShardContext.RemovedVariants,
                processedSnippets = VexforgeShaderShardContext.ProcessedSnippets,
                failure = failure?.GetBaseException().Message ?? string.Empty
            };

            var summaryDirectory = Path.Combine(
                projectRoot,
                "Builds",
                "ShaderShardWarmup",
                "checkpoints");
            Directory.CreateDirectory(summaryDirectory);

            var summaryPath = Path.Combine(
                summaryDirectory,
                $"vexforge-shader-shard-{configuration.ShardIndex:D3}-of-{configuration.ShardCount:D3}.json");
            File.WriteAllText(summaryPath, JsonUtility.ToJson(summary, true));
        }

        private sealed class ShaderShardConfiguration
        {
            internal readonly int ShardIndex;
            internal readonly int ShardCount;
            internal readonly string Mode;

            internal ShaderShardConfiguration(int shardIndex, int shardCount, string mode)
            {
                ShardIndex = shardIndex;
                ShardCount = shardCount;
                Mode = mode;
            }

            internal void Validate()
            {
                if (!string.Equals(Mode, WarmupMode, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "VEXFORGE shader shard warmup requires " +
                        "VEXFORGE_SHADER_SHARD_MODE=warm.");
                }

                if (ShardCount < 2 || ShardCount > MaxShardCount)
                {
                    throw new InvalidOperationException(
                        $"VEXFORGE shader shard count must be between 2 and {MaxShardCount}.");
                }

                if (ShardIndex < 0 || ShardIndex >= ShardCount)
                {
                    throw new InvalidOperationException(
                        $"VEXFORGE shader shard index {ShardIndex} is outside 0..{ShardCount - 1}.");
                }
            }
        }

        [Serializable]
        private sealed class ShaderShardSummary
        {
            public int shardIndex;
            public int shardCount;
            public string editorVersion;
            public string buildTarget;
            public string outputPath;
            public string buildResult;
            public int warnings;
            public int errors;
            public long seenVariants;
            public long selectedVariants;
            public long removedVariants;
            public long processedSnippets;
            public string failure;
        }
    }
}
#endif