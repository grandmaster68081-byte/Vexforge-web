# VE-VIS-1 — Objetivo visual Tier 1 (trazado en la fuente autoritativa)

## Proposito

La vision final del protocolo es que VEXFORGE sea visualmente **Tier 1 para su genero**
(RPG de forja / gacha competitivo). Hasta esta unidad ese objetivo vivia solo en el
lenguaje del protocolo, sin criterios medibles ni estado por criterio. VE-VIS-1 lo baja
a datos: una tabla de gobierno en Supabase, de solo lectura publica, con criterios,
fuente de medicion, valor objetivo, ultimo valor medido y estado.

## Fuente autoritativa

`public.vexforge_visual_tier1_objective` (migracion `0030_ve_vis_1_tier1_visual_objective.sql`).

- `select` para `anon` y `authenticated` (dato de gobierno, no sensible); `all` para `service_role`.
- RLS activo con una unica politica de lectura publica.
- Tabla y las 12 columnas documentadas con `comment on`, asi las guardas
  `verify:table-docs`, `verify:column-docs` y `verify:support-column-docs` la cubren sin cambios.
- Se actualiza **solo por migracion**, con evidencia real de `verify:all`, del catalogo vivo
  o de navegador sobre el deploy publico. Nunca a mano desde la app.

## Estado medido (2026-08-21)

| Criterio | Area | Estado | Bloquea Tier 1 |
| --- | --- | --- | --- |
| `surface_backgrounds` | arte | MET | si |
| `boss_art` | arte | MET | si |
| `card_art` | arte | MET | si |
| `asset_manifest_integrity` | arte | MET | si |
| `ui_identity_tokens` | identidad | MET | si |
| `icon_language` | identidad | PARTIAL | si |
| `mobile_layout` | layout | MET | no |
| `motion_and_feedback` | motion | NOT_STARTED | si |
| `loading_and_empty_states` | layout | PARTIAL | no |
| `asset_hygiene` | higiene | BLOCKED | no |

## Lectura del resultado

**Tier 1 todavia no esta alcanzado.** La capa de arte y de identidad estatica esta
practicamente cerrada (fondos canonicos, 15/15 jefes, 127/127 cartas, manifiesto 218,
0 violaciones de tokens). Lo que falta ya no es arte: es **vida**.

Ruta critica declarada, en orden:

1. `motion_and_feedback` (NOT_STARTED, bloqueante) — sistema de motion unico:
   transicion de entrada por superficie, hover/press consistentes, confirmaciones
   animadas en acciones economicas y de combate. Es la mayor brecha frente al genero.
2. `icon_language` (PARTIAL, bloqueante) — cerrar los restos Unicode en
   `NotFoundRoute`, `PvpRoute` y los motores de batalla.
3. `loading_and_empty_states` (PARTIAL) — estados vacios con arte de marca.
4. `asset_hygiene` (BLOCKED) — requiere autorizacion humana de listado/borrado en Storage.

Declaracion de Tier 1: cuando **todos** los criterios `blocking = true` esten en `MET`,
con evidencia de navegador sobre el deploy publico adjunta en `CONTINUITY.md`.

## Consulta rapida

```sql
select criterion_key, area, status, blocking, current_value, notes
from public.vexforge_visual_tier1_objective
where blocking and status <> 'MET'
order by sort_order;
```
