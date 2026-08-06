---
name: External deployment boundary
description: Distinguishes this workspace's Replit deployment metadata from the project's separate Cloudflare Pages deployment.
---

The VEXFORGE repository can be pushed successfully while its Cloudflare Pages site still serves an older bundle; Replit's deployment metadata is not evidence about that external site.

**Why:** The workspace reported no Replit deployment, while the external Cloudflare alias remained reachable with stale assets after `main` advanced.

**How to apply:** After a GitHub push, verify the external production URL's HTML and referenced bundle separately. If it is stale, document the external propagation/deployment block and do not claim QA or launch readiness.