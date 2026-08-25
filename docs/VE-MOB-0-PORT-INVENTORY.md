# VE-MOB-0 — INVENTARIO OFICIAL DEL PORT WEB → APP ANDROID

Fuente: `src/routes/` (38 superficies web) vs `mobile/app/(tabs)/` (4 pantallas, 3 de ellas esqueleto).
Regla: cada superficie portada es una unidad `VE-MOB-*` con criterios, guarda y evidencia propios. La app consume el mismo Supabase oficial; prohibido duplicar lógica autoritativa.

## Estado del esqueleto actual
- `index.tsx` (Home, 160 líneas) — parcial.
- `battle.tsx`, `collection.tsx`, `profile.tsx` — stubs (5–17 líneas). Calidad declarada insuficiente por el operador: se reconstruyen, no se pulen sobre lo actual.

## Fases del port (orden obligatorio)

### FASE P1 — Núcleo jugable (vertical slice del protocolo)
1. VE-MOB-2 AUTH: login/registro real contra Supabase Auth en la app (la app hoy no tiene auth).
2. VE-MOB-3 HOME: HomeRoute completo (identidad, actividad, progreso).
3. VE-MOB-4 COLLECTION: CardsRoute + inspector/detalle de carta con arte canónico del manifiesto.
4. VE-MOB-5 DECK: DeckBuilderRoute + selección/formación.
5. VE-MOB-6 TUTORIAL: TutorialRoute con el flujo real.
6. VE-MOB-7 BATTLE: tablero de combate completo (InteractiveBattleBoard, cues, cinematicas, BattleResultScreen) — presentación fiel a resultados autoritativos, jamás lógica de combate en cliente.
7. VE-MOB-8 REWARDS: recompensas, QuestsRoute, MissionsRoute.

### FASE P2 — Progresión y economía (solo lectura/consumo de RPCs autoritativas)
8. VE-MOB-9 PROFILE: ProfileRoute + AchievementsRoute + ProgressRoute.
9. VE-MOB-10 PACKS/SHOP: PacksRoute, ShopRoute, FusionRoute, EvolutionRoute, InventoryRoute.
10. VE-MOB-11 ECONOMY: EconomyRoute, MarketRoute, DepositRoute, WithdrawalRoute, ReferralRoute.

### FASE P3 — Mundo y social
11. VE-MOB-12 WORLD: WorldBossesRoute, RaidsRoute, LoreRoute, SeasonPassRoute, SeasonRankingsRoute, LeaderboardRoute.
12. VE-MOB-13 SOCIAL: FriendsRoute, ClansRoute, PvpRoute.
13. VE-MOB-14 META: SettingsRoute, AccountRoute, CosmeticsRoute, RelicsRoute, NftRoute, ForgeAdsRoute, AssetsRoute.

### FASE P4 — Admin (diferida; evaluar si permanece solo web)
14. VE-MOB-15 ADMIN: AdminDashboard/Deposits/ShopOrders/Withdrawals — decisión pendiente del operador.

## Criterios transversales de toda unidad del port
- Datos reales vía `mobile/lib/supabase.ts` con la misma RLS; sin mocks ni duplicación de lógica autoritativa.
- Assets exclusivamente del manifiesto oficial + Storage (regla Cero Genéricos vigente).
- Estados carga/vacío/error, accesibilidad y reduced-motion equivalentes a la web.
- `npm run typecheck` (mobile) + guarda específica de la unidad; `verify:build` y `verify:all` web sin regresión.
- Cierre: workflow APK success sobre el commit + release publicado; QA en dispositivo (operador) o emulador → si no, `IMPLEMENTED_UNVERIFIED`.

## Tras el port
Continuar `public.vexforge_visual_tier1_objective` por fase ascendente sobre la app; `VE-VIS-6-GAME-LOOP-TELEMETRY` se reevalúa para instrumentarse en la app (emisor `mobile/lib/telemetry.ts` equivalente, mismas 5 claves canónicas ya sembradas en Supabase).
