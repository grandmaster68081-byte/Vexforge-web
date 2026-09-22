# VEXFORGE — Sequential shader cache experiment

Status: EXPERIMENTAL — not a production build path

## Purpose

This experiment warms deterministic partitions of Unity shader variants one at a
time, keeps the same Unity project workspace and `Library` continuity during
the run, and performs one unfiltered Android build at the end.

The intermediate shard builds are not release APKs. They exist only to give
Unity an opportunity to populate compatible shader compilation results.

## Safety rules

- Use the existing Unity project, organization, Build Automation target, and
  GitHub repository. Do not create replacements.
- Use the Unity version declared in `unity/ProjectSettings/ProjectVersion.txt`.
- Keep the same commit, package lock, Android target, scripting backend, and
  graphics configuration for every shard.
- Never merge `Library` directories from concurrent Unity processes.
- The shard preprocessor is disabled unless
  `VEXFORGE_SHADER_SHARD_MODE=warm` is explicitly set.
- The final build calls `BuildAndroid` without shard filtering.
- A shard checkpoint is evidence and metrics, not proof that a percentage of
  the complete application is finished.
- A successful experiment requires a real APK and the uploaded checkpoint
  summaries. Static source inspection is not build evidence.

## Execution model

The GitHub workflow intentionally uses one sequential job rather than a
parallel matrix. This keeps one Unity `Library` chain and avoids concurrent
writes. Each iteration:

1. Assigns a stable shard index using `VEXFORGE_SHADER_SHARD_INDEX` and
   `VEXFORGE_SHADER_SHARD_COUNT`.
2. Uses a SHA-256 assignment of shader name, pass, shader type, pass type, and
   enabled keywords to select that shard.
3. Runs a temporary Android build with only the selected variants retained by
   `IPreprocessShaders`.
4. Writes a JSON summary and cache-size checkpoint.
5. Continues with the same workspace for the next shard.

The final iteration runs the normal unfiltered Android build. It does not use
`BuildOptions.CleanBuild`, because the experiment is specifically measuring
whether compatible incremental cache results survive into the final build.

## Interpretation

The selected and removed variant counts are instrumentation, not a percentage
of the application. Unity shader caches are keyed by source and build
configuration; they are invalidated when relevant inputs change. Unity also
warns that modifying internal `Library` contents outside the Editor can cause
unexpected results, so this experiment keeps the cache in one sequential
workspace and treats the result as experimental.

If the final build still spends the same time compiling shaders, or fails in
IL2CPP, Gradle, asset import, memory, or another phase, this experiment has not
solved the actual bottleneck. The uploaded Editor logs must be used to classify
that result before changing the workflow again.

## Source references

- Unity shader compilation:
  https://docs.unity3d.com/6000.0/Documentation/Manual/shader-compilation.html
- Unity clean builds:
  https://docs.unity3d.com/6000.4/Documentation/Manual/build-clean-build.html
- Unity cache location:
  https://docs.unity3d.com/6000.0/Documentation/Manual/build-cache-location-reference.html
- Unity shader preprocessing API:
  https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Build.IPreprocessShaders.OnProcessShader.html