---
name: Android build environment
description: Durable constraints for reproducing VEXFORGE Android builds in this workspace.
---

The mobile dependency install is reliable only when npm is explicitly pointed at the public registry; the workspace firewall can return a misleading 404 for a transitive package. The GitHub Android workflow should keep using the committed manifest, public registry, retries, and no generated lockfile. Local Expo prebuild can validate native project generation, but APK compilation belongs in the Java/Android-enabled CI runner.

**Why:** the Replit workspace does not provide the Java/Android toolchain used by the release build, and the internal npm configuration is not stable for the mobile dependency graph.

**How to apply:** run mobile typechecks and guards locally; use the official GitHub Android workflow for the release APK and its bundle/package/version/digest gates.