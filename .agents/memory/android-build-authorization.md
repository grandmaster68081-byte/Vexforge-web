---
name: Android build authorization
description: User authorization boundary for VEXFORGE APK/AAB compilations.
---

Do not compile a VEXFORGE APK or AAB without the user's explicit authorization for that compilation.

**Why:** The user explicitly set this restriction to avoid unauthorized Android builds.

**How to apply:** Treat each APK/AAB compilation as opt-in. An explicit request to build one artifact authorizes only that build, not future builds.