# VE-MOB-12 — IDENTIDAD HONESTA DE JEFES EN WORLD

## Alcance

Evitar que un jefe con nombre, código o tier vacío aparezca como una tarjeta
sin identidad o provoque una lectura falsa de sus datos.

## Cambio

- Código ausente: `CÓDIGO NO REPORTADO`.
- Nombre ausente: `NOMBRE DEL JEFE NO REPORTADO`.
- Tier ausente: `TIER NO REPORTADO`.
- Los valores presentes se conservan sin transformar semánticamente, salvo la
  capitalización visual del tier.
- La etiqueta accesible del arte usa la misma identidad explícita.

No se añadieron jefes, nombres, tiers, arte, poder, HP, recompensas,
consultas, RPCs, acciones ni datos locales.

## Evidencia

- La fuente viva `world_bosses` continúa accesible mediante lectura QA sin
  mutaciones.
- `node scripts/verify-mobile-world.mjs` OK.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.