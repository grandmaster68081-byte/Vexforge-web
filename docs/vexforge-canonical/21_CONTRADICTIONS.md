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

## C-006 — Expo fallback vs Unity principal de desarrollo

SOURCE A: código actual en `mobile/**`, `mobile/app.json` y workflow Expo/Gradle.
SOURCE B: `unity/**`, `ProjectVersion.txt` y la escena bootstrap actual.
CURRENT EVIDENCE: Unity es el runtime principal de desarrollo; mobile queda
íntegro como fallback/rollback/referencia.
STATUS: `RESUELTO`: Unity `IMPLEMENTED_UNVERIFIED`, mobile `PRESERVED`.

## C-007 — Foundation antiguo vs Game Runtime Foundation

SOURCE A: cualquier paquete anterior diseñado para React Native.
SOURCE B: orden operativa nueva, que exige la Foundation sobre Expo / React
Native sin destruir componentes funcionales existentes.
CURRENT EVIDENCE: `mobile/game/**` existe y el shell consume la sesión y
sincronización reales.
STATUS: `RESUELTO POR FASE`: la Foundation operativa continúa en Unity;
World, Cards, Deck, Battle y Missions se completan por bloques sin cambiar la
autoridad de Supabase.
