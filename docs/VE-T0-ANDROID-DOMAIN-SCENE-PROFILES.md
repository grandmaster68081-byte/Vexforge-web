# VEXFORGE — T0 Android domain scene profiles

**Fecha:** 2026-09-15  
**Unidad:** T0 — `DOMAIN_SCENE_PROFILES` ejecutables  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `30ba51f0989e833ebc9829c106c817916ea6592f`  
**Fuente activa:** `public.vexforge_official_documents /
vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito

Este registro convierte los diez perfiles de escena de la sección 72.8 del
protocolo en límites de producción verificables. Define qué debe leerse en cada
dominio y qué nunca puede inventarse. No promueve assets, no cambia rutas y no
declara terminada ninguna escena.

La relación de autoridad es:

1. el protocolo ACTIVE fija sujeto, acento y prohibiciones;
2. `mobile/constants/visual.ts` y `src/lib/assetManifest.ts` fijan los assets
   que pueden consumirse;
3. `mobile/lib/supabase.ts` y los loaders de cada ruta fijan los datos;
4. `VE-T0-ANDROID-VISUAL-STATE-MATRIX.md` fija estados y acciones;
5. el dispositivo físico decide legibilidad, touch, motion, audio y rendimiento.

## 2. Reglas comunes de escena

- Una escena debe leerse como parte del mismo mundo VEXFORGE, pero su copy,
  métricas, cartas, precios, resultados y progreso provienen de contratos vivos.
- `CANON_ACTIVE` y `VERIFIED_ASSET` pueden consumirse sólo en el dominio
  registrado. `AVAILABLE_UNASSIGNED`, `REVIEW_REQUIRED` y
  `RESERVED_SURFACE_ART` no se convierten en contenido por proximidad visual.
- La ausencia de un dato conserva una señal de ausencia. No se sustituyen
  fechas, nombres, estadísticas, cartas, rewards, balances, presencia ni lore.
- Cualquier estado `pending` permanece pendiente hasta settlement, receipt o
  resultado confirmado.
- Reduced-motion, mute, safe area, retry, back y recovery pertenecen a cada
  perfil; no son una capa que pueda omitirse por falta de espacio en una
  referencia visual.

## 3. Perfiles de dominio

### DSP-01 — Nexus / Home

- **Rutas:** `/(tabs)/`.
- **Sujeto obligatorio:** citadel de mando, núcleo de forja, portales y
  actividad viva; debe sentirse como entrada a un juego, no como dashboard.
- **Acento del protocolo:** cyan + oro.
- **Assets autorizados:** `vexforge-home-hero.png`,
  `vexforge-hero-sentinel.png`, `vexforge-feature-card.png`, logo y facciones
  oficiales registrados.
- **Datos vivos:** `HomeStats`, `HomeMission`, `DailyCard`, `ActivityItem`,
  `PlayerProgress`, `Wallet` y `PlayerStats`.
- **Estados mínimos:** `loading`, `empty`, `partial`, `error`, `recovery`.
- **Interacción y motion:** portales, pull-to-refresh, retry no duplicado,
  parallax acotado y reduced-motion.
- **Prohibiciones:** no afirmar temporada, evento, fecha, actividad o progreso
  cuando el contrato entrega `null`, vacío o una señal no sincronizada.
- **Cierre:** primera impresión, legibilidad del hero, navegación de portales,
  safe area, recovery y lectura en los tres tiers de dispositivo.

### DSP-02 — Arena / Battlefield

- **Rutas:** `/(tabs)/battle`.
- **Sujeto obligatorio:** formaciones, Champion, mano, Reserve, objetivo legal,
  evento, replay y resultado.
- **Acento del protocolo:** cyan vs ember.
- **Assets autorizados:** `backgrounds/bg_pvp.jpg`,
  `backgrounds/bg_bosses.jpg`, `battle-reference-scene.png` y arte de cartas
  registrado.
- **Datos vivos:** `Opponent`, `PlayerRank`, `BattleResult`, `BattleTurn` y
  `BattleUnit` desde Battle Run / ForgeFormation.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Interacción y motion:** selección de target legal, acción, stream de
  eventos, replay y abandono/timeout; sin motor de combate paralelo.
- **Prohibiciones:** no inferir lado, slot, daño, turnos, outcome, HP, replay,
  MMR o reward; no declarar resultado antes de persistencia.
- **Cierre:** captura de 30 segundos, frame time P95 ≤ 16,7 ms, P99 ≤ 25 ms,
  sin crash/OOM y touch sin bloqueo.

### DSP-03 — Collection / Archivo

- **Rutas:** `/(tabs)/collection`.
- **Sujeto obligatorio:** unidades, cartas, artefactos, rareza, facción, lore,
  procedencia y mastery.
- **Acento del protocolo:** violet + plata.
- **Assets autorizados:** `heroes/hero_assets.jpg`,
  `collection-archive-scene.jpg` y arte de carta desde registros vivos.
- **Datos vivos:** `PlayerCard` / `PublicCard`, incluyendo `quantity`, `locked`,
  `listed`, `rarity`, `faction`, `power`, `lore` e `image_url`.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `recovery`.
- **Interacción y motion:** filtros, scroll, detalle, vuelta al archivo y
  estados de carga/error del arte.
- **Prohibiciones:** no reemplazar una imagen, rareza, lore, identidad o stat
  faltante por otra carta o por arte genérico.
- **Cierre:** filtros, detalle, scroll, legibilidad y procedencia visible cuando
  la fuente la entrega.

### DSP-04 — Deck / Forja

- **Rutas:** `/(tabs)/deck`.
- **Sujeto obligatorio:** pedestal, cartas, composición, formación y legalidad.
- **Acento del protocolo:** oro + violet.
- **Assets autorizados:** `heroes/hero_fusion.jpg` para Forge,
  `decks-reference-scene.png` como escena registrada; `deck-forge-scene.jpg`
  permanece `REVIEW_REQUIRED`.
- **Datos vivos:** `DeckSlot`, `DeckValidation` y `SaveDeckResult`, además de
  colección y contratos de formación.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Interacción y motion:** seleccionar slots, validar, confirmar, guardar y
  recuperar una persistencia fallida.
- **Prohibiciones:** no presentar legalidad, poder o guardado exitoso antes de
  la respuesta autoritativa.
- **Cierre:** hitboxes de slots, feedback de validación, persistencia,
  accesibilidad y retorno seguro.

### DSP-05 — Missions / World objectives

- **Rutas:** `/missions`.
- **Sujeto obligatorio:** mapa, objetivos, cadenas de quest, checkpoints y
  recompensas.
- **Acento del protocolo:** cyan + ember.
- **Assets autorizados:** `backgrounds/bg_missions.jpg` y recursos de misión
  inscritos.
- **Datos vivos:** `DailyQuest`, `MobileMission` y `MissionReward`; progreso,
  target, claim y reward conservan sus tipos y estados.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Interacción y motion:** abrir misión, ejecutar, reclamar sólo según
  contrato y volver al Home.
- **Prohibiciones:** no presentar progreso, claim o reward sin confirmación de
  settlement; no convertir lore en progreso.
- **Cierre:** claim idempotente, locked con motivo, pending visible y retorno
  con estado persistido.

### DSP-06 — Store / Economy

- **Rutas:** `/store` y `/economy`.
- **Sujeto obligatorio:** cámara de materiales, wallet, ofertas, crafting,
  compra, receipt, ledger y recovery de transacción.
- **Acento del protocolo:** oro + magenta.
- **Assets autorizados:** `backgrounds/bg_packs.jpg`,
  `heroes/hero_economy.jpg`, `heroes/hero_fusion.jpg` y arte registrado.
- **Datos vivos:** `Wallet`, `EconomyStats`, `EconomyLedgerEntry`,
  `MobilePack`, `MobilePackOrder`, `MobileShopItem`, `MobileShopOrder`,
  `DepositRecord`, `WithdrawalRequest`, shards, fusión y evolución.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Interacción y motion:** una mutación por acción, protección de doble
  aplicación, receipt pending, hash y revalidación del saldo.
- **Prohibiciones:** no inventar precio, wallet, fee, saldo, tx hash, fecha,
  carta recibida o recompensa.
- **Cierre:** input inválido, saldo antes/después, receipt, recovery de pago y
  persistencia de cada mutación.

### DSP-07 — Social / Guild

- **Rutas:** `/social`.
- **Sujeto obligatorio:** sala de alianza, amigos, clanes, chat, invitaciones,
  ranking, guerra, presencia y moderación.
- **Acento del protocolo:** azul profundo + oro.
- **Assets autorizados:** `backgrounds/bg_clans.jpg`,
  `backgrounds/bg_leaderboard.jpg` y emblemas/facciones registrados.
- **Datos vivos:** `MobileSocialSnapshot`, `Opponent`, amistades, desafíos,
  clan, miembros, wars, rankings, matches y temporada.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `recovery`.
- **Interacción y motion:** navegar paneles, aceptar/rechazar, desafiar,
  crear/unirse/salir y recuperar una mutación interrumpida.
- **Prohibiciones:** no inventar presencia, nombres, MMR, posición, temporada,
  timestamps o guerras.
- **Cierre:** privacidad, moderación, fechas honestas, estados de conexión y
  ausencia de acciones duplicadas.

### DSP-08 — World Atlas

- **Rutas:** `/world`.
- **Sujeto obligatorio:** biomas, regiones, bosses, raids y ruta narrativa.
- **Acento del protocolo:** cyan + violet + ember.
- **Assets autorizados:** `backgrounds/bg_bosses.jpg`; regiones y arte
  adicionales requieren promoción canónica.
- **Datos vivos:** `MobileWorldBoss`, `MobileBossEncounter`,
  `MobileRaidRun` y `MobileRaidParticipant`.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Interacción y motion:** abrir identidad, combatir sólo con elegibilidad,
  leer daño, reclamar settlement y volver.
- **Prohibiciones:** no usar lore para reemplazar boss, daño, eligibility,
  reward o progreso.
- **Cierre:** identidad y daño legibles, locked real, claim persistido y
  recovery de red.

### DSP-09 — Profile / Progression

- **Rutas:** `/(tabs)/profile`.
- **Sujeto obligatorio:** avatar, rango, niveles, mastery, logros, identidad,
  historial, preferencias y privacidad.
- **Acento del protocolo:** oro + azul.
- **Assets autorizados:** `profile-reference-scene.png` como referencia local;
  `heroes/hero_profile.jpg` permanece `RESERVED_SURFACE_ART` hasta decisión
  de consumidor.
- **Datos vivos:** `PlayerProfile`, `PlayerProgress`, `PlayerStats`,
  `PlayerRank`, `PlayerAchievement`, `Wallet` y snapshot social.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `recovery`.
- **Interacción y motion:** paneles, back, refresh, sign-out y reduced-motion.
- **Prohibiciones:** no convertir ausencia de historial, ranking, racha o
  temporada en cero; `draw`, `pending` y recovery deben sobrevivir al render.
- **Cierre:** legibilidad, sign-out, paneles, estados sociales y resolución de
  `PROFILE_HISTORY_STATE_GAP`.

### DSP-10 — Meta / Live Operations

- **Rutas:** `/meta`.
- **Sujeto obligatorio:** temporada, eventos, recompensas, preferencias,
  cosméticos, reliquias y señales de actividad legibles para el jugador.
- **Acento del protocolo:** magenta + cyan.
- **Assets autorizados:** sólo los registrados por el manifiesto y sus
  consumidores; no se agrega una imagen para cubrir ausencia de contenido.
- **Datos vivos:** `MobileSettings`, `MobileCosmetic`,
  `MobilePlayerCosmetic`, `MobileRelic`, `MobilePlayerRelic`,
  `MobileNft*` y `MobileAdStats`.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `recovery`.
- **Interacción y motion:** toggles, audio, mute, reduced-motion y persistencia
  confirmada de preferencias.
- **Prohibiciones:** no convertir telemetría, cosméticos, NFT, anuncios o live
  operations ausentes en un dashboard técnico o en contenido ficticio.
- **Cierre:** toggles accesibles, persistencia, señales legibles y retorno.

## 4. Capas transversales

Auth (`/auth`) y Tutorial (`/tutorial`) no se convierten en paneles adicionales.
Son capas obligatorias que atraviesan los diez perfiles:

| Capa | Fuente real | Regla de escena | Gate |
|---|---|---|---|
| Auth | `Session`, Auth y `authLoading/authError` | no presentar acceso al Nexus sin sesión confirmada | teclado, safe area, submit, recovery y mensajes seguros |
| Tutorial | `tutorial_step`, `TUTORIAL_TOTAL_STEPS`, `TUTORIAL_DONE_STEP` | no saltar gates localmente ni separar el onboarding del Nexus | reanudación, persistencia, back, targets y reduced-motion |
| Estados comunes | loaders y `DomainState` | loading/empty/error deben conservar el significado del contrato | evidencia de estados, retry y recovery |
| Plataforma | safe areas, haptics, audio, reduced-motion y tiers | el dominio conserva su identidad aunque se reduzcan efectos | dispositivo físico y rendimiento |

## 5. Criterio de cierre T0

Un perfil sólo puede cambiar de `PREPARED` a `VERIFIED` cuando tenga:

1. asset ID o archivo con procedencia y consumidor real;
2. datos vivos y estados de la matriz ejecutable;
3. hitboxes, tap/back/retry y recuperación de red;
4. reduced-motion, audio/mute y safe area comprobados;
5. medición en Device Matrix, incluyendo Battlefield/replay cuando aplique;
6. evidencia de persistencia, settlement y release cuando el cambio toque
   `mobile/**`.

Este documento no promueve assets ni declara compatibilidad física. El estado
de todos los perfiles permanece `PREPARED / EVIDENCE_REQUIRED`; T0 no es
`VERIFIED`, `TIER1_READY` ni `OPERATIONAL`.