# Kivora 5.2.0 — deploy-ready visual/product phase

This package is intended to be applied to the existing Kivora project in GitHub.
It deliberately does not require BitcoTasks credentials to build or deploy.

Cloudflare Pages installs from `package.json` and runs `npm run build`.
The later BitcoTasks onboarding is a separate configuration step.
