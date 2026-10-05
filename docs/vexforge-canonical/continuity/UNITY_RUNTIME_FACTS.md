> HISTORICAL SNAPSHOT: This file records evidence collected before Hito 10.
> The Expo workflow mentioned below was removed at commit `77d31b5d`; there is
> no current Android build workflow. See `28_UNITY_EXPO_MIGRATION_GATES.md`.

# UNITY RUNTIME FACTS

- `REPO_CURRENT` Unity editor version: `6000.3.0f1`.
- `REPO_CURRENT` Android identifier: `com.vexforge.android`.
- `REPO_CURRENT` bundle version: `0.1.0`.
- `REPO_CURRENT` Android bundle version code: `4`.
- `REPO_CURRENT` Android minimum SDK: `26`.
- `REPO_CURRENT` Android target SDK: `35`.
- `REPO_CURRENT` Android scripting backend: `1` in ProjectSettings.
- `REPO_CURRENT` active input handler: `2`.
- `REPO_CURRENT` graphics and selected ProjectSettings evidence: `snapshots/continuity-20260919T062954Z/unity-project-settings-selected`.
- `HISTORICAL_SNAPSHOT` the path `.github/workflows/vexforge-unity-android-github.yml` was previously described as the Unity workflow; inspection found that it built Expo and it was later removed.
- `HISTORICAL_SNAPSHOT` operation modes recorded for that removed workflow: `normal`, `diagnostic`, `baseline`, `inventory`, `shard`, `final`.
- `REPO_CURRENT` Android compilation gate: confirmed optimized shader variants must be greater than `0` and strictly below `35000`.
- `REPO_CURRENT` historical inventory run 34: Unity `6000.3.0f1`, Android, `285367` observed variants and `285279` unique fingerprints; inventory APK only, not a release APK.
- `REPO_CURRENT` diagnostic run 37: cancelled before valid evidence was produced.
- `UNKNOWN` current optimized variant count: must be measured by a new canonical `inventory` run; the historical run 34 count is not reused.
- `UNKNOWN` device verification: no physical device evidence exists.
