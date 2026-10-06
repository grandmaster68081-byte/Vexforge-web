---
name: GitHub workflow dispatch
description: Repository-specific behavior for dispatching the canonical GitHub Actions workflow.
---

For VEXFORGE, inspect the live GitHub Actions workflow list and workflow source on current `main` before dispatch. Do not reuse a numeric workflow ID merely because it appears in historical logs: an ID can survive a filename/name change and point to Expo rather than Unity. The Unity-only workflow is currently deferred and must be configured before a current Editor run can be dispatched.

**Why:** Repository history shows the former Unity workflow path was converted to Expo and later removed. Its last successful Unity-labeled run performed shader inventory on an earlier source revision; it did not build an Android package or validate the current Unity source.

**How to apply:** List current workflows, inspect the workflow file at the target revision, and confirm the run's operation/input before dispatch. Only use the active Unity-only workflow after it exists and the relevant validation or build is authorized.