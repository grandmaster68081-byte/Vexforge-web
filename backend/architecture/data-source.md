# Data source

Supabase is the single source of truth for VEXFORGE. This repo never duplicates
game data or continuity documentation as a second source of truth.

- Project ref: `rscuzqnfccqvltkdcdny`
- All reads go through `src/lib/supabase.ts` — no other file imports `@supabase/supabase-js`.
- Every domain repository under `src/domains/<domain>/repository.ts` documents,
  in a comment, exactly which RLS policy it relies on and when/how it was verified.
- Continuity documentation (this folder) is a **local working copy for humans and
  future coding sessions**, not a second authority. The authoritative version
  always lives in Supabase: `vexforge_project_documents`, `vexforge_project_memory`,
  `vexforge_project_decisions`, `vexforge_web_registry`.
- If this folder and Supabase ever disagree, Supabase wins. Re-sync this folder
  from Supabase, don't do the reverse.
