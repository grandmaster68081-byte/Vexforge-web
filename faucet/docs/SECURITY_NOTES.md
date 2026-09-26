# Security notes

This package is a production-oriented foundation, but external launch still requires provider approval, legal/policy review, abuse controls, and operational monitoring.

## Secrets

Never commit:

- Supabase server/secret key
- BitcoTasks API key
- BitcoTasks bearer token
- BitcoTasks secret key
- payout treasury private keys

This package intentionally contains placeholders only.

## Authentication

The faucet uses independent account/session tables. Passwords are never stored plaintext; passwords are derived with PBKDF2-HMAC-SHA-256 using a per-account random salt and 210,000 iterations. Session tokens are random and stored only as SHA-256 hashes.

## Postback integrity

BitcoTasks postbacks are verified with the documented MD5 signature scheme before any reward is applied. The database records provider transaction IDs and status codes to make callbacks idempotent.

## Payout safety

No private keys are stored by the application. The initial payout workflow is manual. The admin interface records state and optionally the final transaction hash.

## Provider economics

The code deliberately does not invent a BitcoTasks revenue-share percentage. The provider reward callback is authoritative for user credit. Provider USD payout data is stored for reporting/reconciliation.

## Provider SDK

The browser loads only the public BitcoTasks API key plus the isolated Kivora public user ID from `/api/public-config`. The Bearer Token and Secret Key remain server-side. The current client integration supports the documented SDK categories: surveys, offers, PTC, video, faucet, shortlinks, tasks and article.
