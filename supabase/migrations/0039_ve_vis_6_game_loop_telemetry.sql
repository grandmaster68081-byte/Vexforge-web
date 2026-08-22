-- VE-VIS-6-GAME-LOOP-TELEMETRY
-- Contrato observable del bucle de juego. Solo registra eventos de producto;
-- nunca decide combate, recompensas, economía ni ningún estado autoritativo.

create table if not exists public.vexforge_telemetry_event_catalog (
  event_key text primary key,
  loop_phase text not null,
  description text not null,
  display_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vexforge_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_key text not null references public.vexforge_telemetry_event_catalog(event_key),
  client_session_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.vexforge_telemetry_event_catalog (event_key, loop_phase, description, display_order)
values
  ('session_start', 'enter', 'Jugador autenticado entra en una sesión nueva.', 1),
  ('forge_action', 'forge', 'Jugador ejecuta una acción de forja o fusión.', 2),
  ('combat_resolved', 'combat', 'Una resolución de combate termina y se presenta el resultado.', 3),
  ('reward_claimed', 'collect', 'Jugador reclama una recompensa disponible.', 4),
  ('return_visit', 'return', 'Jugador autenticado vuelve después del umbral de retorno.', 5)
on conflict (event_key) do update set
  loop_phase = excluded.loop_phase,
  description = excluded.description,
  display_order = excluded.display_order;

create index if not exists idx_vexforge_telemetry_events_user
  on public.vexforge_telemetry_events (user_id);
create index if not exists idx_vexforge_telemetry_events_key
  on public.vexforge_telemetry_events (event_key);
create index if not exists idx_vexforge_telemetry_events_created
  on public.vexforge_telemetry_events (created_at desc);

alter table public.vexforge_telemetry_event_catalog enable row level security;
alter table public.vexforge_telemetry_events enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vexforge_telemetry_event_catalog'
  loop
    execute format(
      'drop policy if exists %I on public.vexforge_telemetry_event_catalog',
      policy_row.policyname
    );
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vexforge_telemetry_events'
  loop
    execute format(
      'drop policy if exists %I on public.vexforge_telemetry_events',
      policy_row.policyname
    );
  end loop;
end
$$;

create policy telemetry_catalog_select_public
  on public.vexforge_telemetry_event_catalog
  for select
  to anon, authenticated
  using (true);

create policy telemetry_events_insert_own
  on public.vexforge_telemetry_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy telemetry_events_select_own
  on public.vexforge_telemetry_events
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.vexforge_telemetry_event_catalog from public, anon, authenticated;
grant select on table public.vexforge_telemetry_event_catalog to anon, authenticated;
grant all on table public.vexforge_telemetry_event_catalog to service_role;

revoke all on table public.vexforge_telemetry_events from public, anon, authenticated;
grant select, insert on table public.vexforge_telemetry_events to authenticated;
grant all on table public.vexforge_telemetry_events to service_role;

-- Keep the already-live five-column result shape stable for existing probes.
create or replace function public.vexforge_telemetry_coverage()
returns table(
  event_key text,
  loop_phase text,
  display_order integer,
  event_count bigint,
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    c.event_key,
    c.loop_phase,
    c.display_order,
    count(e.id)::bigint as event_count,
    max(e.created_at) as last_seen_at
  from public.vexforge_telemetry_event_catalog c
  left join public.vexforge_telemetry_events e
    on e.event_key = c.event_key
  group by c.event_key, c.loop_phase, c.display_order
  order by c.display_order;
$$;

revoke all on function public.vexforge_telemetry_coverage() from public;
grant execute on function public.vexforge_telemetry_coverage() to anon, authenticated, service_role;

comment on table public.vexforge_telemetry_event_catalog is
  'VE-VIS-6: catálogo público y ordenado de los cinco eventos observables del bucle de juego.';
comment on column public.vexforge_telemetry_event_catalog.event_key is
  'Clave estable del evento canónico; no contiene datos del jugador.';
comment on column public.vexforge_telemetry_event_catalog.loop_phase is
  'Fase del bucle de juego asociada al evento.';
comment on column public.vexforge_telemetry_event_catalog.description is
  'Descripción funcional del evento para lectura del contrato.';
comment on column public.vexforge_telemetry_event_catalog.display_order is
  'Orden canónico de la fase dentro del bucle.';
comment on column public.vexforge_telemetry_event_catalog.created_at is
  'Momento de inscripción del evento en el catálogo.';

comment on table public.vexforge_telemetry_events is
  'VE-VIS-6: eventos de producto emitidos por jugadores autenticados; aislados por auth.uid() y no autoritativos.';
comment on column public.vexforge_telemetry_events.id is
  'Identificador técnico único de la emisión.';
comment on column public.vexforge_telemetry_events.user_id is
  'Jugador autenticado propietario de la emisión; se completa con auth.uid().';
comment on column public.vexforge_telemetry_events.event_key is
  'Clave del evento, limitada al catálogo canónico.';
comment on column public.vexforge_telemetry_events.client_session_id is
  'Identificador efímero de sesión por pestaña, sin identidad personal.';
comment on column public.vexforge_telemetry_events.payload is
  'Metadatos mínimos del evento, sin credenciales ni datos personales.';
comment on column public.vexforge_telemetry_events.created_at is
  'Momento en que Supabase recibió la emisión.';

comment on function public.vexforge_telemetry_coverage() is
  'VE-VIS-6: cobertura agregada por evento canónico; no devuelve filas de jugador ni user_id.';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, adopted_in_chat, status, official_payload
)
values (
  'VE-VIS-6-GAME-LOOP-TELEMETRY',
  'product',
  'Telemetría observable del bucle de juego',
  'El bucle de VEXFORGE se mide con cinco eventos canónicos persistidos por jugador autenticado. La telemetría observa el producto, pero no es fuente de verdad de combate, recompensas, economía ni autenticación.',
  0,
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-6-GAME-LOOP-TELEMETRY',
    'criterion_key', 'game_loop_telemetry',
    'events', jsonb_build_array(
      'session_start', 'forge_action', 'combat_resolved', 'reward_claimed', 'return_visit'
    ),
    'coverage_function', 'public.vexforge_telemetry_coverage()',
    'evidence', jsonb_build_array(
      'npm run typecheck',
      'npm run verify:telemetry',
      'npm run verify:build'
    ),
    'met_requires_live_coverage', true,
    'authoritative_logic_unchanged', true,
    'reopen_when', 'Se añade o retira un evento del bucle, una superficie deja de emitir, la cobertura viva de una clave cae a 0, o la RLS deja de aislar por auth.uid().'
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();