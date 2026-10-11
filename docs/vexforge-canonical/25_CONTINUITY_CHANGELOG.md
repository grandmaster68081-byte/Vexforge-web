# 25 — CONTINUITY CHANGELOG

## 2026-10-11 — Bootstrap promovido a Unity oficial

- Se retiró el árbol Unity oficial anterior de la rama actual y el proyecto
  Bootstrap completo pasó a `unity/`; se eliminó la ruta separada `unity-bootstrap/`.
- Se conservaron las 197 rutas del proyecto Unity anterior: 195 son idénticas
  byte por byte; solo se reemplazaron el estado documental y los ajustes del
  jugador. El proyecto promovido usa `VEXFORGE` y `com.vexforge.android`.
- El workflow Android antiguo fue reemplazado por el builder previamente usado
  por Bootstrap, ahora apuntando a `unity/`. Permanece manual.
- No se ejecutó una compilación durante la promoción. Los APKs anteriores no
  verifican el estado promovido. Supabase, `src/**` y `public/**` no se cambiaron.

## 2026-10-10 — Bootstrap Stage 12 verified; Stage 13 prepared

- Bootstrap run #18 passed on commit
  `9250fdcec1f7a61396a345d7ea67d5060ee13d58`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-18` (ID `11680372661`) and its 45,827,421-byte
  APK passed hash, ZIP/CRC, Android manifest, Unity data, and ARM64 IL2CPP
  checks. The downloaded APK hash
  `6625abf256d9dc266c24dba453e2ecd5a60fb1e56d9843af1e91f590f6169bcc` matches
  the build report. Unity reported `BuildResult.Succeeded`, warnings=0/errors=1;
  the counter remains recorded for review.
- The run restored 2,010,396,996 bytes from the compatible run #17 Unity Library
  cache and saved a new cache. Stage 12's 19 canonical script GUID metadata
  files are verified.
- Stage 13 prepares 19 additional canonical script `.meta`/GUID files for
  already-migrated Tier1 and UI sources. All GUIDs are unique and unreferenced
  by serialized assets in the current Bootstrap inventory. This is 19/197 files
  (9.6447%), within the per-stage cap; the planned cumulative inventory is
  189/197, leaving eight canonical paths.

## 2026-10-10 — Bootstrap Stage 11 verified; Stage 12 prepared

- Bootstrap run #17 passed on commit
  `c5d5b81011cc2647533c0684055fb980bc19cec0`. The downloaded 45,827,437-byte
  APK SHA-256 `0101f9b9af7960c6a74b5b4e538015a5f9baaba1e57dfe260fb79c040cc727b0`
  matches the build report. APK ZIP/CRC, Android manifest, Unity data, and
  ARM64 IL2CPP checks passed. Unity reported `BuildResult.Succeeded`,
  warnings=0/errors=1; the counter remains recorded for review.
- The run restored a compatible Unity Library cache from run #16 and saved a
  new cache. Stage 11's production configuration and build validator are now
  verified.
- Stage 12 prepares 19 original script `.meta`/GUID files for already-migrated
  backend, presentation, session, and Tier1 scripts. All GUIDs are unique and
  unreferenced by serialized assets in the current Bootstrap inventory. This is
  19/197 files (9.6447%), within the per-stage cap; the planned cumulative
  inventory is 170/197. No C# source, gameplay, scene, Resource, or live
  Supabase data/configuration is changed.

## 2026-10-10 — Bootstrap migration Stage 10 verified; Stage 11 prepared

- Stage 10's canonical Nexus, pack, and reward textures were validated in
  Bootstrap run #16 on `022632a9a588412994b7f45854e3dd4116cda30c`. The APK and
  uploaded artifact passed hash, ZIP/CRC, Android manifest, Unity data, and
  ARM64 IL2CPP checks. Unity reported 0 warnings and 1 BuildReport error; the
  counter remains recorded for review.
- Runs #14–#16 used the same source commit. The repeated runs did not migrate
  new content; future runs must compile a newly committed dependency-closed
  slice rather than repeat an unchanged SHA.
- Stage 11 prepares the canonical production config and `.meta`, plus the
  Editor build validator. This adds 3/197 files and depends on existing stages
  3 and 7. Bootstrap now contains 151/197 canonical paths; 46 remain, including
  44 Assets files and two project-root files. `unity/**`, the web portal, and
  live Supabase remain unchanged.

## 2026-10-04 — UNITY COMO RUNTIME ÚNICO / HITO 01

- **ACTUALIZACIÓN 2026-10-05 — HITO 10/11:** por instrucción explícita del
  usuario, se retiró `mobile/**` y su workflow Expo en el commit `77d31b5d`
  mientras las gates de paridad, seguridad, Editor y dispositivo seguían
  abiertas. No hay workflow Unity dedicado configurado; el usuario difirió esa
  configuración a una etapa posterior. Esta retirada no certifica paridad.
- **DECISIÓN HISTÓRICA:** Unity bajo `unity/**` es el único runtime Android
  activo; Expo bajo `mobile/**` quedó como referencia hasta resolver las gates.
  Las líneas siguientes conservan el estado registrado antes del Hito 10.
- **PROGRESO:** se registraron el inventario por capacidad y las gates de
  verificación; Unity Editor y dispositivo siguen sin verificar.
- **LÍMITES:** no borrar `mobile/**`, no modificar Supabase live y no generar
  APK/AAB durante la migración. El hito debe quedar committed y pushed en `main`
  antes de comenzar el siguiente.

---

## HISTÓRICO — PROPUESTA VISUAL UNITY/FAB RETIRADA (2026-09-30)

- La propuesta Unity/Fab fue retirada en esa fecha. Unity quedó reactivado como
  runtime Android el 2026-10-04; la adquisición/importación de Fab sigue retirada.
- La auditoría no encontró contenido Fab en el repositorio.
- Este registro es histórico; consultar `VEXFORGE_CONTEXT.md` y las gates
  actuales para la ruta operativa.

---

## HISTÓRICO / SUPERSEDIDO — 2026-09-30 — ROADMAP COMPETITIVO Y RUNTIME EXPO

- **DECISIÓN EN ESA FECHA:** Expo / React Native (`mobile/**`) era el único runtime activo del videojuego; Unity y demás clientes se preservaban como legado.
- **PLAN:** `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md` fija gates, riesgos, Definition of Done y próximo bloque G0.
- **BASE:** `main` SHA `02e4cec401230184f7a0de07a12cbc369dd5674a` antes del commit documental.
- **SUPABASE:** inspección read-only; proyecto `ACTIVE_HEALTHY`; score Tier 1 observado `38.30`, `tier1_ready=false`, 10 dimensiones debajo del mínimo. No hubo escrituras ni migrations.
- **LÍMITES:** sin código de gameplay, build, APK, despliegue, dispatch de workflows ni mutaciones de Supabase. El plan no afirma Expo buildable ni QA física.
- **NEXT HISTÓRICO:** G0 debía revalidar el `main`, el pipeline Expo, las reglas y los contratos de batalla. Esta ruta quedó supersedida por la migración a Unity.

---


## 2026-09-23 — CANONICAL UNITY INVENTORY GATE

- BLOCK: `CANONICAL_UNITY_VARIANT_COUNT`
- CHANGE: la continuidad se actualizó para reflejar que Unity bajo `unity/` es el
  runtime Android canónico y que el único workflow operativo es
  `.github/workflows/vexforge-unity-android-github.yml`.
- EVIDENCE: el run 34 (`35738958946`) terminó `success` en modo `inventory` con
  `285367` variantes observadas y `285279` fingerprints únicos; el run 37
  (`35857542570`) fue cancelado antes de producir evidencia válida.
- GATE: las operaciones Android `normal`, `shard` y `final` requieren un conteo
  optimizado confirmado estrictamente menor que `35000`.
- INTERPRETATION: el run 34 es inventario histórico anterior al stripping seguro;
  no autoriza una APK final ni sustituye un inventario nuevo.
- INCIDENT: el run 34 y el artefacto `10698924155` fueron eliminados durante la
  auditoría anterior y actualmente devuelven HTTP `404`; no se declara que sean
  restaurables.
- NEXT: publicar esta actualización en `main` y ejecutar un nuevo `inventory`
  manual del workflow canónico para obtener el conteo actual antes de decidir
  si se conserva o cancela una compilación Android.

## 2026-09-19 — UNITY CLOUD R5 EDITOR CONTINUITY

- BLOCK: `UNITY_CLOUD_R5_EDITOR_CONTINUITY`
- CHANGE: la infraestructura Unity Cloud Build Android externa existente queda
  enlazada explícitamente en la continuidad canónica con el proyecto Unity y
  el R5 Editor gate.
- FILES: `unity/Assets/Editor/VexforgeR5CloudBuildGate.cs` y su `.meta`,
  `docs/vexforge-canonical/UNITY_CLOUD_BUILD.md` y documentación canónica.
- STATUS: `DOCUMENTED / EVIDENCE_REQUIRED`.
- EVIDENCE: estado del repositorio, versión del proyecto Unity e información
  existente del proyecto/target Cloud; la ejecución real aún requiere logs
  externos.
- RULES: no se creó un nuevo proyecto Cloud, no se creó un nuevo target, no se
  reconectó GitHub, Auto-build permanece OFF y Schedule permanece OFF.
- NEXT: ejecutar manualmente el EXISTING VEXFORGE ANDROID BUILD AUTOMATION
  TARGET y capturar evidencia real del Editor R5.

## 2026-09-17

- BLOCK: `CANONICAL-CONTINUITY-PERSISTENCE`
- CHANGE: se creó el punto de entrada `VEXFORGE_CONTEXT.md`, la carpeta `docs/vexforge-canonical/`, registros machine-readable y orientación de README/CONTINUITY.
- FILES: documentación canónica; sin cambios en `mobile/**`, `src/**`, `supabase/**`, `contracts/**` ni `scripts/**`.
- COMMIT: commit documental dedicado creado desde `f43159ecee63b610bb71c295238327ecea3feeb6`.
- STATUS: DOCUMENTATION_PERSISTED
- EVIDENCE: commit GitHub, catálogo Supabase live consultado, scan de seguridad sin findings.
- NEXT: `ANDROID-T0-EVIDENCE` solo con autorización explícita.

## 2026-09-17 — ENGINE DECISION

- BLOCK: `ENGINE-DECISION-CANONICALIZATION`
- CHANGE: se registró Unity 6.3 LTS + URP + C# como runtime final objetivo; Expo/React Native queda legado protegido durante migración reversible.
- FILES: contexto, dirección de producto, sistema actual, build, estado, decisiones, blockers, unknowns, contradicciones y protocolo AI.
- COMMIT: actualización documental posterior a `1f20bc4986d54447fb40f52fb5a08aa05e5956c1`.
- STATUS: DECISION_PERSISTED / UNITY_NOT_IMPLEMENTED
- EVIDENCE: documento de decisión adjunto y árbol actual sin proyecto Unity.
- NEXT: paquete único `ETAPA 1 — FOUNDATION / UNITY MIGRATION`.

## 2026-09-17 — EXPO GAME RUNTIME FOUNDATION

- BLOCK: `EXPO_GAME_RUNTIME_FOUNDATION`
- CHANGE: este registro histórico documenta un estado anterior en el que Expo /
  React Native era el runtime Android activo; Unity es ahora el runtime
  canónico y `mobile/**` queda como legado histórico.
- COMMIT: `890dc19693e1b5c429d3599175937e2c3bbdd985`.
- WORKFLOW: `vexforge-android-apk.yml`; run `35288617678`; release
  `vexforge-android-build-250`; artifact `vexforge-android-apk-250`.
- RESULT: APK standalone verificado con bundle embebido, package
  `com.vexforge.android`, versión `1.0.1`, versionCode `4` y SHA-256
  `082cdd1bf8ec143770febdca05a985fd978257518a5bd962ae7bcd860bd0d428`.
- STATUS: BUILD_VERIFIED / PHYSICAL_QA_PENDING.
- NEXT: instalación y prueba posterior por Cristian; no iniciar Etapa 2.