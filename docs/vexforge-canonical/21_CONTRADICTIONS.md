# 21 — CONTRADICTIONS

## C-001 — Web oficial vs Android activo

SOURCE A: README original: `Official Web Frontend`.
SOURCE B: orden canónica y cliente Expo móvil actual.
CURRENT EVIDENCE: `mobile/app.json`, Expo Router, workflows APK y continuidad reciente.
STATUS: `RESUELTO`: Android active; web historical/frozen.

## C-002 — Snapshot vs current repo

SNAPSHOT: documentación histórica que referencia `f43159ecee63b610bb71c295238327ecea3feeb6`.
CURRENT REPO: `main` actual es `55b724e8f20fbc22abd1f6606d7c4dd617ee3270`.
CURRENT EVIDENCE: el repositorio contiene ahora `unity/` y workflows Foundation.
STATUS: `RESUELTO / DOCUMENTACIÓN HISTÓRICA IDENTIFICADA`.

## C-003 — Backend documentado vs catálogo live

SOURCE A: 49 migrations y documentación del repo.
SOURCE B: catálogo live con 318 tablas/vistas, 345 rutinas y 275 policies.
CURRENT EVIDENCE: ambos son reales, pero no se ejecutó reconciliación exhaustiva por objeto.
STATUS: `CONTRADICTORIO / NO_RESUELTO`: Supabase live gana para estado actual; el repo conserva historial.

## C-004 — Local AI simulation vs server authority

SOURCE A: `mobile/lib/aiBattle.ts` contiene `simulateQuickAIBattle`.
SOURCE B: protocolo activo establece server-authoritative Battle Run/settlement.
CURRENT EVIDENCE: la función local está clasificada como simulation; no prueba settlement competitivo.
STATUS: `RESUELTO POR CLASIFICACIÓN`: simulation local, no autoridad competitiva.

## C-005 — Release anterior vs commit actual

SOURCE A: continuidad registra release 249 desde `ded78720...`.
SOURCE B: `main` actual es `f43159e...`.
CURRENT EVIDENCE: el commit actual registra el release, pero no existe un nuevo APK de esta tarea.
STATUS: `NO_RESUELTO / EVIDENCE_REQUIRED` para afirmar que una instalación coincide con el commit actual.

## C-006 — Expo actual vs Unity objetivo

SOURCE A: código actual en `mobile/**`, `mobile/app.json` y workflow Expo/Gradle.
SOURCE B: `unity/` y workflows Unity del commit actual, con Unity 6.3 LTS + URP como runtime objetivo.
CURRENT EVIDENCE: Expo/React Native sigue protegido como legado; Unity Foundation existe, pero no hay APK verificado.
STATUS: `RESUELTO POR FASE`: Expo/React Native es legado protegido; Unity está en `IMPLEMENTED_UNVERIFIED` hasta superar Foundation.

## C-007 — Foundation antiguo vs Foundation Unity

SOURCE A: cualquier paquete anterior diseñado para React Native.
SOURCE B: orden operativa nueva, que prohíbe ejecutar el antiguo Foundation y exige un paquete único específico de Unity.
CURRENT EVIDENCE: no se ejecutó ningún paquete de migración.
STATUS: `SUPERSEDED`: el siguiente paquete debe ser Unity Foundation, no React Native Foundation.
