---
name: GitHub workflow dispatch
description: Repository-specific behavior for dispatching the canonical GitHub Actions workflow.
---

For VEXFORGE, dispatch the canonical Unity workflow through the numeric GitHub Actions workflow ID observed from the repository API when filename-based dispatch returns HTTP 404. The same authenticated API access can still read the workflow by ID and list runs.

**Why:** The repository accepted authenticated API reads and a valid workflow filename, but the filename dispatch endpoint returned 404; the numeric workflow endpoint accepted the dispatch.

**How to apply:** Resolve the active workflow ID from the canonical run or workflow list, preserve the canonical workflow path and inputs, and never create a parallel workflow to work around dispatch routing.