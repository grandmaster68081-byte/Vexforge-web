---
name: Git LFS attachment recovery
description: Recovering large user-uploaded packages after a working-tree path disappears.
---

Large uploaded ZIPs in this workspace can remain in Git history only as LFS pointers after the current branch switches to another tree. Locate the pointer with `git rev-list --objects --all`, read its declared SHA-256 and size, then match the payload under `.git/lfs/objects/<aa>/<bb>/<oid>`. Verify both size and SHA before extracting outside the repository. Preserve the original archive in the remote branch before continuing if it is needed across sessions.

**Why:** The attachment path disappeared during branch alignment, but its exact LFS payload remained recoverable and allowed work to continue without another upload.

**How to apply:** Before changing branches, protect uploaded inputs. If a large ZIP disappears, recover only the matching LFS object; never substitute a similarly named release archive.