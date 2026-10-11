---
name: GitHub Actions checkpoint storage
description: Storage and cleanup rules for the progressive Unity shader checkpoint chain.
---

GitHub Actions artifacts and dependency caches use separate storage allowances. Public repositories get free standard-runner minutes, but that does not make large artifacts free: GitHub Free includes 500 MB of artifact storage and 10 GB of Actions cache per repository. Unity checkpoints can be multiple gigabytes, and unused cache entries expire after seven days.

**Why:** Keeping every chain link or duplicating temporary payload directories makes a multi-shard build grow by many gigabytes even though only the current chain head is needed for the next shard.

**How to apply:** Measure both artifact and cache usage before choosing a transport; do not assume a public repository's free runner minutes cover storage. Keep the live shader-chain head only, exclude `checkpoint-download`, `checkpoint-upload`, and other restored temporary payload directories from evidence artifacts, and use bounded retention. After a successful successor checkpoint (or final build), delete only the consumed predecessor through the repository-scoped Actions artifact API; a failed shard must leave its predecessor intact. The artifact response may omit `workflow_run.repository.full_name`; validate its name and use the repository-scoped endpoint.

When migrating a Unity project's repository path, preserve the old `actions/cache` path and key prefix for one-time restoration, then move the restored directory to the new project path. A legacy key prefix alone is insufficient because cache compatibility also depends on the saved path.

**Why:** The Bootstrap project moved from `unity-bootstrap/` to `unity/`; keeping the old path on the restore step is what makes its existing Library cache version compatible.

**How to apply:** For future Unity project-root renames, restore the cache with the original path, relocate it before opening the Editor, and save subsequent successful builds under the new path.