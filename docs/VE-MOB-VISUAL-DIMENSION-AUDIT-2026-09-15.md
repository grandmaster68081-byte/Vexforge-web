# VEXFORGE — Android visual dimension audit

**Fecha:** 2026-09-15  
**Entorno:** `mobile/**`  
**Contrato visual de referencia:** `1080 × 2340 px`, proporción `9:19.5`  
**Estado:** diagnóstico registrado; no se modificó la implementación ni se compiló APK.

## Resultado ejecutivo

Auth y Home están funcionando como rutas Android, pero sus assets locales de escena no tienen el mismo formato que el lienzo oficial de referencia:

| Superficie | Consumidor activo | Dimensión medida | Dimensión esperada | Resultado |
|---|---|---:|---:|---|
| Auth | `CANONICAL_BACKGROUNDS.auth` → `auth-reference-scene.png` → `ScreenShell` | `1024 × 1024` | `1080 × 2340` | **No conforme; recorte horizontal severo** |
| Home | `CANONICAL_BACKGROUNDS.home` → official scene art + native layers | `1080 × 2340` | `1080 × 2340` scene reference | **Conforme como arte ambiental; UI y estados siguen nativos** |
| Auth alternativa | `vexforge-auth-nexus-final.png` | `1080 × 2340` | `1080 × 2340` | **Correcta en dimensión, no consumida** |

## Auth — causa exacta

`mobile/constants/visual.ts` asigna `auth-reference-scene.png` a `CANONICAL_BACKGROUNDS.auth`. `mobile/app/auth.tsx` monta `ScreenShell surface="auth" sceneMode="shell"`, y `ScreenShell` pinta el asset absoluto con `resizeMode="cover"`.

El archivo activo es cuadrado (`1024 × 1024`). En un viewport `1080 × 2340`, `cover` necesita escalarlo por la altura: el resultado aproximado es `2340 × 2340`, con unos `630 px` recortados horizontalmente en total, antes de considerar safe areas y contenido. Por eso la escena no puede conservar composición completa en el dispositivo.

Existe `mobile/assets/images/vexforge-auth-nexus-final.png` con `1080 × 2340`, pero aparece como asset disponible/no consumido. Cambiar el consumidor requiere decisión visual y QA autenticada; este audit no lo activa.

## Home — causa exacta

`mobile/app/(tabs)/index.tsx` toma `CANONICAL_BACKGROUNDS.home` como arte
ambiental dentro del hero, con `resizeMode="cover"` y parallax limitado. La
interfaz no está horneada en la escena: los controles, datos, estados y rutas
se renderizan nativamente.

`home-reference-scene.png` mide `1080 × 2340` y conserva el lienzo vertical
oficial. No se deforma para inventar una pantalla: el recorte visible pertenece
al hero responsive, mientras el movimiento y la interacción quedan en capas
nativas separadas.

Home no es actualmente un fondo full-screen: es una composición nativa desplazable con hero, gradientes, portales, actividad y datos vivos. Por tanto, corregir sólo el tamaño del PNG no resolvería por sí solo la equivalencia visual; habría que decidir si el contrato sigue siendo hero recortado o si se promueve una escena vertical completa y se remaqueta el hero.

## Registro detectado

El registro T0 declaraba previamente `auth-reference-scene.png` como `1080 × 2340`, pero la medición del archivo en el repositorio es `1024 × 1024`. El registro se corrige en este commit para reflejar el archivo real. Home ya figura como `1024 × 1024` en el registro.

## Próximo cambio seguro

1. Aprobar la dirección visual de una escena vertical Auth o confirmar el uso de `vexforge-auth-nexus-final.png`.
2. Decidir si Home conserva un hero responsive recortado o requiere una escena vertical completa.
3. Sólo después cambiar el consumidor, validar safe areas, teclado, legibilidad, parallax y reduced-motion.
4. Ejecutar typecheck, verificación móvil, workflow APK y QA física antes de promover cualquier asset a activo.

No se autoriza por este audit la compilación APK, la subida de fondos a Storage ni la publicación de release.
