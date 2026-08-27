# VE-MOB-9 — PERFIL, LOGROS Y PROGRESO

## Alcance

Portar a Android la superficie de identidad y progresión del jugador:

- identidad real de `players`, estado de conexión y fecha de alta;
- rango PvP y MMR mediante `get_player_rank`;
- nivel, XP, energía, región inicial y VEX desde los datos ya cargados del jugador;
- estadísticas de actividad mediante `get_player_stats`;
- logros desbloqueados desde `player_achievements` con su catálogo de `achievements`;
- accesos táctiles a misiones, colección y mazo;
- cierre de sesión y estados explícitos de carga, error y vacío.

La pantalla mantiene una sola intención principal: entender el estado actual del
forjador y elegir el siguiente paso de progresión. El cliente sólo presenta
respuestas de Supabase; no calcula rango, XP, recompensas ni estadísticas
autoritativas.

## Contratos y fuentes canónicas

- Tablas `players`, `player_progress`, `player_wallet`, `player_achievements` y
  `achievements`, bajo la misma sesión y RLS oficial.
- RPCs `get_player_rank` y `get_player_stats`.
- Datos base compartidos por `mobile/context/GameContext.tsx`.
- Referencias web `src/routes/ProfileRoute.tsx`,
  `src/routes/AchievementsRoute.tsx`, `src/routes/ProgressRoute.tsx` y
  `src/domains/profile/`.
- Catálogos oficiales `vexforge_screen_manifest`, `vexforge_player_journey` y
  `vexforge_game_loop`.

## Gates técnicos

1. La identidad, el progreso, la cartera y las estadísticas proceden de datos
   vivos; no se agregan fixtures ni perfiles locales.
2. El rango procede de `get_player_rank`; el cliente sólo asigna una etiqueta
   visual para presentar la respuesta.
3. Los logros proceden de la relación `player_achievements → achievements`.
4. Existen estados explícitos de carga, error, vacío y sincronización limitada.
5. El flujo es táctil, accesible, mobile-first y compatible con safe area.
6. La unidad no usa emojis, datos de demostración ni arte genérico.
7. Se ejecutan typecheck móvil, guarda específica, verificaciones web y
   workflow APK.

## Estado y evidencia

Estado de implementación: `IMPLEMENTED_UNVERIFIED`. La QA posterior requiere
instalar el release y recorrer el perfil autenticado, la sincronización, los
accesos rápidos y el cierre de sesión con una cuenta normal.

Nivel Q: Q2 actual / Q3 objetivo.

## Condición de reapertura

Reabrir si cambian los contratos de perfil, rango, estadísticas o logros; si se
presenta información no autoritativa; si falla el workflow/release; o si el
operador reporta un problema de interacción, accesibilidad, rendimiento o
estado real.