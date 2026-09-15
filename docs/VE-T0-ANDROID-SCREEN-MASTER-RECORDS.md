# VEXFORGE — T0 Android Screen Master Records

**Fecha:** 2026-09-15
**Unidad:** T0 — Screen Master Records and visual acceptance register
**Estado:** `PREPARED / EVIDENCE_REQUIRED`
**Entorno activo:** aplicación Android en `mobile/**`
**Baseline observado:** `main` en `624007bb732b40c186495f0a3aab2d872ed86e0f`
**Fuente activa reconciliada:** `public.vexforge_official_documents`
(`vexforge_home_world_system_protocol_v3`, `ACTIVE`, V2.2)
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito

Este registro convierte el mapa real de rutas Android en superficies
verificables. No crea rutas nuevas, no inventa datos y no usa la referencia
visual como sustituto de una APK ejecutada.

La autoridad de cada record se divide así:

- datos, autenticación, RPCs, RLS, economía y settlement: Supabase y contratos
  vivos;
- resolución de combate y replay: ForgeFormation / Battle Run;
- render, input y navegación: Android;
- assets: `src/lib/assetManifest.ts`, `mobile/constants/visual.ts` y el atlas
  de assets;
- evidencia de aceptación: dispositivo físico, captura, touch, estado,
  rendimiento y continuidad.

Este registro refleja las secciones 72.3, 72.7 y 72.8 del protocolo activo. La
existencia de una ruta, el typecheck, una guarda textual o una compilación no
promueven un record a `VERIFIED`.

## 2. Inventario real de rutas

El repositorio contiene 13 rutas Android de producto. `_layout` y `+not-found`
son rutas estructurales y no se cuentan como paneles de producto.

