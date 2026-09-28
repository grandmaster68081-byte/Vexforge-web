---
name: KIVORA visual overrides
description: How to preserve the KIVORA 5.2.1 identity layer while working around the legacy stylesheet.
---

KIVORA scene-identity corrections should live in a dedicated override stylesheet loaded after the legacy styles.

**Why:** The existing visual stylesheet is compressed into long legacy rules, while the scene assets need iterative tuning without risking unrelated product surfaces or making fragile partial replacements.

**How to apply:** Keep real environment assets as the source of truth for scene composition, put only KIVORA-specific visual corrections in the override layer, and leave auth, wallet, ledger, settlement, and provider behavior unchanged.