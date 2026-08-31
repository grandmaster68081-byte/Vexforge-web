# VE-MOB-6 — TUTORIAL AND ONBOARDING ANDROID

## Alcance canónico

Portar el onboarding jugable de `TutorialRoute` y `TutorialOverlay` a la aplicación Android como una ruta persistente de siete pasos. El progreso usa `player_progress.tutorial_step`, la misma autoridad viva que la web, y nunca retrocede.

## Comportamiento

- La ruta requiere una sesión Supabase real y muestra estados explícitos de carga, error y progreso inválido.
- Los siete pasos conservan el orden canónico: bienvenida, colección, packs/forja, misiones, primera batalla, mazo y finalización.
- Las rutas enlazadas sólo apuntan a superficies Android existentes: colección, cámara de packs/forja, arena y mazo.
- El paso de arena abre la batalla real disponible; no simula daño, victoria, recompensas ni settlement en el dispositivo.
- Omitir o completar el tutorial persiste el paso `99` mediante una mutación autenticada.
- El estado se recarga desde Supabase después de cada avance para conservar continuidad entre sesiones.
- La pantalla usa tokens semánticos móviles, controles táctiles accesibles, `testID` en acciones y padding de safe area.

## Gates

- `cd mobile && npm run typecheck`
- `npm run verify:mobile-tutorial`
- `npm run verify:mobile-deck`
- `npm run verify:build`
- Workflow oficial `.github/workflows/vexforge-android-apk.yml`
- QA del operador en el APK publicado; sin esa evidencia el estado permanece `IMPLEMENTED_UNVERIFIED`.

## Alcance preservado

No se crean RPCs, tablas, recompensas, sesiones, cartas, oponentes ni reglas de combate nuevas. Supabase sigue siendo la autoridad de autenticación, progreso y combate.