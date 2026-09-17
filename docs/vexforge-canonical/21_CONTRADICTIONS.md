# 21 — CONTRADICTIONS

## C-001 — Web oficial vs Android activo

SOURCE A: README original: `Official Web Frontend`.
SOURCE B: orden canónica y cliente Expo móvil actual.
CURRENT EVIDENCE: `mobile/app.json`, Expo Router, workflows APK y continuidad reciente.
STATUS: `RESUELTO`: Android active; web historical/frozen.

## C-002 — Snapshot vs current repo

SNAPSHOT: auditoría extraída de `main` en `f43159ecee63b610bb71c295238327ecea3feeb6`.
CURRENT REPO: consulta de `main` devuelve el mismo SHA.
CURRENT EVIDENCE: commit API GitHub del 2026-09-17.
STATUS: `RESUELTO / MATCH`.

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
