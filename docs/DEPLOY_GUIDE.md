# VEXFORGE — Guía de Deploy (Cloudflare Pages)
> Actualizado: Chat 66 — 2026-07-20

---

## Prerrequisitos

- Cuenta en Cloudflare Pages
- `wrangler` CLI (incluido en devDependencies del proyecto)
- Node.js 18+, pnpm

---

## Variables de entorno requeridas

Configurar en Cloudflare Pages > Settings > Environment Variables:

| Variable | Valor | Tipo |
|----------|-------|------|
| `VITE_SUPABASE_URL` | `https://rscuzqnfccqvltkdcdny.supabase.co` | Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58` | Production + Preview |

> **Nota:** La anon key es pública (RLS-protected). Nunca subir service_role key al frontend.

---

## Deploy manual

```bash
# 1. Instalar dependencias
npm install

# 2. Build de producción
npm run build
# Equivalente: tsc -b && vite build
# Output: ./dist/

# 3. Deploy a Cloudflare Pages
npm run deploy
# Equivalente: wrangler pages deploy dist --project-name=vexforge-web
```

---

## Primera vez (crear proyecto en Cloudflare)

```bash
# Login en Cloudflare
wrangler login

# Crear proyecto (primera vez)
wrangler pages project create vexforge-web

# Deploy
wrangler pages deploy dist --project-name=vexforge-web
```

---

## Archivos de configuración ya provistos

| Archivo | Propósito |
|---------|-----------|
| `wrangler.toml` | Config de Cloudflare Pages (pages_build_output_dir=dist) |
| `public/_redirects` | SPA routing — `/* /index.html 200` |
| `public/_headers` | CSP, seguridad, cache headers |
| `public/manifest.json` | PWA manifest |
| `public/robots.txt` | SEO — Disallow admin routes |

---

## Verificar antes de deploy

- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en Cloudflare
- [ ] `npm run build` sin errores TypeScript
- [ ] `public/_redirects` existe con `/* /index.html 200`
- [ ] Supabase RLS activo (anon key tiene acceso limitado)
- [ ] RPCs críticos verificados: `vexforge_battle_resolve` ✅

---

## Supabase — RLS y permisos post-deploy

El proyecto usa Supabase con:
- **RLS activo** en todas las tablas de datos de usuario
- **SECURITY DEFINER RPCs** para operaciones sensibles:
  - `vexforge_battle_resolve` — motor PvP real
  - `vexforge_apply_fusion` — fusión de cartas
  - `vexforge_evolve_card` — evolución de cartas
  - `get_public_player_names` — nombres públicos sin exponer datos privados
- **Anon key** es la única credencial en el frontend
- **No** exponer `service_role` key nunca

---

## Rutas registradas (28)

```
/              HomeRoute
/account       AccountRoute
/cards         CardsRoute
/missions      MissionsRoute
/market        MarketRoute
/pvp           PvpRoute
/packs         PacksRoute
/clans         ClansRoute
/friends       FriendsRoute
/fusion        FusionRoute
/deck-builder  DeckBuilderRoute
/bosses        WorldBossesRoute
/quests        QuestsRoute
/achievements  AchievementsRoute
/season-pass   SeasonPassRoute
/cosmetics     CosmeticsRoute
/leaderboard   LeaderboardRoute
/evolution     EvolutionRoute
/inventory     InventoryRoute
/profile       ProfileRoute
/progress      ProgressRoute
/economy       EconomyRoute
/settings      SettingsRoute
/assets        AssetsRoute
/deposit       DepositRoute
/admin         AdminDashboardRoute
/admin/deposits AdminDepositsRoute
/raids         RaidsRoute
/season-rankings SeasonRankingsRoute
```

---

## Performance (Vite build output)

El build produce chunks separados:
- `vendor-react` — React core
- `vendor-router` — react-router-dom
- `vendor-supabase` — @supabase/supabase-js

Lazy loading activado en todas las rutas (Suspense + lazy en App.tsx).

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| URL directa da 404 | Verificar que `public/_redirects` existe con `/* /index.html 200` |
| "Missing VITE_SUPABASE_URL" | Configurar variables de entorno en Cloudflare Pages |
| RPC returns PGRST202 | El RPC no existe en el schema — ejecutar SQL via Management API |
| Battle no funciona | Verificar `vexforge_battle_resolve` en information_schema.routines |
| Imágenes no cargan | CSP en `_headers` permite `rscuzqnfccqvltkdcdny.supabase.co` |
