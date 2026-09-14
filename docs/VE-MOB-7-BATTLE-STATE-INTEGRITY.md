# VE-MOB-7 — INTEGRIDAD EXPLÍCITA DEL ESTADO DE FORMACIÓN

## Alcance

El campo de batalla Android deja de inferir el lado o la posición de una
unidad a partir de su índice cuando el contrato vivo no entrega esos campos.
La superficie conserva la información como estado explícito:

- `LADO NO REPORTADO` cuando falta `side`;
- `POSICIÓN NO REPORTADA` cuando falta `slot`;
- `CAÍDAS REPORTADAS` cuando el motor devuelve `slot: fallen` o una unidad
  marcada como no viva.

## Límites

- No se inventan roles, lados, cartas ni artwork.
- No se modifica el resultado, el daño, el motor, el RPC ni la economía.
- Los slots canónicos `champion`, `vanguard`, `sentinel` y `reserve` siguen
  representándose desde la respuesta autoritativa.
- La información faltante permanece visible y accesible en lugar de
  desaparecer silenciosamente.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda móvil valida que no exista fallback
posicional; la inspección visual/táctil de la APK queda pendiente de autorización.