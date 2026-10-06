# 06 — SUPABASE BACKEND MAP

## Autoridad y límites

El proyecto conectado es `rscuzqnfccqvltkdcdny`. Supabase live conserva la
autoridad sobre autenticación, estado del jugador, cartas, combate, economía,
progreso y recompensas. Los consumidores Unity están en
`unity/Assets/Scripts/Backend/`; la web oficial usa sus contratos existentes.

Los archivos de `supabase/migrations/` son historial de cambios del repositorio,
no una declaración del esquema live. No aplicar migraciones ni cambiar datos,
funciones, permisos o configuración live durante la limpieza.

La fuente local de la función OTA fue retirada del repositorio. Esta limpieza
no elimina ni modifica funciones, buckets ni objetos ya desplegados en
Supabase; no volver a desplegar ni borrar esos recursos como parte de este
cambio.
