---
name: Vexforge access rule
description: The user's access-method constraint for GitHub and Supabase work on Vexforge.
---

For Vexforge work, do not use connectors; use the configured PAT secrets for GitHub or Supabase operations. Do not expose secret values.

**Why:** the user explicitly asked to use PATs instead of connectors.

**How to apply:** For Vexforge service access, avoid connector-based authentication and use the available PAT through approved secret handling. Keep each operation within the current migration permissions.
