# VE-5-ASSET-MANIFEST-DATA

Unidad de datos: inscripción de los archivos individuales de assets en
`public.vexforge_official_asset_manifest` y corrección de las rutas rotas del
pack `progression`.

## Fuente canónica

- Código real de `main` (baseline `69de81c`).
- Datos vivos del proyecto Supabase oficial `rscuzqnfccqvltkdcdny`:
  `storage.objects` del bucket público `vexforge-assets`,
  `public.cards`, `public.world_bosses`,
  `public.vexforge_official_asset_manifest`.
- `src/lib/assetManifest.ts` (manifiesto del cliente, VE-3 y VE-4).
- `VEXFORGE_PROTOCOL_V2.md` y `CONTINUITY.md`.

## Baseline verificado (antes del cambio)

- 73 filas en `vexforge_official_asset_manifest`: 19 bundles ZIP + 54 archivos.
- 3 filas con ruta inexistente: `progresión/IMG_20260619_120425.jpg`,
  `progresión/IMG_20260619_120838.jpg`, `progresión/IMG_20260619_121047.jpg`
  (los objetos reales viven en `progression/`).
- 127 artes de carta y 15 artes de jefe mundial consumidos por el dato vivo
  (`cards.image_url`, `world_bosses.image_url`) sin inscribir en el manifiesto.
- 7 fondos consumidos por `src/lib/assetManifest.ts` sin inscribir
  (`backgrounds/bg_achievements.jpg`, `backgrounds/bg_leaderboard.jpg`,
  `backgrounds/bg_bosses.jpg`, `factions/bg_{guerrero,mago,paladin,picaro}.jpg`).
- 0 URLs de carta/jefe apuntando a objetos inexistentes.

## Cambio realizado

`supabase/migrations/0009_ve5_official_asset_manifest_files.sql`
(idempotente, transaccional):

1. Respaldo de las 3 rutas heredadas en `public.vexforge_icon_legacy`
   (`source_table='vexforge_official_asset_manifest'`,
   `source_column='internal_path'`, `row_key=asset_code`) y corrección de
   `internal_path`/`source_zip_url` a `progression/`.
2. Inscripción de 127 filas `asset_pack='cards'`, `semantic_role='card_art'`,
   con `display_name` tomado de `cards.name` (dato canónico, no inventado).
3. Inscripción de 15 filas `asset_pack='bosses'`,
   `semantic_role='world_boss_art'`, con `display_name` de `world_bosses.name`.
4. Inscripción de 7 fondos de superficie/facción consumidos por el cliente,
   sólo cuando el objeto existe realmente en Storage.

Herramienta nueva: `scripts/verify-manifest.mjs` (`npm run verify:manifest`),
que lee con el rol `anon` y falla si una ruta del código no está inscrita, si
una fila de archivo del manifiesto no tiene objeto en Storage, o si un arte de
carta/jefe consumido por el juego no está registrado.

## Procedencia y reversibilidad

- No se creó, sustituyó ni eliminó ningún asset. Sólo se inscribió en el dato
  lo que ya existe en el Storage oficial.
- Reversible: las filas nuevas son identificables por `asset_code`
  (`cards_*`, `bosses_*`, `backgrounds_bg_*`, `factions_bg_*`) y las rutas
  heredadas están en `vexforge_icon_legacy`.

## Alcance no modificado

Esquema de juego, RLS, RPCs, triggers, autenticación, roles, economía,
energía, wallet, MMR, recompensas, evolución y cualquier resultado
autoritativo. No se usó `service_role` para suplantar jugadores ni para
fabricar QA.

## Evidencia

- Migración aplicada vía Management API sin error.
- Post-estado: 222 filas (19 bundles + 203 archivos); `broken=0`;
  `cards_unregistered=0`; `bosses_unregistered=0`.
- `npm run verify:manifest` → 203 archivos inscritos, 17 rutas del código
  presentes, 0 referencias rotas.
- `npm run verify:assets` → 17/17 rutas del manifiesto del cliente disponibles.

## Deuda registrada

- El bucket contiene artes adicionales no consumidos por ningún dato ni código
  (`bosses/BOSS_*.jpg` y `bosses/boss_*.jpg` duplicados de los `BOSS-0xx.jpg`
  activos, `cards/IMG_2026*.jpg`). No se inscriben porque no tienen rol
  semántico canónico asignado; requieren decisión canónica previa.
- Sigue pendiente la higiene documental de las tablas internas `vexforge_*`.
- Sin variantes responsive dedicadas para móvil de los fondos.

## Condición de reapertura

Cambio del inventario del bucket, decisión canónica sobre los artes
duplicados, o fallo de `npm run verify:manifest`.

## Contrato permanente de consumo visual

Desde la entrada en vigor de `VE-VIS-3`, toda superficie nueva debe declarar
sus elementos visuales y resolver cada uno contra este manifiesto antes del
cierre. Si un elemento todavía no existe, se produce en la pista visual
paralela, se sube al bucket `vexforge-assets`, se inscribe aquí con rol
semántico y después se enlaza desde el consumidor. No se permite sustituirlo
por una forma CSS, emoji, icono genérico, imagen stock o placeholder visible.

La ausencia temporal del asset no detiene las partes independientes del plan,
pero deja la unidad en `ASSET_REQUIRED` o `ASSET_IN_PROGRESS` y bloquea su
declaración como visualmente cubierta hasta que la guarda del manifiesto pase.
