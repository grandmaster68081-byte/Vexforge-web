#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;

namespace Vexforge.Tier1.Editor
{
    public static class VexforgeTier1BuildValidator
    {
        private const string UnityVersion = "6000.3.0f1";
        private const string Treasury = "0x29B2907d6E10BeB2becb9bA82f2b6af04815c403";

        [MenuItem("VEXFORGE/Tier1/Validate Production Closure")]
        public static void Validate()
        {
            var errors = 0;
            var projectVersion = File.ReadAllText(Path.Combine(Application.dataPath, "../ProjectSettings/ProjectVersion.txt"));
            if (!projectVersion.Contains(UnityVersion)) errors++;

            var required = new[]
            {
                "Assets/Scripts/Core/VexforgeApp.cs",
                "Assets/Scripts/Backend/VexforgeRepository.cs",
                "Assets/Scripts/Presentation/BattlePresentationDirector.cs",
                "Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs",
                "Assets/Scripts/Presentation/VexforgeCardArtResolver.cs",
                "Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs",
                "Assets/Scripts/UI/GameShellController.cs",
                "Assets/Resources/VexforgeTier1/VexforgeProductionConfig.json",
                "Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json",
                "Assets/Scripts/Tier1/VexforgeTier1IdentityScope.cs",
                "Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs",
                "Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs",
                "Assets/Scripts/Tier1/VexforgeTier1CanonicalBattlefieldPolish.cs",
                "Assets/Scripts/Tier1/VexforgeTier1CardImmersionDirector.cs",
                "Assets/Scripts/Tier1/VexforgeTier1CinematicDirector.cs",
                "Assets/Scripts/Tier1/VexforgeTier1EncounterPresentationDirector.cs",
                "Assets/Scripts/Tier1/VexforgeTier1LegacyHudSuppressor.cs",
                "Assets/Scripts/Tier1/VexforgeTier1LegacyRouteFrame.cs",
                "Assets/Scripts/Tier1/VexforgeTier1NavigationRail.cs",
                "Assets/Scripts/Tier1/VexforgeTier1OperationJournal.cs",
                "Assets/Scripts/Tier1/VexforgeTier1RoomOrnamentDirector.cs",
                "Assets/Scripts/Tier1/VexforgeTier1RouteSurface.cs",
                "Assets/Scripts/Tier1/VexforgeTier1TutorialDirector.cs",
                "Assets/Scripts/Tier1/VexforgeTier1Ui.cs",
                "Assets/Scripts/Tier1/VexforgeTier1VisualFoundation.cs"
            };
            foreach (var path in required) if (!File.Exists(Path.Combine(Application.dataPath, "..", path))) errors++;

            var configPath = Path.Combine(Application.dataPath, "../Assets/Resources/VexforgeTier1/VexforgeProductionConfig.json");
            if (File.Exists(configPath))
            {
                var config = File.ReadAllText(configPath);
                if (!config.Contains(Treasury)) errors++;
                if (!config.Contains("\"enabled\": false")) errors++;
                if (!config.Contains("\"copy_to_client_repo\": false")) errors++;
                if (!config.Contains("\"client_roll_forbidden\": true")) errors++;
            }

            var assetManifestPath = Path.Combine(Application.dataPath, "../Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json");
            if (File.Exists(assetManifestPath))
            {
                var manifest = File.ReadAllText(assetManifestPath);
                if (!manifest.Contains("Tier1ProductionClosureV15")) errors++;
                if (!manifest.Contains("\"known_count\": 127")) errors++;
                if (!manifest.Contains("\"local_card_art_copy_forbidden\": true")) errors++;
            }

            errors += CheckGuidUniqueness(Path.Combine(Application.dataPath));
            errors += CheckTier1ForbiddenConstructs(Path.Combine(Application.dataPath, "Scripts/Tier1"));
            errors += CheckBattleEventContracts(Path.Combine(Application.dataPath, "Scripts/Tier1"));

            if (errors == 0)
                Debug.Log("VEXFORGE Tier1 V15 production closure static gate passed. Unity compile, Cloud Build, live backend and device QA remain environment gates.");
            else
                Debug.LogError("VEXFORGE Tier1 V15 production closure static gate found " + errors + " issue(s). See Console and run after resolving the reported files.");
        }

        private static int CheckTier1ForbiddenConstructs(string tierPath)
        {
            if (!Directory.Exists(tierPath)) return 1;
            var errors = 0;
            foreach (var path in Directory.GetFiles(tierPath, "*.cs", SearchOption.AllDirectories))
            {
                var text = File.ReadAllText(path);
                if (text.Contains("Guid.NewGuid()")) { Debug.LogError("VEXFORGE Tier1 forbidden Guid.NewGuid() in " + path); errors++; }
                if (text.Contains("vexforge_battle_resolve")) { Debug.LogError("VEXFORGE Tier1 must call the canonical repository rather than embed the battle RPC in " + path); errors++; }
            }
            return errors;
        }


        private static int CheckBattleEventContracts(string tierPath)
        {
            if (!Directory.Exists(tierPath)) return 1;
            var errors = 0;
            foreach (var path in Directory.GetFiles(tierPath, "*.cs", SearchOption.AllDirectories))
            {
                var text = File.ReadAllText(path);
                if (text.Contains("BattleEvent") && !text.Contains("using Vexforge.Backend;") && !text.Contains("Vexforge.Backend.BattleEvent"))
                {
                    Debug.LogError("VEXFORGE BattleEvent consumer missing Vexforge.Backend import: " + path);
                    errors++;
                }
                if (text.Contains("vexforge_battle_resolve") || text.Contains("Guid.NewGuid()") || text.Contains("Random.Range("))
                {
                    Debug.LogError("VEXFORGE Tier1 local authority/randomness construct found: " + path);
                    errors++;
                }
            }
            return errors;
        }

        private static int CheckGuidUniqueness(string assetsPath)
        {
            var seen = new Dictionary<string, string>();
            var errors = 0;
            foreach (var path in Directory.GetFiles(assetsPath, "*.meta", SearchOption.AllDirectories))
            {
                var text = File.ReadAllText(path);
                var match = Regex.Match(text, "^guid:\\s*([0-9a-f]+)$", RegexOptions.Multiline);
                if (!match.Success) continue;
                var guid = match.Groups[1].Value;
                string previous;
                if (seen.TryGetValue(guid, out previous) && previous != path)
                {
                    Debug.LogError("VEXFORGE duplicate Unity GUID " + guid + ": " + previous + " <> " + path);
                    errors++;
                }
                else seen[guid] = path;
            }
            return errors;
        }
    }
}
#endif
