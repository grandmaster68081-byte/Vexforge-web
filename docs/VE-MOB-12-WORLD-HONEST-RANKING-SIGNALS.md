# VE-MOB-12 — World: honest ranking metrics

## Alcance

Este microbloque mejora únicamente la presentación Android del panel Ranking
en `mobile/app/world.tsx`.

## Regla aplicada

Los ceros numéricos recibidos desde Supabase se conservan. Los valores de
puesto, MMR, victorias, derrotas o empates que no sean números finitos muestran
una señal explícita de dato no reportado. El porcentaje sólo se calcula cuando
las tres métricas de partidas son válidas; una fila con cero partidas muestra
`SIN PARTIDAS`, no un guion ambiguo ni un porcentaje inventado.

No se modifican el ranking autoritativo, la consulta de temporada, los nombres
resueltos por el RPC, el orden, los filtros ni ningún dato de Supabase.

## Evidencia

- `node scripts/verify-mobile-world.mjs`
- `git diff --check`

No se inicia APK, workflow Android ni release en este bloque.