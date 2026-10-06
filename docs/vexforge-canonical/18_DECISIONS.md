# 18 — DECISIONS

## D-010 — Runtime Unity único (decisión vigente)

- DATE: 2026-10-04
- DECISION: Unity bajo `unity/**` es el único runtime Android activo; el cliente
  móvil alternativo fue retirado del estado actual del repositorio.
- SCOPE: runtime, implementación del cliente y documentación operativa.
- WHY: instrucción más reciente del propietario y estado implementado del
  proyecto Unity.
- EVIDENCE: `VEXFORGE_CONTEXT.md`, `16_IMPLEMENTATION_STATUS.md` y
  `UNITY_BUILD_OPERATIONS.md`.
- STATUS: ACTIVE
- SUPERSEDES: cualquier estado anterior que declaraba otro runtime Android o
  Unity legado/read-only.

## D-001

- DATE: 2026-09-17
- DECISION: Android es el producto activo; web frozen/non-active.
- SCOPE: orientación de futuras sesiones.
- WHY: orden canónica activa y evidencia del proyecto Android Unity.
- EVIDENCE: `unity/**`, configuración Android y workflow manual.
- AFFECTED_FILES: orientación y documentación, no código funcional.
- STATUS: ACTIVE
- SUPERSEDES: documentos históricos que llamaban oficial a la web.

## D-002

- DATE: 2026-09-17
- DECISION: Supabase live es autoridad de backend/datos/seguridad; `main` es autoridad de implementación.
- SCOPE: contratos y reconciliación.
- WHY: separar datos vivos de copias documentales.
- EVIDENCE: consulta live del proyecto y consumidores Unity en
  `unity/Assets/Scripts/Backend/`.
- STATUS: ACTIVE

## D-003

- DATE: 2026-09-17
- DECISION: no inventar datos, assets, rewards, reglas ni resultados; no generic fallback silencioso.
- SCOPE: todas las superficies.
- WHY: preservación de evidencia y honestidad de estados.
- EVIDENCE: protocolo activo, verificadores del portal y componentes Unity.
- STATUS: ACTIVE

## D-004

- DATE: 2026-09-17
- DECISION: no compilar APK ni desplegar por iniciativa propia.
- SCOPE: continuidad y bloques futuros.
- WHY: build/release/QA son gates independientes.
- EVIDENCE: continuidad y orden canónica.
- STATUS: ACTIVE

## D-005

- DATE: 2026-09-17
- DECISION: el runtime final Android será Unity 6.3 LTS + URP + C#; el cliente
  móvil alternativo quedaba como legado durante la migración reversible.
- SCOPE: runtime, arquitectura de cliente, pipeline futuro y orden de etapas.
- WHY: VEXFORGE se declara TCG premium con battlefield, cartas animadas, cámara, Timeline/Animator, VFX, audio y experiencia de juego en un runtime único.
- EVIDENCE: `attached_assets/VEXFORGE_ENGINE_DECISION_AND_WORKFLOW_1789670634346.md` y ausencia de árbol Unity en `main` auditado.
- AFFECTED_FILES: futura ubicación Unity separada; el árbol de cliente existente
  se protegía durante la migración.
- AFFECTED_SYSTEMS: cliente Android y CI; Supabase permanece sin cambio.
- STATUS: SUPERSEDED / HISTORICAL
- SUPERSEDES: la dirección anterior que trataba el cliente móvil alternativo
  como runtime final; no supersede la descripción histórica del código.

## D-006

- DATE: 2026-09-18
- DECISION: Unity es el runtime Android principal de desarrollo de VEXFORGE.
- SCOPE: `unity/**`, presentación del juego, integración de sesión y datos.
- WHY: la dirección de producto exige un runtime TCG con mundo, cartas,
  cámara, battlefield, VFX y audio hooks sin convertir el producto en un
  dashboard.
- EVIDENCE: `unity/ProjectSettings/ProjectVersion.txt`,
  `unity/Assets/Scenes/VexforgeBootstrap.unity` y `unity/Assets/Scripts/**`.
- AFFECTED_FILES: Unity y documentación canónica; `mobile/**` queda protegido.
- AFFECTED_SYSTEMS: cliente Android; Supabase permanece sin cambio.
- STATUS: ACTIVE / IMPLEMENTED_UNVERIFIED
- RULES: mobile es fallback/rollback/referencia; Supabase mantiene autoridad;
  no se declara APK ni QA física sin evidencia.

## D-007

- DATE: 2026-09-18
- DECISION: Las superficies Unity se presentan como mundo TCG y no como
  dashboard administrativo.
- SCOPE: Nexus, Archive, Forge, Battlefield y Missions.
- WHY: la carta, el pedestal, la arena y el contrato son la unidad visual del
  producto; los estados ausentes deben seguir siendo honestos.
- EVIDENCE: `unity/Assets/Scripts/World/NexusWorldController.cs`,
  `unity/Assets/Scripts/UI/CardRenderer.cs`.
