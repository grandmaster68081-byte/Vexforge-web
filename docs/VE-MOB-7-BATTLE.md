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

Estado de implementación: `IMPLEMENTED_UNVERIFIED`. La guarda móvil pasa 15/15
y el typecheck móvil pasa. La entrega actual quedó incluida en el commit
`9e6ddc87b1449f6e4626277ad6d8b0248c78b187`; los runs 57
(`33365849985`) y 58 (`33365855394`) del workflow Android oficial terminaron
`success`, incluyendo `assembleRelease`, bundle JS standalone y publicación.
El release vigente es `vexforge-android-build-58`, con `app-release.apk`.
La QA manual del operador sigue siendo necesaria para instalar el APK y
recorrer una partida autenticada; la compilación y las guardas técnicas no
sustituyen esa comprobación.

Nivel Q: Q2 actual / Q3 objetivo.

Condición de reapertura: cambio del contrato `vexforge_battle_resolve`, ausencia de
la formación real en Android, resultado no autoritativo, fallo del workflow/release
o reporte del operador sobre interacción, accesibilidad, rendimiento o datos.

## Reconciliación con el paquete PVP Battlefield — 2026-09-07

La resolución PVP viva fue verificada contra Supabase oficial antes de modificar la presentación: la cuenta QA obtuvo ok:true, match_id, turnos reales, 13 unidades finales, arte image_url y roles de formación. El cliente Android no añade autoridad de combate ni reemplaza vexforge_battle_resolve.

El lote visual añade un campo vertical Android con dos mitades espejadas, tres posiciones semánticas por lado, reserva, arte canónico, vida, keywords, target lock, impacto, daño, crítico, muerte y resultado. Si el servidor no entrega arte, la pantalla comunica explícitamente la ausencia; no crea una carta genérica.

La función de oponentes queda restringida al RPC canónico get_pvp_opponents y a mazos reales de al menos cinco cartas; no hay fallback silencioso a rankings decorativos.

Estado de esta capa: IMPLEMENTED_UNVERIFIED. Falta instalar el APK, completar una partida real y verificar visualmente Touch/TalkBack/reduced-motion.
