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
