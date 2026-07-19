# docs/

This folder intentionally stays thin. The real documentation lives in two
places, in priority order:

1. **Supabase** (`vexforge_project_documents`, `vexforge_web_registry`,
   `vexforge_project_decisions`, `vexforge_project_memory`) — the single
   source of truth for the whole VEXFORGE project, not just this repo.
2. **`backend/`** in this repo — a local, human-readable mirror of the parts
   of that continuity that specifically concern this frontend: `architecture/`,
   `decisions/`, `pending/`, `blockers/`, `handoff/`, `reports/`.

Don't add general project documentation directly under `docs/` — it will
drift from Supabase. If something belongs here, it's UI/component-level
documentation specific to this codebase (e.g. a future Storybook or style
guide), not project continuity.