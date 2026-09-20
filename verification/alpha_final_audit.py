#!/usr/bin/env python3
"""Final static audit for the integrated VEXFORGE repository."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

required_files = [
    "supabase/migrations/20260920010000_vexforge_social_alpha.sql",
    "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs",
    "unity/Assets/Scripts/UI/VexforgeSocialHub.cs",
    "unity/Assets/Scripts/UI/VexforgeGlobalChatDock.cs",
    "unity/Assets/Scripts/UI/VexforgeAlphaHud.cs",
    "unity/Assets/Scripts/Presentation/VexforgeAlphaWorldDirector.cs",
    "unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs",
    "unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs",
]

for relative in required_files:
    if not (ROOT / relative).exists():
        errors.append(f"missing integrated file: {relative}")

social_csharp = [
    ROOT / "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs",
    ROOT / "unity/Assets/Scripts/UI/VexforgeSocialHub.cs",
    ROOT / "unity/Assets/Scripts/UI/VexforgeGlobalChatDock.cs",
    ROOT / "unity/Assets/Scripts/UI/VexforgeAlphaHud.cs",
]

def balanced_csharp(text: str) -> bool:
    cleaned: list[str] = []
    state = "code"
    i = 0
    while i < len(text):
        c = text[i]
        n = text[i + 1] if i + 1 < len(text) else ""
        if state == "code":
            if c == "/" and n == "/":
                state = "line"
                cleaned.extend([" ", " "])
                i += 2
                continue
            if c == "/" and n == "*":
                state = "block"
                cleaned.extend([" ", " "])
                i += 2
                continue
            if c == '"':
                state = "string"
                cleaned.append(" ")
                i += 1
                continue
            cleaned.append(c)
            i += 1
            continue
        if state == "line":
            cleaned.append("\n" if c == "\n" else " ")
            i += 1
            if c == "\n":
                state = "code"
            continue
        if state == "block":
            if c == "*" and n == "/":
                state = "code"
                cleaned.extend([" ", " "])
                i += 2
                continue
            cleaned.append("\n" if c == "\n" else " ")
            i += 1
            continue
        if c == "\\":
            cleaned.extend([" ", " "])
            i += 2
            continue
        cleaned.append("\n" if c == "\n" else " ")
        i += 1
        if c == '"':
            state = "code"
    code = "".join(cleaned)
    return all(code.count(opening) == code.count(closing) for opening, closing in [
        ("{", "}"), ("(", ")"), ("[", "]")
    ])

for path in social_csharp:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if "using UnityEditor" in text or "UnityEditor." in text:
        errors.append(f"runtime editor dependency: {path.relative_to(ROOT)}")
    if "Physics.RaycastAll" in text:
        errors.append(f"allocation-heavy raycast: {path.relative_to(ROOT)}")
    if not balanced_csharp(text):
        errors.append(f"delimiter mismatch: {path.relative_to(ROOT)}")
    meta = Path(str(path) + ".meta")
    if not meta.exists() or not meta.read_bytes().endswith(b"\n"):
        errors.append(f"missing or unterminated meta: {meta.relative_to(ROOT)}")

repository = (ROOT / "unity/Assets/Scripts/Backend/VexforgeSocialRepository.cs").read_text(
    encoding="utf-8"
)
if re.search(r"\b(?:select|insert|update|delete)\b.+\bfrom\b", repository, re.I | re.S):
    errors.append("social repository appears to embed direct SQL/table reads")

hub = (ROOT / "unity/Assets/Scripts/UI/VexforgeSocialHub.cs").read_text(encoding="utf-8")
for token in [
    "OpenFriends", "OpenGlobal", "OpenClan", "SearchPlayersAsync",
    "RespondRequestAsync", "CancelRequestAsync", "SendPrivateMessageAsync",
    "SendGlobalMessageAsync", "SendClanMessageAsync", "CreateClanAsync",
    "JoinClanAsync", "LeaveClanAsync", "TouchPresenceHeartbeatAsync",
    "lastRenderFingerprint", "ComputeActiveFingerprint", "IsCurrent",
]:
    if token not in hub:
        errors.append(f"social hub missing: {token}")
if "RenderClanMessagesAsync" in hub:
    errors.append("obsolete duplicate clan renderer remains")
if "IsNullOrWhiteSpace(statusLabel)" in hub:
    errors.append("invalid statusLabel expression remains")

alpha = (ROOT / "unity/Assets/Scripts/UI/VexforgeAlphaHud.cs").read_text(encoding="utf-8")
for token in ["VexforgeSocialHub", "VexforgeGlobalChatDock", "HALL DE ALIADOS",
              "OpenSocialHub", "HandleSessionChanged", "HideForSignedOut"]:
    if token not in alpha:
        errors.append(f"alpha HUD integration missing: {token}")
if "enum GameRoute" in alpha:
    errors.append("Alpha HUD declares a parallel GameRoute enum")

sql = (ROOT / "supabase/migrations/20260920010000_vexforge_social_alpha.sql").read_text(
    encoding="utf-8"
)
if sql.count("security definer") < 20:
    errors.append("social migration has fewer than 20 security-definer functions")
for path in [p for p in ROOT.glob("unity/Assets/Scripts/**/*.cs") if "Editor" not in p.parts]:
    if path.name.startswith("VexforgeSocial") or path.name == "VexforgeGlobalChatDock.cs":
        if not Path(str(path) + ".meta").exists():
            errors.append(f"social runtime meta missing: {path.relative_to(ROOT)}")

print("ALPHA_FINAL_AUDIT_FILES", len(required_files))
if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    raise SystemExit(1)
print("PASS")