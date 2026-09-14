# VE-MOB-7 — SEÑALES HONESTAS DE POSICIÓN Y RESERVA

## Alcance

Cerrar la presentación de estados vacíos en el campo de batalla Android sin
inventar una unidad, facción o carta cuando `vexforge_battle_resolve` no
entrega esa señal.

## Cambio

- Los slots activos sin unidad muestran `POSICIÓN VACÍA`.
- La unidad ausente de ese slot se anuncia como `UNIDAD NO REPORTADA`, sin
  presentarla como una carta o facción real.
- Una reserva sin cartas muestra `RESERVA VACÍA`.
- La etiqueta accesible del slot conserva el mismo estado explícito.

No se añadieron cartas, estadísticas, turnos, daño, simulaciones, datos,
RPCs, rutas, assets ni autoridad local. Los valores recibidos del servidor y
los ceros confirmados siguen mostrándose sin transformación semántica.

## Evidencia

- Sesión QA autenticada de solo lectura contra Supabase oficial:
  `cristiangalvez815@gmail.com` resolvió correctamente y `players` devolvió
  una fila.
- `node scripts/verify-mobile-battle.mjs` OK, 43/43.
- `git diff --check` limpio.
- No se inició workflow Android, no se compiló APK y no se publicó release,
  conforme a la instrucción vigente del operador.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.