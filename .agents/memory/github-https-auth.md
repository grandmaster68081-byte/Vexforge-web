---
name: GitHub HTTPS authentication
description: Environment-specific distinction between GitHub API validation and Git Smart HTTP authentication.
---

For Git operations against a private GitHub repository, validate the PAT with the GitHub API separately from the Git transport. A token accepted by the API with Bearer authentication may still be rejected by Git HTTPS unless the transport uses Basic authentication with the `x-access-token` username.

**Why:** A successful `/user` API probe did not prove that `git ls-remote` could authenticate; treating them as separate checks avoided falsely declaring the official repository inaccessible.

**How to apply:** Never print the token. Run an API probe and an authenticated `ls-remote` probe independently, and use the Git HTTPS format required by the repository protocol.

For GitHub REST publication, the identity probe uses `https://api.github.com/user`; Git Data requests use the repository-scoped `/repos/{owner}/{repo}` path. A repo-scoped `/user` request is a false 404 and does not validate the PAT.

**Why:** Mixing the root identity endpoint with the repository API path caused a misleading 404 before the actual HTTPS publication could proceed.

**How to apply:** Keep root API checks and repository Git Data calls as separate request bases, and report only status/SHAs—not credential material.