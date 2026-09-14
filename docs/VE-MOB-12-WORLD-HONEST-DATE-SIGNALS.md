# VE-MOB-12 — SEÑALES HONESTAS DE FECHA EN WORLD

## Alcance

Distinguir en Android entre una fecha que Supabase no entregó y una fecha que
llegó con un valor ilegible, sin sustituir ambas por una etiqueta genérica.

## Cambio

- Un `started_at`, `created_at` o `end_at` ausente muestra `FECHA NO REPORTADA`.
- Un valor presente pero inválido muestra `FECHA NO VÁLIDA`.
- Una fecha válida conserva su formato localizado de World.

No se añadieron fechas, temporadas, raids, recompensas, consultas, RPCs,
acciones ni datos locales. El cambio sólo normaliza la señal de presentación
de valores ya recibidos.

## Evidencia

- La cuenta QA mantiene acceso de solo lectura a las tablas vivas de World;
  no se ejecutaron mutaciones.
- `node scripts/verify-mobile-world.mjs` OK.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.