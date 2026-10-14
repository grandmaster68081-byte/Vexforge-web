#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace Vexforge.EditorTools
{
    /// <summary>
    /// One-pass inventory used by the VEXFORGE visual-production order.
    /// Diagnostic only: it does not change scenes, packages, assets or gameplay state.
    /// Replit must continue implementation after running it; this report is not the deliverable.
    /// </summary>
    public static class VexforgeVisualProductionGate
    {
        private const string ManifestAssetPath = "Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json";
        private static readonly string[] TextureExtensions = { ".png", ".jpg", ".jpeg", ".tga", ".psd", ".exr", ".tif", ".asset" };
        private static readonly string[] SourceMarkers =
        {
            "CreatePrimitive(", "Shader.Find(", "Resources.Load<AudioClip>", "FindObjectsByType<",
            "new Material(", "SetActive(false)", "CAMPO DE BATALLA AÚN NO LISTO", "VF_CARD_FALLBACK_NEUTRAL"
        };

        [MenuItem("VEXFORGE/Production/Run Visual Production Gate")]
        public static void Run()
        {
            var report = new StringBuilder(32768);
            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var reportsDir = Path.Combine(projectRoot, "Reports");
            Directory.CreateDirectory(reportsDir);
            var reportPath = Path.Combine(reportsDir, "VexforgeVisualProductionGate.md");

            report.AppendLine("# VEXFORGE Visual Production Gate — one-pass inventory");
            report.AppendLine();
            report.AppendLine("Generated UTC: " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            report.AppendLine("Unity: " + Application.unityVersion);
            report.AppendLine("Platform: " + EditorUserBuildSettings.activeBuildTarget);
            report.AppendLine("Project root: `" + projectRoot.Replace("\\", "/") + "`");
            report.AppendLine("Current scene: `" + (EditorSceneManager.GetActiveScene().path ?? string.Empty) + "`");
            report.AppendLine("Render pipeline: `" + (GraphicsSettings.currentRenderPipeline == null ? "Built-in/None" : GraphicsSettings.currentRenderPipeline.GetType().FullName) + "`");
            var qualityNames = QualitySettings.names;
            var activeQualityName = qualityNames != null && qualityNames.Length > 0 ? qualityNames[Mathf.Clamp(QualitySettings.GetQualityLevel(), 0, qualityNames.Length - 1)] : "unknown";
            report.AppendLine("Quality level: `" + activeQualityName + "`");
            report.AppendLine();

            AppendAssetCount(report, "Scenes", "t:SceneAsset");
            AppendAssetCount(report, "Prefabs", "t:Prefab");
            AppendAssetCount(report, "Models", "t:Model");
            AppendAssetCount(report, "Materials", "t:Material");
            AppendAssetCount(report, "Textures", "t:Texture2D");
            AppendAssetCount(report, "Audio clips", "t:AudioClip");
            AppendAssetCount(report, "Animation clips", "t:AnimationClip");
            AppendAssetCount(report, "Animator controllers", "t:AnimatorController");
            AppendAssetCount(report, "Volume profiles", "t:VolumeProfile");
            AppendAssetCount(report, "Timeline assets", "t:TimelineAsset");
            report.AppendLine();

            report.AppendLine("## Build Settings scenes");
            var enabledScenes = 0;
            foreach (var scene in EditorBuildSettings.scenes)
            {
                if (scene.enabled) enabledScenes++;
                report.AppendLine("- [" + (scene.enabled ? "x" : " ") + "] `" + scene.path + "`");
            }
            report.AppendLine("Enabled scene count: **" + enabledScenes + "**");
            report.AppendLine();

            AppendManifestCheck(report, projectRoot);
            AppendImportantFolders(report, projectRoot);
            AppendScriptFindings(report);
            AppendPackageFacts(report, projectRoot);

            report.AppendLine("## Interpretation rules");
            report.AppendLine("- This is an inventory, not proof that the game is visually complete.");
            report.AppendLine("- A manifest field named `production` does not prove that a matching asset exists or is used at runtime.");
            report.AppendLine("- The order requires Replit to continue with production implementation after recording this report; do not stop here.");
            report.AppendLine("- Do not add local copies of official card art. The live catalog / Supabase resolver remains authoritative.");
            File.WriteAllText(reportPath, report.ToString(), new UTF8Encoding(false));
            AssetDatabase.Refresh();
            Debug.Log("VEXFORGE visual-production inventory written to: " + reportPath);
            EditorUtility.DisplayDialog("VEXFORGE Visual Production Gate", "Inventory generated. Continue the production order; this report is not a completion result.\n\n" + reportPath, "Open report folder");
            EditorUtility.RevealInFinder(reportPath);
        }

        private static void AppendAssetCount(StringBuilder report, string label, string filter)
        {
            var guids = AssetDatabase.FindAssets(filter);
            report.AppendLine("- " + label + ": **" + (guids == null ? 0 : guids.Length) + "**");
        }

        private static void AppendManifestCheck(StringBuilder report, string projectRoot)
        {
            report.AppendLine("## Canonical Unity visual manifest");
            var manifestAbsolute = Path.Combine(Application.dataPath, "Resources/VexforgeTier1/VexforgeTier1AssetManifest.json");
            if (!File.Exists(manifestAbsolute))
            {
                report.AppendLine("**FAIL:** manifest missing at `" + ManifestAssetPath + "`.");
                report.AppendLine();
                return;
            }

            var json = File.ReadAllText(manifestAbsolute);
            var knownCountMatch = Regex.Match(json, "\\\"known_count\\\"\\s*:\\s*(\\d+)");
            report.AppendLine("Manifest path: `" + ManifestAssetPath + "`");
            report.AppendLine("Declared card count: `" + (knownCountMatch.Success ? knownCountMatch.Groups[1].Value : "not found") + "`");
            report.AppendLine("Reminder: confirm count against the live catalog; this field alone is not proof.");

            var entryRegex = new Regex("\\{[^{}]*\\\"asset_id\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"[^{}]*\\\"resources_key\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"[^{}]*\\}", RegexOptions.Singleline);
            var matches = entryRegex.Matches(json);
            var checkedCount = 0;
            var missing = new List<string>();
            foreach (Match match in matches)
            {
                if (!match.Success || match.Groups.Count < 3) continue;
                checkedCount++;
                var assetId = match.Groups[1].Value;
                var key = match.Groups[2].Value.Replace('/', Path.DirectorySeparatorChar);
                var relativeBase = Path.Combine("Assets", "Resources", key);
                var found = false;
                foreach (var ext in TextureExtensions)
                {
                    var relative = relativeBase + ext;
                    var absolute = Path.Combine(projectRoot, relative);
                    if (File.Exists(absolute) && AssetDatabase.LoadAssetAtPath<Texture2D>(relative.Replace('\\', '/')) != null)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found) missing.Add(assetId + " -> " + match.Groups[2].Value);
            }
            report.AppendLine("World/visual resource-key entries scanned: **" + checkedCount + "**");
            report.AppendLine("Resource-key entries without a matching importable Texture2D in `Resources`: **" + missing.Count + "**");
            if (missing.Count > 0)
            {
                report.AppendLine("Missing/unimportable resources:");
                foreach (var item in missing) report.AppendLine("- `" + item + "`");
            }
            else
            {
                report.AppendLine("All parsed resource keys resolved to importable Texture2D assets. This still does not prove runtime usage/visual quality.");
            }
            report.AppendLine();
        }

        private static void AppendImportantFolders(StringBuilder report, string projectRoot)
        {
            report.AppendLine("## Production asset folders present");
            string[] folders =
            {
                "Assets/VexforgeProduction/Art/Environment/Nexus",
                "Assets/VexforgeProduction/Art/Environment/Battlefield",
                "Assets/VexforgeProduction/Art/Environment/Archive",
                "Assets/VexforgeProduction/Art/Environment/Forge",
                "Assets/VexforgeProduction/Art/Props/Shared",
                "Assets/VexforgeProduction/Art/Materials",
                "Assets/VexforgeProduction/Art/VFX",
                "Assets/VexforgeProduction/Art/Audio",
                "Assets/VexforgeProduction/Prefabs",
                "Assets/VexforgeProduction/Scenes",
                "Assets/VexforgeProduction/ScriptableObjects/VisualCatalogs"
            };
            foreach (var folder in folders)
            {
                var absolute = Path.Combine(projectRoot, folder.Replace('/', Path.DirectorySeparatorChar));
                var exists = Directory.Exists(absolute);
                var count = exists ? Directory.GetFiles(absolute, "*", SearchOption.AllDirectories).Length : 0;
                report.AppendLine("- `" + folder + "`: " + (exists ? "present, " + count + " files" : "not present"));
            }
            report.AppendLine();
        }

        private static void AppendScriptFindings(StringBuilder report)
        {
            report.AppendLine("## Source-code heuristics (manual review required)");
            var scriptRoot = Path.Combine(Application.dataPath, "Scripts");
            if (!Directory.Exists(scriptRoot))
            {
                report.AppendLine("Scripts folder not found at `Assets/Scripts`; locate the actual source path and rerun if appropriate.");
                report.AppendLine();
                return;
            }

            var counts = new Dictionary<string, int>(StringComparer.Ordinal);
            foreach (var marker in SourceMarkers) counts[marker] = 0;
            var snippets = new List<string>();
            var files = Directory.GetFiles(scriptRoot, "*.cs", SearchOption.AllDirectories);
            foreach (var file in files)
            {
                string[] lines;
                try { lines = File.ReadAllLines(file); }
                catch { continue; }
                for (var i = 0; i < lines.Length; i++)
                {
                    var line = lines[i];
                    foreach (var marker in SourceMarkers)
                    {
                        if (line.IndexOf(marker, StringComparison.Ordinal) >= 0)
                        {
                            counts[marker]++;
                            if (snippets.Count < 90)
                            {
                                var relative = file.Substring(Application.dataPath.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Replace('\\', '/');
                                var content = line.Trim();
                                if (content.Length > 180) content = content.Substring(0, 180) + "…";
                                snippets.Add("- `Assets/" + relative + ":" + (i + 1) + "` — `" + marker + "` — " + content.Replace("`", "'") );
                            }
                        }
                    }
                }
            }
            foreach (var pair in counts) report.AppendLine("- `" + pair.Key + "`: " + pair.Value + " occurrence(s)");
            report.AppendLine("\nUp to 90 source locations:");
            foreach (var item in snippets) report.AppendLine(item);
            report.AppendLine();
        }

        private static void AppendPackageFacts(StringBuilder report, string projectRoot)
        {
            report.AppendLine("## Relevant package declarations");
            var manifestPath = Path.Combine(projectRoot, "Packages", "manifest.json");
            var lockPath = Path.Combine(projectRoot, "Packages", "packages-lock.json");
            if (File.Exists(manifestPath))
            {
                var text = File.ReadAllText(manifestPath);
                string[] packages = { "com.unity.render-pipelines.universal", "com.unity.shadergraph", "com.unity.cinemachine", "com.unity.timeline", "com.unity.addressables", "com.unity.visualeffectgraph" };
                foreach (var package in packages)
                {
                    var pattern = "\\\"" + Regex.Escape(package) + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"";
                    var match = Regex.Match(text, pattern);
                    report.AppendLine("- `" + package + "`: " + (match.Success ? match.Groups[1].Value : "not declared directly in manifest.json"));
                }
            }
            else report.AppendLine("`Packages/manifest.json` missing; locate actual project path.");
            report.AppendLine("`packages-lock.json`: " + (File.Exists(lockPath) ? "present — inspect for resolved/transitive packages" : "not found"));
            report.AppendLine();
        }
    }
}
#endif
