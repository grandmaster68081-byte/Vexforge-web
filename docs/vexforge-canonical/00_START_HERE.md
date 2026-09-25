# 00 — START HERE

Una IA nueva debe leer en este orden:

1. `VEXFORGE_CONTEXT.md`
2. `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md`
3. `docs/vexforge-canonical/UNITY_INCREMENTAL_VARIANT_BATCHES.md` — selector y gates del workflow canónico
4. este archivo
5. `16_IMPLEMENTATION_STATUS.md`
6. `17_CURRENT_BLOCK.md`
7. `19_BLOCKERS.md`
8. `20_KNOWN_UNKNOWNS.md`
9. `21_CONTRADICTIONS.md`
10. el documento de dominio relevante
11. el código actual relevante
12. Supabase live si la afirmación depende del backend

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

Unity es el runtime Android principal de desarrollo y `unity/**` contiene la
implementación Unity que debe continuarse. Expo / React Native permanece
íntegro en `mobile/**` como respaldo, rollback y referencia funcional.
Supabase conserva toda autoridad de datos y reglas.

Unity está en `IMPLEMENTED_UNVERIFIED`: se continúa el código sin fabricar
APK, sin afirmar instalación y sin convertir el bloqueo de build/licencia en
un bloqueo del desarrollo.
