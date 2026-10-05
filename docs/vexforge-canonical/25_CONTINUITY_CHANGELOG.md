# 25 — CONTINUITY CHANGELOG

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