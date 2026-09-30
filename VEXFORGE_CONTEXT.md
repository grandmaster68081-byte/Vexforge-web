# VEXFORGE — CONTEXTO ACTUAL DEL PROYECTO

## Directiva vigente del propietario — 2026-09-30

- **Único runtime activo para el videojuego:** Expo / React Native en `mobile/**`.
- **Legado/fuera del trabajo nuevo del juego:** Unity (`unity/**`) y las demás implementaciones cliente. Se preservan; no se eliminan, se migran ni se modifican por esta decisión.
- La web pública existente no se reconstruye ni se usa como runtime del juego; se deja intacta.
- Esta directiva explícita sustituye las afirmaciones anteriores de `main` y de documentos canónicos que decían que Unity era el runtime activo. Las referencias antiguas se conservan como historia, no como instrucción actual.
- Supabase live continúa siendo la autoridad de auth, reglas, cartas, estado, ownership, economía, resultados y settlement.

## Base observada

- Repositorio: `grandmaster68081-byte/Vexforge-web`; rama `main`.
- SHA inspeccionado antes del plan: `02e4cec401230184f7a0de07a12cbc369dd5674a` (2026-09-30).
- El árbol incluye Expo bajo `mobile/**` y Unity bajo `unity/**`. La selección de Expo es una decisión del propietario; su build/runtime actual no se verificó en esta unidad.
- En el árbol inspeccionado figuraba un workflow manual de Unity; no se verificó un pipeline Expo/Android activo. No despachar el pipeline Unity.
- La planificación vigente es `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md`.

## Supabase y readiness

El proyecto Supabase `rscuzqnfccqvltkdcdny` respondió `ACTIVE_HEALTHY` a una lectura de Management API. El snapshot live del 2026-09-30 reportó `vexforge_tier1_score = 38.30`, 10 dimensiones bajo el mínimo, score más bajo 0 y `tier1_ready = false`. Las fases 1 y 3 estaban `DONE`; la fase 7 `NOT_STARTED`; las fases restantes estaban incompletas. Ver detalle y límites de esa consulta en el roadmap.

Los objetos `battle_runs`, `battle_events`, `pvp_matches`, `player_deck` y rutinas de combate/deck existen en live, pero su nombre y estructura no demuestran que el flujo sea seguro o competitivo. Revalidar definiciones, políticas, grants, ownership, idempotencia y recuperación antes de integrar cambios.

## Reglas para continuar

1. Releer este contexto, `docs/vexforge-canonical/00_START_HERE.md` y el roadmap antes de modificar código.
2. Confirmar el SHA más reciente de `main`; no continuar desde una captura antigua.
3. Trabajar sólo en `mobile/**` para el runtime de juego, salvo documentación de continuidad o integración backend aprobada.
4. No declarar Expo listo para producción sin validar dependencias, configuración, build y recorrido en Android real.
5. No inventar reglas, cartas, recompensas, RPCs ni datos. Supabase live gana sobre migraciones históricas para contratos actuales.
6. Mantener Unity y los otros árboles legados intactos. No ejecutar sus builds.
7. El plan no autoriza cambios de esquema/datos, build de producción ni lanzamiento. Todo incremento funcional debe persistirse en GitHub `main` con evidencia y estado honesto.

## Orden de lectura

1. `docs/vexforge-canonical/00_START_HERE.md`
2. `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md`
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`, `17_CURRENT_BLOCK.md`, `19_BLOCKERS.md`, `20_KNOWN_UNKNOWNS.md`, `21_CONTRADICTIONS.md`
4. Documento de dominio y código Expo que corresponda al cambio
5. Contratos Supabase live implicados
