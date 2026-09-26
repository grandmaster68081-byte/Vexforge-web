# Kivora architecture

```text
                         SAME GITHUB REPOSITORY
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
        VEXFORGE PRODUCT                         KIVORA PRODUCT
               │                                     │
        existing src/**                         faucet/**
        existing Unity                         independent React UI
        existing auth                           independent custom auth
               │                                     │
               └──────────────────┬──────────────────┘
                                  │
                           SAME SUPABASE PROJECT
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
      existing VEXFORGE data                     faucet schema
                                                    │
                                        accounts / sessions / wallets
                                        provider_events / ledger
                                        withdrawals / settings


Browser
  │
  ├── UI (React/Vite)
  │
  └── same-origin /api/*
          │
          ▼
Cloudflare Pages Functions
  │
  ├── custom auth/session
  ├── BitcoTasks API proxy
  ├── postback signature verifier
  ├── withdrawal API
  └── admin API
          │
          ▼
Existing Supabase project
  └── isolated `faucet` schema
```

## Security boundary

No browser component receives the Supabase server key, BitcoTasks API key, Bearer token, or Secret Key. The browser only receives normal JSON from same-origin Cloudflare Functions.

The faucet does not call Supabase Auth and does not reference VEXFORGE account/profile tables.

## Provider boundary

BitcoTasks data is read server-side. Offer links are restricted to `https://bitcotasks.com/`. Rewards are credited only through a verified provider postback.

## Accounting boundary

All money-like activity is represented as a ledger event. User balance is a projection maintained transactionally with provider events and withdrawal state changes. This is designed to prevent double-crediting and double-withdrawal races.
