# 00 — START HERE

Una IA nueva debe leer en este orden:

1. `VEXFORGE_CONTEXT.md`
2. este archivo
3. `16_IMPLEMENTATION_STATUS.md`
4. `17_CURRENT_BLOCK.md`
5. `19_BLOCKERS.md`
6. `20_KNOWN_UNKNOWNS.md`
7. `21_CONTRADICTIONS.md`
8. el documento de dominio relevante
9. el código actual relevante
10. Supabase live si la afirmación depende del backend

## No asumir

- Que un documento histórico describe el cliente activo.
- Que una ruta documentada existe en Android.
- Que una RPC histórica sigue habilitada.
- Que un asset visual está disponible porque aparece en una referencia.
- Que un release corresponde al commit actual sin evidencia de workflow y artefacto.
- Que una función live está activa solo porque aparece en una migration.

## Autoridad

`03_CANONICAL_HIERARCHY.md` define la jerarquía. En resumen: Supabase live para backend/datos; código `main` para implementación; esta capa para continuidad; documentos antiguos como historial.

## Inspección

```text
cat VEXFORGE_CONTEXT.md
find mobile/app mobile/components mobile/lib -type f
npm run typecheck --prefix mobile
node scripts/verify-mobile-battle.mjs
node scripts/verify-mobile-visual-system.mjs
```

Los comandos anteriores son inspección/verificación del estado existente. No se debe instalar, compilar, desplegar o modificar nada sin la autorización del bloque activo.

## Registrar el siguiente bloque

Actualizar `17_CURRENT_BLOCK.md`, `16_IMPLEMENTATION_STATUS.md`, `18_DECISIONS.md`, `19_BLOCKERS.md`, `20_KNOWN_UNKNOWNS.md` y `25_CONTINUITY_CHANGELOG.md`. Si afecta Android, registrar commit → workflow → artefacto → QA.

## Decisión actual de runtime

Expo / React Native es el runtime Android activo. React Native es la capa de
aplicación/UI; Reanimated, Worklets y Gesture Handler son la capa de
movimiento/interacción; Skia queda reservada para una futura capa de rendering
2D/2.5D. Supabase conserva toda autoridad de datos y reglas.

Unity es `RETIRED / HISTORICAL`: no es runtime activo, no tiene ruta de build
activa y no debe volver a introducirse en esta etapa.
