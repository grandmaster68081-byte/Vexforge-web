# 03 — CANONICAL HIERARCHY

1. **Supabase LIVE**: tablas, datos vivos, RLS, policies, RPCs, functions, triggers, storage, auth, permisos y contratos backend.
2. **Código actual de `main`**: entry points, rutas, componentes, cliente ejecutado, consumers, assets, build y comportamiento implementado.
3. **`VEXFORGE_CONTEXT.md`**: punto de entrada persistente.
4. **`docs/vexforge-canonical/**`**: mapa y reconciliación detallados.
5. **Documentación histórica**: evidencia contextual; no autoridad si contradice evidencia actual.

## Resolución de la discrepancia web/Android

- SOURCE A: `README.md` original llama a la web “Official Web Frontend”.
- SOURCE B: decisión activa y `mobile/**` declaran Android como producto activo.
- CURRENT EVIDENCE: Expo Router, `mobile/app.json`, rutas móviles, workflows APK y continuidad reciente.
- STATUS: `RESUELTO` para orientación futura: Android activo; la afirmación web queda histórica/frozen.

No se eliminan fuentes antiguas: se clasifican y se enlazan.

## Runtime actual versus runtime objetivo

- Código `main` actual: autoridad para describir la implementación Expo/React Native existente.
- Decisión de producto/runtime: Unity 6.3 LTS + URP es el objetivo aprobado, pero está `PLANNED`, no implementado.
- Durante la migración, no se debe describir Unity como cliente activo ni tratar el cliente legado como eliminado.
