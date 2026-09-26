# Kivora v1.3.0 — exact integrated implementation instructions for Replit

Replit is the implementation executor for this package. Do not redesign the architecture. Copy the package as an overlay into the existing `Vexforge-web` repository and preserve the existing VEXFORGE application untouched.

## 1. Copy exactly these paths

- `faucet/**` → repository root `/faucet/**`
- `supabase/migrations/202609260001_kivora_core.sql` → repository root `/supabase/migrations/202609260001_kivora_core.sql`
- `supabase/migrations/202609260002_kivora_hardening.sql` → repository root `/supabase/migrations/202609260002_kivora_hardening.sql`
- `.github/workflows/kivora-quality.yml` → repository root `/.github/workflows/kivora-quality.yml`
- Kivora documentation is already included under `faucet/docs/**`; do not copy these files over unrelated repository documentation.

**Do not rename `faucet/`.** It is the stable technical directory; **Kivora** is the public product identity.

## 2. Validation before commit

From repository root:

```bash
cd faucet
npm install
npm run check
cd ..
```

The existing VEXFORGE web, backend and Unity checks remain unchanged. If a pre-existing check fails outside `faucet/**` or the new Kivora migration, stop and report it instead of modifying VEXFORGE to make the Kivora change pass.

## 3. Database: SAME Supabase project, NEW logical boundary

Use the existing Supabase project used by VEXFORGE. Do not create a second Supabase project.

Run both migrations in filename order once:

```bash
supabase db push
```

or execute `supabase/migrations/202609260001_kivora_core.sql` once in Supabase SQL Editor.

The two migrations create/extend the isolated `faucet` schema and its hardening/settlement controls. Kivora does not use `auth.users` and does not reuse VEXFORGE authentication, profile, wallet, battle, card or economy tables.

## 4. First admin

Create a normal Kivora account through the website first, then run:

```sql
update faucet.accounts
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

Do not store the admin email in source code.

## 5. BitcoTasks

Publisher dashboard: `https://bitcotasks.com/pub/dashboard`
Credential path after the app is registered: `My Apps → select Kivora → Edit`

Configure the approved website/app in BitcoTasks with the final Kivora hostname. The website/app does not receive secrets in browser code.

Use:

- Site URL: final Kivora hostname
- Currency name: `Kivora Points`
- Currency round: `2`
- Initial display reference: `1000` points / USD
- Earn Hub: use the official BitcoTasks JS SDK with the public API key + Kivora user `public_id`
- Postback URL: `https://YOUR-KIVORA-DOMAIN/api/bitcotasks/postback`

The provider callback remains authoritative for credit/chargeback. The system records provider `reward` and `payout` separately for reconciliation. The platform's configurable target user share starts at 35% but is not represented as a guaranteed provider revenue-share percentage.

## 6. Cloudflare Pages — separate project, SAME account/repository

Create a **second Pages project** in the same Cloudflare account that currently serves the official VEXFORGE web. Connect it to the same GitHub repository.

Use:

- Project name: `kivora-rewards`
- Root directory: `faucet`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Build watch include: `faucet/*`

Do **not** create a Direct Upload-only project for Kivora. Git integration is intentional because it preserves the commit → automatic production deployment flow and supports Pages Functions.

### Protect the official VEXFORGE project

In the existing VEXFORGE Pages project, open **Settings → Build → Build watch paths** and exclude:

```text
faucet/*
```

This ensures a Kivora-only change is not treated as a reason to rebuild the official VEXFORGE site. The deployments remain separate even if both projects watch the same repository.

### Resulting deployment graph

```text
GitHub: Vexforge-web
│
├── src/** ───────────────→ Cloudflare Pages: VEXFORGE
│                            └── official hostname
│
└── faucet/** ────────────→ Cloudflare Pages: Kivora
                             └── Kivora hostname
```

Both Pages projects can use `main`. A change under `faucet/**` deploys Kivora only. A change outside the Kivora watch paths does not publish Kivora.

## 7. Kivora secrets

Add these as encrypted environment variables to the Kivora Pages project for Production (and Preview only when needed):

```text
SUPABASE_URL=https://YOUR-EXISTING-PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
BITCOTASKS_API_KEY=YOUR_BITCOTASKS_API_KEY
BITCOTASKS_BEARER_TOKEN=YOUR_BITCOTASKS_BEARER_TOKEN
BITCOTASKS_SECRET_KEY=YOUR_BITCOTASKS_SECRET_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is accepted as a compatibility fallback, but the preferred current variable name in this package is `SUPABASE_SECRET_KEY`.

Never commit these values, and never put them into `src/`.

## 8. Do not create a second deploy workflow

`.github/workflows/kivora-quality.yml` is a Kivora quality gate only. Cloudflare Pages Git integration performs the actual deployment. Keeping deployment in Cloudflare avoids duplicate production deployments and keeps the same GitHub → Cloudflare workflow the official site already uses.

## 9. Commit boundary

Recommended commit message:

```text
feat(kivora): add isolated advertiser-funded rewards platform
```

The commit should contain the new Kivora `faucet/**` application, the Kivora migration, and the quality workflow. Do not modify existing VEXFORGE application logic merely to accommodate the Kivora deployment.

## 10. BitcoTasks browser SDK + server API surface

The integrated Kivora Earn Hub uses the official BitcoTasks browser SDK for all eight documented activity families: `surveys`, `offers`, `ptc`, `video`, `faucet`, `shortlinks`, `tasks`, `article`. Core inventory also has a server-side API fallback using the Bearer Token, so the frontend never receives that secret.

## 11. BitcoTasks postback contract implemented here

The endpoint accepts GET or POST and validates the documented signature:

```text
md5(subId + transId + reward + secretKey)
```

before any ledger credit.

`transId` is idempotent per provider/status. Credit (`status=1`) adds points. Chargeback (`status=2`) subtracts the same absolute reward and records a chargeback ledger entry.

The public user ID sent to BitcoTasks is the isolated `faucet.accounts.public_id`, not a VEXFORGE user ID and not a Supabase Auth UID.

## 12. Manual payout lifecycle

```text
available
  ↓ request
pending (points reserved)
  ↓ approve
approved
  ↓ paid
paid
```

A rejection restores reserved points. The admin console records an optional transaction hash after the manual blockchain transfer.

## 13. Never change

Do not modify:

- existing VEXFORGE `src/**` application logic
- VEXFORGE Unity scripts or scenes
- existing VEXFORGE authentication
- existing VEXFORGE economy tables
- card/battle/social contracts
- existing VEXFORGE Cloudflare Pages project build/root settings except the explicit `faucet/*` watch-path exclusion described above

Kivora is independent at the application/data/authentication level while remaining inside the same GitHub repository, Supabase project and Cloudflare account.

## 14. Visual QA

After `npm run check`, verify the Kivora root route on a narrow mobile viewport and a desktop viewport. The public landing should render the packaged `/kivora-hero.webp` art locally, not a remote image. Verify that no invented user counts, balances or payout claims are shown before live data exists. Test keyboard focus outlines, mobile navigation, the offer filters, withdrawal form, and modal close behaviour.

Do not “improve” the visuals by adding stock templates, copied competitor artwork, hotlinked brand logos, fake social proof or fake live counters.
