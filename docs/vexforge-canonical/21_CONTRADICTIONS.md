# 21 — CONTRADICTIONS (HISTORIAL)

## Resolución vigente — Expo canónico

Expo / React Native en `mobile/**` es el único runtime activo del videojuego.
Unity (`unity/**`) se conserva como legado, sin trabajo nuevo. La ruta
Epic/Fab está retirada; no se encontraron assets importados de ese proveedor.

Esta decisión sustituye las reconciliaciones Unity/Fab anteriores de este
archivo y de `CONTINUITY.md`. Los registros históricos que siguen sirven para
auditoría, no como instrucciones de runtime. La fuente operativa es
`mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md` y
`mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`.

## Historial de resoluciones anteriores (no vigente para este bloque)

## Resolución histórica — 2026-09-30

El propietario resolvió explícitamente el runtime activo: Expo / React Native en `mobile/**` es el único runtime de juego para trabajo nuevo. Unity y los demás clientes quedan como legado, preservados e intactos. Esta instrucción sustituye los estados históricos de Unity activo en `main`; no certifica que Expo compile ni autoriza a cambiar Supabase.

El documento de lanzamiento v4 es material de requisitos, no autoridad para revertir esta selección. Ver `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md`. Los C-001–C-007 siguientes registran evidencia y decisiones anteriores a esta reconciliación; no son instrucciones de runtime vigentes cuando contradicen esta sección.

## CURRENT RECONCILIATION — 2026-09-25

La documentación histórica que describe Expo/React Native o Unity Cloud Build\como runtime o método activo queda supersedida por el estado observable de
`main`: Unity en `unity/**` y GitHub Actions en
`.github/workflows/vexforge-unity-android-github.yml`. `mobile/**` se conserva
como legado y la infraestructura Cloud queda como referencia externa.

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

## C-008 — Runtime Expo frente a decisión Unity histórica (resuelto por el propietario)

- **FUENTE A:** documentos y código histórico de `main` que describen Unity como runtime activo.
- **FUENTE B:** decisión explícita del propietario del 2026-09-30: Expo en `mobile/**` es el único runtime activo; lo demás queda como legado.
- **EVIDENCIA:** ambos árboles existen en el SHA inspeccionado; la build/QA actual de Expo no se verificó en esta planificación.
- **RESOLUCIÓN:** para trabajo nuevo manda la decisión reciente del propietario. Unity y otros clientes se preservan sin cambios; Expo no se declara listo hasta superar G0/G1.
- **SIGUIENTE:** reconciliar sólo la documentación de entrada y verificar el camino Expo; no reabrir ni borrar el trabajo histórico de Unity.

## C-009 — Ruta visual Unity/URP frente a Expo-only o Unreal (decisión técnica delegada)

- **SITUACIÓN:** documentos previos registraban Expo como runtime activo; el repositorio también contiene un cliente Unity Android con URP, evento de presentación, perfiles de calidad y workflow de seis horas.
- **PETICIÓN MÁS RECIENTE:** elegir la mejor ruta visual en 2026, sin coste de herramientas/assets y dentro del límite GitHub Actions.
- **RESOLUCIÓN:** Unity 6.3.0f1 + URP 17.3.0 permanece como target visual Android; Fab sólo para contenido compatible/licenciado. No portar a Unreal: Nanite/Lumen no están en la tabla mobile de UE 5.8 y no existe pipeline UE en el repo. Expo permanece preservado como legado.
- **BUILD:** `normal/final` siguen bloqueados para producción mientras no tengan hard cap/preflight; inventario ~287k no es build aceptable.
- **EVIDENCIA/DETALLE:** `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md`. No hubo cambios runtime, Supabase ni build en esta decisión.
