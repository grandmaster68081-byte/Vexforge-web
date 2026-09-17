# 10 — ASSET SYSTEM

## Assets locales Android observados

`mobile/assets/images/` contiene 12 archivos: icono, escenas de battle/collection/deck/home/profile y referencias visuales de auth/feature/hero. El código referencia assets mediante constantes y componentes como `ForgeArchiveScene`, `ForgeBattlefield`, `CANONICAL_BACKGROUNDS` y `cardIdentity`.

## Clasificación

- `CANONICAL_CONTENT`: arte, nombres, identidad, rareza, faction y lore que provienen de código/Supabase/manifest.
- `VISUAL_REFERENCE`: referencias de escena y dirección; no son automáticamente datos runtime.
- `VISUAL_DEBT`: asset ausente, no resuelto, resolución insuficiente o consumo no verificado.
- `UNKNOWN`: archivo existente cuyo consumer actual no se confirmó.

## Regla

**NO GENERIC FALLBACK / NO SILENT SUBSTITUTION.** Si falta una imagen o identidad, debe mostrarse y registrarse como `MISSING`, `NOT_REPORTED` o `NOT_FOUND`; no se debe inventar un placeholder como si fuera contenido canónico.

## Evidencia

- Assets físicos: `mobile/assets/**`.
- Registros y procedencia: `docs/visual-assets/**`, `docs/VE-5-ASSET-MANIFEST-DATA.md` y migraciones `0009`, `0010`, `0020`–`0023`.
- Verificadores: `scripts/verify-mobile-home-official-assets.mjs`, `verify-mobile-visual-system.mjs`, `verify-card-art.mjs`, `verify-manifest.mjs`.
