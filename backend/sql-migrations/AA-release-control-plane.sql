-- VEXFORGE — Android release control plane
-- Idempotent migration. Secrets and signing material never belong in this schema.

create table if not exists public.vexforge_android_release_registry (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  section_scope text not null,
  delivery_type text not null,
  runtime_version text not null,
  app_version text not null,
  version_code integer,
  channel text not null,
  source_commit text not null,
  supabase_schema_or_rpc_impact text not null default 'NONE',
  asset_manifest jsonb not null default '[]'::jsonb,
  manifest_url text,
  bundle_url text,
  artifact_url text,
  bundle_or_aab_digest text not null,
  minimum_app_version text not null,
  rollout_percent numeric(5,2) not null default 100.00,
  rollback_target_id uuid references public.vexforge_android_release_registry(id),
  validation jsonb not null default '{}'::jsonb,
  known_limitations text,
  status text not null default 'DRAFT',
  responsible text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint vexforge_android_release_delivery_type_ck
    check (delivery_type in ('OTA_UPDATE', 'NATIVE_PLAY_RELEASE')),
  constraint vexforge_android_release_channel_ck
    check (channel in ('development', 'internal', 'closed', 'production')),
  constraint vexforge_android_release_status_ck
    check (status in ('DRAFT', 'VALIDATED', 'PUBLISHED', 'ROLLED_BACK', 'BLOCKED')),
  constraint vexforge_android_release_version_code_ck
    check (version_code is null or version_code > 0),
  constraint vexforge_android_release_rollout_ck
    check (rollout_percent > 0 and rollout_percent <= 100),
  constraint vexforge_android_release_native_version_ck
    check (delivery_type = 'OTA_UPDATE' or version_code is not null),
  constraint vexforge_android_release_ota_manifest_ck
    check (delivery_type = 'NATIVE_PLAY_RELEASE' or manifest_url is not null),
  constraint vexforge_android_release_digest_ck
    check (bundle_or_aab_digest ~ '^[A-Fa-f0-9]{64}$'),
  constraint vexforge_android_release_unique_source
    unique (section_id, channel, delivery_type, source_commit)
);

create index if not exists vexforge_android_release_lookup_idx
  on public.vexforge_android_release_registry (channel, runtime_version, status, created_at desc);

create index if not exists vexforge_android_release_section_idx
  on public.vexforge_android_release_registry (section_id, created_at desc);

comment on table public.vexforge_android_release_registry is
  'Authoritative VEXFORGE Android release metadata. Service role writes; clients may read published metadata only.';
comment on column public.vexforge_android_release_registry.delivery_type is
  'OTA_UPDATE for runtime-compatible JS/assets or NATIVE_PLAY_RELEASE for a new signed Play AAB.';
comment on column public.vexforge_android_release_registry.bundle_or_aab_digest is
  'SHA-256 digest of the published OTA bundle/manifest or AAB; never a secret.';
comment on column public.vexforge_android_release_registry.rollback_target_id is
  'Previously validated release to restore if the new release fails compatibility or startup checks.';

alter table public.vexforge_android_release_registry enable row level security;

-- Published metadata is safe to read for update discovery. There are deliberately
-- no client INSERT/UPDATE/DELETE policies; service_role or a controlled server job
-- must be used to change a release or production channel.
drop policy if exists vexforge_android_release_public_read on public.vexforge_android_release_registry;
create policy vexforge_android_release_public_read
  on public.vexforge_android_release_registry
  for select
  to anon, authenticated
  using (status = 'PUBLISHED');

-- Keep timestamps consistent with the existing project convention without adding
-- a new trigger that could affect unrelated tables.
create or replace function public.vexforge_touch_android_release_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

revoke all on function public.vexforge_touch_android_release_updated_at() from public;

drop trigger if exists vexforge_android_release_touch_updated_at
  on public.vexforge_android_release_registry;
create trigger vexforge_android_release_touch_updated_at
  before update on public.vexforge_android_release_registry
  for each row execute function public.vexforge_touch_android_release_updated_at();

revoke all on public.vexforge_android_release_registry from anon, authenticated;
grant select on public.vexforge_android_release_registry to anon, authenticated;
