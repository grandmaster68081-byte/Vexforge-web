# VEXFORGE — ANDROID GAME RUNTIME

Start here:
- `VEXFORGE_CONTEXT.md`
- `docs/vexforge-canonical/00_START_HERE.md`

**ANDROID PRODUCT:** `unity/**`
**ACTIVE RUNTIME:** Unity 6.3 LTS target (`6000.3.0f1`)
**BACKEND AUTHORITY:** Supabase
**EXPO:** `FALLBACK / REFERENCE / PRESERVED`
**WEB:** `OFFICIAL PUBLIC PORTAL`

El estado real implementado se describe desde `main`, no desde documentación histórica.

La documentación histórica existente se conserva. La capa canónica resume, indexa, reconcilia y enlaza; no sustituye al código ni a Supabase.

---

# VEXFORGE — Official Android Product

This repository contains the official Android game clients for VEXFORGE.
Unity is the active development runtime under `unity/**`. Expo/React Native is
preserved intact under `mobile/**` as fallback, rollback and behavior
reference; it is not removed or used as a dependency of Unity.
Supabase is the only source of truth for backend data and rules; see
`backend/architecture/data-source.md`.

The current Unity block is `IMPLEMENTED_UNVERIFIED`: code work may continue,
but no APK, Android Player, installation or physical QA is claimed until the
separate build gate has evidence.

## Unity development
```bash
open unity/ in Unity 6000.3.0f1
```

The active product runtime is Unity Android. The `mobile/**` tree is retained
only as legacy/historical reference and rollback material; it is not an active
runtime or a recommended implementation path.

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

Unity is the active Android development runtime under `unity/**`. The Expo /
React Native client in `mobile/**` remains intact only as legacy/historical
reference and rollback material. The public VEXFORGE portal in `src/**` and
`public/**` is an active editorial product surface, separate from the Unity
runtime and without player state, authentication, inventory, market, PvP,
wallet or economic controls.

Unity work and the public portal are maintained as separate product surfaces.
