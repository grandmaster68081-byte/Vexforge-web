# VEXFORGE

Juego de cartas coleccionables (TCG) web: 127 cartas únicas, 4 facciones, economía real con VEX, combate PvP turn-based, mercado P2P, misiones y clanes.

**Producción pública:** https://vexforge-web.pages.dev
**Protocolo activo:** `VEXFORGE_PROTOCOL_V2.md` — leer primero en cada sesión.
**Continuidad activa:** `CONTINUITY.md` — leer después del protocolo.

---

## Run & Operate

- **Frontend local:** `/home/runner/workspace/Vexforge-web/`
- **Build:** `cd /home/runner/workspace/Vexforge-web && npm run build` (= `vite build`)
- **Typecheck:** `cd /home/runner/workspace/Vexforge-web && npx tsc --noEmit -p tsconfig.app.json`
- **ZIP descargable:** `/home/runner/workspace/vexforge-web.zip` → `GET /api/download/vexforge`
- **API Server (este Replit):** `pnpm --filter @workspace/api-server run dev`

---

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5.5 + React Router 6 + Supabase JS 2.45
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RPCs)
- **Hosting:** Cloudflare Pages (Wrangler 3)
- **Arquitectura:** Domain-driven — `src/domains/<domain>/repository.ts` → `use<Domain>.ts` → `src/routes/<Name>Route.tsx`

---

## Where things live

- **Fuente de verdad del frontend:** Supabase tabla `vexforge_frontend_source_files`
- **Documentación operativa activa:** `VEXFORGE_PROTOCOL_V2.md` y `CONTINUITY.md`
- **Arquitectura backend:** `backend/architecture/`, `backend/decisions/`, `backend/pending/`, `backend/blockers/` y `backend/handoff/`
- **Supabase project:** `rscuzqnfccqvltkdcdny` — `https://rscuzqnfccqvltkdcdny.supabase.co`
- **Assets de cartas:** Supabase Storage bucket `vexforge-assets/`

---

## Architecture decisions

- **Supabase como única fuente canónica:** Todo edit de frontend = UPDATE en `vexforge_frontend_source_files`. Nunca persistir solo en disco.
- **RPCs para toda escritura de negocio:** `execute_mission`, `fuse_cards`, `start_pvp_match`, etc. No INSERT/UPDATE directo desde el cliente.
- **Domain-driven frontend:** Cada dominio tiene su `repository.ts` + `use<Domain>.ts` + ruta asociada.
- **TypeScript:** El build de Vite no ejecuta TypeScript; siempre validar con `npx tsc --noEmit -p tsconfig.app.json`.

---

## Product

TCG con 127 cartas únicas en 4 facciones, economía dual VEX, packs con pity system, combate PvP por turnos, mercado P2P, misiones, logros, clanes, World Bosses, Season Pass y fusión de cartas.

---

## User preferences

- Idioma de respuesta: español.
- Leer el protocolo V2 y la continuidad activa al inicio de cada sesión.
- Trabajar sólo sobre las fuentes oficiales indicadas por el protocolo.
- Al cerrar una sesión, registrar estado, evidencia, bloqueos, deuda y siguiente acción verificable en `CONTINUITY.md`.
- Al cerrar cada unidad completada, hacer push a main, desplegar y verificar el deploy público; si hay bloqueo, documentarlo sin simular evidencia.

---

## Gotchas

- El proxy de Replit usa path-based routing: API server en `/api/*`.
- `players_self` RLS sólo retorna la propia fila; para display names públicos usar las RPCs autorizadas.
- No usar service_role para suplantar jugadores, fabricar QA o falsear resultados.
