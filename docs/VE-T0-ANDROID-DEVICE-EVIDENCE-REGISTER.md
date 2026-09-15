# VEXFORGE — T0 Android device and evidence register

**Fecha:** 2026-09-15  
**Unidad:** T0 — `DEVICE_MATRIX` + `VISUAL_ACCEPTANCE` evidence register  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `feb2b60483584efb4fa2034ee447166642b31195`  
**Fuente activa:** `public.vexforge_official_documents /
vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y límite

Este registro prepara la ejecución física exigida por las secciones 72.3, 72.4
y 72.8. No es evidencia de compatibilidad, no sustituye una APK instalada y
no convierte candidatos en dispositivos soportados.

- Un emulador puede ayudar a depurar, pero no cierra el gate.
- Todo campo sin medición debe permanecer `NOT_MEASURED`.
- La captura conceptual, el typecheck, el token visual y la existencia de una
  ruta no sustituyen touch, legibilidad, memoria, temperatura, safe area o
  rendimiento físico.
- La compilación de APK, la QA autenticada y cualquier release permanecen
  bloqueadas hasta autorización explícita.

## 2. Device Matrix provisional

| Tier | Candidato nominal | Uso previsto | Estado T0 | Datos físicos pendientes |
|---|---|---|---|---|
| `LOW` | Samsung Galaxy A14 5G | memoria/GPU limitada, reduced-FX, scroll y estabilidad | `CANDIDATE / EVIDENCE_REQUIRED` | modelo exacto, API, RAM, densidad, resolución, orientación, insets, temperatura y memoria |
| `REFERENCE` | Google Pixel 7a | baseline de lectura, touch, animación y Battlefield | `CANDIDATE / EVIDENCE_REQUIRED` | modelo exacto, API, RAM, densidad, resolución, orientación, insets, temperatura y memoria |
| `HIGH` | Google Pixel 8 Pro | calidad máxima, VFX, replay y carga sostenida | `CANDIDATE / EVIDENCE_REQUIRED` | modelo exacto, API, RAM, densidad, resolución, orientación, insets, temperatura y memoria |

El nombre comercial del candidato no constituye por sí mismo el modelo exacto
ni una declaración de soporte. Cada evidence pack debe registrar el hardware
real que se utilizó o marcarlo `NOT_MEASURED`.

## 3. Cobertura por ruta

Las 13 rutas de producto mantienen estado `NOT_MEASURED / EVIDENCE_REQUIRED`
en cada tier. `_layout` y `+not-found` no son records de producto.

| ID | Ruta | LOW | REFERENCE | HIGH |
|---|---|---|---|---|
| `SMR-01` | `/auth` | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-02` | `/(tabs)/` Home / Nexus | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-03` | `/(tabs)/battle` Battlefield | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-04` | `/(tabs)/collection` Collection / Archivo | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-05` | `/(tabs)/deck` Deck / Forja | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-06` | `/(tabs)/profile` Profile / Progression | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-07` | `/economy` Economy | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-08` | `/meta` Meta | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-09` | `/missions` Missions | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-10` | `/social` Social / Guild | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-11` | `/store` Store | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-12` | `/tutorial` Tutorial | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |
| `SMR-13` | `/world` World Atlas | `NOT_MEASURED` | `NOT_MEASURED` | `NOT_MEASURED` |

Rewards y Live Operations no crean columnas ni rutas nuevas: se verifican
dentro de Missions, Store, Economy, World y Meta según los records existentes.

## 4. Evidence pack por dispositivo

Cada combinación `tier × Screen Master Record` debe tener un pack separado o
una referencia inequívoca a un pack que contenga estos campos:

### 4.1 Identidad física y entorno