- STATUS: ACTIVE

## D-008

- DATE: 2026-09-19
- DECISION: Unity Cloud Build Automation es la infraestructura remota existente
  para ejecutar el Editor del proyecto Android canónico y verificar el gate R5.
- SCOPE: continuidad Unity, configuración externa existente y documentación
  canónica; no crea un segundo target ni reemplaza el runtime.
- WHY: el proyecto Unity y su target Android Cloud ya existen; la continuidad
  debe preservar esa relación para futuras sesiones.
- EVIDENCE: `unity/ProjectSettings/ProjectVersion.txt`,
  `docs/vexforge-canonical/UNITY_CLOUD_BUILD.md` y el bridge
  `unity/Assets/Editor/VexforgeR5CloudBuildGate.cs`.
- RULES: reutilizar la infraestructura existente; no crear targets duplicados;
  no sustituir Unity; exigir ejecución Cloud real para verificar R5; distinguir
  evidencia del repositorio de evidencia del dashboard.
- STATUS: ACTIVE / EVIDENCE_REQUIRED


## D-009

- DATE: 2026-09-25
- DECISION: GitHub Actions directo es el único método activo de compilación
  Android; Unity Cloud Build / Build Automation queda como referencia externa
  y el cliente Android alternativo como legado.
- SCOPE: `unity/**`, `.github/workflows/vexforge-unity-android-github.yml` y continuidad operativa.
- WHY: la instrucción canónica exige una sola fuente de build, sin cuota Cloud, sin workflows paralelos y sin compilación automática.
- EVIDENCE: workflow `workflow_dispatch` único, Unity `6000.3.0f1` en `ProjectVersion.txt`, Supabase Management API saludable y último run existente consultado sin lanzar uno nuevo.
- STATUS: HISTÓRICO / SUPERSEDED BY D-011
- RULES: These rules described the then-configured workflow. Its runtime path
  changed on 2026-10-01 and was later removed; do not apply its historical ID
  or modes to current `main`.
- SUPERSEDES: la afirmación anterior de Unity Cloud Build como infraestructura operativa activa.

## D-011

- DATE: 2026-10-05
- DECISION: At that date Unity remained the only active Android game runtime, but no Unity Android workflow was configured. This state was superseded when the manual workflow was restored.
- SCOPE: `unity/**`, `.github/workflows/`, migration validation, and workflow continuity.
- WHY: the historical Unity-labeled run performed shader inventory on an earlier source revision; it did not validate current Unity behavior or produce an Android package.
- EVIDENCE: `.github/workflows/`, `replit.md`, `05_ANDROID_RUNTIME_AND_BUILD.md`, and the historical run logs.
- STATUS: SUPERSEDED_HISTORICAL
- RULES: these rules described the workflow state at that date. The current manual workflow is recorded in D-012.

## D-012

- DATE: 2026-10-06
- DECISION: Restore the manual Unity GitHub Actions workflow without dispatching it. Shard mode defaults to 12 partitions and caps each shard at 35,000 variants; `normal` and `final` remain unfiltered.
- SCOPE: `.github/workflows/vexforge-unity-android-github.yml` and repository cleanup.
- WHY: the user requested the prior shard-based Unity workflow while preserving the official web portal, Unity source, and live Supabase project.
- STATUS: ACTIVE / MANUAL ONLY / NOT DISPATCHED
- RULES: do not dispatch or generate an APK/AAB without separate authorization; do not mutate Supabase live.

## HISTÓRICO / SUPERSEDIDO — 2026-09-30 — CLIENTE MÓVIL ALTERNATIVO COMO RUNTIME ACTIVO

- **DECISIÓN EN ESA FECHA:** el cliente móvil alternativo era el único runtime activo para trabajo nuevo del videojuego.
- **LEGADO:** Unity (`unity/**`) y las demás implementaciones cliente quedan fuera del trabajo activo y se preservan intactas. La web existente no se reconstruye ni se modifica por esta decisión.
- **AUTORIDAD:** esta directiva explícita resuelve la contradicción con los documentos anteriores de `main` que declaraban Unity activo.
- **ESTADO:** decisión de runtime registrada; no prueba que el cliente compilara, que existiera un pipeline Android vigente ni que hubiera QA física.
- **BACKEND:** Supabase conserva autoridad. La inspección del 2026-09-30 fue de sólo lectura; sin cambios live.
- **CONTINUIDAD:** usar `VEXFORGE_CONTEXT.md` y `docs/vexforge-canonical/`;
  revalidar `main` antes de implementar.

## Estado de decisiones vigente

D-012, fechado 2026-10-06, confirma Unity bajo `unity/**` como runtime Android
activo y el workflow manual restaurado, aún sin ejecutar. El shard mode usa
12 particiones con un máximo de 35.000 variantes por shard. La dirección está en
`VEXFORGE_CONTEXT.md`, `replit.md` y
`docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md`. La retirada de Epic/Fab se
mantiene vigente.
