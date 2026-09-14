# VE-MOB-7 — ESTADO NEUTRO DEL MMR

## Alcance

El resultado Android de Arena deja de tratar un cambio de MMR igual a `0` como
una penalización. Cuando el servidor no devuelve `elo_change`, la interfaz
comunica que el dato no está disponible en lugar de fabricar un cero.

## Regla de presentación

- `elo_change > 0`: color de mejora y prefijo `+`.
- `elo_change < 0`: color de descenso.
- `elo_change === 0`: color neutral.
- `elo_change` ausente: `—`, sin afirmar un valor.
- `client_ai_v1`: `—`, porque la práctica no modifica MMR.

La fuente sigue siendo únicamente `BattleResult.elo_change`. No se calculan
variaciones en el cliente.

## Límites

- No se modifica el RPC ni la economía.
- No se toca el rango cargado desde Supabase.
- No se compila APK ni se genera release en este bloque.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda local y la revisión visual en APK quedan
pendientes de la autorización de compilación.