---
name: Kivora package constraints
description: Non-obvious dependency and CI constraints for the supplied Kivora 5.2.1 package.
---

The supplied Kivora package must install without a lockfile, and its declared `@cloudflare/workers-types` v4.20260920.0 range is not published. Use the available v5 Workers Types line instead.

**Why:** The package's requested version makes npm installation fail with `ETARGET`, while a lockfile-dependent GitHub Actions cache or `npm ci` fails because the package intentionally omits `package-lock.json`.

**How to apply:** Keep `faucet/package-lock.json` absent, use `npm install --no-package-lock` locally and in Kivora CI, and verify that the Workers Types range resolves before pushing.