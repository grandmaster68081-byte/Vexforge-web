# VE-MOB-7 — SEÑALES HONESTAS DE EVENTOS DE TURNO

## Alcance

Conservar en la UI Android la diferencia entre un evento de combate
confirmado, una eliminación por veneno y un evento que el contrato no
reportó. La pantalla no debe convertir una ausencia de evento en una acción
inferida.

## Cambio

- `poison_death` se presenta como `UNIDAD ELIMINADA POR VENENO`.
- `poisoned` y `poison_tick` se presentan como `VENENO CONFIRMADO`.
- Un turno sin evento reconocible ni daño numérico presenta `EVENTO NO REPORTADO`
  en vez de `TARGET LOCK`.
- El replay y la lectura de turnos continúan consumiendo exactamente el evento
  y el daño recibidos del servidor.

No se añadieron simulación, eventos, daño, turnos, recompensas, RPCs, rutas ni
datos. Los eventos desconocidos continúan mostrando su código recibido.

## Evidencia

- Se conserva la sesión QA autenticada de solo lectura contra Supabase oficial;
  no se ejecutaron mutaciones.
- `node scripts/verify-mobile-battle.mjs` OK, 44/44.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.