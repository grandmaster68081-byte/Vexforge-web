# 17 — CURRENT BLOCK

## Bloque activo

`EXPO_RUNTIME_REBASELINE_AND_TIER1_GAME_ROADMAP`

### Directiva vigente

El propietario confirmó el 2026-09-30 que Expo / React Native en `mobile/**` es el único runtime activo del juego. Unity y demás implementaciones son legado para trabajo nuevo; conservar sin borrar. Esta decisión prevalece sobre los documentos anteriores que declaraban Unity activo.

### Objetivo de este bloque

Dejar una ruta realista, verificable y continua hacia un TCG móvil competitivo y preparar el primer bloque de implementación: reconciliar el estado Expo del `main`, fijar reglas canónicas y auditar de forma read-only los contratos Supabase de combate. Este documento no afirma que el combate esté implementado o que el cliente Expo esté listo.

### Estado verificado al 2026-09-30

| Gate | Estado | Evidencia / límite |
|---|---|---|
| Expo como runtime elegido | OWNER_CONFIRMED | Directiva explícita; `mobile/**` existe en `main` |
| Expo reproducible en el `main` actual | NO_VERIFICADO | En esta planificación no se instalaron deps ni se ejecutaron typecheck, Expo Doctor o build |
| Pipeline oficial Expo Android | NO_VERIFICADO | En el snapshot se observó workflow manual de Unity; no se validó uno de Expo |
| Unity | LEGACY_FOR_NEW_GAME_WORK | Código y workflow se preservan; no se despacha ni se modifica |
| Supabase project | ACTIVE_HEALTHY_READ_ONLY | Management API; sin cambios de esquema, datos, auth, RLS, functions ni Storage |
| Contratos de combate | OBJECTS_OBSERVED_SEMANTICS_UNVERIFIED | Tablas/rutinas existen; falta revisar cuerpo, RLS, grants, ownership y ejecución autenticada |
| Tier 1 interno | NOT_READY | Live `weighted_score=38.30`, 10 dimensiones bajo mínimo, `tier1_ready=false` |
| Runtime Android instalado / QA física | NO_VERIFICADO | Esta planificación no hizo build, instalación ni prueba en dispositivo |

### Próximo bloque de trabajo

Leer `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md` y completar G0 antes de añadir pantallas o cambiar backend:

1. Inspeccionar el `main` vigente, `mobile/**`, dependencias, configuración, scripts de verificación y todos los pipelines Android.
2. Reconstruir la fuente de reglas y el recorrido de combate que el producto realmente pretende ofrecer; pedir al propietario sólo decisiones que no existan en fuentes canónicas.
3. Auditar bodies/firmas/grants/RLS y ownership de cada contrato Supabase llamado por Expo para Battle/Deck/Missions; no inferir de nombres.
4. Registrar los gaps concretos. Si el servidor no valida acciones competitivas, declarar PvP de producción bloqueado; no mover adjudicación al cliente.
5. Proponer el primer vertical slice Expo y sus pruebas. No iniciar build Android de producción, compra, migración ni escritura de Supabase sin su gate de autorización.

### Gate de salida

No avanzar a PvP/settlement de producción hasta demostrar un bucle real de inicio → acción validada → evento → resultado autorizado → persistencia → recuperación tras interrupción. Una práctica/IA local se identifica como simulación y no cuenta como partida competitiva.
