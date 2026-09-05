# VE-UI-TIER1-T0 — Reconciliación y baseline Android

**Fecha:** 2026-09-03  
**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Nivel:** `Q0 → Q1` para el contrato documental; no es un pase visual ni una declaración Tier 1.

## Propósito

Este baseline ejecuta T0 del plan `VE-UI-TIER1-ANDROID-01` después de la revisión de suficiencia del plan. Su objetivo es separar hechos comprobados, deuda visual, bloqueos de verificación y el orden de implementación. No modifica reglas de juego, datos, economía, Auth, RLS, RPCs, Storage ni autoridad de combate.

## Fuentes reconciliadas

- `main` del repositorio oficial `grandmaster68081-byte/Vexforge-web`.
- `VEXFORGE_PROTOCOL_V2.md` y su fila activa `vexforge_master_protocol_v2` en Supabase.
- `CONTINUITY.md` más reciente.
- `docs/VE-MOB-0-PORT-INVENTORY.md` y contratos `VE-MOB-2` a `VE-MOB-14`.
- `docs/VE-VIS-1-TIER1-VISUAL-OBJECTIVE.md` y la tabla viva `public.vexforge_visual_tier1_objective`.
- `docs/VE-1-VISUAL-BIBLE.md`, `docs/VE-MOB-3-HOME.md`, el manifiesto visual Android y los consumidores reales de `mobile/**`.
- Código Android real: Home, shell visual, tokens, tipografía, iconografía, registro de assets, Supabase, telemetría y rutas existentes.
- Investigación de referentes de presentación TCG móvil: se toman principios de jerarquía, escena, carta como objeto, feedback y claridad; no se copian identidad, arte, layout, textos ni mecánicas.

## Hechos comprobados

| Área | Evidencia | Estado real |
|---|---|---|
| Fuente de código | `main` confirmado por GitHub REST en el commit vigente de esta reconciliación | `RECONCILED` |
| Protocolo | fila activa de Supabase en versión `v2.10-android-visual-first-execution-plan`; copia de GitHub exacta tras la revisión | `RECONCILED` |
| Superficie de implementación | Android es la única superficie activa; web queda congelada como referencia | `RECONCILED` |
| Port Android | Auth, Home, Colección, Mazo, Tutorial, Battle, Rewards, Profile, Packs/Shop, Economy, World, Social y Meta tienen unidades implementadas | `IMPLEMENTED_UNVERIFIED` |
| QA humana | falta instalación/recorrido visual y funcional por operador en APK/dispositivo o emulador | `PENDING_HUMAN_QA` |
| Home / Forja | existe primera capa visual con `lobby/main.jpg`, tokens, tipografía, iconografía authored, datos vivos y estados explícitos; la composición aún no alcanza Q4 | `Q1/Q2 → Q4` |
| Cartas | existe contrato de datos, arte oficial y piloto authored; falta cerrar el recorrido universal selección → reveal → inspector → estadísticas → retorno en el vertical slice | `IN_PROGRESS` |
| Autoridad | el cliente Android presenta datos y eventos; no se autoriza settlement, combate, inventario, recompensa ni economía local | `RECONCILED` |
| Assets | los fondos y cartas consumen el registro oficial; cualquier asset diegético nuevo requiere procedencia y manifiesto | `RECONCILED` |
| Lockfile | `mobile/package-lock.json` contiene 0 referencias a `package-firewall.replit.local` | `CLEAN` |
| Instalación local | el intento de baseline recibió HTTP 404 del firewall al resolver `npm-package-arg@11.0.3`; el comando no llegó a typecheck | `RUNNER_BLOCKED` |

## Criterios vivos que todavía impiden declarar Tier 1

La tabla de Supabase conserva criterios `MET`, pero también criterios bloqueantes `PARTIAL`, `NOT_STARTED` o sin evidencia de release/QA. Entre los gaps de producto que gobiernan la ejecución están:

- `art_direction_quality`, `design_uniqueness`, `finish_quality` y `first_impression`;
- `route_health_maturity`, `loading_and_empty_states` y `device_compatibility`;
- `combat_decision_depth` y `gameplay_balance`;
- `first_session_flow` y `content_quality`;
- `automated_regression_suite`, `network_resilience` y `competitive_integrity`;
- `benchmark_definition`, `benchmark_positioning` y `evidence_reproducibility`;
- `game_loop_telemetry`, `economy_readability`, `release_readiness` y `player_trust`;
- `backup_restore_drill`, `payments_compliance_reconciliation`, `localization_coverage`, `audio_authored_production` y la higiene de assets cuando su fuente requiere revisión humana.

