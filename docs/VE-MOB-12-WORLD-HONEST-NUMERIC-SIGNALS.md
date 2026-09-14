# VE-MOB-12 — SEÑALES HONESTAS DE NÚMEROS EN WORLD

## Alcance

Evitar que World use `—` como sustituto ambiguo para poder, HP, límite de
participantes, XP o tier cuando esos valores no llegan desde la fuente oficial.

## Cambio

- El poder de un jefe ausente muestra `PWR NO REPORTADO`.
- El HP de un jefe ausente muestra `HP NO REPORTADO`.
- El límite de participantes ausente muestra `LÍMITE NO REPORTADO`.
- XP y tier ausentes muestran `XP NO REPORTADO` y `TIER NO REPORTADO`.
- Los valores numéricos válidos, incluido cero, conservan su formato localizado.

No se agregaron números, cálculos de combate, recompensas, consultas, RPCs,
acciones ni datos locales. La barra de HP del boss conserva su semántica
existente y no se usa para inferir HP cuando falta.

## Evidencia

- Las fuentes vivas de World continúan respondiendo por lectura QA sin
  mutaciones.
- `node scripts/verify-mobile-world.mjs` OK.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.