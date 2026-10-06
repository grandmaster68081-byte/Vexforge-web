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

        [MenuItem("VEXFORGE/Tier1/Validate Production Closure V15.1")]
        public static void Validate()
        {
            var projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            var errors = new List<string>();
            var warnings = new List<string>();

            CheckFile(projectRoot, "Assets/Scripts/Core/VexforgeApp.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Backend/VexforgeRepository.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Backend/PvpOpponentRecord.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Presentation/BattlePresentationDirector.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Presentation/VexforgeCardArtResolver.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/UI/GameShellController.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/UI/VexforgeAlphaHud.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1RouteOwnership.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1RouteSurface.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1TurnCombatGate.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1CanonicalBattlefieldPolish.cs", errors);
            CheckFile(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1TutorialDirector.cs", errors);
            CheckFile(projectRoot, "Assets/Resources/VexforgeTier1/VexforgeProductionConfig.json", errors);
            CheckFile(projectRoot, "Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json", errors);

            var versionPath = Path.Combine(projectRoot, "ProjectSettings/ProjectVersion.txt");
            CheckFile(projectRoot, "ProjectSettings/ProjectVersion.txt", errors);
            if (File.Exists(versionPath) && !File.ReadAllText(versionPath).Contains(UnityVersion))
                errors.Add("ProjectVersion.txt no corresponde a Unity " + UnityVersion);

            var configPath = Path.Combine(projectRoot, "Assets/Resources/VexforgeTier1/VexforgeProductionConfig.json");
            if (File.Exists(configPath))
            {
                var config = File.ReadAllText(configPath);
                Require(config, Treasury, "Treasury address", errors);
                Require(config, "\"enabled\": false", "Treasury must remain disabled", errors);
                Require(config, "\"client_roll_forbidden\": true", "Client RNG guard", errors);
                Require(config, "\"copy_to_client_repo\": false", "Official art copy guard", errors);
            }

            var manifestPath = Path.Combine(projectRoot, "Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json");
            if (File.Exists(manifestPath))
            {
                var manifest = File.ReadAllText(manifestPath);
                Require(manifest, "Tier1ProductionClosureV15", "V15 asset manifest", errors);
                Require(manifest, "\"known_count\": 127", "127-card inventory", errors);
                Require(manifest, "\"local_card_art_copy_forbidden\": true", "Remote card art guard", errors);
            }

            var shellPath = Path.Combine(projectRoot, "Assets/Scripts/UI/GameShellController.cs");
            if (File.Exists(shellPath))
            {
                var shell = File.ReadAllText(shellPath);
                Forbidden(shell, "UUID DEL OPONENTE", "legacy UUID battle input", errors);
                Forbidden(shell, "Guid.NewGuid().ToString(\"N\")", "client-created battle idempotency", errors);
                Require(shell, "CanonicalArtResolver", "explicit canonical resolver bridge", errors);
                Require(shell, "VexforgeTier1BattleGate", "Tier-1 battle bridge", errors);
            }

            var hudPath = Path.Combine(projectRoot, "Assets/Scripts/UI/VexforgeAlphaHud.cs");
            if (File.Exists(hudPath))
            {
                var hud = File.ReadAllText(hudPath);
                Forbidden(hud, "UUID DEL OPONENTE", "legacy UUID battle input", errors);
                Forbidden(hud, "Guid.NewGuid().ToString(\"N\")", "client-created battle idempotency", errors);
                Require(hud, "VexforgeTier1RouteOwnership.Owns", "route ownership gate", errors);
            }

            var repoPath = Path.Combine(projectRoot, "Assets/Scripts/Backend/VexforgeRepository.cs");
            if (File.Exists(repoPath))
            {
                var repo = File.ReadAllText(repoPath);
                Require(repo, "GetPvpOpponentsAsync", "centralized opponent discovery", errors);
                Require(repo, "get_pvp_opponents", "authoritative opponent RPC", errors);
                Require(repo, "vexforge_battle_resolve", "authoritative battle RPC", errors);
                Require(repo, "vexforge_turn_v7_start_training", "V7 training start RPC", errors);
                Require(repo, "vexforge_turn_v7_create_pvp_room", "V7 PvP room creation RPC", errors);
                Require(repo, "vexforge_turn_v7_discover_pvp_rooms", "V7 PvP room discovery RPC", errors);
                Require(repo, "vexforge_turn_v7_join_pvp_room", "V7 PvP room join RPC", errors);
                Require(repo, "vexforge_turn_v7_get_state", "V7 state RPC", errors);
                Require(repo, "vexforge_turn_v7_legal_actions", "V7 legal actions RPC", errors);
                Require(repo, "vexforge_turn_v7_submit_action", "V7 authoritative action RPC", errors);
            }

            var gatePath = Path.Combine(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs");
            if (File.Exists(gatePath))
            {
                var gate = File.ReadAllText(gatePath);
                Forbidden(gate, "RpcAsync(\"get_pvp_opponents\"", "direct backend access from Tier-1 BattleGate", errors);
                Require(gate, "GetPvpOpponentsAsync", "repository-based opponent discovery", errors);
                Require(gate, "OpenTurnCombatPvp", "V7 PvP route from the battle gate", errors);
                Require(gate, "PresentationCompleted", "presentation completion gate", errors);
                Require(gate, "GetOrCreate", "persistent operation journal", errors);
            }

            var turnGatePath = Path.Combine(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1TurnCombatGate.cs");
            var pvpGatePath = Path.Combine(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1TurnCombatGate.Pvp.cs");
            if (File.Exists(turnGatePath))
            {
                var turnGate = File.ReadAllText(turnGatePath);
                var pvpGate = File.Exists(pvpGatePath) ? File.ReadAllText(pvpGatePath) : string.Empty;
                var v7Gate = turnGate + "\n" + pvpGate;
                Forbidden(v7Gate, "RpcAsync(", "direct backend access from V7 turn-combat UI", errors);
                Require(v7Gate, "SubmitTurnCombatActionAsync", "V7 intent submission through repository", errors);
                Require(v7Gate, "CreateTurnCombatPvpRoomAsync", "V7 PvP room creation through repository", errors);
                Require(v7Gate, "DiscoverTurnCombatPvpRoomsAsync", "V7 PvP room discovery through repository", errors);
                Require(v7Gate, "JoinTurnCombatPvpRoomAsync", "V7 PvP room join through repository", errors);
                Require(v7Gate, "OpenPvp", "V7 PvP entry point", errors);
                Require(v7Gate, "awaiting_opponent", "V7 PvP waiting-room state", errors);
                Require(v7Gate, "legal_actions", "server-provided legal action rendering", errors);
                Require(v7Gate, "SNAPSHOT CONFIRMADO", "event-state replay from confirmed snapshots", errors);
            }

            var bootstrapPath = Path.Combine(projectRoot, "Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs");
            if (File.Exists(bootstrapPath))
            {
                var bootstrap = File.ReadAllText(bootstrapPath);
                Require(bootstrap, "VexforgeTier1TurnCombatGate", "V7 training gate registration", errors);
                Require(bootstrap, "BindTurnCombatGate", "V7 training route binding", errors);
            }

            foreach (var cs in Directory.GetFiles(Path.Combine(projectRoot, "Assets/Scripts"), "*.cs", SearchOption.AllDirectories))
            {
                var text = File.ReadAllText(cs);
                if (!cs.EndsWith("VexforgeRepository.cs"))
                    Forbidden(text, "RpcAsync(\"vexforge_turn_v7_", "V7 RPC outside repository", errors);
                if (!cs.EndsWith("VexforgeRepository.cs"))
                    Forbidden(text, "RpcAsync(\"vexforge_battle_resolve\"", "battle resolve RPC outside repository", errors);
            }

            CheckGuids(Path.Combine(projectRoot, "Assets"), errors);

            if (errors.Count > 0)
            {
                foreach (var error in errors) Debug.LogError("VEXFORGE V15.1 FAIL: " + error);
                Debug.LogError("VEXFORGE V15.1 production closure FAILED: " + errors.Count + " error(s).");
                return;
            }

            foreach (var warning in warnings) Debug.LogWarning("VEXFORGE V15.1 WARNING: " + warning);
            Debug.Log("VEXFORGE V15.1 production closure PASS");
        }

        private static void CheckFile(string root, string relative, List<string> errors)
        {
            if (!File.Exists(Path.Combine(root, relative))) errors.Add("Falta archivo requerido: " + relative);
        }
        private static void Require(string text, string needle, string label, List<string> errors)
        {
            if (!text.Contains(needle)) errors.Add("Falta contrato: " + label);
        }
        private static void Forbidden(string text, string needle, string label, List<string> errors)
        {
            if (text.Contains(needle)) errors.Add("Construcción prohibida presente: " + label);
        }
        private static void CheckGuids(string assetsRoot, List<string> errors)
        {
            var seen = new Dictionary<string, string>();
            foreach (var path in Directory.GetFiles(assetsRoot, "*.meta", SearchOption.AllDirectories))
            {
                var text = File.ReadAllText(path);
                var match = Regex.Match(text, "^guid:\\s*([0-9a-f]+)$", RegexOptions.Multiline);
                if (!match.Success) continue;
                var guid = match.Groups[1].Value;
                string previous;
                if (seen.TryGetValue(guid, out previous) && previous != path)
                    errors.Add("GUID duplicado: " + guid + " -> " + previous + " <> " + path);
                else
                    seen[guid] = path;
            }
        }
    }
}
#endif
