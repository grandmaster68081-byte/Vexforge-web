# VE-MOB-7 — ARENA Y RESOLUCIÓN DE COMBATE

## Alcance

Portar a Android la superficie de batalla VEXFORGE como una presentación táctil de
la resolución autoritativa del servidor:

- búsqueda y selección de oponentes reales;
- confirmación explícita antes de iniciar una partida;
- resolución mediante `vexforge_battle_resolve`;
- lectura secuencial del registro de turnos devuelto por Supabase;
- cues de impacto, críticos, derrotas y efectos reportados por el servidor;
- resultado final con ganador, turnos, ELO y referencia de match.

El dispositivo no calcula daño, combate, ganador, recompensas ni economía.

## Contratos y fuentes canónicas

- RPC vivo `public.vexforge_battle_resolve(p_challenger_id, p_opponent_id, p_idempotency_key)`.
- RPC vivo `public.get_leaderboard(p_limit)` para oponentes públicos.
- Código web de referencia en `src/routes/PvpRoute.tsx`, `src/domains/pvp/usePvp.ts`,
  `src/domains/pvp/repository.ts` y `src/lib/battleTypes.ts`.
- Supabase oficial, RLS, datos de jugadores y releases Android.

## Gates técnicos

1. Sólo se muestran oponentes devueltos por Supabase y se exige confirmación.
2. El inicio de combate pasa por el RPC oficial; no existe simulación local.
3. Los turnos y el resultado se muestran desde la respuesta del servidor.
4. Hay estados explícitos de búsqueda, resolución, error, lista vacía y resultado.
5. El flujo es táctil, accesible y respeta `reduceMotion`.
6. La unidad no usa emojis, datos de demostración ni arte genérico.
7. Se ejecutan typecheck móvil, guardas móviles, verificaciones web y workflow APK.

## Reconciliación canónica — 2026-08-30

ForgeFormation **no está suspendido ni reemplazado**. El documento histórico
`vexforge_forge_formation_engine_v1` aparece como `superseded` porque su plan de
trabajo fue absorbido por la directiva Tier 1; ese estado no cancela las reglas ni
el motor de combate. El protocolo activo y la RPC viva confirman que
ForgeFormation es el núcleo obligatorio del juego.

La discrepancia encontrada está en el port Android: la pantalla ya resolvía
partidas reales mediante `vexforge_battle_resolve`, pero la evidencia técnica sólo
comprobaba el RPC y la lectura de turnos. No mostraba explícitamente la formación
Vanguardia/Campeón/Centinela/Reserva, por lo que una APK podía parecer una arena
genérica aunque el servidor ya aplicara las reglas ForgeFormation.

## Alcance cerrado en esta unidad

- La APK presenta la formación real derivada del mazo autenticado: Vanguardia,
  Campeón, Centinela y Reserva.
- El Campeón se identifica desde `player_deck.is_champion`; si falta, la
  representación respeta el fallback del contrato autoritativo.
- La reserva y las tres posiciones activas se presentan como estado de lectura; no
  se simula ni se altera el resultado en el cliente.
- El combate continúa entrando únicamente por `vexforge_battle_resolve`, que aplica
  estadísticas, bonificaciones, guardias, turnos, muerte del Campeón, ganador, ELO
  y recompensas en Supabase.
- El botón de inicio queda bloqueado sin un mazo con al menos tres unidades para no
  presentar un combate ForgeFormation inválido.

## Estado y evidencia

Estado de implementación: `IMPLEMENTED_UNVERIFIED` después de publicar el código
en `main` y pasar el typecheck móvil. La ejecución oficial que debía producir el
APK correlativo quedó bloqueada en el runner y fue cancelada; por eso no se
declara un nuevo release. La QA manual del operador sigue siendo necesaria para
instalar el APK y recorrer una partida autenticada; la compilación y las guardas
técnicas no sustituyen esa comprobación.

Nivel Q: Q2 actual / Q3 objetivo.

Condición de reapertura: cambio del contrato `vexforge_battle_resolve`, ausencia de
la formación real en Android, resultado no autoritativo, fallo del workflow/release
o reporte del operador sobre interacción, accesibilidad, rendimiento o datos.