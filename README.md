# VEXFORGE — ANDROID GAME RUNTIME

Start here:
- `VEXFORGE_CONTEXT.md`
- `docs/vexforge-canonical/00_START_HERE.md`

**ANDROID PRODUCT:** `mobile/**`
**ACTIVE RUNTIME:** Expo / React Native
**BACKEND AUTHORITY:** Supabase
**WEB:** `FROZEN / NON-PRODUCT`
**UNITY:** `RETIRED / HISTORICAL`

El estado real implementado se describe desde `main`, no desde documentación histórica.

La documentación histórica existente se conserva. La capa canónica resume, indexa, reconcilia y enlaza; no sustituye al código ni a Supabase.

---

# VEXFORGE — Official Android Product

This repository contains the official Android game client for VEXFORGE.
Supabase is the only source of truth for backend data and rules; see
`backend/architecture/data-source.md`.

## Quick start
```bash
cd mobile
npm ci
npm run typecheck
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

## Runtime status

Expo / React Native is the active Android runtime and `mobile/**` is the
canonical Android product. The web client in `src/**` and `public/**` is
frozen and non-product. Unity material is retained only as historical
documentation; it is not an active runtime or build path.
