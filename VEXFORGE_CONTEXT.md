# VEXFORGE — CONTEXTO ACTUAL

## Ruta de calidad visual elegida

A petición del propietario, se comparó el proyecto actual con Unreal/Fab y el límite gratuito Android/CI. La recomendación vigente para trabajo nuevo es **Unity 6.3.0f1 + URP 17.3.0**, el proyecto Android y pipeline ya presentes en `main`. Esto sustituye la nota Expo-only del commit anterior para el plan visual. `mobile/**` se conserva como legado/historial y no se modifica; tampoco se migra a Unreal.

**Epic/Fab se usa selectivamente para contenido gratuito y compatible con Unity**, no como cambio de engine. Para Android, Epic UE 5.8 documenta Nanite y Lumen GI/reflections no disponibles en sus perfiles mobile; el renderer de escritorio Android/Vulkan aparece experimental. La licencia de Unreal no cuesta bajo el umbral publicado, pero migrar el cliente y crear CI nuevo no resuelve el tiempo/presupuesto actual.

## Ruta principal de sesión

1. Leer `docs/vexforge-canonical/00_START_HERE.md`.
2. Leer `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md` antes de tocar escena, assets, animación, VFX o shaders.
3. Leer las biblias/manifiestos/QA visual que esa hoja enlaza; reutilizar, no duplicar.
4. Trabajar desde el `main` actual; comprobar SHA antes de continuar. Persistir incrementos en GitHub `main`.

## Hechos de implementación y límites

- `unity/ProjectSettings/ProjectVersion.txt`: Unity `6000.3.0f1`.
- `unity/Packages/manifest.json`: URP `17.3.0`.
- `VexforgeBattlefieldStage` tiene presentación dirigida por eventos, pero construye parte de la arena con cubos/cilindros/anillos y puede mostrar un fallback primitivo. El problema de prioridad es completar escena/arte/VFX, no rehacer lógica de juego.
- Ya existen perfiles Mobile/Balanced/Cinematic, resolver/manifiestos de arte, `VexforgeTier1BuildValidator` y documentos visuales v15. Conservar sus contratos, especialmente la prohibición de copiar arte oficial de cartas al cliente.
- El workflow Android usa `timeout-minutes: 360`, inventario histórico ~287.000 variantes, cap de shard 35.000, y deja `normal/final` sin límite. No lanzar esas rutas hasta que el preflight/stripping proteja también producción.
- El repositorio es público; GitHub Actions estándar es gratis en repos públicos, pero cada job tiene máximo seis horas. Objetivo de build <4 h y límite duro <6 h, medidos en runner real.

## Límites permanentes de este bloque

Trabajo visual únicamente: escenas, composición, arte, iluminación, animaciones, VFX, UI feedback y sonido asociado a eventos existentes. No rehacer balance, stats, clanes, guerras, dungeons, bosses, PvP/PvE, economía ni contratos Supabase. No usar assets/plugins pagados, contenido Fab sin licencia verificable, contenido UE-Only en Unity, ni repetir el inventario de 287k como prueba normal. No cambiar Supabase ni iniciar build de release sin su gate.
