# VEXFORGE — T0 Android visual acceptance contract

**Fecha:** 2026-09-15  
**Unidad:** T0 — `VISUAL_ACCEPTANCE` ejecutable por ruta y tier  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `fa67f6a8e5bdb63903b05293a76b944ce8ddaf25`  
**Fuente activa:** `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y límites

Este documento convierte `VISUAL_ACCEPTANCE` de una referencia abierta en un
contrato comprobable para los 13 Screen Master Records y los tres tiers
provisionales de dispositivo. No es una captura, no es una prueba de APK y no
promueve un candidato a dispositivo soportado.

La autoridad permanece separada:

- Supabase y sus contratos vivos: datos, Auth, economía, RPCs, RLS y settlement.
- ForgeFormation / Battle Run: reglas, eventos, replay y resultado de combate.
- Android: render, input, navegación y reanudación del contrato vivo.
- `src/lib/assetManifest.ts` y `mobile/constants/visual.ts`: procedencia y
  selección de assets autorizados.
- Este documento: criterio de aceptación y evidencia; nunca fuente de gameplay.

La regla de cero genéricos prevalece: un estado ausente, error, pending,
locked o vacío debe pertenecer al dominio actual y conservar su causa. No se
acepta inventar cartas, nombres, fechas, estadísticas, recompensas, precios,
resultados, arte o compatibilidad para completar una captura.

## 2. Estados de evidencia

| Estado | Significado | Promoción permitida |
|---|---|---|
| `NOT_MEASURED` | No existe evidencia física completa para la celda `tier × SMR`. | Ninguna; permanece `EVIDENCE_REQUIRED`. |
| `EVIDENCE_CAPTURED` | El evidence pack contiene todos los campos aplicables y trazabilidad reproducible. | Puede pasar a revisión del record, no a `VERIFIED` automáticamente. |
| `BLOCKED` | Hay clipping, fallback genérico, acción duplicada, crash/OOM, éxito prematuro, estado omitido o umbral incumplido sin tier válido. | No se promueve hasta resolver la causa y repetir la captura. |
| `VERIFIED` | El record y su evidencia fueron revisados contra el protocolo, la fuente viva y el release correspondiente. | Sólo después de revisión completa; no se infiere por compilación. |

Una ruta no puede promoverse si una celda crítica está `NOT_MEASURED` o
`BLOCKED`. Un tier no puede llamarse `SUPPORTED` hasta que sus rutas críticas
hayan cerrado el evidence pack completo.

## 3. Criterios comunes de aceptación

| Gate | Qué se debe demostrar | Evidencia mínima | Bloqueo |
|---|---|---|---|
| Identidad y procedencia | La superficie corresponde al dominio y usa sólo assets autorizados. | Captura de la ruta, asset IDs y fuente del dato/arte. | Arte genérico, identidad inventada o asset sin procedencia. |
| Datos honestos | Los valores visibles coinciden con la respuesta viva; ausencia no se convierte en cero o éxito. | Respuesta o log correlacionado con la captura. | Dato fabricado, stale no declarado o fallback silencioso. |
| Estados | Se ejecutan los estados aplicables: `loading`, `empty`, `pending`, `error`, `locked`, `completed`, `recovery`. | Captura por estado aplicable y condición que lo produjo. | Estado omitido, confundido o sustituido por pantalla genérica. |
| Interacción | Tap, scroll, back, retry y hitboxes funcionan sin duplicar mutaciones. | Recorrido grabado o registro de pasos y resultado. | Target inaccesible, doble acción o back que pierde contexto. |
| Safe area y legibilidad | Texto, cartas, placas, controles y datos no quedan bajo insets ni teclado. | Modelo exacto, orientación, insets y captura legible. | Clipping, solape, contraste insuficiente o dato ilegible. |
| Motion y audio | `reduced-motion` conserva comprensión; mute/audio respetan el evento y no bloquean. | Estado normal y reducido, con audio/mute observado. | Movimiento no reducible, audio inventado o feedback que contradice el evento. |
| Persistencia y recovery | Resultado, saldo, recompensa, receipt o settlement sólo aparece después de confirmación. | Antes/después correlacionado con fuente viva; red interrumpida y reanudación. | Éxito prematuro, mutación duplicada o recovery que pierde el estado. |
| Rendimiento | No hay crash/OOM; Battlefield y replay cumplen P95 ≤ 16,7 ms y P99 ≤ 25 ms durante 30 s. | Captura de rendimiento, duración, tier y dispositivo real. | Umbral incumplido sin quality tier documentado o degradación que altera outcome. |
| Release y trazabilidad | La evidencia corresponde al código y APK realmente probados. | Commit, workflow/run, release/tag, APK y SHA-256 cuando `mobile/**` cambió. | Evidencia de otro commit, release ausente o build no identificable. |

Los criterios no aplicables deben marcarse `N/A` con una razón derivada del
record; nunca se dejan implícitamente aprobados.

## 4. Cobertura por Screen Master Record

Cada fila se evalúa por separado en `LOW`, `REFERENCE` y `HIGH`. La columna
`estado actual` es deliberadamente `NOT_MEASURED` hasta que exista un pack
físico completo.

| Record / ruta | Sujetos y estados críticos | Aceptación específica | Estado actual |
|---|---|---|---|
| `SMR-01 /auth` | Sesión, error de Auth, recovery y entrada segura. | Teclado, safe area, submit único, mensajes seguros, back y reintento sin crear sesión falsa. | `NOT_MEASURED` |
| `SMR-02 /(tabs)/` | Nexus, portales, actividad, misión y progreso vivos. | Primera impresión con identidad de mundo, señales parciales honestas, navegación a dominios y recovery de sesión. | `NOT_MEASURED` |
| `SMR-03 /(tabs)/battle` | Formación, Battlefield, eventos, replay, resultado y settlement. | Targets estables, evento autoritativo, no simular outcome en render, 30 s de rendimiento y persistencia de resultado. | `NOT_MEASURED` |
| `SMR-04 /(tabs)/collection` | Cartas, identidad, rareza, filtros, detalle y estados vacíos. | Arte canónico, stats ausentes sin barras de cero, filtros/scroll y procedencia visible cuando aplique. | `NOT_MEASURED` |
| `SMR-05 /(tabs)/deck` | Composición, legalidad, Champion, formación y reserva. | Validación viva, slots/roles legibles, bloqueo legal honesto y no guardar un mazo no confirmado. | `NOT_MEASURED` |
| `SMR-06 /(tabs)/profile` | Identidad, progreso, logros, historial, racha y social. | `victory`, `defeat`, `draw` y `pending` no se mezclan; la racha no cuenta estados no resueltos. | `NOT_MEASURED` |
| `SMR-07 /economy` | Wallet, ledger, treasury, retiro y recovery de transacción. | Saldo y receipt confirmados, límites visibles, pending diferenciado y cero doble aplicación. | `NOT_MEASURED` |
| `SMR-08 /meta` | Settings, cosméticos, relics, NFT y señales de live operations. | Preferencias persistentes, toggles accesibles, contenido ausente sin inventar operaciones o rewards. | `NOT_MEASURED` |
| `SMR-09 /missions` | Quests, progreso, rewards, lock y claim. | Claim idempotente, pending hasta settlement, locked con motivo y recompensa sólo después de confirmación. | `NOT_MEASURED` |
| `SMR-10 /social` | Friends, requests, challenges, guild, wars, rankings y matches. | Presencia, nombres, fechas y ranking provenientes de fuente viva; privacidad y acciones sin duplicación. | `NOT_MEASURED` |
| `SMR-11 /store` | Packs, ofertas, orders, fusión, evolución, wallet y receipt. | Precio, carta recibida, receipt y saldo nunca se fabrican; compra/recovery conservan idempotencia. | `NOT_MEASURED` |
| `SMR-12 /tutorial` | Pasos, gates, sesión y progreso confirmado. | No saltar pasos localmente; reanudar y persistir sólo el paso confirmado; safe area y reduced-motion. | `NOT_MEASURED` |
| `SMR-13 /world` | Regiones, bosses, raids, daño, elegibilidad y rewards. | Identidad y daño vivos, lock real, claim/settlement confirmado y retorno/recovery sin inventar progreso. | `NOT_MEASURED` |

Rewards y Live Operations no crean una ruta adicional: se aceptan dentro de
Missions, Store, Economy, World y Meta según el record correspondiente.

## 5. Evidence pack obligatorio

Cada combinación `tier × SMR` debe conservar, como mínimo:

1. **Identidad física:** fabricante, modelo exacto, variante, build, Android/API,
   RAM, resolución, densidad, orientación, refresh rate e insets.
2. **Entorno:** red utilizada, transición de red si aplica, temperatura inicial y
   final, duración y memoria inicial/pico.
3. **Build:** commit probado, workflow/run, release/tag, APK y SHA-256 cuando el
   cambio haya tocado `mobile/**`.
4. **Recorrido:** acciones tap/scroll/back/retry, hitboxes y ausencia de doble
   mutación.
5. **Estados:** capturas y condición viva de cada estado aplicable.
6. **Motion/audio:** normal, `reduced-motion`, mute y audio derivado del evento.
7. **Persistencia:** consulta o respuesta que confirme el resultado, saldo,
   reward, receipt o settlement cuando corresponda.
8. **Rendimiento:** 30 s para Battlefield/replay, frame time P95/P99, crash/OOM,
   memoria, temperatura y quality tier observado.
9. **Decisión:** `EVIDENCE_CAPTURED`, `BLOCKED` o `NOT_MEASURED`, con causa,
   fecha y revisor; nunca una aprobación implícita.

La evidencia debe permitir repetir la conclusión. Una captura estética aislada,
un typecheck, una guarda textual o un HTTP 200 no cierra este contrato.

## 6. Estado T0 y regla de cierre

- `VISUAL_ACCEPTANCE`: `PREPARED / EVIDENCE_REQUIRED`.
- Las 39 celdas `tier × Screen Master Record` permanecen `NOT_MEASURED`.
- `DEVICE_MATRIX`: `CANDIDATE / EVIDENCE_REQUIRED`; ningún tier es `SUPPORTED`.
- `PROFILE_HISTORY_STATE_GAP`: continúa `BLOCKED`.
- El gate físico, APK, QA autenticada y release permanece cerrado por la
  instrucción operativa vigente.
- Este documento no añade rutas, assets, datos, permisos, gameplay ni cambios
  en `mobile/**`.
- No se declara `VERIFIED`, `TIER1_READY` ni `OPERATIONAL`.
