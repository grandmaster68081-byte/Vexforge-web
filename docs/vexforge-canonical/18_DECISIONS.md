# 18 — DECISIONS

## D-010 — Runtime Unity único (decisión vigente)

- DATE: 2026-10-04
- DECISION: Unity bajo `unity/**` es el único runtime Android activo; Expo bajo
  `mobile/**` es referencia de comportamiento y se retira solo tras paridad.
- SCOPE: runtime, implementación del cliente y documentación operativa.
- WHY: instrucción más reciente del propietario y paquete de migración Unity
  suministrado, organizado en 12 hitos.
- EVIDENCE: `VEXFORGE_CONTEXT.md`, paquete de migración aportado por el usuario
  y `27_UNITY_EXPO_MIGRATION_INVENTORY.json`.
- STATUS: ACTIVE
- SUPERSEDES: cualquier estado anterior que declaraba Expo runtime único o
  Unity legado/read-only.

## D-001

- DATE: 2026-09-17
- DECISION: Android es el producto activo; web frozen/non-active.
- SCOPE: orientación de futuras sesiones.
- WHY: orden canónica activa y evidencia del cliente Expo móvil.
- EVIDENCE: `mobile/app/**`, `mobile/app.json`, workflows APK, continuidad reciente.
- AFFECTED_FILES: orientación y documentación, no código funcional.
- STATUS: ACTIVE
- SUPERSEDES: documentos históricos que llamaban oficial a la web.

## D-002

- DATE: 2026-09-17
- DECISION: Supabase live es autoridad de backend/datos/seguridad; `main` es autoridad de implementación.
- SCOPE: contratos y reconciliación.
- WHY: separar datos vivos de copias documentales.
- EVIDENCE: consulta live del proyecto y `mobile/lib/supabase.ts`.
- STATUS: ACTIVE

## D-003

- DATE: 2026-09-17
- DECISION: no inventar datos, assets, rewards, reglas ni resultados; no generic fallback silencioso.
- SCOPE: todas las superficies.
- WHY: preservación de evidencia y honestidad de estados.
- EVIDENCE: protocolo activo, verificadores móviles y componentes de estados.
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
- DECISION: el runtime final Android será Unity 6.3 LTS + URP + C#; React Native/Expo queda como cliente legado durante migración reversible.
- SCOPE: runtime, arquitectura de cliente, pipeline futuro y orden de etapas.
- WHY: VEXFORGE se declara TCG premium con battlefield, cartas animadas, cámara, Timeline/Animator, VFX, audio y experiencia de juego en un runtime único.
- EVIDENCE: `attached_assets/VEXFORGE_ENGINE_DECISION_AND_WORKFLOW_1789670634346.md` y ausencia de árbol Unity en `main` auditado.
- AFFECTED_FILES: futura ubicación Unity separada; `mobile/**` protegido durante migración.
- AFFECTED_SYSTEMS: cliente Android y CI; Supabase permanece sin cambio.
- STATUS: SUPERSEDED / HISTORICAL
- SUPERSEDES: la dirección anterior que trataba Expo/React Native como runtime final; no supersede la descripción histórica del código actual.

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
- DECISION: GitHub Actions directo es el único método activo de compilación Android; Unity Cloud Build / Build Automation queda como referencia externa y Expo / React Native como legado.
- SCOPE: `unity/**`, `.github/workflows/vexforge-unity-android-github.yml` y continuidad operativa.
- WHY: la instrucción canónica exige una sola fuente de build, sin cuota Cloud, sin workflows paralelos y sin compilación automática.
- EVIDENCE: workflow `workflow_dispatch` único, Unity `6000.3.0f1` en `ProjectVersion.txt`, Supabase Management API saludable y último run existente consultado sin lanzar uno nuevo.
- STATUS: ACTIVE / CONFIGURED_UNVERIFIED
- RULES: mantener los modos dentro del workflow canónico; no crear otro workflow de build; no dispatch sin autorización explícita; no guardar credenciales en el repositorio.
- SUPERSEDES: la afirmación anterior de Unity Cloud Build como infraestructura operativa activa.

## HISTÓRICO / SUPERSEDIDO — 2026-09-30 — EXPO COMO ÚNICO RUNTIME ACTIVO

- **DECISIÓN EN ESA FECHA:** Expo / React Native bajo `mobile/**` era el único runtime activo para trabajo nuevo del videojuego.
- **LEGADO:** Unity (`unity/**`) y las demás implementaciones cliente quedan fuera del trabajo activo y se preservan intactas. La web existente no se reconstruye ni se modifica por esta decisión.
- **AUTORIDAD:** esta directiva explícita resuelve la contradicción con los documentos anteriores de `main` que declaraban Unity activo.
- **ESTADO:** decisión de runtime registrada; no prueba que Expo compile, que exista pipeline Expo Android vigente ni que haya QA física.
- **BACKEND:** Supabase conserva autoridad. La inspección del 2026-09-30 fue de sólo lectura; sin cambios live.
- **CONTINUIDAD:** usar `VEXFORGE_CONTEXT.md` y los documentos operativos de
  `mobile/docs/`; revalidar `main` antes de implementar.

## Estado de decisiones vigente

D-010, fechado 2026-10-04, establece Unity bajo `unity/**` como el único runtime
Android activo. Expo bajo `mobile/**` permanece como referencia de comportamiento
hasta superar todas las gates de paridad, seguridad y retirada. La dirección
operativa está en `VEXFORGE_CONTEXT.md`, `replit.md` y
`docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md`. La retirada de
Epic/Fab se mantiene vigente.
