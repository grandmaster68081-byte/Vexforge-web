## CURRENT RECONCILIATION — 2026-10-06

- El workflow manual de Unity está restaurado en
  `.github/workflows/vexforge-unity-android-github.yml`; usa 12 shards y un
  límite de 35.000 variantes por shard. No se ha ejecutado.
- Unity Editor y dispositivo siguen sin verificar.
- No se inició una compilación, no se generó APK/AAB y no se modificó Supabase
  live.
- Los blockers fechados abajo son registros históricos salvo que se reconfirmen
  contra el código y el servicio actuales.

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

## B-004 — Unity Cloud R5 Editor verification

- AREA: importación, compilación del Editor y ejecución del R5 Foundation Gate.
- STATUS: EVIDENCE_REQUIRED
- OBSERVED EVIDENCE: proyecto Unity `6000.3.0f1`, target Android Cloud externo
  existente y bridge documental en `UNITY_CLOUD_BUILD.md`.
- DEPENDENCY: run real del `EXISTING VEXFORGE ANDROID BUILD AUTOMATION TARGET`
  con logs del Editor.
- WHY BLOCKED: la ausencia del ejecutable Unity dentro de Replit no significa
  que falte un entorno Unity; todavía no existe evidencia capturada del run
  remoto ni del hook externo configurado.
- UNBLOCK CONDITION: importación y compilación reales, ejecución de
  `VexforgeR5FoundationGate.ExecuteBatch()` y log con
  `VEXFORGE R5.3 FOUNDATION GATE: PASS`.

La verificación de instalación, artifact Android y QA física continúa siendo
un gate separado y no queda resuelta por la documentación Cloud.
