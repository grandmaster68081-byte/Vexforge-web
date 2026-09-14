# VE-MOB-5 — RESUMEN HONESTO SIN FORMACIÓN ACTIVA

## Alcance

La superficie Deck Android ya no muestra `0 CARTAS` ni `0 PODER` cuando no
existe una formación oficial persistida. En ese estado usa `—` para indicar
que no hay una métrica confirmada; los valores numéricos solo aparecen cuando
existe un mazo cargado desde la fuente oficial.

## Límites

- No se modifica la validación, el guardado, la colección ni los RPC de mazos.
- No se interpreta la ausencia de mazo como un mazo vacío.
- La creación de un borrador sigue funcionando igual.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda valida la separación entre ausencia de
formación y métricas reales; la revisión visual queda pendiente de APK autorizada.