---
name: Release dependency availability
description: A sealed package can contain a pinned npm version that has disappeared from the public registry.
---

Before installing a release package, verify every pinned dependency against the target registry. If a version is unavailable, use the nearest compatible published patch only when the package contract and audits remain unchanged.

**Why:** The VEXFORGE 1.10.0 package pinned a React Query patch that was not present in the available npm registry, so installation failed before any runtime checks could run.

**How to apply:** Record the compatibility correction in the tracked manifest, avoid generating a lockfile when the release explicitly omits one, and rerun the package's own audits plus typecheck.