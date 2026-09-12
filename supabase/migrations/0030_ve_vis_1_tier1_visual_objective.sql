-- VE-VIS-1 — Objetivo visual Tier 1 trazado en la fuente autoritativa.
-- Solo metadatos de gobierno: sin cambios de esquema de juego, economia, RLS de datos
-- de jugador, Storage ni arte. Define, mide y versiona el objetivo final del protocolo:
-- alcanzar calidad visual Tier 1 para el genero (RPG de forja / gacha competitivo).

create table if not exists public.vexforge_visual_tier1_objective (
  id uuid primary key default gen_random_uuid(),
  criterion_key text not null unique,
  area text not null,
  objective text not null,
  measure_source text not null,
  target_value text not null,
  current_value text not null,
  status text not null check (status in ('MET', 'PARTIAL', 'NOT_STARTED', 'BLOCKED')),
  blocking boolean not null default false,
  sort_order integer not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

grant select on public.vexforge_visual_tier1_objective to anon;
grant select on public.vexforge_visual_tier1_objective to authenticated;
grant all on public.vexforge_visual_tier1_objective to service_role;

alter table public.vexforge_visual_tier1_objective enable row level security;

drop policy if exists "public_read_visual_tier1_objective" on public.vexforge_visual_tier1_objective;
create policy "public_read_visual_tier1_objective"
  on public.vexforge_visual_tier1_objective
  for select
  to anon, authenticated
  using (true);

comment on table public.vexforge_visual_tier1_objective is
  'VE-VIS-1: criterios medibles del objetivo final del protocolo (calidad visual Tier 1 del genero). Solo lectura publica; se actualiza por migracion con evidencia real de verify:all o del deploy vivo.';
comment on column public.vexforge_visual_tier1_objective.id is 'uuid. Clave primaria. Obligatoria. Por defecto gen_random_uuid().';
comment on column public.vexforge_visual_tier1_objective.criterion_key is 'text. Clave estable del criterio visual. Obligatoria y unica.';
comment on column public.vexforge_visual_tier1_objective.area is 'text. Area del criterio: arte, identidad, layout, motion, rendimiento o higiene.';
comment on column public.vexforge_visual_tier1_objective.objective is 'text. Enunciado del objetivo Tier 1 para ese criterio.';
comment on column public.vexforge_visual_tier1_objective.measure_source is 'text. Fuente de medicion verificable (script de verify:all, catalogo vivo o evidencia de navegador).';
comment on column public.vexforge_visual_tier1_objective.target_value is 'text. Valor objetivo declarado para considerar el criterio cumplido.';
comment on column public.vexforge_visual_tier1_objective.current_value is 'text. Ultimo valor medido con evidencia real.';
comment on column public.vexforge_visual_tier1_objective.status is 'text. MET, PARTIAL, NOT_STARTED o BLOCKED segun la ultima medicion.';
comment on column public.vexforge_visual_tier1_objective.blocking is 'boolean. Verdadero si el criterio bloquea la declaracion de Tier 1. Obligatoria. Por defecto false.';
comment on column public.vexforge_visual_tier1_objective.sort_order is 'integer. Orden de presentacion del criterio. Obligatoria. Por defecto 0.';
comment on column public.vexforge_visual_tier1_objective.notes is 'text. Nota de contexto o deuda asociada al criterio.';
comment on column public.vexforge_visual_tier1_objective.updated_at is 'timestamptz. Momento de la ultima medicion registrada. Obligatoria. Por defecto now().';

insert into public.vexforge_visual_tier1_objective
  (criterion_key, area, objective, measure_source, target_value, current_value, status, blocking, sort_order, notes)
values
  ('surface_backgrounds', 'arte',
   'Toda superficie navegable renderiza un fondo canonico coherente con la direccion pictorica (forja gotica, azul profundo / naranja fundido).',
   'scripts/verify-surface-art.mjs + evidencia de navegador sobre el deploy',
   'todas las superficies con fondo canonico', 'cobertura completa segun verify:all verde', 'MET', true, 10,
   'Cerrado por VE-4 y VE-6 (incluida la ruta /leaderboard).'),
  ('boss_art', 'arte',
   'Cada jefe mundial tiene arte canonico propio, sin reutilizacion generica.',
   'scripts/verify-boss-art.mjs', '15/15 jefes con arte canonico', '15/15 verificados, 15 variantes en reserva', 'MET', true, 20,
   null),
  ('card_art', 'arte',
   'Cada carta jugable tiene arte propio y consistente de rareza.',
   'scripts/verify-card-art.mjs', 'cobertura total del catalogo de cartas', 'verificado en verify:all', 'MET', true, 30,
   null),
  ('asset_manifest_integrity', 'arte',
   'Todo asset consumido esta registrado en el manifiesto oficial y resuelve 200 en el bucket.',
   'scripts/verify-manifest.mjs + scripts/verify-assets.mjs', 'manifest 218 / assets 21/21', 'manifest 218 / assets 21/21', 'MET', true, 40,
   null),
  ('ui_identity_tokens', 'identidad',
   'Sin colores crudos ni tipografias fuera del sistema: color, radio, sombra y tipografia salen de tokens semanticos.',
   'scripts/verify-ui-identity.mjs', '0 violaciones', '0 violaciones', 'MET', true, 50,
   'Reforzado por VE-1-EYEBROW-SEPARATOR-ICON-LANGUAGE y VE-15.'),
  ('icon_language', 'identidad',
   'Lenguaje de iconos unico y vectorial en breadcrumbs, estados y encabezados; sin caracteres de dibujo de caja.',
   'scripts/verify-ui-identity.mjs + docs/VE-15-ICON-LANGUAGE-CONSUMER-CLOSURE.md', 'consumidores 100% migrados', 'consumidores de UI migrados; restos Unicode en motores de batalla', 'PARTIAL', true, 60,
   'Deuda viva: limpieza Unicode en NotFoundRoute/PvpRoute y motores de batalla.'),
  ('mobile_layout', 'layout',
   'Ninguna superficie desborda el documento en 390x844; tablas densas con scroll contenido.',
   'evidencia Playwright sobre el deploy vivo (viewport 390x844)', '0 superficies con overflow de documento', 'leaderboard y grids auditados sin overflow', 'MET', false, 70,
   'Cerrado por VE-1-LEADERBOARD-MOBILE-TABLE y auditoria global de grids.'),
  ('motion_and_feedback', 'motion',
   'Feedback de estado Tier 1: transiciones de entrada por superficie, estados hover/press y confirmaciones animadas coherentes.',
   'evidencia de navegador + inventario de componentes', 'sistema de motion unico documentado y aplicado', 'sin sistema de motion declarado', 'NOT_STARTED', true, 80,
   'Principal brecha restante frente a Tier 1: la superficie es estatica.'),
  ('loading_and_empty_states', 'layout',
   'Todo estado de carga y vacio es explicito y con arte de marca; ningun loader eterno.',
   'QA autenticada sobre el deploy (32 rutas)', '0 loaders eternos y estados vacios con identidad', 'loaders eternos corregidos (/deposit); estados vacios sin arte de marca', 'PARTIAL', false, 90,
   'Cerrado parcialmente por VE-QA-1.'),
  ('asset_hygiene', 'higiene',
   'El bucket no contiene artes duplicados ni variantes huerfanas fuera del manifiesto.',
   'listado del bucket vexforge-assets', '0 duplicados', 'duplicados bosses/BOSS_*.jpg vs bosses/boss_*.jpg', 'BLOCKED', false, 100,
   'Requiere autorizacion humana de listado y borrado en Storage.')
on conflict (criterion_key) do update set
  area = excluded.area,
  objective = excluded.objective,
  measure_source = excluded.measure_source,
  target_value = excluded.target_value,
  current_value = excluded.current_value,
  status = excluded.status,
  blocking = excluded.blocking,
  sort_order = excluded.sort_order,
  notes = excluded.notes,
  updated_at = now();
