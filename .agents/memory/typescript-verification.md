---
name: Portable TypeScript verification
description: How portal syntax checks should resolve TypeScript across Replit and CI environments.
---

Syntax verification must resolve the project's local `typescript` package before trying any environment-specific global installation path.

**Why:** Replit workspaces and external CI runners do not necessarily expose the same global TypeScript location; a hard-coded path can fail before parsing any source even when the project dependency is valid.

**How to apply:** Prefer normal package resolution, then a path under the repository's `node_modules`, and keep any global fallback last and non-authoritative.