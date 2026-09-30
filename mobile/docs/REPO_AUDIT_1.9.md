# VEXFORGE 1.9 — Public Repository / Runtime Audit

## Public repository baseline

Repository: https://github.com/grandmaster68081-byte/Vexforge-web
Branch inspected: `main`

The public repository currently identifies the web portal as V5.6 Art-Directed Final and contains separate `mobile`, `supabase`, `contracts`, `backend`, `unity`, `src`, `public` and other surfaces.

The public `mobile/package.json` is version `1.0.0`, while `mobile/app.json` is `1.0.1` with Android versionCode `4`. The current mobile package does not expose the full 1.8/1.9 runtime dependency and source surface.

## Canonical integration decision

The 1.9 package therefore replaces the target `mobile/` runtime as a coherent unit. It must not be assembled by merging arbitrary files from the old mobile directory.

The following remain external authorities:

- Supabase database/RPCs/RLS.
- Supabase `vexforge-updates` update service.
- Official VEXFORGE card artwork/content records.
- Root portal/web surface.
- Existing external build/account configuration.

## Supabase update service verified in public main

`supabase/functions/vexforge-updates/index.ts`:

- accepts GET/OPTIONS;
- reads Expo platform/runtime/channel headers;
- allows `development`, `internal`, `closed`, `production`;
- queries `vexforge_android_release_registry` for `OTA_UPDATE` and matching runtime/channel;
- requires the manifest to originate from the public `vexforge-updates` storage bucket;
- returns `application/expo+json` with Expo protocol version 1.

1.9 aligns EAS profiles to those accepted channels.

## Known boundary

The repository provides raid join/contribution RPCs but no verified public authoritative boss-damage/reward resolver was established during this audit. The mobile runtime therefore does not fabricate a production economic boss resolver.

## Build proof status

Static source/asset audits pass in the supplied package. Dependency installation and native compilation were not possible in this analysis environment because the npm registry was unavailable. Those gates remain mandatory in Replit/EAS before calling an Android build production-ready.
