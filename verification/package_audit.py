#!/usr/bin/env python3
"""Repository-level v1.2 package audit for the public VEXFORGE tree."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

required = [
    "unity/Assets/Scripts/UI/GameShellController.cs",
    "unity/Assets/Scripts/Core/VexforgeApp.cs",
    "unity/Assets/Scripts/UI/VexforgeAlphaHud.cs",
    "unity/Assets/Scripts/UI/VexforgeSocialHub.cs",
    "unity/Assets/Scripts/UI/VexforgeGlobalChatDock.cs",
    "unity/Assets/Scripts/Presentation/VexforgeAlphaWorldDirector.cs",
    "unity/Assets/Scripts/Presentation/VexforgeCardInspectionStage.cs",
    "unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs",
    "unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs",
    "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs",
    "supabase/migrations/20260920010000_vexforge_social_alpha.sql",
]

for relative in required:
    if not (ROOT / relative).exists():
        errors.append(f"missing required public-main file: {relative}")

shell = (ROOT / required[0]).read_text(encoding="utf-8")
app = (ROOT / required[1]).read_text(encoding="utf-8")
social_sql = (ROOT / required[-1]).read_text(encoding="utf-8")

for token in [
    "await app.InitializeAsync();",
    "VexforgeAlphaWorldDirector",
    "VexforgeAlphaHud",
    "VexforgeCardInspectionStage",
    "BuildBattlePresentationHost();",
    "InitializeBattlePresentation();",
    "alphaWorld.Initialize(",
    "battleDirector.Initialize(",
    "alphaHud.RenderRoute(",
]:
    if token not in shell:
        errors.append(f"GameShell integration missing: {token}")

if "initializationTask" not in app or "InitializeCore" not in app:
    errors.append("VexforgeApp idempotent initialization missing")
if "create table if not exists public.social_friend_requests" not in social_sql:
    errors.append("social migration contract missing")
if social_sql.count("security definer") < 20:
    errors.append("social migration security-definer RPC count is below contract")

for path in ROOT.glob("unity/Assets/Scripts/**/*.cs"):
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "using UnityEditor" in text or "UnityEditor." in text:
        if "Editor" not in path.parts:
            errors.append(f"runtime editor dependency: {path.relative_to(ROOT)}")
    if "Physics.RaycastAll" in text:
        errors.append(f"allocation-heavy raycast: {path.relative_to(ROOT)}")

print("PACKAGE_AUDIT_PUBLIC_MAIN_FILES", len(required))
if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("PASS")