---
name: Official access and rate limits
description: Operational constraints encountered when reconciling GitHub, Supabase, and Cloudflare sources.
---

Use the GitHub token through the API or Basic auth with `x-access-token`; a Bearer header is accepted by the GitHub API but may be rejected by Git smart HTTP.

**Why:** A valid token can appear unusable if the transport-specific authorization form is wrong, which risks incorrectly marking official repository access as blocked.

Storage asset checks can return HTTP 429 during repeated sequential manifest/card scans even when the object exists and the manifest is coherent.

**Why:** The rate limit is an external verification constraint, not evidence that an official asset is missing.

**How to apply:** Retry Storage checks with backoff and report 429 separately from integrity failures; do not replace, remove, or reinterpret canonical assets because of a rate-limited probe.

Local verification after re-materializing the official repository requires a fresh
`npm ci --ignore-scripts` from its committed lockfile; missing `node_modules` is
an environment reset, not evidence of a source regression.

**Why:** Replacing the working copy with a fresh official `main` removed the
previous dependency directory, causing TypeScript resolution errors until the
locked dependencies were restored.

**How to apply:** Reinstall from the official lockfile before judging typecheck
or build results, and keep dependency installation separate from product changes.