---
name: GitHub Actions runner tooling
description: Portable shell assumptions for the canonical VEXFORGE Unity workflow.
---

The GitHub-hosted runner does not guarantee `ripgrep`; canonical validation steps must use broadly available POSIX tools such as `grep`, `find`, `awk`, and `sed` unless the workflow explicitly installs the dependency.

**Why:** Run 33 completed Unity shader inventory successfully, then failed only because `rg` was unavailable in the runner.

**How to apply:** Keep the single canonical workflow self-contained and audit every command used by validation/evidence steps against the runner image rather than assuming developer-local tools exist.