| ID | Ruta | Dominio / sujeto | Record | Estado T0 |
|---|---|---|---|---|
| SMR-01 | `/auth` | Auth / entrada segura al Nexus | [record](#smr-01--auth) | `STATIC_ONLY` |
| SMR-02 | `/(tabs)/` | Nexus / Home / citadel y portales | [record](#smr-02--home--nexus) | `STATIC_ONLY` |
| SMR-03 | `/(tabs)/battle` | Arena / Battlefield / formaciones y eventos | [record](#smr-03--battlefield) | `STATIC_ONLY` |
| SMR-04 | `/(tabs)/collection` | Collection / Archivo / cartas y unidades | [record](#smr-04--collection--archivo) | `STATIC_ONLY` |
| SMR-05 | `/(tabs)/deck` | Deck / Forja / composición y legalidad | [record](#smr-05--deck--forja) | `STATIC_ONLY` |
| SMR-06 | `/(tabs)/profile` | Profile / identidad, progreso e historial | [record](#smr-06--profile--progression) | `STATIC_ONLY` |
| SMR-07 | `/economy` | Store / Economy / wallet, ledger y treasury | [record](#smr-07--economy) | `STATIC_ONLY` |
| SMR-08 | `/meta` | Meta / preferencias y live operations visibles | [record](#smr-08--meta) | `STATIC_ONLY` |
| SMR-09 | `/missions` | Missions / objetivos y recompensas | [record](#smr-09--missions) | `STATIC_ONLY` |
| SMR-10 | `/social` | Social / Guild / relaciones y presencia | [record](#smr-10--social--guild) | `STATIC_ONLY` |
| SMR-11 | `/store` | Store / ofertas, órdenes y fusión | [record](#smr-11--store) | `STATIC_ONLY` |
| SMR-12 | `/tutorial` | Onboarding / recorrido guiado | [record](#smr-12--tutorial) | `STATIC_ONLY` |
| SMR-13 | `/world` | World Atlas / regiones, bosses y raids | [record](#smr-13--world-atlas) | `STATIC_ONLY` |

No existe una ruta independiente de Rewards o Live Operations. Esas
experiencias se consumen dentro de Missions, Store, Economy, World y Meta;
esta ausencia se conserva como hecho del producto.

## 3. Contrato común de todos los records

Cada pantalla debe demostrar los siguientes estados con datos vivos:

| Estado | Fuente | Acción permitida | Evidencia pendiente |
|---|---|---|---|
| `loading` | solicitud viva sin respuesta | esperar o cancelar cuando el contrato lo permita | captura en dispositivo |
| `empty` | respuesta válida con cero filas | orientar a una acción real | captura con respuesta vacía |
| `pending` | mutación iniciada sin settlement confirmado | bloquear doble acción y consultar estado | captura y log de transición |
| `error` | fallo de transporte o contrato | retry/back/recovery | captura de error seguro |
| `locked` | Auth, elegibilidad o regla viva | autenticar o cumplir requisito | captura con motivo |
| `completed` | resultado persistido | continuar o volver | captura y evidencia de persistencia |
| `recovery` | reconexión o reanudación | revalidar antes de mutar | captura con red interrumpida |

El estado `STATIC_ONLY` significa que existe un punto de inspección en código y
un contrato de pantalla identificable, pero todavía no hay medición física,
QA visual/táctil ni evidencia de APK de esta unidad.

## 4. Records por pantalla

### SMR-01 — Auth

- **Ruta:** `/auth`; fuente primaria: `mobile/app/auth.tsx`.
- **Sujeto:** entrada segura al Nexus y estado de sesión, no una escena
  decorativa.
- **Assets:** `auth-reference-scene.png` está registrado como canon local de
  Auth; `cover/main.jpg` es el fondo remoto canónico.
- **Datos y acciones:** credenciales y sesión provienen del flujo de Auth
  existente; submit, recuperación, remember y visibilidad de contraseña deben
  conservar estados de carga/error.
- **Estados mínimos:** `loading`, `error`, `locked`, `recovery`.
- **Aceptación:** touch de campos y submit, safe area, teclado, mensaje seguro,
  retry y back. `STATIC_ONLY` hasta QA autenticada.

### SMR-02 — Home / Nexus

- **Ruta:** `/(tabs)/`; fuente primaria: `mobile/app/(tabs)/index.tsx`.
- **Sujeto:** citadel, núcleo de forja, portales y actividad viva; debe leerse
  como entrada a un juego y no como dashboard.
- **Assets:** `home-reference-scene.png` es la escena vertical oficial de
  `1080×2340`, usada como arte ambiental y no como captura de interfaz. La
  escena funcional añade artwork canónico vivo de la identidad desde Storage y
  capas authored de entorno. `vexforge-home-hero.png`, `vexforge-hero-sentinel.png`
  y `vexforge-feature-card.png` no se consumen automáticamente sin una decisión
  de consumidor; el logo y facciones usan Storage oficial cuando están
  disponibles.
- **Calidad visual:** la escena se compone como viewport centrado con capas de
  entorno, atmósfera, entidad y primer plano interactivo. El asset aprobado no
  se monta sobre otra escena ni actúa como poster estático: respira con deriva
  idle/parallax acotado, mientras la UI conserva materialidad VEXFORGE y no
  inventa VFX ni datos.
- **Datos y acciones:** `GameContext`, Supabase y las fuentes de Home existentes;
  portales y reintento sólo reflejan rutas y señales publicadas.
- **Estados mínimos:** `loading`, `empty`, `partial`, `error`, `recovery`.
- **Aceptación:** navegación de portales, pull-to-refresh, retry sin
  duplicados, reduced-motion, parallax acotado, safe area y lectura de hero.

### SMR-03 — Battlefield

- **Ruta:** `/(tabs)/battle`; fuente primaria: `mobile/app/(tabs)/battle.tsx`.
- **Sujeto:** formaciones, Champion, mano, Command, Reserve, target legal,
  evento y resultado.
- **Assets:** `battle-reference-scene.png` es el arte aprobado de la escena
  dentro del viewport nativo; no es una captura ni contiene UI de runtime.
  El arte de carta real llega desde datos vivos; cualquier carta sin imagen debe
  conservar estado honesto.
- **Datos y acciones:** Battle Run / ForgeFormation, replay y settlement
  existentes; no se crea un motor paralelo.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** escena reconocible antes que panel, formaciones/Champion/
  Reserve/hand/Command legibles, parallax limitado, iluminación ambiental,
  touch de target y acción, turn/event stream, resultado persistido,
  abandono/timeout, replay y objetivo de 60 FPS por medir.

### SMR-04 — Collection / Archivo

- **Ruta:** `/(tabs)/collection`; fuente primaria:
  `mobile/app/(tabs)/collection.tsx`.
- **Sujeto:** unidades, cartas, artefactos, rareza, facción, lore, procedencia
  y mastery.
- **Assets:** `collection-archive-scene.jpg` es la escena local registrada;
  `heroes/hero_assets.jpg` es el fondo remoto canónico; arte de carta viene de
  registros vivos.
- **Datos y acciones:** colección, filtros y detalle con señales reales;
  ausencia de imagen, rareza o lore se muestra como pendiente/no reportado.
- **Estados mínimos:** `loading`, `empty`, `error`, `pending`, `recovery`.
- **Aceptación:** filtros, detalle, scroll, lectura de cartas, fallback
  explícito y ausencia de sustitución genérica.

### SMR-05 — Deck / Forja

- **Ruta:** `/(tabs)/deck`; fuente primaria:
  `mobile/app/(tabs)/deck.tsx`.
- **Sujeto:** pedestal, cartas, composición, formación y legalidad del mazo.
- **Assets:** `decks-reference-scene.png` está registrada como escena activa y
  ahora es consumida como arte de escena dentro de un viewport nativo;
  `deck-forge-scene.jpg` queda `REVIEW_REQUIRED` hasta decisión explícita.
  `heroes/hero_fusion.jpg` cubre Forge en Storage.
- **Datos y acciones:** colección y legalidad entregadas por contratos vivos;
  editar, seleccionar y guardar no pueden declarar éxito local antes de
  persistencia.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** touch de slots, confirmación, validación legal, estado de arte
  pendiente, recuperación de guardado y separación verificable entre arte de
  escena y UI nativa.

### SMR-06 — Profile / Progression

- **Ruta:** `/(tabs)/profile`; fuente primaria:
  `mobile/app/(tabs)/profile.tsx`.
- **Sujeto:** identidad, rango, progreso, logros, historial y señales sociales.
- **Assets:** `profile-reference-scene.png` es canon local de referencia;
  `heroes/hero_profile.jpg` permanece como arte reservado en el manifiesto.
- **Datos y acciones:** perfil, achievements, ranking e historial de Supabase;
  `draw` y `pending` deben sobrevivir al render del historial.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `recovery`.
- **Aceptación:** paneles, back, sign-out, texto legible y preservación de
  resultados `draw`/`pending`. `PROFILE_HISTORY_STATE_GAP` mantiene el gate
  bloqueado.

### SMR-07 — Economy

- **Ruta:** `/economy`; fuente primaria: `mobile/app/economy.tsx`.
- **Sujeto:** Iron Treasury, balances, depósitos, retiros, ledger y referidos.
- **Assets:** `heroes/hero_economy.jpg` es la resolución canónica declarada;
  los valores económicos siempre vienen de contratos vivos.
- **Datos y acciones:** wallet, fórmulas informativas, límites, ledger y RPCs;
  entrada inválida o fecha/hash ausente conserva señal honesta.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** bloqueo de doble retiro, pending de receipt, campos
  inválidos, retry y protección de saldo antes de settlement.

### SMR-08 — Meta

- **Ruta:** `/meta`; fuente primaria: `mobile/app/meta.tsx`.
- **Sujeto:** preferencias de jugador y live operations visibles, nunca consola
  técnica.
- **Assets:** sólo los registrados por el manifiesto y los consumidores
  reales; no se agrega una imagen por ausencia de contenido.
- **Datos y acciones:** preferencias, notificaciones, Telegram vinculado,
  modo de UI, audio y reduced-motion preservan el estado local/servidor
  existente.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `recovery`.
- **Aceptación:** toggles accesibles, persistencia confirmada, reduced-motion,
  audio/mute y back.

### SMR-09 — Missions

- **Ruta:** `/missions`; fuente primaria: `mobile/app/missions.tsx`.
- **Sujeto:** mapa, objetivos, cadenas de quest, checkpoints y recompensas.
- **Assets:** `backgrounds/bg_missions.jpg` y recursos inscritos de misiones;
  recompensas sin confirmación no se presentan como completadas.
- **Datos y acciones:** quests y claim desde Supabase/RPCs; `pending` se
  mantiene hasta settlement.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** claim idempotente, progreso real, locked con motivo,
  reintento y retorno al Home.

### SMR-10 — Social / Guild

- **Ruta:** `/social`; fuente primaria: `mobile/app/social.tsx`.
- **Sujeto:** amigos, clanes, invitaciones, chat, presencia, ranking y guerras.
- **Assets:** `backgrounds/bg_clans.jpg`, `bg_leaderboard.jpg` y arte de
  facciones del manifiesto; presencia ausente no se rellena.
- **Datos y acciones:** amistades, desafíos, roster, guerras y fechas desde los
  contratos vivos; timestamps inválidos se distinguen de los ausentes.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `recovery`.
- **Aceptación:** navegación entre paneles, privacidad/moderación, estados de
  conexión, chat y fechas honestas.

### SMR-11 — Store

- **Ruta:** `/store`; fuente primaria: `mobile/app/store.tsx`.
- **Sujeto:** cámara de materiales, ofertas, órdenes, receipt y fusión.
- **Assets:** `backgrounds/bg_packs.jpg`, `heroes/hero_market.jpg` y cartas
  reales; precios, wallet y receipt nunca se inventan.
- **Datos y acciones:** catálogo, shards, fusion, orden de pago y submit de
  transacción desde contratos vivos.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** una sola mutación por acción, receipt pending, recovery de
  pago, tx hash y wallet faltantes claramente señalados.

### SMR-12 — Tutorial

- **Ruta:** `/tutorial`; fuente primaria: `mobile/app/tutorial.tsx`.
- **Sujeto:** onboarding contextual del mismo Nexus; no un producto visual
  separado.
- **Assets:** `tutorial/main.png` es la pieza remota canónica declarada.
- **Datos y acciones:** progreso y desbloqueos del tutorial provienen de la
  sesión/contratos vivos; no se saltan gates localmente.
- **Estados mínimos:** `loading`, `locked`, `pending`, `error`, `recovery`.
- **Aceptación:** safe area, targets, back, reduced-motion, reanudación y
  persistencia del paso confirmado. El protocolo coloca T9 después del loop
  validado.

### SMR-13 — World Atlas

- **Ruta:** `/world`; fuente primaria: `mobile/app/world.tsx`.
- **Sujeto:** biomas, regiones, bosses, raids y ruta narrativa.
- **Assets:** `backgrounds/bg_bosses.jpg` cubre World/Raids; regiones reservadas
  permanecen pendientes hasta promoción canónica.
- **Datos y acciones:** objetivos, identidad de boss, ranking, rewards y
  progreso desde las fuentes vivas; lore no sustituye progreso.
- **Estados mínimos:** `loading`, `empty`, `pending`, `error`, `locked`,
  `completed`, `recovery`.
- **Aceptación:** locked por elegibilidad real, lectura de identidad y daño,
  claim/settlement, retorno y recovery de red.

## 5. Gates de aceptación T0

Todos los records quedan `STATIC_ONLY` hasta contar con:

1. captura en un dispositivo físico nombrado;
2. touch/back/retry y safe area comprobados;
3. estados comunes ejecutados con datos reales;
4. reduced-motion, audio y performance tier revisados;
5. errores de red y recovery observados sin duplicar mutaciones;
6. evidencia de persistencia para cualquier resultado, saldo, recompensa o
   settlement;
7. relación con el release Android correspondiente cuando se autorice.

Los candidatos de la Device Matrix (`LOW`, `REFERENCE`, `HIGH`) siguen siendo
candidatos: Samsung Galaxy A14 5G, Google Pixel 7a y Google Pixel 8 Pro no se
declaran compatibles sin medición física.

### 5.1 Campos medibles y criterio de bloqueo

Cada evidence pack debe completar estos campos, incluso cuando el resultado sea
`NOT_MEASURED`:

| Campo | Umbral o valor requerido | Bloqueo |
|---|---|---|
| Dispositivo | modelo exacto, API, RAM, densidad, resolución, orientación | sin dispositivo físico nombrado → `EVIDENCE_REQUIRED` |
| Safe area y legibilidad | insets observados, texto/cartas legibles, sin clipping | clipping o dato no comprobado → `BLOCKED` |
| Interacción | tap, back, retry y hitboxes del record | acción duplicada, target inaccesible o no probado → `BLOCKED` |
| Estados | `loading`, `empty`, `pending`, `error`, `locked`, `completed`, `recovery` según dominio | fallback genérico o estado omitido → `BLOCKED` |
| Movimiento y audio | reduced-motion y mute comprobados; audio derivado del evento | comportamiento no medido → `EVIDENCE_REQUIRED` |
| Rendimiento | sin crash/OOM; Battlefield/replay: captura de 30 s, frame time P95 ≤ 16,7 ms y P99 ≤ 25 ms | incumplimiento sin quality tier documentado → `BLOCKED` |
| Persistencia | resultado, saldo, recompensa o settlement confirmado por fuente viva | éxito mostrado antes de persistir → `BLOCKED` |
| Evidencia de release | APK, run, tag, SHA-256 y relación con el commit | ausencia de release cuando el cambio toque `mobile/**` → `EVIDENCE_REQUIRED` |

El bloque actual no ejecuta APK ni altera `mobile/**`; por eso todos los records
continúan en `STATIC_ONLY`. La matriz de dispositivos permanece
`CANDIDATE / EVIDENCE_REQUIRED` y no se convierte en compatibilidad declarada.

## 6. Estado y bloqueos

- `DEVICE_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- `VISUAL_STATE_MATRIX`: preparada a nivel común; evidencia por ruta pendiente.
- `DOMAIN_SCENE_PROFILES`: preparados; no autorizan assets nuevos.
- `VISUAL_ACCEPTANCE`: abierto.
- `PROFILE_HISTORY_STATE_GAP`: `BLOCKED`.
- `verify:manifest` y `verify:assets`: revalidación completa de Storage,
  224/224 HEAD del manifiesto y 22/22 objetos canónicos disponibles.
- APK, release y QA de dispositivo: no ejecutados en esta unidad por la
  instrucción de no compilar.

Este documento registra preparación y límites. No declara `VERIFIED`,
`TIER1_READY` ni `OPERATIONAL`.