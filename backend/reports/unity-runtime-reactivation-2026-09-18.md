# VEXFORGE — UNITY RUNTIME REACTIVATION

## Implemented

- Unity project scaffold targeted at `6000.3.0f1`.
- Android identity `com.vexforge.android`, version `0.1.0`, versionCode `4`.
- Bootstrap scene, runtime environment, service registry, navigation and
  persistent non-sensitive runtime preferences.
- Supabase REST/RPC client with publishable key configuration only.
- Auth sign-in and explicit signed-out/error/loading states.
- GameState synchronization for profile, progress, cards, collection, deck,
  missions and wallet.
- Nexus development geometry and a scene shell with routes for Nexus, Archive,
  Forge, Arena, Missions, Treasury and Legado.
- Server-authoritative deck validation/save and battle resolve calls.
- Expo preserved without deletion or migration.

## Partially implemented

- Device-secure token persistence is implemented in
  `Assets/Scripts/Session/SecureSessionStore.cs` with Android Keystore and
  AES-GCM; Editor/device validation remains pending.
- Formation editing and battle event rendering need the exact live payload
  shapes and Unity Editor validation.
- Official art, audio, particles, camera choreography and tactile feedback
  need a later asset/presentation pass.

## Blocked

- No Unity Editor validation was possible in this environment.
- No APK, Android Player, Gradle, GameCI, Build Automation or GitHub build
  workflow was executed, by explicit instruction.
- Physical Android QA and license activation are pending.

## Next build gate

Open `unity/` with the declared Unity target, validate REST payload mapping
against authenticated development data, implement an Android Keystore-backed
session store, then review the official build mechanism before the first
compilation.