Los criterios `MET` no se reinterpretan como cierre global: prueban sólo su propio alcance y no sustituyen el vertical slice ni la QA del APK.

## Matriz de brechas de ejecución

| Brecha | Por qué importa | Unidad / fase | Evidencia de cierre |
|---|---|---|---|
| Home aún puede leerse como dashboard | determina primera impresión y retorno del loop | `VE-MOB-3-HOME-SCENE/HERO/ACTION/CARD/PROGRESS`, T2/T3 | captura top/intermedio/inferior, prueba ciega de cinco segundos y matriz de estados |
| Carta sin contrato transversal completo | el TCG se reconoce por tocar, revelar e inspeccionar la carta | `VE-VIS-3-CARD-INSPECTOR`, `VE-MOB-4`, `VE-MOB-5`, `VE-MOB-8` | recorrido selección → reveal → stats → retorno en APK, con reduced-motion |
| Vertical slice no demostrado de extremo a extremo | evita cerrar pantallas aisladas sin juego completo | gate `VS-T1` | Home → Reward → Home con datos reales, resultado persistente e interacción documentada |
| Estados y reconexión | una pantalla visualmente premium no puede mentir sobre el estado del servidor | `VE-MOB-3-HOME-STATES`, Battle/Result, T4/T6/T9 | carga, vacío, error, retry, reconnect, resultado y recuperación reproducibles |
| Calidad Tier 1 no medida en dispositivo | compile/typecheck no prueban FPS, touch, memoria o legibilidad | T9/T10 | matriz de viewport/dispositivo, FPS/memoria, accesibilidad, APK autónoma y evidencia |
| Benchmark y primera sesión sin evidencia cerrada | evita confundir intención con resultado | T3/T5/T10 | rúbrica 0–5, benchmark versionado y recorrido de primera sesión medido |

## Decisión de orden

1. T0 queda documentado sin editar producto para resolver suposiciones.
2. T1 se conserva como sistema visual móvil reutilizable.
3. Se implementa `VE-MOB-3-HOME-SCENE` y después `HERO`, `ACTION`, `CARD`, `PROGRESS` y `STATES`.
4. Se cierra el contrato de carta y Colección/Inspector antes de abrir expansión visual secundaria.
5. Se recorre el vertical slice completo antes de declarar elegible la expansión de World, Social, Shop, Profile o Meta.
6. Cada lote se publica por GitHub REST, genera el workflow/release Android si toca producto, y actualiza continuidad con el estado exacto.

## No afirmado

Este baseline no afirma que el APK haya sido instalado por un operador, que el typecheck local haya pasado, que el Home sea Q4, que la primera sesión esté medida, que el benchmark esté cerrado o que VEXFORGE esté `OPERATIONAL`, `PASS` o `TIER1_READY`.


---
## Addendum 2026-09-04 — Reconciliación actual y primer lote Hero

La reconciliación T0 se mantiene como una salida documental, no como un pase de Tier 1. Se actualiza su contexto operativo: el documento normativo activo es `v2.14-automatic-ota-cycle`; la APK base OTA es `vexforge-android-build-78`, runtime `1.0.0`, app `1.0.0`, `versionCode: 3`, canal `production`, con SHA-256 registrado en `public.vexforge_android_release_registry` bajo `VE-MOB-BASE-OTA`.

El primer lote posterior a T0 comenzó en `VE-MOB-3-HOME-HERO` con el commit `2d3123fac9899f048486589785b0801009981514`. El lote añade movimiento ambiental reversible y respetuoso de `reduced-motion` al Hero existente, sin cambiar contratos ni autoridad. Permanece `IN_PROGRESS / IMPLEMENTED_UNVERIFIED`: todavía requiere evidencia en APK, revisión del Home completo y el gate visual `HOME_GAME_SCENE_QUALITY_V1`; no se publica OTA mientras el lote no esté cerrado.

El run `33933157525` de verificación quedó separado como bloqueo transitorio de Storage HTTP 429. El build Android `33933157629` se conserva como evidencia del commit y debe concluir antes de declarar el lote verificado.
