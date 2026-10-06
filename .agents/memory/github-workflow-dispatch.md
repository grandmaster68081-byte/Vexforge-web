---
name: GitHub workflow dispatch
description: Repository-specific behavior for dispatching the canonical GitHub Actions workflow.
---

For VEXFORGE, inspect the live GitHub Actions workflow list and workflow source on current `main` before dispatch. Do not reuse a numeric workflow ID merely because it appears in historical logs: an ID can survive a filename/name change and refer to an obsolete workflow. The Unity workflow is manual; do not dispatch it without explicit authorization.

**Why:** Repository history contains workflow-name and runtime changes; an old run may not validate current Unity source or produce a valid Android package.

**How to apply:** List current workflows, inspect the workflow file at the target revision, and confirm the run's operation/input before dispatch. Only use the current Unity workflow after the relevant validation or build is authorized.