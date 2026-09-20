# Social Alpha — Supabase Migration Runbook v1.2

## Precondition

Repository must be exactly at the published Stage 08 checkpoint.

Verify the intended Supabase project reference:

`rscuzqnfccqvltkdcdny`

## Migration

File:

`supabase/migrations/20260920010000_vexforge_social_alpha.sql`

## Commands

```bash
supabase migration list
supabase db push --dry-run
```

Inspect the pending migration list before applying.

Then:

```bash
supabase db push
supabase migration list
```

Confirm the social migration appears applied.

## Do not

- run `supabase db reset --linked`;
- mutate the schema through Dashboard SQL;
- repair migration history by guesswork;
- print database passwords, service-role keys, secret keys or access tokens;
- bypass the migration file with direct production edits.

## Runtime transport

The Alpha uses the existing authenticated Unity HTTP/RPC transport.

Realtime is intentionally deferred. Supabase's current Realtime documentation recommends private Broadcast channels for scalable, secure real-time delivery; that can be added later without changing the social data authority contract.
