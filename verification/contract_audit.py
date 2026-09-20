#!/usr/bin/env python3
"""Public-main contract audit for the VEXFORGE v1.2 integration."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def read(relative: str) -> str:
    path = ROOT / relative
    if not path.exists():
        errors.append(f"missing contract file: {relative}")
        return ""
    return path.read_text(encoding="utf-8")


shell = read("unity/Assets/Scripts/UI/GameShellController.cs")
app = read("unity/Assets/Scripts/Core/VexforgeApp.cs")
director = read("unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs")
hud = read("unity/Assets/Scripts/UI/VexforgeAlphaHud.cs")
precheck = read("docs/vexforge-canonical/BUILD_5_PRECHECK.md")
project_version = read("unity/ProjectSettings/ProjectVersion.txt")
cloud_gate = read("unity/Assets/Editor/VexforgeR5CloudBuildGate.cs")
social_repository = read("unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs")

for token in [
    "BuildPresentation();",
    "BuildBattlePresentationHost();",
    "InitializeBattlePresentation();",
    "BuildCanvas();",
    "alphaHud.Initialize(",
    "Subscribe();",
    "Render();",
    "alphaWorld.BindBattlefield(battlefield)",
]:
    if token not in shell:
        errors.append(f"shell contract missing: {token}")

for token in ["initializationTask", "InitializeCore", "GetComponent<GameShellController>()"]:
    if token not in app:
        errors.append(f"app contract missing: {token}")

for token in [
    "public bool IsInitialized",
    "GetComponentsInChildren<VexforgeBattlefieldStage>(true)",
    "requires Initialize() first.",
]:
    if token not in director:
        errors.append(f"battle contract missing: {token}")

for token in ["VexforgeSocialHub", "VexforgeGlobalChatDock", "OpenSocialHub"]:
    if token not in hud:
        errors.append(f"social HUD contract missing: {token}")
for token in ["social_list_friend_data", "social_send_private_message", "social_get_clan_hall"]:
    if token not in social_repository:
        errors.append(f"social repository contract missing: {token}")
for token in ["build5_runtime_integration_gate.py", "POST .../builds", "vexforge-android-qa"]:
    if token not in precheck:
        errors.append(f"precheck contract missing: {token}")
if "6000.3.0f1" not in project_version:
    errors.append("Unity editor contract mismatch")
if "IPreprocessBuildWithReport" not in cloud_gate:
    errors.append("R5 Cloud Gate contract missing")

print("CONTRACT_AUDIT_PUBLIC_MAIN")
if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("PASS")