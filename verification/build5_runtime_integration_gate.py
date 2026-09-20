#!/usr/bin/env python3
"""Static gate for the Unity runtime seams required before Cloud Build 5."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "unity/Assets/Scripts"
SHELL_PATH = SCRIPTS / "UI/GameShellController.cs"
APP_PATH = SCRIPTS / "Core/VexforgeApp.cs"
HUD_PATH = SCRIPTS / "UI/VexforgeAlphaHud.cs"
DIRECTOR_PATH = SCRIPTS / "Presentation/BattlePresentationDirector.cs"
errors: list[str] = []


def require(text: str, token: str, label: str) -> None:
    if token not in text:
        errors.append(f"{label}: missing {token}")


shell = SHELL_PATH.read_text(encoding="utf-8")
app = APP_PATH.read_text(encoding="utf-8")
hud = HUD_PATH.read_text(encoding="utf-8")
director = DIRECTOR_PATH.read_text(encoding="utf-8")

for token in [
    "VexforgeAlphaWorldDirector",
    "VexforgeAlphaHud",
    "VexforgeCardInspectionStage",
    "VexforgeDiegeticInputRouter",
    "await app.InitializeAsync();",
    "BuildBattlePresentationHost();",
    "InitializeBattlePresentation();",
    "alphaHud.Initialize(",
    "alphaWorld.Initialize(",
    "alphaWorld.BindGalleryRoot(",
    "battleDirector.Initialize(",
    "alphaHud.RenderRoute(",
]:
    require(shell, token, "GameShellController")

start = shell[shell.index("private async void Start()"):]
start = start[:start.index("private void BuildBattlePresentationHost()")]
ordered_start_tokens = [
    "await app.InitializeAsync();",
    "BuildPresentation();",
    "BuildBattlePresentationHost();",
    "InitializeBattlePresentation();",
    "BuildCanvas();",
    "alphaHud.Initialize(",
    "Subscribe();",
    "Render();",
]
positions = []
for token in ordered_start_tokens:
    position = start.find(token)
    if position < 0:
        errors.append(f"GameShellController.Start: missing {token}")
    positions.append(position)
if all(position >= 0 for position in positions) and positions != sorted(positions):
    errors.append("GameShellController.Start: initialization order is not canonical")

require(shell, "new GameObject(\"CardInspectionStage\")", "Card inspection")
require(
    shell,
    "cardInspectionObject.transform.SetParent(presentationHost.transform, false);",
    "Card inspection",
)
require(shell, "cardInspectionObject.AddComponent<VexforgeCardInspectionStage>()", "Card inspection")
require(shell, "cardInspection.Initialize(presentationCamera, alphaInput, artResolver)", "Card inspection")
require(shell, "cardInspection.Closed += HandleCardInspectionClosed", "Card inspection")
require(shell, "gallery.CardSelected += HandleCardSelected", "Card inspection")
if "presentationHost.AddComponent<VexforgeCardInspectionStage>()" in shell:
    errors.append("Card inspection: legacy host-level AddComponent remains")

require(shell, 'new GameObject("BattlePresentationHost")', "Battle host")
require(shell, 'new GameObject("BattlefieldStage")', "Battle host")
require(shell, "battlefieldObject.transform.SetParent(host.transform, false);", "Battle host")
require(shell, "host.AddComponent<BattlePresentationDirector>()", "Battle host")
require(shell, "GetComponentInChildren<VexforgeBattlefieldStage>(true)", "Battle host")
require(shell, "alphaWorld.BindBattlefield(battlefield)", "Battle host")

require(app, "private Task initializationTask;", "VexforgeApp")
require(app, "if (initializationTask != null)", "VexforgeApp")
require(app, "initializationTask = InitializeCore();", "VexforgeApp")
require(app, "GetComponent<GameShellController>()", "VexforgeApp")
if re.search(r"\basync\s+Task\s+InitializeAsync\s*\(", app):
    errors.append("VexforgeApp: InitializeAsync reverted to independent async tasks")

require(hud, "if (battleDirector == null || !battleDirector.IsInitialized)", "Alpha HUD battle guard")
require(hud, "battleDirector.Play(result.events);", "Alpha HUD battle path")
require(director, "public bool IsInitialized", "Battle director")
require(director, "if (!initialized)", "Battle director")
require(director, "requires Initialize() first.", "Battle director")
require(director, "GetComponentsInChildren<VexforgeBattlefieldStage>(true)", "Battle director stage isolation")

legacy_resolve = shell[shell.index("private async void ResolveBattle("):]
legacy_play = legacy_resolve.find("battleDirector.Play(")
legacy_guard = legacy_resolve.find("if (battleDirector == null || !battleDirector.IsInitialized)")
if legacy_play < 0 or legacy_guard < 0 or legacy_guard > legacy_play:
    errors.append("GameShellController: legacy battle Play() is not guarded")
if "host.AddComponent<VexforgeBattlefieldStage>()" in shell:
    errors.append("Battle host: battlefield is still attached to the director host")

for token in [
    "VexforgeSocialHub",
    "VexforgeGlobalChatDock",
    "socialHub.Initialize(",
    "globalChatDock.Initialize(",
]:
    require(hud, token, "Active social HUD")

if "nexusStage.Initialize(app);" in shell and "alphaWorld" not in shell:
    errors.append("GameShellController: legacy Nexus path is the only presentation path")

director_adds = 0
for path in SCRIPTS.rglob("*.cs"):
    director_adds += path.read_text(encoding="utf-8").count(
        "AddComponent<BattlePresentationDirector>()"
    )
if director_adds != 1:
    errors.append(
        "Battle director: expected one runtime AddComponent, found "
        + str(director_adds)
    )

if errors:
    print("BUILD5_RUNTIME_INTEGRATION_GATE FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("BUILD5_RUNTIME_INTEGRATION_GATE PASS")