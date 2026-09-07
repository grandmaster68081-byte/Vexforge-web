# VE-ASSET-ZIP-EXTRACTION-2026-09-07

## Alcance

Se ejecutó la acción de procedencia indicada por el plan vivo de VEXFORGE para los paquetes ZIP que existían en el bucket oficial pero no tenían sus archivos internos disponibles como objetos individuales. La operación no cambia la lógica Android, web, Auth, RLS, RPCs, economía ni combate.

## Fuente canónica

- Proyecto Supabase oficial: `rscuzqnfccqvltkdcdny`.
- Bucket: `vexforge-assets`.
- Paquetes fuente: `founders.zip`, `misc.zip`, `sessions.zip` y `ui sistema.zip`.
- Manifiesto: `public.vexforge_official_asset_manifest`.

## Archivos publicados

| Paquete | Ruta individual | Estado |
|---|---|---|
| founders | `founders/IMG_20260619_113831.jpg` | oficial, habilitado, reservado |
| misc | `misc/IMG_20260619_122016.jpg` | oficial, habilitado, reservado |
| misc | `misc/IMG_20260619_122314.jpg` | oficial, habilitado, reservado |
| sessions | `sessions/IMG_20260619_111025.jpg` | oficial, habilitado, reservado |
| ui_system | `ui sistema/IMG_20260619_115844.jpg` | oficial, habilitado, reservado |
| ui_system | `ui sistema/IMG_20260619_120107.jpg` | oficial, habilitado, reservado |

Cada archivo conserva su ZIP de origen en el manifiesto. Las rutas quedan en `RESERVED_RESIDUAL_ART` porque aún no existe un consumidor Android autorizado para ellas; no se asignó una superficie por inferencia visual ni se reemplazó arte pendiente.

## Verificación

- Los seis objetos responden HTTP 200 desde Storage oficial.
- El manifiesto registra seis filas individuales, todas `official=true` y `enabled=true`.
- `node scripts/verify-residual-art.mjs` pasa con 57 filas residuales, 38 objetos, 35 reservas y 19 prefijos.
- La publicación de `main` y la verificación oficial del commit quedan pendientes hasta completar el transporte GitHub REST.

## Estado

`ASSET_PROVENANCE_RESOLVED` para estos cuatro bundles. Los assets siguen reservados: no se declara cobertura visual de una superficie ni se eleva ninguna unidad Android por esta operación.
