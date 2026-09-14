# VE-MOB-8 — REWARDS NEXUS IDENTITY

## Alcance

Este bloque conecta visualmente el centro de Misiones y Recompensas con el
Nexus/Forja sin alterar los contratos de actividad ni convertirlo en una
superficie administrativa genérica.

## Delta visual

- La pantalla usa `DomainHeader` con `domain="foja"` para declarar que la
  actividad pertenece al Nexus del forjador.
- El estado del encabezado se deriva únicamente de `loading`, `error`, la
  cantidad de quests y la cantidad de misiones recibidas de Supabase.
- La señal de energía conserva el valor real de `progress.energy` y muestra
  `—` cuando aún no está disponible.
- El regreso al Nexus tiene una compresión táctil breve, sin cambiar la ruta ni
  la lógica de carga.

## Límites

- Se mantienen `loadDailyQuests`, `loadMissions`, `claimDailyQuest`,
  `executeMobileMission` y la liquidación autoritativa existente.
- No se añaden datos, assets, recompensas, rutas, endpoints ni dependencias.
- Los estados de carga, error, vacío, ejecución, cooldown y resultado siguen
  siendo explícitos.
- El bloque queda en `IMPLEMENTED_UNVERIFIED` hasta QA visual/táctil en APK.