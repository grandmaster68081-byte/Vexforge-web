# UNKNOWN AND BLOCKED

## Entry 1

ITEM: Supabase CLI-dependent schema dump, migration list and function source download
SOURCE: WORKSPACE_CURRENT
WHAT WAS CHECKED: `command -v supabase` and `supabase --version` path
WHAT WAS NOT AVAILABLE: Supabase CLI and linked project configuration
EXACT ERROR / OUTPUT: `SUPABASE_CLI_UNAVAILABLE`
STATUS: BLOCKED

## Entry 2

ITEM: Direct Supabase REST/Storage authentication with supplied service-role key
SOURCE: SUPABASE_LIVE
WHAT WAS CHECKED: read-only GET requests to PostgREST and Storage bucket endpoints
WHAT WAS NOT AVAILABLE: accepted REST authentication for that key
EXACT ERROR / OUTPUT: HTTP `401`
STATUS: BLOCKED

## Entry 3

ITEM: Official remote schema SQL dump
SOURCE: SUPABASE_LIVE
WHAT WAS CHECKED: CLI-dependent `supabase db dump --linked`
WHAT WAS NOT AVAILABLE: CLI/link state
EXACT ERROR / OUTPUT: `STATUS: BLOCKED` in `snapshots/continuity-20260919T062954Z/remote-schema.sql`
STATUS: BLOCKED

## Entry 4

ITEM: Edge Function source
SOURCE: SUPABASE_LIVE
WHAT WAS CHECKED: Management API function inventory and function detail metadata
WHAT WAS NOT AVAILABLE: source bundle download through available tooling/API path
EXACT ERROR / OUTPUT: source not present in the returned detail metadata; no source invented
STATUS: BLOCKED

## Entry 5

ITEM: Unity Editor, Android build and device verification
SOURCE: WORKSPACE_CURRENT
WHAT WAS CHECKED: source/configuration inventory only
WHAT WAS NOT AVAILABLE: Unity Editor, build output and physical device evidence
EXACT ERROR / OUTPUT: no build was started by this audit
STATUS: NOT VERIFIED

## Entry 6

ITEM: Legacy Expo card count and Unity card record count
SOURCE: LEGACY_EXPO / REPO_CURRENT
WHAT WAS CHECKED: prescribed file inventory and source searches
WHAT WAS NOT AVAILABLE: source-independent structured record count
EXACT ERROR / OUTPUT: no authoritative local structured count identified by the prescribed inventory
STATUS: UNKNOWN
