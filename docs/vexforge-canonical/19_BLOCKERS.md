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
- OBSERVED EVIDENCE: release 250 fue compilado desde
  `890dc19693e1b5c429d3599175937e2c3bbdd985`; el artifact y SHA-256 están
  registrados.
- DEPENDENCY: nuevo build explícitamente autorizado o evidencia del artefacto instalado.
- WHY BLOCKED: el APK no ha sido instalado y recorrido todavía en un
  dispositivo físico.
- UNBLOCK CONDITION: instalación del release 250 y recorrido QA documentado.

## B-003 — Live backend reconciliation

- AREA: 318 tablas/vistas, 345 rutinas, 275 policies.
- STATUS: EVIDENCE_REQUIRED
- OBSERVED EVIDENCE: catálogo live amplio; consumer móvil acotado en `supabase.ts`.
- DEPENDENCY: auditoría por dominio y ejecución autenticada.
- WHY BLOCKED: no toda rutina live es necesariamente activa ni consumida por Android.
- UNBLOCK CONDITION: matriz RPC/table/policy por dominio con evidencia.

## B-004 — Android Foundation release no verificado

- AREA: Expo / React Native Android Foundation.
- STATUS: EVIDENCE_REQUIRED
- OBSERVED EVIDENCE: `mobile/game/**`, `mobile/app.json` y el workflow APK
  existen en el commit actual.
- DEPENDENCY: runner Android con instalación limpia y artifact release.
- WHY BLOCKED: todavía no existe un APK verificable de este commit.
- UNBLOCK CONDITION: APK real con package, versión, versionCode, SHA-256 y
  artifact descargable.
