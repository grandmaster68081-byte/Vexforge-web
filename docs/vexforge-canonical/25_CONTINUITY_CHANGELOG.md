# 25 — CONTINUITY CHANGELOG

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
