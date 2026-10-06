---
name: Vexforge access rule
description: The user's access-method constraint for GitHub and Supabase work on Vexforge.
---

For Vexforge work, do not use connectors; use the configured PAT secrets for GitHub or Supabase operations. Do not expose secret values. Request any additional credential only through Replit Secrets when a specific operation requires it; never ask for credentials in chat. Request Unity account credentials only if an authorized step actually requires them.

**Why:** the user explicitly asked to use PATs instead of connectors.

**How to apply:** For Vexforge service access, avoid connector-based authentication and use available PAT secrets through approved secret handling. Keep each operation within the current migration permissions; ask for other credentials only when needed for an authorized operation.
