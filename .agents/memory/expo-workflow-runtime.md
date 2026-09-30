---
name: Expo workflow runtime
description: Replit workflow behavior for the Expo/Metro mobile runtime.
---

Expo/Metro should run as the sole `console` workflow without a `waitForPort` health check in this project. Metro can serve Expo Go and web while the workflow supervisor may incorrectly time out waiting for a conventional web preview.

**Why:** The Expo process starts correctly and exposes the QR/Metro endpoints, but the Replit webview port probe can kill it or leave it marked failed even when Metro is healthy.

**How to apply:** Keep the Expo workflow console-oriented, use a supported port such as `8000`, and validate with workflow state/logs plus Expo Doctor rather than requiring an HTTP readiness probe.