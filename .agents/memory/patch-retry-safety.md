---
name: Patch retry safety
description: Avoid duplicate edits after a multi-hunk patch reports a failure.
---

After a failed multi-hunk `apply_patch`, inspect the working tree and the target file before retrying. Earlier hunks in the same request may already have applied.

**Why:** A failed battle-gate patch left some requested edits present, so blindly retrying would have duplicated or contradicted them.

**How to apply:** Check `git diff` and the exact target context after any failed multi-hunk patch, then apply only the changes that remain.
