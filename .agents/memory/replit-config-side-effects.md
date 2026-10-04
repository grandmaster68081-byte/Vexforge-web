---
name: Replit config side effects
description: Workspace tooling may rewrite `.replit` with environment-generated modules or port mappings.
---

Python shell tooling can add a `python-base-3.13` module to `.replit`, and Expo development/export commands can add `[[ports]]` mappings such as the 8000 and 8080 ports. These generated changes can appear unrelated to the requested app work.

**Why:** Both tool paths have modified the tracked Replit config during verification in this workspace.

**How to apply:** After Python-based tooling or Expo exports/workflow starts, compare `.replit` against the intended tracked version. If the diff is environment-generated, restore it through `verifyAndReplaceDotReplit` using a trusted temporary source, then check `git status` before publishing. Do not commit generated mappings unless the user requested them or they are required project configuration.