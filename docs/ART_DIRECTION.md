# VEXFORGE — Android Art Direction

**Fecha:** 2026-09-15  
**Unidad:** T0 — `ART_DIRECTION`  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `0223a6212d39e164514fea60060241ee3cb0a7b8`  
**Fuente activa:** `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y autoridad

Este documento fija la dirección artística común que debe conservar el renderer
Android sin convertirse en fuente de gameplay, datos, economía o settlement.
Define identidad, materialidad, jerarquía, tono y prohibiciones para que una
pantalla pueda sentirse parte del mismo mundo aunque su dominio, estado o tier de
efectos cambie.

La autoridad permanece separada:

- **Supabase y contratos vivos:** datos, Auth, RPCs, RLS, economía y settlement.
- **ForgeFormation / Battle Run:** reglas, eventos, replay y resultado de combate.
- **Asset Registry:** procedencia, estado y dominios autorizados de cada asset.
- **Android:** render, input, navegación, replay y reanudación del contrato.
- **Dispositivo físico:** legibilidad, safe area, touch, motion, audio, memoria y
  rendimiento.

Una referencia visual, una captura conceptual o una forma de UI no autoriza un
asset, dato, resultado, carta, reward, nombre o regla. La falta de evidencia
humana mantiene esta unidad en `PREPARED / EVIDENCE_REQUIRED`.

## 2. Identidad del mundo

VEXFORGE es un juego de cartas y formaciones situado en una forja fantástica
tecnológica. Cada pantalla debe leerse primero como una cámara de un mundo
compartido y después como interfaz operativa.

### 2.1 Materiales base

| Material | Función visual | Uso permitido | Prohibición |
|---|---|---|---|
| Obsidiana / piedra oscura | profundidad, marco y espacio de lectura | fondos, zócalos, capas de escena y separación | no usar una placa oscura para ocultar un dato ausente |
| Hierro / metal forjado | estructura, borde y soporte | paneles, sockets, marcos, placas y controles | no convertir un borde en indicador de regla no recibida |
| Oro / brasa | foco, confirmación y valor | acción primaria, progreso confirmado, sello y reward confirmado | no colorear como éxito una operación pending |
| Cyan / luz arcana | navegación, energía y lectura contextual | Nexus, Arena, señales vivas y foco de dominio | no sustituir con cyan un dato o evento que no llegó |
| Violet / resonancia | rareza, Archivo y forja arcana | Collection, Deck, artefactos y estados de rareza confirmados | no inferir rareza por el color del contenedor |
| Ember / rojo de peligro | daño, riesgo y bloqueo | daño reportado, error o amenaza real | no presentar derrota o daño por ausencia de payload |
| Madera, vidrio, pergamino | metáfora de dominio | Archive, Forge, Missions y listas diegéticas | no repetir una textura como fondo genérico de todas las rutas |

La profundidad se construye con capas, bordes, luz, sockets y arte registrado.
No se reemplaza por una cuadrícula administrativa ni por paneles blancos
intercambiables.

### 2.2 Tipografía y lectura

- Títulos de mundo y proclamación usan la familia tipográfica ya registrada por
  el sistema visual; no se introduce una fuente nueva por pantalla.
- Encabezados de dominio deben distinguirse de datos operativos.
- Labels, controles y navegación deben ser cortos y explícitos.
- Valores, identificadores, estados técnicos y números alineados usan una
  lectura monoespaciada cuando el sistema existente la provea.
- Ningún icono reemplaza una etiqueta crítica si el significado no es obvio.
- El tamaño, contraste y safe area tienen prioridad sobre la fidelidad ornamental.

## 3. Boards de referencia aprobadas

Las boards son dirección de composición, nivel de detalle, densidad y lenguaje
material. No son datos del producto, no autorizan importación de nombres o
stats y no sustituyen el Asset Registry.

| Board | Intención aprobada | Elementos que debe conservar Android | Límite |
|---|---|---|---|
| `VF-REF-NEXUS` | Hub vertical vivo y fortaleza suspendida | portales físicos, piedra, oro, obsidiana y luz arcana azul | no convertir Home en dashboard ni inventar actividad |
| `VF-REF-BATTLEFIELD` | Escenario 1v1 espejado | tres sockets por lado, eje central, Champion, mano, Command y Reserve | no movimiento libre, cámara libre Ranked ni VFX que oculte unidades |
| `VF-REF-ARCHIVE` | Santuario de colección | madera oscura, metal, vidrio, vitrina y carta real dominante | no usar arte de referencia como identidad de carta |
| `VF-REF-FORGE` | Mesa de creación | metal, piedra, fuego arcano, herramientas, materiales y acción primaria física | no mostrar resultado de creación antes de settlement |
| `VF-REF-MISSIONS` | Tablero de encargos | pergamino, madera, metal, rutas, nodos, objetivos y rewards como objetos | no convertir lore o decoración en progreso vivo |

El arte exacto se selecciona sólo desde el Asset Registry y sus consumidores
reales. `CANON_ACTIVE` y `VERIFIED_ASSET` no significan evidencia física de
legibilidad. `AVAILABLE_UNASSIGNED`, `REVIEW_REQUIRED`,
`RESERVED_SURFACE_ART` y `RESERVED_RESIDUAL_ART` no autorizan promoción.

## 4. Orden de composición

Toda pantalla principal sigue esta lectura conceptual:

`WORLD_SCENE → IDENTITY/HERO_ASSET → DIEGETIC_OBJECTS → LIVE_DATA → INTERACTION → MOTION/FEEDBACK → SYSTEM/SAFE_AREA`

Reglas de aplicación:

1. Existe un sujeto visual dominante y una ruta de lectura estable.
2. El dato vivo aparece sobre objetos legibles del mundo: placas, pergaminos,
   vitrinas, tableros, medallones, libros, estandartes o instrumentos.
3. Los overlays quedan reservados para loading, error, pending, reward
   confirmado, confirmación, recovery y accesibilidad.
4. Tabs y navegación representan rutas reales; no se añaden destinos por llenar
   la composición.
5. El layout no oculta acciones legales, targets, HP, estados, Command, Reserve,
   resultados, receipt o mensajes de recovery.
6. Un valor `null`, una lista no cargada, una fecha inválida o un reward no
   confirmado conserva su estado explícito; no se convierte en cero, éxito o
   contenido de relleno.
7. El modo reducido conserva identidad, legibilidad, estado y funcionalidad.

## 5. Dirección por dominio Android

| Dominio / ruta | Sujeto y metáfora | Acento | Restricción de verdad |
|---|---|---|---|
| Nexus / Home `/(tabs)/` | citadel, núcleo de forja y portales | cyan + oro | entrada a un juego; actividad, temporada y progreso sólo desde datos vivos |
| Arena / Battlefield `/(tabs)/battle` | formaciones, Champion, mano, Reserve y eje central | cyan vs ember | target, evento, HP, Command, replay y resultado son señales del contrato |
| Collection / Archivo `/(tabs)/collection` | carta real en pedestal o vitrina | violet + plata | arte, rareza, lore y stats conservan procedencia; ausencia no es cero |
| Deck / Forja `/(tabs)/deck` | pedestal, cartas, composición y legalidad | oro + violet | validar y guardar sólo después de respuesta autoritativa |
| Missions `/missions` | mapa, tablero, rutas y nodos de encargo | cyan + ember | progreso, claim, dificultad y reward vienen del Mission Engine |
| Store / Economy `/store`, `/economy` | cámara de materiales, wallet y ledger | oro + magenta | precio, saldo, fee, receipt, hash y carta recibida nunca se inventan |
| Social / Guild `/social` | sala de alianza, emblemas, presencia y paneles | azul profundo + oro | nombres, fechas, presencia, ranking y guerras permanecen vivos |
| World Atlas `/world` | biomas, regiones, bosses, raids y ruta narrativa | cyan + violet + ember | lore no reemplaza eligibility, daño, reward, settlement o progreso |
| Profile / Progression `/(tabs)/profile` | identidad, rango, logros, mastery e historial | oro + azul | `draw`, `pending`, recovery y ausencia de historial se conservan |
| Meta / Live Operations `/meta` | preferencias y actividad legible del jugador | magenta + cyan | no se transforma en consola técnica ni inventa operaciones ausentes |
| Auth `/auth` | umbral de entrada seguro al Nexus | obsidiana + luz del sistema | no mostrar sesión, identidad o acceso confirmado antes de Auth |
| Tutorial `/tutorial` | onboarding contextual dentro del mismo Nexus | cyan + oro | no saltar gates ni marcar pasos localmente como completados |

Auth y Tutorial son capas transversales, no productos visuales separados.

## 6. Primitivas de interfaz

Las primitivas compartidas pueden aceptar tokens, safe area, reduced-motion,
quality tier y accesibilidad, pero no contienen reglas de gameplay ni asumen
que un dato exista:

- `WorldSceneContainer` para escena, capas y recorte seguro.
- `MaterialPanel`, `HeraldicPlate`, `MetricPlaque` y `SealButton` para datos y
  acciones diegéticas.
- `CardPedestal`, `DomainPortal`, `DiegeticList` y `RewardObject` para objetos
  del dominio.
- `BattlefieldSocket`, `StatusAura`, `EventTelegraph`, `ReserveRevealRail`,
  `CommandIndicator` y `HandDock` para lectura de Battlefield.
- `ModalOverlay`, `BottomNavigationShell`, `LoadingState`, `EmptyState`,
  `PendingState` y `ErrorState` para estados explícitos y accesibles.

Una primitiva de feedback no puede afirmar que una mutación fue aceptada, que
un target es legal o que un reward existe sin la señal autoritativa que lo
confirma.

## 7. Motion, audio y feedback

- Toda animación con significado de juego nace de un evento real o de un estado
  recibido; no crea orden, daño, muerte, reward, victoria ni derrota.
- Una animación declara `event_type`, duración máxima, prioridad, cámara permitida,
  estado reforzado, tier de calidad y comportamiento `reduced-motion`.
- El Tier 1 visual mínimo cubre entrada de escena, press/tap, foco y targeting,
  ataque/daño, critical, status, death/replacement, Champion exposed, Reserve,
  round start/end, match result y reward/settlement confirmado.
- Audio y haptics son feedback de presentación, no la única evidencia de un
  estado. Deben respetar mute, reduced-motion, volumen y fallback de bajo
  consumo.
- `reduced-motion` elimina o acorta parallax, shake, spins, partículas
  repetitivas y cámara ornamental; conserva orden, causa, datos, legibilidad,
  outcome recibido y funcionalidad.
- Un evento pending, rechazado o desconocido no recibe celebración de éxito.
- En error o recovery, la escena estable permanece visible si es seguro; la
  acción de retry/back/reanudar no puede duplicar mutaciones.

## 8. Rendimiento, plataforma y safe area

- Android es portrait-first; los controles y datos críticos respetan los insets
  reales y el teclado.
- Battlefield y replay conservan objetivo de 60 FPS en el baseline; el cierre
  requiere frame time P95 ≤ 16,7 ms y P99 ≤ 25 ms durante 30 segundos, sin
  crash/OOM.
- No hay simulación de combate en el render thread.
- Partículas y efectos son pooled, desactivables y reducibles por quality tier.
- Camera effects son limitados; el preload de assets es de solo lectura y no
  bloquea interacción.
- El event stream se acota según contrato; no se trunca para inventar un final.
- Reducir VFX nunca altera outcome, hash, replay, legalidad, settlement o datos.
- Las hitboxes permanecen estables entre tiers y estados de motion.

Los dispositivos `LOW`, `REFERENCE` y `HIGH` siguen siendo candidatos en
`VE-T0-ANDROID-DEVICE-EVIDENCE-REGISTER.md`; no se declara compatibilidad sin
instalación, recorrido táctil, medición, safe area, memoria, temperatura y
capturas físicas.

## 9. Prohibiciones no negociables

No se permite:

- stock fantasy genérico, cartas inventadas o iconos de sistema como identidad
  diegética;
- nombres de una board de referencia tratados como datos vivos;
- backgrounds que contengan valores dinámicos o texto que suplante una fuente
  viva;
- sustituir un asset ausente por otra pantalla, stock, emoji, Unicode o forma
  CSS silenciosa;
- convertir `loading`, lista no recibida, `null`, `pending`, `error`, `locked` o
  `unavailable` en cero, éxito, derrota, victoria o reward;
- simular combate, resolver target, calcular daño, aplicar legalidad o decidir
  outcome dentro del renderer Android;
- celebrar `MATCH_END` como reward antes de `SETTLEMENT_COMPLETED`;
- declarar una escena `VERIFIED`, `TIER1_READY`, `SUPPORTED` u `OPERATIONAL`
  por documentación, typecheck, guardas, HTTP 200 o compilación.

## 10. Estado y evidencia requerida

Esta dirección artística queda preparada, no cerrada. Para cada Screen Master
Record se requiere evidencia de:

1. asset ID, procedencia, consumidor y estado del Asset Registry;
2. datos vivos y estados de `VISUAL_STATE_MATRIX`;
3. tap, back, retry, hitboxes y recovery sin mutación duplicada;
4. safe area, orientación, lectura de texto/cartas y teclado cuando aplique;
5. normal, reduced-motion, mute y audio derivado del evento;
6. dispositivo físico exacto, memoria, temperatura y rendimiento;
7. relación entre captura, commit, APK/release y SHA-256 cuando se autorice;
8. persistencia de resultado, saldo, reward, receipt o settlement.

Mientras no exista esa evidencia, el estado global permanece
`PREPARED / EVIDENCE_REQUIRED`, `PROFILE_HISTORY_STATE_GAP` permanece
`BLOCKED` y el gate APK/QA permanece cerrado.

## 11. Alcance de esta unidad

- Sólo se añadió dirección artística documental Android.
- No se modifican `mobile/**`, contratos de Supabase, Auth, RLS, RPCs, economía,
  gameplay, assets físicos, rutas, workflows ni la web congelada.
- No se inicia workflow Android, no se compila APK y no se publica release.
- El siguiente trabajo permitido es otra reconciliación documental independiente
  o el gate físico únicamente después de autorización explícita.
