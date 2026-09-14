# VE-MOB-12 — IDENTIDAD HONESTA DE RAIDS EN WORLD

## Alcance

Evitar que un raid vivo aparezca sin nombre o código cuando esas cadenas
llegan vacías desde la fuente oficial.

## Cambio

- Nombre ausente en `metadata`: `NOMBRE DE RAID NO REPORTADO`.
- Código ausente: `CÓDIGO DE RAID NO REPORTADO`.
- Nombre y código presentes se conservan sin reemplazarlos entre sí.

No se añadieron raids, nombres, códigos, regiones, estados, participantes,
recompensas, consultas, RPCs, acciones ni datos locales.

## Evidencia

- La fuente viva `raid_runs` continúa accesible mediante lectura QA sin
  mutaciones.
- `node scripts/verify-mobile-world.mjs` OK.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.