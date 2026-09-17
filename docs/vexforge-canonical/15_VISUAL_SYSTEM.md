# 15 — VISUAL SYSTEM

## Existing visual implementation

La implementación móvil usa `CanonicalFrame`, `ScreenShell`, `MaterialPanel`, `ForgeText`, `ForgeButton`, `ForgeIcon`, colores/tipografía/tokens en `mobile/constants/**`, escenas oficiales locales, safe areas, estados de carga/error/retry, haptics y reduced motion donde el código lo declara.

Escenas relevantes: `ForgeArchiveScene`, `ForgeBattlefield`, `ForgeFormationPreview`.

## Approved target direction

TCG premium de fantasía medieval oscura con identidad VEXFORGE propia. Las referencias visuales orientan composición y materialidad; no son fuente de cards, stats, rewards, reglas o datos.

## Límites

No diseñar una UI nueva dentro de esta tarea. No reemplazar arte faltante por generic fallback. No presentar una referencia como si fuera runtime canónico sin evidencia de consumer. Registrar safe area, motion, audio, VFX y haptics como implementado/no verificado según código y QA física.

Verificadores existentes: `verify-mobile-visual-system.mjs`, `verify-mobile-battle.mjs`, `verify-mobile-collection.mjs`, `verify-mobile-home-official-assets.mjs`.

## Implicación del motor objetivo

Unity es el runtime aprobado para reunir cartas animadas, battlefield, cámara, Timeline/Animator, VFX, audio, iluminación y transiciones dentro de una experiencia de juego única. Esto es dirección objetivo; no autoriza a inventar arte, datos, reglas o assets ni demuestra que esas capacidades estén implementadas hoy.
