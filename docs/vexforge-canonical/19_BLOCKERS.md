# 19 — BLOCKERS

## B-001 — Physical Android evidence

- AREA: instalación, safe areas, legibilidad, rendimiento, touch.
- STATUS: EVIDENCE_REQUIRED
- OBSERVED EVIDENCE: código y guards móviles existen; release 249 está registrado.
- DEPENDENCY: autorización APK/QA y dispositivo/cuenta QA.
- WHY BLOCKED: no se debe declarar experiencia física verificada desde código solamente.
- UNBLOCK CONDITION: workflow success, release identificado, APK instalado y recorrido QA documentado.

## B-002 — Release/source correspondence

- AREA: build → artifact → installed app.
- STATUS: PARTIALLY_VERIFIED
- OBSERVED EVIDENCE: release 249 fue compilado desde `ded78720...`; `main` actual es `f43159e...`.
- DEPENDENCY: nuevo build explícitamente autorizado o evidencia del artefacto instalado.
- WHY BLOCKED: un release anterior no prueba el commit actual.
- UNBLOCK CONDITION: mapping completo y APK SHA-256 comprobado.

## B-003 — Live backend reconciliation

- AREA: 318 tablas/vistas, 345 rutinas, 275 policies.
- STATUS: EVIDENCE_REQUIRED
- OBSERVED EVIDENCE: catálogo live amplio; consumer móvil acotado en `supabase.ts`.
- DEPENDENCY: auditoría por dominio y ejecución autenticada.
- WHY BLOCKED: no toda rutina live es necesariamente activa ni consumida por Android.
- UNBLOCK CONDITION: matriz RPC/table/policy por dominio con evidencia.

## B-004 — Unity Foundation no verificado

- AREA: Unity 6.3 LTS / URP / Android Foundation.
- STATUS: IMPLEMENTED_UNVERIFIED
- OBSERVED EVIDENCE: `unity/Assets/`, `unity/ProjectSettings/`, `unity/Packages/` y `VexForgeBuild.BuildAndroid` existen en el commit actual.
- DEPENDENCY: entorno Unity/CI válido y licencia Personal.
- WHY BLOCKED: no existe todavía un APK standalone verificable del commit actual.
- UNBLOCK CONDITION: APK real con package, versión, versionCode, SHA-256 y artifact descargable.

## B-005 — Unity Build Automation Dashboard

- AREA: Rutas 1 y 2.
- STATUS: BLOCKED_EXTERNAL_DASHBOARD
- OBSERVED EVIDENCE: el repositorio no contiene la configuración de organización/proyecto de Unity Build Automation ni acceso al Unity Dashboard.
- DEPENDENCY: configuración externa de Unity Build Automation, rama `main`, subdirectorio `unity/` y patch disponible.
- WHY BLOCKED: esa configuración se realiza en Unity Dashboard; no puede ejecutarse ni verificarse únicamente desde GitHub.
- UNBLOCK CONDITION: un run de Build Automation accesible que produzca el APK y sus logs.

## B-006 — Unity Personal activation in CI

- AREA: Rutas 3, 4 y 5.
- STATUS: BLOCKED_IN_PROGRESS
- OBSERVED EVIDENCE: Ruta 3 terminó con exit code `198`; Ruta 5 falló con `Invalid version "6000.3.24f1"` en `game-ci/unity-activate@v2`; ninguna llegó a compilación.
- DEPENDENCY: activación Personal compatible con Unity 6000.3.24f1 o un `.ulf` válido.
- WHY BLOCKED: las credenciales por sí solas no han producido una licencia utilizable en el runner.
- UNBLOCK CONDITION: una ruta aislada completa la compilación y entrega APK verificable, o logs que permitan pasar a la siguiente ruta.

## B-007 — Third-party license conversion

- AREA: Ruta 6.
- STATUS: READY_TO_RUN
- OBSERVED EVIDENCE: existe una herramienta pública fijada en `unity-license-activate@0.3.9`; no se almacena `.alf`, `.ulf` ni credenciales en el repositorio.
- DEPENDENCY: Unity debe aceptar las credenciales y devolver un `.ulf` válido para `6000.3.24f1`.
- WHY BLOCKED: las Rutas 3 y 5 no produjeron una licencia utilizable para compilar.
- UNBLOCK CONDITION: conversión `.alf` → `.ulf`, importación en el runner y APK verificable; si falla, conservar logs y no cambiar de editor sin evidencia.
