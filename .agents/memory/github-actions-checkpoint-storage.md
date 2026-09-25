---
name: GitHub Actions checkpoint storage
description: Storage and cleanup rules for the progressive Unity shader checkpoint chain.
---

GitHub Actions artifacts live outside the Git repository, but large Unity checkpoints still consume repository Actions storage. A shard checkpoint can be around a gigabyte, and broad evidence globs can accidentally upload both the restored input and the newly created output.

**Why:** Keeping every chain link or duplicating temporary payload directories makes a multi-shard build grow by many gigabytes even though only the current chain head is needed for the next shard.

**How to apply:** Exclude `checkpoint-download`, `checkpoint-upload`, and other restored temporary payload directories from evidence artifacts. Keep a bounded retention period, and after a successful successor checkpoint (or successful final build), delete only the consumed predecessor through the repository-scoped Actions artifact API. A failed shard must leave its predecessor intact for retry. The artifact response may omit `workflow_run.repository.full_name`; validate the artifact name and use the repository-scoped endpoint instead.