-- VE-DOC-3-DOC-COVERAGE-PROBE
-- Sonda publica de cobertura documental del catalogo publico.
-- Sin cambios de esquema de negocio, RLS, economia autoritativa, Storage ni arte.
-- Permite que un verificador (scripts/verify-table-docs.mjs) falle cuando aparezca
-- una tabla publica sin `comment on table`, cerrando la condicion de reapertura
-- declarada en VE-DOC-2-CATALOG-COMMENTS.

create or replace function public.vexforge_doc_coverage()
returns table(total_tables integer, undocumented integer, missing text[])
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with t as (
    select c.oid, c.relname, obj_description(c.oid) as cmt
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  )
  select
    count(*)::integer,
    count(*) filter (where cmt is null)::integer,
    coalesce(array_agg(relname order by relname) filter (where cmt is null), '{}'::text[])
  from t;
$$;

comment on function public.vexforge_doc_coverage() is
  'VE-DOC-3: cobertura documental del catalogo publico (total, sin comentario y nombres faltantes). Solo metadatos, sin datos de jugador.';

revoke all on function public.vexforge_doc_coverage() from public;
grant execute on function public.vexforge_doc_coverage() to anon, authenticated, service_role;
