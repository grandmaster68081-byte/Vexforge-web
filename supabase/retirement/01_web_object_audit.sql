-- Non-destructive inventory only. Run in Supabase SQL editor before retiring old web objects.
-- Do not execute DROP statements from an automated deployment.
select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    lower(p.proname) like '%shop%'
    or lower(p.proname) like '%deposit%'
    or lower(p.proname) like '%withdraw%'
    or lower(p.proname) like '%admin%'
    or lower(p.proname) like '%nft%'
  )
order by 1,2;

select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and (
    lower(tablename) like '%shop%'
    or lower(tablename) like '%order%'
    or lower(tablename) like '%deposit%'
    or lower(tablename) like '%withdraw%'
    or lower(tablename) like '%nft%'
  )
order by 1,2;
