-- VEXFORGE web retirement audit — NON-DESTRUCTIVE.
-- Run this in Supabase SQL Editor or psql before dropping anything.
-- The purpose is to identify objects whose names suggest historical web-only usage.
-- DO NOT execute DROP statements based on this report alone.

select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and (
    table_name ilike '%shop%'
    or table_name ilike '%order%'
    or table_name ilike '%withdraw%'
    or table_name ilike '%deposit%'
    or table_name ilike '%referral%'
    or table_name ilike '%clan%'
    or table_name ilike '%friend%'
    or table_name ilike '%nft%'
  )
order by table_name;

select routine_schema, routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and (
    routine_name ilike '%shop%'
    or routine_name ilike '%order%'
    or routine_name ilike '%withdraw%'
    or routine_name ilike '%deposit%'
    or routine_name ilike '%referral%'
    or routine_name ilike '%admin%'
    or routine_name ilike '%nft%'
  )
order by routine_name;

select table_schema, table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    column_name ilike '%wallet%'
    or column_name ilike '%tx_hash%'
    or column_name ilike '%payment%'
  )
order by table_name, column_name;
