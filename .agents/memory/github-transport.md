---
name: GitHub transport authentication
description: Reliable way to use the workspace GitHub secret for HTTPS pushes without exposing it.
---

For this repository, a valid `GITHUB_PAT` may not work through the default Git credential path. Use a temporary `GIT_ASKPASS` helper that returns `x-access-token` for the username and the secret only for the password, disable the configured credential helper for that command, and remove the helper afterward.

**Why:** The repository is public and fetches anonymously, which can make a credential-path failure look like an invalid token even when the token is valid.

**How to apply:** Keep the token out of URLs, command output, files in the repository, and logs; verify the remote branch after pushing.