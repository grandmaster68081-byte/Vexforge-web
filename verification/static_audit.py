#!/usr/bin/env python3
"""Static Unity runtime audit for the public VEXFORGE main tree."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "unity/Assets/Scripts/UI/GameShellController.cs",
    ROOT / "unity/Assets/Scripts/UI/VexforgeAlphaHud.cs",
    ROOT / "unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs",
    ROOT / "unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs",
    ROOT / "unity/Assets/Scripts/Presentation/VexforgeCardInspectionStage.cs",
    ROOT / "unity/Assets/Scripts/Presentation/VexforgeAlphaWorldDirector.cs",
]
errors: list[str] = []


def strip_comments_and_strings(text: str) -> str:
    output: list[str] = []
    state = "code"
    i = 0
    while i < len(text):
        c = text[i]
        n = text[i + 1] if i + 1 < len(text) else ""
        if state == "code":
            if c == "/" and n == "/":
                output.extend("  ")
                state = "line"
                i += 2
                continue
            if c == "/" and n == "*":
                output.extend("  ")
                state = "block"
                i += 2
                continue
            if c == '"':
                output.append(" ")
                state = "string"
                i += 1
                continue
            output.append(c)
            i += 1
            continue
        if state == "line":
            output.append("\n" if c == "\n" else " ")
            i += 1
            if c == "\n":
                state = "code"
            continue
        if state == "block":
            if c == "*" and n == "/":
                output.extend("  ")
                state = "code"
                i += 2
                continue
            output.append("\n" if c == "\n" else " ")
            i += 1
            continue
        if c == "\\":
            output.extend("  ")
            i += 2
            continue
        output.append("\n" if c == "\n" else " ")
        i += 1
        if c == '"':
            state = "code"
    return "".join(output)


for path in TARGETS:
    if not path.exists():
        errors.append(f"missing target: {path.relative_to(ROOT)}")
        continue
    text = path.read_text(encoding="utf-8")
    clean = strip_comments_and_strings(text)
    for opening, closing in [("{", "}"), ("(", ")"), ("[", "]")]:
        if clean.count(opening) != clean.count(closing):
            errors.append(f"delimiter mismatch: {path.relative_to(ROOT)}")
    if "using UnityEditor" in text or "UnityEditor." in text:
        errors.append(f"editor namespace in runtime target: {path.relative_to(ROOT)}")
    if "Physics.RaycastAll" in text:
        errors.append(f"Physics.RaycastAll in runtime target: {path.relative_to(ROOT)}")

shell = TARGETS[0].read_text(encoding="utf-8")
director = TARGETS[2].read_text(encoding="utf-8")
if "host.AddComponent<VexforgeBattlefieldStage>()" in shell:
    errors.append("battlefield remains on BattlePresentationHost")
if "GetComponentsInChildren<VexforgeBattlefieldStage>(true)" not in director:
    errors.append("battlefield child discovery missing")
if 'new GameObject("CardInspectionStage")' not in shell:
    errors.append("card inspection runtime object missing")
if "presentationHost.AddComponent<VexforgeCardInspectionStage>()" in shell:
    errors.append("legacy card inspection host attachment remains")

print("STATIC_AUDIT_TARGETS", len(TARGETS))
if errors:
    print("FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("PASS")