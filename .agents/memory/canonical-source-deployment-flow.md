---
name: Canonical source and deployment flow
description: The permanent VEXFORGE rule for where product changes are made and how Cloudflare receives them.
---

GitHub main is the only product source of truth. Cloudflare Pages is the automatically deployed frontend linked to that branch, and Supabase is the backend, database, and Storage.

**Why:** Treating Cloudflare or a local or replicated environment as a separate implementation creates false divergence and can lead to unauthorized manual publication.

**How to apply:** Make frontend changes directly in the official GitHub repository, commit and push to main, wait for automatic Cloudflare propagation, then verify the public URL and live Supabase state. Never edit Cloudflare, use Wrangler to publish, or use local or Replit artifacts as a product source.
