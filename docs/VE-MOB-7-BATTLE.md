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

## Estado y evidencia

Estado de implementación: `IMPLEMENTED_UNVERIFIED` tras publicar el APK del
commit de cierre. La QA funcional posterior requiere que el operador instale el
release y recorra una partida con una sesión normal; esa evidencia no se inventa
ni se sustituye por una compilación.

Nivel Q: Q2 actual / Q3 objetivo.

## Condición de reapertura

Reabrir si cambia el contrato del RPC o del leaderboard, se muestran resultados no
autoritativos, falla el workflow/release, o el operador reporta un problema de
interacción, accesibilidad, rendimiento o estado real.