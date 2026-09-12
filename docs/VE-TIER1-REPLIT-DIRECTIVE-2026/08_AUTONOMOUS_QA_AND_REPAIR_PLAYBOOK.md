# VEXFORGE — AUTONOMOUS QA + REPAIR PLAYBOOK

## Purpose
Turn Replit Agent from a primarily implementation agent into an implementation + verification + repair loop, within its actual tool permissions.

## Operating rules

### Rule 1 — Never assume a screen works because it renders
A rendered screen is only the beginning of verification.

### Rule 2 — Exercise the user's path
For each domain, start at its entry point and follow the primary user journey.

### Rule 3 — Repair the smallest safe layer
Prefer:
- route fix over route rewrite;
- state fix over data duplication;
- adapter over replacing backend contracts;
- component extraction over wholesale rewrite.

### Rule 4 — Retest after every repair
A fix is incomplete until the triggering path is retested and nearby flows are spot-checked.

### Rule 5 — Keep evidence
For every significant issue: record symptom, fix, verification, and remaining limitation.

## Discovery passes

### Pass A — Static / repository
Search for:
- TODO/FIXME in user-facing paths;
- dead imports;
- unreachable routes;
- missing route targets;
- console.error / console.warn that indicate real defects;
- unhandled promises;
- unsafe any-casts around critical state;
- duplicated constants that should be canonical;
- client-side use of privileged secrets;
- suspicious hard-coded mock data;
- loading flags that are never cleared;
- mutations with no error handling.

### Pass B — Runtime
Start the app and inspect:
- boot errors;
- red screens;
- network failures;
- blank screens;
- hydration/auth races;
- broken assets;
- infinite loading.

### Pass C — Browser/App Testing
Where available, exercise the real UI.

### Pass D — Regression
After a meaningful fix, revisit:
- the repaired route;
- the previous route;
- shared components;
- auth entry/exit;
- neighboring domain links.

## Defect classes

- NAV — navigation
- UI — interaction/layout
- DATA — data binding/state
- AUTH — auth/session
- RLS — access policy / data authorization
- API — integration/runtime contract
- MEDIA — image/asset loading
- PERF — performance
- A11Y — accessibility
- VIS — visual regression
- MOTION — animation/transition
- ECON — economy/ownership/reward logic
- BUILD — build/dependency/runtime packaging

## Autonomous-safe fixes

Generally safe when the desired behavior is unambiguous:
- broken route target;
- missing loading state;
- missing error boundary;
- button wired to a known existing action;
- stale UI state after successful mutation;
- obvious null/undefined crash;
- missing key/list warning when behavior is otherwise unchanged;
- incorrect visual state when tied to an existing known status;
- missing mobile spacing/safe-area handling;
- performance cleanup that preserves behavior.

## Human confirmation required

Request/leave for human approval when the change would alter:
- economic semantics;
- ownership semantics;
- irreversible rewards/transfers;
- broad authorization;
- destructive database migrations;
- public API contracts;
- product rules not explicitly documented.

## QA success notation

Use:
- PASS — verified in available environment;
- PARTIAL — partly verified, remainder requires human/device/external validation;
- BLOCKED — cannot be tested because environment lacks access;
- FAIL — reproduced and unresolved.

Never use PASS when the test was not actually run.
