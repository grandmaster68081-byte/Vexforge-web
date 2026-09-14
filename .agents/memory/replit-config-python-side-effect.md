---
name: Replit config Python side effect
description: Workspace configuration can be auto-expanded when Python tooling runs.
---

Running Python-based shell tooling in this workspace can cause `.replit` to gain a `python-base-3.13` module even when the project only declares Node.js.

**Why:** This happened during read-only verification and would create an unrelated project diff if left in place.

**How to apply:** Treat `.replit` changes as environment noise unless explicitly requested; restore the intended file through `verifyAndReplaceDotReplit` after Python-based tooling, then check `git status` before publishing.