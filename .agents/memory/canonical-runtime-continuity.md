---
name: VEXFORGE visual runtime and build budget
description: Current recommendation for premium Android visuals under free-tools and six-hour CI constraints.
---

The owner delegated choosing the best 2026 visual route under Android, $0 asset/plugin spend, and a strict six-hour GitHub Actions job cap. The repository already contains an Android Unity project, URP, event-driven battle presentation, visual-quality profiles, a six-hour Unity workflow and shader-variant sharding. The current recommendation is to keep Unity 6.3.0f1 + URP 17.3.0, improve production art/presentation, use only free Fab content with verified compatible licenses, and not migrate the game runtime to Unreal. This supersedes the prior Expo-only note for visual production; Expo remains preserved as legacy.

**Why:** the current battlefield presentation is event-aware but constructs key arena elements from primitives/fallbacks, while the production `normal/final` workflow is unbounded and the inventory is about 287k variants. Epic's UE 5.8 mobile reference lists Nanite and Lumen GI/reflections as unsupported in its mobile feature table, and the Android/Vulkan desktop renderer as experimental. A UE runtime port adds client and CI work without fitting the hard mobile/build constraint better.

**How to apply:** read `VEXFORGE_CONTEXT.md`, `docs/vexforge-canonical/00_START_HERE.md`, and `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md`. Preserve backend/gameplay contracts; begin with variant preflight/stripping, then one polished event-driven battlefield and reusable art/animation kits. Never dispatch unbounded `normal/final`, use paid/UE-only assets in Unity, copy protected card art, or change Supabase as part of visual work.
