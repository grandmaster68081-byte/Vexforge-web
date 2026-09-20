# PRODUCTION GATES · V15

Static source inspection is not a release certificate. The following gates must be observed in the real project environment.

## Gate A · Repository

Confirm `main`, expected origin and clean working tree before each microtask.

## Gate B · Unity editor

Open the canonical Unity project using `6000.3.0f1` and run:

`VEXFORGE → Tier1 → Validate Production Closure`

Then enter Play Mode and verify there are no compilation/runtime exceptions.

## Gate C · Supabase battle smoke

Authenticated account must be able to:

- read server opponents;
- select one server identity;
- submit one resolve;
- receive authoritative events;
- reach `PresentationCompleted`;
- refresh GameState;
- retry safely after an artificial interruption.

## Gate D · Android

At minimum test: cold start, auth loss/re-auth, vertical card scrolling, deck validation, battle selection, battle resolve, result state, tutorial resume, background/foreground transition, low-memory relaunch and network interruption.

## Gate E · Cloud Build

Reconcile the operator-supplied Unity Cloud project/target with the repository-documented project before triggering the production build.

## Gate F · Commerce/compliance

Verify store billing, randomized-content disclosure, tokenized-asset declarations, privacy consent and legal copy against the exact storefront and regions where the product will be distributed.

## Release decision

Only human verification of all environment-dependent gates may change the release status from unverified to verified.
