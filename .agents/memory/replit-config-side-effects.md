---
name: Replit config side effects
description: Workspace tooling may rewrite `.replit` with environment-generated modules or port mappings.
---

Python shell tooling or framework development/export commands can add modules to `.replit` and `[[ports]]` mappings. These generated changes can appear unrelated to the requested app work.

**Why:** Both tool paths have modified the tracked Replit config during verification in this workspace.

**How to apply:** After tooling or development workflow starts, compare `.replit` against the intended tracked version. If the diff is environment-generated, prepare the full trusted TOML in a temporary file and call `verifyAndReplaceDotReplit({tempFilePath: absolutePath})`; preserve the existing settings and normalize to one trailing newline. Then verify the file diff and `git status`. Do not commit generated mappings unless the user requested them or they are required project configuration.