| Campo | Valor requerido | Resultado actual |
|---|---|---|
| Dispositivo | fabricante, modelo exacto, variante y número de build | `NOT_MEASURED` |
| Android | versión y API level | `NOT_MEASURED` |
| Memoria | RAM total, memoria disponible inicial y pico durante el record | `NOT_MEASURED` |
| Pantalla | resolución, densidad, escala, orientación y refresh rate | `NOT_MEASURED` |
| Safe area | insets superior, inferior, izquierdo y derecho observados | `NOT_MEASURED` |
| Temperatura | temperatura inicial y final, con duración de la sesión | `NOT_MEASURED` |
| Red | conectividad usada y transición de red provocada, si aplica | `NOT_MEASURED` |
| Build | commit, workflow/run, APK/tag y SHA-256 cuando se autorice release | `NOT_MEASURED` |

### 4.2 Visual, interacción y estados

| Campo | Criterio de aceptación | Resultado actual |
|---|---|---|
| Legibilidad | texto, cartas, labels, mensajes y datos sin clipping ni solape | `NOT_MEASURED` |
| Touch | target principal, controles secundarios, scroll, back y hitboxes accesibles | `NOT_MEASURED` |
| Estados | ejecutar sólo los estados aplicables del record: `loading`, `empty`, `pending`, `error`, `locked`, `completed`, `recovery` | `NOT_MEASURED` |
| Safe area | ningún control o dato crítico queda bajo insets o teclado | `NOT_MEASURED` |
| Motion | reduced-motion cambia sólo efectos permitidos y conserva comprensión | `NOT_MEASURED` |
| Audio | mute y audio derivado del evento se comportan sin bloquear el flujo | `NOT_MEASURED` |
| Recovery | retry/back/reanudación no duplican mutaciones ni pierden el contexto | `NOT_MEASURED` |
| Datos | la captura coincide con la respuesta viva; ausencias no se rellenan | `NOT_MEASURED` |

### 4.3 Rendimiento y estabilidad

| Campo | Umbral del protocolo | Resultado actual |
|---|---|---|
| Crash/OOM | cero durante el recorrido del record | `NOT_MEASURED` |
| Scroll y navegación | sin bloqueo perceptible ni pérdida de input | `NOT_MEASURED` |
| Battlefield/replay | captura continua de 30 s por tier | `NOT_MEASURED` |
| Frame time P95 | ≤ 16,7 ms en Battlefield/replay | `NOT_MEASURED` |
| Frame time P99 | ≤ 25 ms en Battlefield/replay | `NOT_MEASURED` |
| Memoria/temperatura | registrar pico y comportamiento final; no ocultar degradación | `NOT_MEASURED` |
| Quality tier | efectos y degradaciones observadas, no asumidas por el nombre del dispositivo | `NOT_MEASURED` |

## 5. Estado de promoción

Una celda `NOT_MEASURED` pasa a `EVIDENCE_CAPTURED` sólo cuando existe:

1. dispositivo físico nombrado y datos de entorno completos;
2. captura del estado y fuente viva que la produjo;
3. touch, back, retry, safe area y ausencia de duplicación;
4. reduced-motion, audio/mute y recovery;
5. rendimiento y estabilidad según el tier;
6. persistencia de resultado, saldo, recompensa, receipt o settlement cuando
   aplique;
7. relación con el release Android autorizado si hubo cambios en `mobile/**`.

Una celda con clipping, target inaccesible, fallback genérico, estado omitido,
mutación duplicada, éxito prematuro, crash/OOM o umbral de rendimiento
incumplido pasa a `BLOCKED`, aunque las demás mediciones sean correctas.

Un tier sólo puede llamarse `SUPPORTED` cuando sus rutas críticas hayan cerrado
el evidence pack completo. Ninguno de los tres tiers tiene ese estado.

## 6. Estado de cierre T0

- `DEVICE_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- `VISUAL_ACCEPTANCE`: `PREPARED / EVIDENCE_REQUIRED`.
- 39 celdas de ruta/tier permanecen `NOT_MEASURED`.
- `PROFILE_HISTORY_STATE_GAP`: `BLOCKED`.
- El HEAD de Storage diferido por `HTTP 429` continúa siendo deuda transitoria,
  no asset ausente.
- Este bloque no instala, compila ni publica una APK.
- No se declara `VERIFIED`, `TIER1_READY`, `SUPPORTED` ni `OPERATIONAL`.