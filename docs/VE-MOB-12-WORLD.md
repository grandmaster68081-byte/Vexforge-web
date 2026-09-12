# VE-MOB-12 — WORLD

## Alcance

Portar a Android la superficie de mundo navegable de VEXFORGE:

- jefes mundiales activos con arte oficial, tier, región, poder, HP y pool de recompensas;
- raids abiertos, unión y contribución mediante RPCs oficiales;
- Codex público con búsqueda, categorías y lectura expandible;
- temporada activa, progreso, tiers, recompensas y claims autenticados;
- ranking público de la temporada `S1_2026` con nombres resueltos por el RPC oficial;
- estados explícitos de carga, error, vacío, sesión y refresh;
- acceso desde Forja y Perfil sin añadir una tab que compita con las cinco superficies principales.

La pantalla presenta el mundo como una ruta única con paneles internos: `Bosses`,
`Raids`, `Codex`, `Pase` y `Ranking`.

## Contratos vivos

- `world_bosses` y `world_boss_encounters`.
- `raid_runs` y `raid_participants`.
- `lore_codex`.
- `season_passes`, `season_pass_tiers` y `season_rankings`.
- RPCs `vexforge_join_raid`, `vexforge_contribute_raid`,
  `get_season_progress`, `claim_season_pass_reward` y
  `get_public_player_names`.
- El arranque de un combate de boss continúa delegado a la superficie Battle
  Run existente; Android no calcula daño, HP, victoria ni recompensas.

## Regla de integridad

El cliente no fabrica daño, progreso, recompensas, MMR ni nombres públicos. Las
acciones de raid y claims sólo se consideran exitosas cuando el RPC devuelve
`ok`. El botón de boss abre la preparación de batalla, pero no registra un daño
local ni usa un valor fijo para simularlo.

## Assets

- Fondo canónico `backgrounds/bg_bosses.jpg` mediante el registro visual móvil.
- Arte de cada boss sólo desde `world_bosses.image_url`, que apunta a Storage
  oficial cuando está disponible.
- No se añaden imágenes, iconos de marca ni placeholders externos.

## Gates técnicos

1. Typecheck móvil y build Expo sin errores.
2. Verificación específica de rutas, contratos RPC, estados y assets de WORLD.
3. Workflow Android oficial en `success` y release APK publicado.
4. La continuidad conserva `IMPLEMENTED_UNVERIFIED` hasta QA humana en un
   dispositivo Android real; no se declara `OPERATIONAL`, `PASS` ni
   `TIER1_READY` sólo por compilar.

## Estado y evidencia

Estado de implementación: `IMPLEMENTED_UNVERIFIED`.
