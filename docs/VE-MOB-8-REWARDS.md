# VE-MOB-8 — RECOMPENSAS Y MISIONES

## Alcance

Portar a Android el centro de actividad que conecta quests diarias, misiones
disponibles y recompensas visibles:

- lectura autenticada de quests diarias y progreso real;
- reclamación de quests completadas mediante `claim_daily_quest`;
- lectura de misiones activas aptas para producción;
- ejecución y liquidación mediante `execute_mission` y `claim_mission_reward`;
- estados explícitos de carga, error, vacío, ejecución y resultado;
- acceso desde Home sin convertir la arena en sustituto del centro de misiones.

El cliente sólo presenta la respuesta de Supabase. No calcula progreso, energía,
recompensas, inventario ni liquidación local.

## Contratos y fuentes canónicas

- Tablas `player_daily_quests`, `daily_quests` y `missions` con la misma RLS
  oficial usada por la web.
- RPCs `claim_daily_quest`, `execute_mission` y `claim_mission_reward`.
- Código web de referencia en `src/routes/QuestsRoute.tsx`,
  `src/routes/MissionsRoute.tsx`, `src/domains/quests/` y `src/domains/missions/`.
- Catálogos oficiales `vexforge_rewards_catalog`, `vexforge_missions_system`,
  `vexforge_game_loop` y `vexforge_screen_manifest`.

## Gates técnicos

1. Sólo se muestran quests y misiones devueltas por Supabase.
2. Las reclamaciones y ejecuciones pasan por RPCs autoritativas.
3. VEX y XP se presentan desde respuestas/catálogos del servidor.
4. Existen estados explícitos de carga, error, lista vacía y resultado.
5. El flujo es táctil, accesible y apto para pantallas pequeñas.
6. La unidad no usa emojis, datos de demostración ni arte genérico.
7. Se ejecutan typecheck móvil, guarda específica, verificaciones web y workflow APK.

## Estado y evidencia

Estado de implementación: `IMPLEMENTED_UNVERIFIED`. La guarda móvil de Rewards
pasa 12/12 y el typecheck móvil pasa. La entrega actual quedó incluida en el
commit `9e6ddc87b1449f6e4626277ad6d8b0248c78b187`; los runs 57
(`33365849985`) y 58 (`33365855394`) del workflow Android oficial terminaron
`success`, incluyendo `assembleRelease`, bundle JS standalone y publicación.
El release vigente es `vexforge-android-build-58`, con `app-release.apk`.
La QA posterior requiere instalar el release y recorrer quests, reclamación y
misión con una sesión normal.

Nivel Q: Q2 actual / Q3 objetivo.

## Condición de reapertura

Reabrir si cambian los contratos de quests/misiones, se muestran recompensas no
autoritativas, falla el workflow/release, o el operador reporta un problema de
interacción, accesibilidad, rendimiento o estado real.