# VE-MOB-12 — World: honest Codex and raid signals

## Alcance

Este microbloque mejora únicamente la presentación Android de Codex y Raids
en `mobile/app/world.tsx`.

## Regla aplicada

Los estados conocidos de raids se traducen a etiquetas legibles: `pending`,
`active`, `completed`, `failed` y `cancelled`. Un estado nuevo conserva su
valor como `ESTADO: ...`; un valor ausente muestra `ESTADO NO REPORTADO`.

Las regiones y categorías ausentes muestran una señal explícita. Una entrada
del Codex conserva su `entry_code` como identidad si no tiene título; si
tampoco existe, muestra `TÍTULO NO REPORTADO`. El contenido ausente muestra
`CONTENIDO NO REPORTADO` tanto en la vista previa como al expandir.

No se modifican lecturas, filtros, RPCs, participación en raids, lore
autoritario, recompensas, permisos ni datos de Supabase.

## Evidencia

- `node scripts/verify-mobile-world.mjs`
- `git diff --check`

No se inicia APK, workflow Android ni release en este bloque.