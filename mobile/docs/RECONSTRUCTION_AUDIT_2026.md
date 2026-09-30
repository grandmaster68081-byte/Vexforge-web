# VEXFORGE · Reconstruction audit record

Source Unity commit: `d9555e2d3e46599c126410b6d786fc0818b4826a`
Unity version: `6000.3.0f1`
Rules label: `forge_formation_v6`
Android package: `com.vexforge.android`

The Unity export contains the presentation runtime, data contracts, asset resolver/cache strategy, world composition, and client repository. Authoritative combat/economy rule bodies are server-side in Supabase and are not duplicated locally.

The new Expo runtime implements the client around those contracts while keeping settlement and outcomes server-authoritative.
