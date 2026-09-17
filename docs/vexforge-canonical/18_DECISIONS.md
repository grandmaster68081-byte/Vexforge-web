# 18 — DECISIONS

## D-001

- DATE: 2026-09-17
- DECISION: Android es el producto activo; web frozen/non-active.
- SCOPE: orientación de futuras sesiones.
- WHY: orden canónica activa y evidencia del cliente Expo móvil.
- EVIDENCE: `mobile/app/**`, `mobile/app.json`, workflows APK, continuidad reciente.
- AFFECTED_FILES: orientación y documentación, no código funcional.
- STATUS: ACTIVE
- SUPERSEDES: documentos históricos que llamaban oficial a la web.

## D-002

- DATE: 2026-09-17
- DECISION: Supabase live es autoridad de backend/datos/seguridad; `main` es autoridad de implementación.
- SCOPE: contratos y reconciliación.
- WHY: separar datos vivos de copias documentales.
- EVIDENCE: consulta live del proyecto y `mobile/lib/supabase.ts`.
- STATUS: ACTIVE

## D-003

- DATE: 2026-09-17
- DECISION: no inventar datos, assets, rewards, reglas ni resultados; no generic fallback silencioso.
- SCOPE: todas las superficies.
- WHY: preservación de evidencia y honestidad de estados.
- EVIDENCE: protocolo activo, verificadores móviles y componentes de estados.
- STATUS: ACTIVE

## D-004

- DATE: 2026-09-17
- DECISION: no compilar APK ni desplegar por iniciativa propia.
- SCOPE: continuidad y bloques futuros.
- WHY: build/release/QA son gates independientes.
- EVIDENCE: continuidad y orden canónica.
- STATUS: ACTIVE
