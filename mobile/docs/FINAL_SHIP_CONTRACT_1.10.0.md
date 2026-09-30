# VEXFORGE 1.10.0 — Final Ship Contract

## Client is presentation + intent

The mobile runtime may:

- collect player intent;
- display canonical card/world content;
- play the event timeline returned by Supabase;
- provide deterministic replay controls;
- render cinematics, VFX, audio and haptics;
- cache/read-only prefetch content.

The mobile runtime may NOT:

- decide competitive outcomes;
- calculate or settle economy;
- invent pack odds;
- award rewards locally;
- increment raid contribution directly;
- bypass ownership/RLS;
- substitute a local engine for an authoritative production Battle Run.

## Raid/Boss gate

The previous `vexforge_contribute_raid` direct contribution path is deliberately blocked in 1.10. A production raid requires:

`Join → Battle Run v6 → validated contribution → shared progress → settlement`

Until a verified backend contract exists for that sequence, the client refuses direct contribution rather than creating a false-success path.

Boss presentation remains available as a visual theatre; boss damage/reward settlement remains server-authoritative.

## Tutorial theatre

The local tactical theatre is explicitly non-authoritative and non-settling. It exists to teach timing, target selection and visual vocabulary. It does not produce competitive or economic state.

## Social

Social mutations are now client-gated against duplicate concurrent taps. Social reads refresh conservatively while the social surface is active; the client does not invent a Realtime channel/table contract absent from the verified package.

## Release validation boundary

Static audits are executable here. Full TypeScript resolution, EAS/Gradle and authenticated Supabase smoke tests must execute in the target build environment with network and credentials.
