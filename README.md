# VEXFORGE — Official Web Frontend

This is the official, single live frontend project for VEXFORGE, replacing the
old ZIP-based workflow. Supabase is the only source of truth; see
`backend/architecture/data-source.md`.

## Quick start
```bash
npm install
cp .env.example .env   # already pre-filled with real public/RLS-safe values
npm run dev
```

## Continuity
Every future coding session should start by reading, in order:
1. `backend/reports/` — most recent session report
2. `backend/architecture/domains.md` — current domain status
3. `backend/blockers/README.md` — what's blocked and why
4. `backend/pending/` — concrete next-step tasks
5. `backend/decisions/README.md` — why the codebase looks the way it does
6. `backend/handoff/deployment.md` — how to ship

The authoritative copy of all of this also lives in Supabase
(`vexforge_project_documents`, `vexforge_web_registry`, etc.) — if this folder
and Supabase ever disagree, Supabase wins.