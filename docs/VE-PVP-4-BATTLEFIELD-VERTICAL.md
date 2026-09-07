# VE-PVP-4 — BATTLEFIELD VERTICAL ANDROID

## Objetivo

Integrar la referencia visual PVP del paquete adjunto dentro de VE-MOB-7 sin crear una segunda autoridad de combate. Supabase sigue resolviendo la partida; Android sólo presenta el resultado.

## Contrato usado

- Entrada: BattleResult.final_units, BattleResult.turns, you_won e image_url del RPC vivo public.vexforge_battle_resolve.
- Roles: Campeón, Vanguardia, Centinela y Reserva.
- Estados visibles: formación, target lock, ataque, impacto, daño, crítico, keyword, muerte, reserva y resultado.
- Fallback: ausencia de arte o payload incompleto se muestra como estado explícito; nunca se inventan unidades o resultados.

## Alineación con la directiva

El tablero conserva la lectura vertical de la referencia: rival arriba, zona de confrontación al centro y jugador abajo. El Campeón tiene mayor jerarquía visual que las otras posiciones. La reserva permanece separada y no se presenta como unidad activa. Las cartas usan las ilustraciones reales que devuelve Supabase Storage.

## Límites

No se cambian fórmulas, iniciativa, targeting, guardia, bonificaciones de facción, ELO, recompensas, economía, RLS ni RPCs. La resolución continúa siendo idempotente y autoritativa. El entrenamiento IA, cuando no hay oponentes reales, conserva su etiqueta sin MMR y no se presenta como PVP.

## Evidencia

- Supabase oficial: resolución QA real con ok:true, match_id, turns, final_units e imágenes Storage.
- Guardas Android ampliadas para comprobar tablero, roles, arte y contrato de datos.
- Estado: IMPLEMENTED_UNVERIFIED hasta QA humana en APK.
