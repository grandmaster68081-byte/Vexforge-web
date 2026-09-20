# VEXFORGE — Build 5 Precheck

## Scope

This record covers the repair pass after the published Stage 12 checkpoint. It
does not start Unity Cloud Build 5.

The existing Unity project, organization, Android platform, branch `main`, and
target `vexforge-android-qa` remain unchanged.

## Runtime repairs

- `GameShellController` now waits for the idempotent `VexforgeApp`
  initialization task before constructing the active runtime.
- The battle host keeps `BattlePresentationDirector` active while its
  self-hiding `VexforgeBattlefieldStage` lives in a child object; initialization
  happens before any active `Play` path, and the legacy path has the same guard.
- The active shell no longer destroys the persistent social overlay and world
  chat dock when changing route or switching between signed-out and signed-in
  views.
- Profile/Hall social access now exposes the existing server-authoritative
  block and message-report RPCs alongside friends, requests, direct messages,
  World Chat, Clan Hall, presence, and clan status.
- No Supabase table transport, RPC contract, Unity package, scene dependency,
  or Cloud Build target was replaced.

## Verification performed

All of the following completed with `PASS` on the repaired tree:

- `git diff --check`
- `python3 verification/build5_runtime_integration_gate.py`
- `python3 verification/alpha_final_audit.py`
- `python3 verification/social_contract_audit.py`
- `python3 verification/package_audit.py`
- `python3 verification/static_audit.py`
- `python3 verification/contract_audit.py`
- Python compilation of every public-main verification script

The repository history contains the published Stage 01–12 checkpoints. Stage
13 is the deliberate Cloud Build milestone, not a source-file stage; its
precheck is satisfied here, but its build evidence does not exist yet because
Build 5 was intentionally not started.

## Live service reconciliation

- Supabase project `rscuzqnfccqvltkdcdny` responded through the Management API.
- The social tables and RPCs exist remotely.
- The migration is recorded remotely as
  `20260920044854 / 20260920010000_vexforge_social_alpha`; the applied
  migration name matches the repository migration even though the remote
  timestamp differs from the local filename timestamp.
- Unity Build Automation v2 returned `200` for the existing project target
  `vexforge-android-qa` using the pre-generated Basic authorization.
- No `POST .../builds` request was made during this repair pass.

## Remaining evidence gate

Unity Editor compilation, Android artifact generation, R5 gate execution,
artifact identifiers, and device behavior still require the operator-approved
Cloud Build 5. This record must not be read as `EDITOR_VERIFIED`,
`BUILD_VERIFIED`, or `DEVICE_VERIFIED`.