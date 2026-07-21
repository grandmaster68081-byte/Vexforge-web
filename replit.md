# VEXFORGE

Juego de cartas coleccionables (TCG) web: 127 cartas únicas, 4 facciones, economía real con VEX, combate PvP turn-based, mercado P2P, misiones y clanes.

**Producción:** https://57bb190d.vexforge-web.pages.dev  
**Plan maestro:** `vexforge/docs/MASTER_WORK_PLAN.md` — leer al inicio de cada sesión.

---

## Run & Operate

- **Frontend local:** `/home/runner/workspace/vexforge/`
- **Build:** `cd /home/runner/workspace/vexforge && npm run build` (= `tsc -b && vite build`)
- **Typecheck:** `cd /home/runner/workspace/vexforge && npx tsc --noEmit`
- **ZIP descargable:** `/home/runner/workspace/vexforge-web.zip` → `GET /api/download/vexforge`
- **API Server (este Replit):** `pnpm --filter @workspace/api-server run dev`

---

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5.5 strict + React Router 6 + Supabase JS 2.45
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RPCs)
- **Hosting:** Cloudflare Pages (Wrangler 3)
- **Arquitectura:** Domain-driven — `src/domains/<domain>/repository.ts` → `use<Domain>.ts` → `src/routes/<Name>Route.tsx`

---

## Where things live

- **Fuente de verdad del frontend:** Supabase tabla `vexforge_frontend_source_files` (125 archivos)
- **28 rutas frontend:** Ver listado completo en `MASTER_WORK_PLAN.md`
- **Supabase project:** `rscuzqnfccqvltkdcdny` — `https://rscuzqnfccqvltkdcdny.supabase.co`
- **Assets de cartas:** Supabase Storage bucket `vexforge-assets/`

---

## Architecture decisions

- **Supabase como única fuente canónica:** Todo edit de frontend = UPDATE en `vexforge_frontend_source_files`. Nunca persistir solo en disco.
- **RPCs para toda escritura de negocio:** `execute_mission`, `fuse_cards`, `start_pvp_match`, etc. No INSERT/UPDATE directo desde el cliente.
- **Domain-driven frontend:** Cada dominio tiene su `repository.ts` (queries Supabase) + `use<Domain>.ts` (estado React) + ruta asociada.
- **TypeScript strict mode:** El build usa `tsc -b && vite build`. Cualquier error TS rompe el deploy.
- **ZIP como artefacto de deploy:** Al cerrar sesión con cambios, regenerar ZIP en `/home/runner/workspace/vexforge-web.zip`.

---

## Product

TCG (Trading Card Game) web con:
- 127 cartas únicas en 4 facciones (Guerrero, Mago, Paladín, Pícaro) y 6 rarezas
- Economía dual: VEX Ingame (gameplay) + VEX Tradeable (mercado real)
- Sistema de packs con gacha y pity system
- Combate PvP turn-based con motor de keywords (Guard, Surge, Flux, Resonance, Veil, Drain, Consecrate, Forge)
- Mercado P2P de cartas
- Misiones (31 activas), Logros (25), Clanes, World Bosses (10 diseñados), Season Pass, Fusión de cartas

---

## User preferences

- El agente debe leer `vexforge/docs/MASTER_WORK_PLAN.md` al inicio de cada sesión
- Todo trabajo ejecutado debe marcarse con ✅ en el plan maestro
- Al cerrar sesión: añadir entrada en el plan maestro con fecha, qué se hizo, próximo paso
- Sincronizar `docs/MASTER_WORK_PLAN.md` de vuelta a Supabase al actualizar
- Al terminar cambios de frontend: regenerar ZIP + sincronizar archivos modificados a `vexforge_frontend_source_files`
- Idioma de respuesta: español

---

## Gotchas

- El proxy de Replit usa path-based routing: API server en `/api/*`
- TypeScript strict: errores de tipo rompen el build. Siempre hacer `npx tsc --noEmit` antes de hacer ZIP
- `friends/repository.ts` retorna `display_name` y `friend_id` — NO `friend_name` ni `sender_name` (BUG corregido chat57 Bloque 5.21)
- `players_self` RLS: solo retorna propia fila. Para display names de otros jugadores usar RPCs SECURITY DEFINER (`get_leaderboard`, `get_public_player_names`)
- Shared components: PageLoader, BlockedAuthState (prop: message), EmptyState, ErrorState, ErrorBoundary, Skeleton — todos en `src/shared/components/`
- `ClanMember.contribution` puede no existir — usar `contribution_accumulated` del tipo real
- `tsconfig.app.json` tiene `strict: false` (tsconfig.json tiene `strict: true`). El build de Vite usa tsconfig.app.json — TypeScript strict está DESACTIVADO. Los type errors sueltos no rompen el build.
