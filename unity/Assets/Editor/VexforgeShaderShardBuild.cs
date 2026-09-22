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
        private static readonly HashSet<string> FingerprintEntries = new HashSet<string>(
            StringComparer.Ordinal);

        internal static bool Enabled { get; private set; }
        internal static bool InventoryOnly { get; private set; }
        internal static int ShardIndex { get; private set; }
        internal static int ShardCount { get; private set; }
        internal static int RangeStartBps { get; private set; }
        internal static int RangeEndBps { get; private set; }

        internal static long SeenVariants { get; private set; }
        internal static long SelectedVariants { get; private set; }
        internal static long RemovedVariants { get; private set; }
        internal static long ProcessedSnippets { get; private set; }
        internal static IReadOnlyCollection<string> Fingerprints => FingerprintEntries;

        internal static void EnableShard(
            int shardIndex,
            int shardCount,
            int rangeStartBps,
            int rangeEndBps)
        {
            Enabled = true;
            InventoryOnly = false;
            ShardIndex = shardIndex;
            ShardCount = shardCount;
            RangeStartBps = rangeStartBps;
            RangeEndBps = rangeEndBps;
            ResetCounters();
        }

        internal static void EnableInventory()
        {
            Enabled = true;
            InventoryOnly = true;
            ShardIndex = -1;
            ShardCount = 0;
            RangeStartBps = 0;
            RangeEndBps = VexforgeShaderShardBuild.HashSpaceBps;
            ResetCounters();
        }

        internal static void Disable()
        {
            Enabled = false;
            InventoryOnly = false;
            RangeStartBps = 0;
            RangeEndBps = 0;
            FingerprintEntries.Clear();
        }

        internal static void RecordVariant(
            string fingerprint,
            int assignedShard)
        {
            if (InventoryOnly || assignedShard == ShardIndex)
                FingerprintEntries.Add($"{fingerprint}\t{assignedShard}");
        }

        internal static void Record(int seen, int selected, int removed)
        {
            ProcessedSnippets++;
            SeenVariants += seen;
            SelectedVariants += selected;
            RemovedVariants += removed;
        }

        private static void ResetCounters()
        {
            SeenVariants = 0;
            SelectedVariants = 0;
            RemovedVariants = 0;
            ProcessedSnippets = 0;
            FingerprintEntries.Clear();
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
                var assignedShard = VexforgeShaderShardBuild.GetShardIndex(
                    key,
                    VexforgeShaderShardContext.InventoryOnly
                        ? VexforgeShaderShardBuild.InventoryShardCount
                        : VexforgeShaderShardContext.ShardCount);
                var hashBucket = VexforgeShaderShardBuild.GetHashBucket(key);

                VexforgeShaderShardContext.RecordVariant(
                    VexforgeShaderShardBuild.CreateVariantFingerprint(key),
                    VexforgeShaderShardContext.InventoryOnly
                        ? assignedShard
                        : hashBucket);

                if (VexforgeShaderShardContext.InventoryOnly)
                    continue;

                if (VexforgeShaderShardBuild.IsInRange(
                    hashBucket,
                    VexforgeShaderShardContext.RangeStartBps,
                    VexforgeShaderShardContext.RangeEndBps))
                {
                    selected++;
                }
                else
                {
                    data.RemoveAt(index);
                }
            }

            if (VexforgeShaderShardContext.InventoryOnly)
            {
                data.Clear();
                VexforgeShaderShardContext.Record(seen, 0, seen);
            }
            else
            {
                VexforgeShaderShardContext.Record(
                    seen,
                    selected,
                    seen - selected);
            }
        }
    }

    public static class VexforgeShaderShardBuild
    {
        private const string WarmupMode = "warm";
        private const int MaxShardCount = 100;
        internal const int HashSpaceBps = 10000;

        // Inventory uses a fixed partition only to make the manifest useful for
        // planning. Inventory itself never strips a variant from the manifest.
        internal const int InventoryShardCount = 100;

        public static void InventoryShaders()
        {
            RunInventory("inventory");
        }

        public static void DiagnoseShaders()
        {
            RunInventory("diagnostic");
        }

        public static void InventoryBaselineShaders()
        {
            RunInventory("baseline");
        }

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

            VexforgeShaderShardContext.EnableShard(
                configuration.ShardIndex,
                configuration.ShardCount,
                configuration.RangeStartBps,
                configuration.RangeEndBps);

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
                WriteVariantManifest(
                    projectRoot,
                    $"shard-{configuration.ShardIndex:D3}-of-{configuration.ShardCount:D3}.tsv");
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
                    $"range={configuration.RangeStartBps}-{configuration.RangeEndBps}bps " +
                $"seen={VexforgeShaderShardContext.SeenVariants} " +
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
                Application.unityVersion,
                EditorUserBuildSettings.activeBuildTarget,
                shader.name,
                snippet.shaderType,
                snippet.passType,
                snippet.passName ?? string.Empty,
                compilerData.shaderCompilerPlatform,
                compilerData.graphicsTier,
                compilerData.shaderRequirements,
                string.Join(",", keywords));
        }

        internal static string CreateVariantFingerprint(string variantKey)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(variantKey));
                return BitConverter.ToString(hash)
                    .Replace("-", string.Empty)
                    .ToLowerInvariant();
            }
        }

        internal static int GetShardIndex(string variantKey, int shardCount)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(variantKey));
                var unsigned = ((uint)hash[0] << 24)
                    | ((uint)hash[1] << 16)
                    | ((uint)hash[2] << 8)
                    | hash[3];
                return (int)(unsigned % (uint)shardCount);
            }
        }

        internal static int GetHashBucket(string variantKey)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(variantKey));
                var unsigned = ((uint)hash[0] << 24)
                    | ((uint)hash[1] << 16)
                    | ((uint)hash[2] << 8)
                    | hash[3];
                return (int)(unsigned % HashSpaceBps);
            }
        }

        internal static bool IsInRange(
            int hashBucket,
            int rangeStartBps,
            int rangeEndBps)
        {
            return hashBucket >= rangeStartBps && hashBucket < rangeEndBps;
        }

        private static void RunInventory(string analysisMode)
        {
            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var outputDirectory = Path.Combine(
                projectRoot,
                "Builds",
                "ShaderShardWarmup",
                "inventory");
            var outputPath = Path.Combine(
                outputDirectory,
                $"VEXFORGE-{analysisMode}.apk");

            Directory.CreateDirectory(outputDirectory);
            if (File.Exists(outputPath))
                File.Delete(outputPath);

            VexforgeShaderShardContext.EnableInventory();

            BuildReport report = null;
            Exception failure = null;
            long seenVariants = 0;
            int uniqueFingerprints = 0;
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
                WriteAnalysisSummary(
                    projectRoot,
                    analysisMode,
                    outputPath,
                    report,
                    failure);
                WriteVariantManifest(projectRoot, $"{analysisMode}.tsv");

                seenVariants = VexforgeShaderShardContext.SeenVariants;
                uniqueFingerprints = VexforgeShaderShardContext.Fingerprints.Count;
                VexforgeShaderShardContext.Disable();

                if (seenVariants == 0 && failure != null)
                    throw failure;
                if (seenVariants == 0)
                {
                    throw new InvalidOperationException(
                        $"VEXFORGE {analysisMode} did not observe any shader variants.");
                }
            }

            Debug.Log(
                $"VEXFORGE shader {analysisMode} PASS " +
                $"seen={seenVariants} " +
                $"unique={uniqueFingerprints}");
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

        private static void WriteAnalysisSummary(
            string projectRoot,
            string analysisMode,
            string outputPath,
            BuildReport report,
            Exception failure)
        {
            var summary = new ShaderShardSummary
            {
                analysisMode = analysisMode,
                shardIndex = -1,
                shardCount = InventoryShardCount,
                rangeStartBps = 0,
                rangeEndBps = HashSpaceBps,
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
                uniqueFingerprints = VexforgeShaderShardContext.Fingerprints.Count,
                failure = failure?.GetBaseException().Message ?? string.Empty
            };

            WriteSummaryFile(projectRoot, $"{analysisMode}.json", summary);
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
                analysisMode = WarmupMode,
                shardIndex = configuration.ShardIndex,
                shardCount = configuration.ShardCount,
                rangeStartBps = configuration.RangeStartBps,
                rangeEndBps = configuration.RangeEndBps,
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
                uniqueFingerprints = VexforgeShaderShardContext.Fingerprints.Count,
                failure = failure?.GetBaseException().Message ?? string.Empty
            };

            WriteSummaryFile(
                projectRoot,
                $"vexforge-shader-shard-{configuration.ShardIndex:D3}-of-{configuration.ShardCount:D3}.json",
                summary);
        }

        private static void WriteSummaryFile(
            string projectRoot,
            string fileName,
            ShaderShardSummary summary)
        {
            var summaryDirectory = Path.Combine(
                projectRoot,
                "Builds",
                "ShaderShardWarmup",
                "checkpoints");
            Directory.CreateDirectory(summaryDirectory);

            var summaryPath = Path.Combine(summaryDirectory, fileName);
            File.WriteAllText(summaryPath, JsonUtility.ToJson(summary, true));
        }

        private static void WriteVariantManifest(
            string projectRoot,
            string fileName)
        {
            var manifestDirectory = Path.Combine(
                projectRoot,
                "Builds",
                "ShaderShardWarmup",
                "checkpoints",
                "variants");
            Directory.CreateDirectory(manifestDirectory);

            var manifestPath = Path.Combine(manifestDirectory, fileName);
            var lines = new List<string>
            {
                "fingerprint\tassigned_partition\tunity_version\tbuild_target"
            };

            lines.AddRange(
                VexforgeShaderShardContext.Fingerprints
                    .OrderBy(entry => entry, StringComparer.Ordinal)
                    .Select(entry =>
                        $"{entry}\t{Application.unityVersion}\t" +
                        $"{EditorUserBuildSettings.activeBuildTarget}"));
            File.WriteAllLines(manifestPath, lines);
        }

        private sealed class ShaderShardConfiguration
        {
            internal readonly int ShardIndex;
            internal readonly int ShardCount;
            internal readonly int RangeStartBps;
            internal readonly int RangeEndBps;
            internal readonly string Mode;

            internal ShaderShardConfiguration(int shardIndex, int shardCount, string mode)
            {
                ShardIndex = shardIndex;
                ShardCount = shardCount;
                RangeStartBps = ReadInt("VEXFORGE_SHADER_RANGE_START_BPS", -1);
                RangeEndBps = ReadInt("VEXFORGE_SHADER_RANGE_END_BPS", -1);
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

                if (RangeStartBps < 0
                    || RangeEndBps > HashSpaceBps
                    || RangeStartBps >= RangeEndBps)
                {
                    throw new InvalidOperationException(
                        $"VEXFORGE shader range must satisfy 0 <= start < end <= {HashSpaceBps}.");
                }

                var expectedStart = ShardIndex * HashSpaceBps / ShardCount;
                var expectedEnd = (ShardIndex + 1) * HashSpaceBps / ShardCount;
                if (RangeStartBps != expectedStart || RangeEndBps != expectedEnd)
                {
                    throw new InvalidOperationException(
                        $"VEXFORGE shader range {RangeStartBps}-{RangeEndBps}bps " +
                        $"does not match shard {ShardIndex}/{ShardCount}; " +
                        $"expected {expectedStart}-{expectedEnd}bps.");
                }
            }
        }

        [Serializable]
        private sealed class ShaderShardSummary
        {
            public string analysisMode;
            public int shardIndex;
            public int shardCount;
            public int rangeStartBps;
            public int rangeEndBps;
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
            public int uniqueFingerprints;
            public string failure;
        }
    }
}
#endif