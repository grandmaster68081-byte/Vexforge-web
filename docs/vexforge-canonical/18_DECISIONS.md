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

## D-005

- DATE: 2026-09-17
- DECISION: el runtime final Android será Unity 6.3 LTS + URP + C#; React Native/Expo queda como cliente legado durante migración reversible.
- SCOPE: runtime, arquitectura de cliente, pipeline futuro y orden de etapas.
- WHY: VEXFORGE se declara TCG premium con battlefield, cartas animadas, cámara, Timeline/Animator, VFX, audio y experiencia de juego en un runtime único.
- EVIDENCE: `attached_assets/VEXFORGE_ENGINE_DECISION_AND_WORKFLOW_1789670634346.md` y ausencia de árbol Unity en `main` auditado.
- AFFECTED_FILES: futura ubicación Unity separada; `mobile/**` protegido durante migración.
- AFFECTED_SYSTEMS: cliente Android y CI; Supabase permanece sin cambio.
- STATUS: SUPERSEDED / HISTORICAL
- SUPERSEDES: la dirección anterior que trataba Expo/React Native como runtime final; no supersede la descripción histórica del código actual.

## D-006

- DATE: 2026-09-17
- DECISION: Expo / React Native es el runtime Android activo de VEXFORGE.
- SCOPE: runtime, aplicación/UI, movimiento, rendering futuro, datos y build.
- WHY: el cliente Expo existente es la única base Android ejecutable y verificable
  disponible para esta Foundation; Unity no alcanzó un APK verificable y queda
  retirado del runtime.
- EVIDENCE: `mobile/**`, `mobile/app.json`,
  `.github/workflows/vexforge-android-apk.yml`.
- AFFECTED_FILES: `mobile/game/**`, entrada Android, documentación canónica y
  workflows Unity retirados.
- AFFECTED_SYSTEMS: cliente Android y CI; Supabase permanece sin cambio.
- STATUS: ACTIVE / FOUNDATION_IMPLEMENTED_UNVERIFIED
- RULES: React Native es la capa de aplicación/UI; Reanimated + Worklets +
  Gesture Handler son la capa de movimiento/interacción; Skia queda reservada
  para una futura capa de rendering 2D/2.5D; Supabase mantiene autoridad de
  datos y reglas.
