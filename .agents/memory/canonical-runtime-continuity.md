---
name: Canonical runtime continuity
description: How to resolve stale historical continuity documents against the active VEXFORGE runtime and build pipeline.
---

The active VEXFORGE state must be reconciled from the current `main` tree, the canonical Unity GitHub Actions workflow, recent workflow runs, and then the continuity documents. Historical notes may still describe Expo or Unity Cloud even after Unity GitHub Actions has become the active path.

**Why:** The repository can contain valid historical records whose runtime and build claims are no longer current; treating those records as live state can trigger the wrong build path or duplicate infrastructure.

**How to apply:** Prefer the current Unity project version, `unity/`, canonical workflow inputs, and observed Actions evidence. Treat older Expo/Cloud Build entries as historical unless current code and runs confirm them.