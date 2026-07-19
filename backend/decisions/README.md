# Decisions log (local mirror)

Authoritative copy: Supabase `vexforge_project_decisions`. This file mirrors
only the decisions that materially affect this repo's structure.

## chat22 — Retired ZIP-based frontend workflow
This repo is now the single official VEXFORGE frontend. Domain-driven
architecture (`src/domains/<name>/repository.ts` → hook → route) was
established here and recorded as official in Supabase
(`official_frontend_scaffold_v1`).

## chat23 — Kept domain-driven architecture over flat top-level structure
A later protocol document requested a flat top-level layout
(`src/components`, `src/repositories`, `src/services`, `src/hooks`, ...)
while simultaneously instructing not to change the already-defined official
architecture. Since the domain-driven layout was already the recorded
official architecture, that rule took precedence — restructuring into a flat
layout would itself have been the forbidden architecture change. Instead,
this chat added the supporting folders that were genuinely missing
(`src/providers`, `src/state`, `src/config`, `src/utils`, `docs/`,
`backend/decisions/`, `backend/blockers/`) without
touching or duplicating the domain folders. See each folder's own README for
what it's for and why it's currently empty rather than pre-filled with
placeholder code.