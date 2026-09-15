# VEXFORGE — T0 Android visual state matrix

**Fecha:** 2026-09-15  
**Unidad:** T0 — `VISUAL_STATE_MATRIX` ejecutable por ruta  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `624007bb732b40c186495f0a3aab2d872ed86e0f`
**Fuente activa:** `public.vexforge_official_documents /
vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y autoridad

Esta matriz extiende la tabla común de estados de la sección 72.8 del
protocolo a las 13 rutas Android reales. No crea rutas, datos, assets, reglas
ni motores paralelos.

- **Supabase y sus contratos vivos** son la fuente de datos, autenticación,
  economía, RPCs y settlement.
- **ForgeFormation / Battle Run** son la autoridad de combate, eventos, replay y
  resultado.
- **Android** sólo renderiza, recibe input y reanuda el contrato vivo.
- **`mobile/lib/supabase.ts` y `mobile/context/GameContext.tsx`** son la fuente
  de los tipos y señales consumidos por las pantallas.
- Un valor ausente sigue ausente: `null`, lista no cargada, timestamp inválido
  o resultado no confirmado no se convierte en `0`, éxito, fecha, recompensa o
  contenido de relleno.

`STATIC_ONLY` significa que el contrato y los estados están identificados en
fuente, pero todavía no existe evidencia de dispositivo, touch, legibilidad,
performance, audio, recovery y APK para esa ruta.

## 2. Contrato común de estados

| Estado | Condición verificable | Render permitido | Acción permitida | Acción bloqueada |
|---|---|---|---|---|
| `loading` | solicitud viva sin respuesta | indicador contextual y datos aún no confirmados | esperar; cancelar sólo si el contrato lo permite | mostrar métricas, cartas, saldos o recompensas como definitivos |
| `empty` | respuesta válida con cero filas o colección vacía confirmada | estado vacío propio del dominio y siguiente acción real | crear, explorar, volver o reintentar según la pantalla | tratarlo como error o inventar contenido |
| `pending` | mutación iniciada sin settlement o receipt confirmado | progreso, bloqueo de doble acción y estado pendiente | consultar o reintentar según contrato | declarar éxito, balance, reward o compra aplicada |
| `error` | fallo de transporte, validación o contrato | causa segura, retry/back/recovery | reintentar o volver | ocultar el error con una escena decorativa |
| `locked` | Auth, elegibilidad o regla viva no satisfecha | bloqueo legible con motivo permitido | autenticar, cumplir requisito o volver | habilitar localmente una acción ilegal |
| `completed` | resultado persistido y confirmado por fuente viva | resultado, historial y recompensa confirmados | continuar o volver | celebrar una mutación no persistida |
| `recovery` | reconexión o reanudación después de fallo | contexto preservado sin afirmar progreso nuevo | revalidar antes de mutar | duplicar compra, desafío, claim, retiro o settlement |

## 3. Matriz por Screen Master Record

| Record / ruta | Señales y tipos reales | Disponibilidad | Estados y acción permitida | Bloqueo explícito | Evidencia requerida |
|---|---|---|---|---|---|
| `SMR-01 /auth` | `Session` (`user.id`, `email`), `authLoading`, `authError`; email/password son entradas de texto | sesión ausente, en carga o confirmada por Auth | `loading/error/locked/recovery`; iniciar sesión, registrarse, recuperar contraseña o usar proveedor | no navegar como autenticado sin `Session` confirmada | teclado, safe area, submit, mensajes seguros, retry y back |
| `SMR-02 /(tabs)/` Home | `HomeStats` (`season`, `active_event`, `top3`), `HomeMission`, `DailyCard`, `ActivityItem`, `PlayerProgress`, `Wallet`, `PlayerStats`, `syncState` | señales opcionales pueden ser `null`; listas vacías son datos válidos sólo tras respuesta | `loading/empty/partial/error/recovery`; abrir portales, refrescar y reintentar | no afirmar temporada, evento, fecha, actividad o progreso ausente | lectura del hero, portales, pull-to-refresh, retry sin duplicados, reduced-motion y safe area |
| `SMR-03 /(tabs)/battle` | `Opponent`, `PlayerRank`, `BattleResult`, `BattleTurn`, `BattleUnit`; HP, daño, turnos, outcome y `match_id` son señales del contrato | oponente, formación y resultado pueden estar pendientes; `image_url` y números pueden faltar | `loading/empty/pending/error/locked/completed/recovery`; buscar, seleccionar, iniciar, replay y volver | sin sesión, jugador, formación legal o settlement no se inicia ni se declara resultado | target/hitbox, event stream, resultado persistido, replay, red y 60 FPS durante 30 s |
| `SMR-04 /(tabs)/collection` | `PlayerCard` / `PublicCard`: `quantity`, `locked`, `listed`, `rarity`, `faction`, `power`, `lore`, `image_url` | colección vacía sólo tras respuesta; arte o lore pueden estar ausentes | `loading/empty/pending/error/recovery`; filtrar, desplazar, abrir detalle y volver | no sustituir arte, rareza, lore o stats faltantes por datos genéricos | filtros, scroll, detalle, estado de arte `loading/error` y lectura de procedencia |
| `SMR-05 /(tabs)/deck` | `DeckSlot`, `DeckValidation` (`valid`, errores, conteos), `SaveDeckResult` | formación vacía, inválida o guardada se distinguen por respuesta | `loading/empty/pending/error/locked/completed/recovery`; seleccionar, editar, validar, guardar | no presentar mazo legal ni éxito de guardado antes de validación y persistencia | slots, confirmación, legalidad, feedback de guardado, back y recovery |
| `SMR-06 /(tabs)/profile` | `PlayerProfile`, `PlayerProgress`, `PlayerStats`, `PlayerRank`, `PlayerAchievement`, `Wallet`, `MobileSocialSnapshot` | temporada, logros, ranking e historial pueden no estar sincronizados | `loading/empty/pending/error/recovery`; abrir paneles, cerrar, refrescar y cerrar sesión | no transformar ausencia en cero; conservar `draw`, `pending` y fechas no confirmadas | paneles, texto legible, sign-out, estados sociales y gap de historial |
| `SMR-07 /economy` | `Wallet`, `EconomyStats`, `EconomyLedgerEntry`, `TradeableBalance`, `DepositRecord`, `WithdrawalRequest`, `MarketListing` | balances, ledger, depósitos y retiros llegan desde fuentes separadas | `loading/empty/pending/error/locked/completed/recovery`; listar, comprar, depositar, retirar y paginar ledger | entrada inválida, wallet no disponible o settlement pendiente bloquean la mutación | doble retiro, receipt, hash/fecha, límites, saldo antes/después y recovery |
| `SMR-08 /meta` | `MobileSettings`, `MobileCosmetic`, `MobilePlayerCosmetic`, `MobileRelic`, `MobileNft*`, `MobileAdStats` | preferencias y colecciones pueden estar vacías o sin señal publicada | `loading/empty/pending/error/locked/recovery`; cambiar preferencias y abrir información disponible | no inventar live operations, cosméticos, NFT, anuncios o recompensas | toggles accesibles, persistencia, audio/mute, reduced-motion y back |
| `SMR-09 /missions` | `DailyQuest`, `MobileMission`, `MissionReward`; `progress`, `target_count`, `claimed_at`, rewards | misión o quest vacía sólo después de una respuesta válida | `loading/empty/pending/error/locked/completed/recovery`; abrir, ejecutar, reclamar y volver | claim no confirmado no se muestra como completado ni reward aplicado | progreso real, claim idempotente, pending, locked con motivo y retorno |
| `SMR-10 /social` | `MobileSocialSnapshot`: friends, requests, challenges, clan, wars, rankings, matches y `seasonName` | snapshot puede no tener temporada, clan, rivales o presencia | `loading/empty/pending/error/locked/recovery`; aceptar, rechazar, desafiar, crear/unirse/salir y navegar | no inventar nombres, presencia, ranking, fecha o guerra; mutación sin respuesta queda pendiente | paneles, conexión, privacidad/moderación, fechas y no duplicación de acciones |
| `SMR-11 /store` | `MobilePack`, `MobilePackOrder`, `MobileShopItem`, `MobileShopOrder`, boosts, shards, fusión y evolución | catálogo, wallet, orders y receipts llegan por contratos separados | `loading/empty/pending/error/locked/completed/recovery`; comprar, pagar, abrir, fusionar y evolucionar | precio, receipt, hash, saldo o carta recibida no se fabrican | una mutación por acción, receipt pendiente, tx hash, wallet y recovery de pago |
| `SMR-12 /tutorial` | `tutorial_step`, `TUTORIAL_TOTAL_STEPS`, `TUTORIAL_DONE_STEP`, sesión y progreso | paso no confirmado permanece bloqueado o pendiente | `loading/locked/pending/error/recovery`; continuar, reanudar y volver según contrato | no saltar gates ni marcar paso completado localmente | safe area, targets, back, reduced-motion, reanudación y persistencia |
| `SMR-13 /world` | `MobileWorldBoss`, `MobileBossEncounter`, `MobileRaidRun`, `MobileRaidParticipant` | boss, raid, región, daño y reward pueden estar ausentes o bloqueados | `loading/empty/pending/error/locked/completed/recovery`; abrir, combatir, reclamar y volver | lore no reemplaza elegibilidad, daño, reward ni settlement | identidad del boss, daño, eligibility, claim, retorno y recovery |

## 4. Reglas de promoción por ruta

Una ruta sólo puede salir de `STATIC_ONLY` cuando el evidence pack de esa ruta
contenga, como mínimo:

1. nombres exactos del dispositivo, API, RAM, densidad, resolución, orientación
   e insets;
2. captura de los estados que aplican y de la fuente viva que los produjo;
3. tap, back, retry, hitboxes y ausencia de acciones duplicadas;
4. reduced-motion, mute/audio y comportamiento de recovery;
5. persistencia comprobada de resultado, saldo, recompensa, receipt o
   settlement, cuando aplique;
6. para Battlefield y replay, 30 segundos con frame time P95 ≤ 16,7 ms, P99 ≤
   25 ms y sin crash/OOM;
7. relación con el workflow, release, APK, commit, tag y SHA-256 cuando el
   cambio haya tocado `mobile/**`.

## 5. Estado de cierre

- `VISUAL_STATE_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- Las señales y acciones se derivan de los tipos y loaders reales; no se
  promovió ninguna evidencia física por inferencia estática.
- `PROFILE_HISTORY_STATE_GAP`: continúa `BLOCKED`.
- La Device Matrix continúa con candidatos `LOW`, `REFERENCE` y `HIGH`; ningún
  dispositivo se declara `SUPPORTED`.
- Este bloque no modifica `mobile/**`, no requiere APK y no abre un release.
- No se declara `VERIFIED`, `TIER1_READY` ni `OPERATIONAL`.