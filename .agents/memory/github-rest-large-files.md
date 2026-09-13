---
name: GitHub REST large-file commits
description: Safe Git Data API handling for large repository files.
---

When publishing large files through GitHub's Git Data API, stream the base64-encoded content into a JSON request instead of passing it as a command-line argument.

**Why:** Large continuity or documentation files can exceed the shell's argument-size limit when interpolated into `jq --arg`, causing a partial tree update or accidental path deletion.

**How to apply:** Build the blob payload from a streaming process, verify every returned blob SHA, update the tree from the current remote ref, and compare remote content SHAs with local files before proceeding.