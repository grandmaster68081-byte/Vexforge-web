# PHASE_REPORT — F0: huella exacta y preservación

## Resultado

**F0: SOURCE BASELINE VERIFIED / UNITY BUILD AND DEVICE STATUS NOT VERIFIED**

## HEAD before/after

- Before: `75b5533926e596c8eceb6263637804168de56175`
- Source checkout after `git fetch --prune origin`: same as `origin/main`; clean before F0 documentation changes.
- No Unity/project source files were changed during F0. The source revision used for the baseline remains `75b5533926e596c8eceb6263637804168de56175`.
- The F0 report/baseline documentation commit is the only phase change; its final commit is recorded by the `main` history containing this report.

## Files changed

- `docs/vexforge-canonical/visual-forensics/FORENSIC_BASELINE.md` — exact source, scene, settings, asset, Supabase linkage, and open-evidence baseline.
- `docs/vexforge-canonical/visual-forensics/PHASE_REPORT_F0.md` — this phase record.

## Evidence and checks

| Check | Result |
| --- | --- |
| GitHub source and branch | `main` fetched; `HEAD == origin/main`; worktree clean before documentation |
| Supabase linkage | Read-only Management API response matched project ref `rscuzqnfccqvltkdcdny`; `ACTIVE_HEALTHY`, `us-west-2` |
| Unity scene and entry chain | Scene/build settings and source references inspected; runtime not executed |
| Asset inventory | 209 Assets files; 32/32 Tier-1 local manifest keys mapped to files |
| 127-card checkpoint | Existing 127-row/24-valid-JPEG evidence reused; no full query in F0 |
| Build / APK / device | Not run; no APK, player log, or full logcat in checkout |
| Supabase mutations | None |
| Connectors | None |

## Import and evidence gaps

- Ten local WAVs do not have `.meta` files; Unity importer settings/GUIDs are not proven.
- `GraphicsSettings.asset`, `QualitySettings.asset`, and URP pipeline/renderer assets are absent; actual SRP assignment is unverified.
- No prefab, material, model, or animation assets exist in the checked `unity/Assets` extension inventory.
- `Resources.Load`, Unity decode/render, build inclusion, and device presentation are not proven by file presence.

## Next authorized phase

F1 — replace the parallel/ambiguous Battle readiness searches with one explicit retryable readiness contract, keep Battle and tutorial gated until the canonical director, battlefield stage, resolver, and active camera are valid, and test the listed startup/navigation cases. Preserve server authority and existing Supabase/gameplay contracts. No Unity build is included without fresh approval.
