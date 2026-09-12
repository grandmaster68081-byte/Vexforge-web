---
name: GitHub HTTPS authentication
description: Environment-specific distinction between GitHub API validation and Git Smart HTTP authentication.
---

For Git operations against a private GitHub repository, validate the PAT with the GitHub API separately from the Git transport. A token accepted by the API with Bearer authentication may still be rejected by Git HTTPS unless the transport uses Basic authentication with the `x-access-token` username.

**Why:** A successful `/user` API probe did not prove that `git ls-remote` could authenticate; treating them as separate checks avoided falsely declaring the official repository inaccessible.

**How to apply:** Never print the token. Run an API probe and an authenticated `ls-remote` probe independently, and use the Git HTTPS format required by the repository protocol.