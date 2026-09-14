# VE-MOB-T2V — VISUAL SYSTEM TOKENS + SHARED MATERIAL PANEL

**Estado:** `IMPLEMENTED_UNVERIFIED`
**Alcance:** Android `mobile/` únicamente
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar la primera pieza ejecutable del Visual System v1.0 sin tocar el motor
ForgeFormation, los contratos de Battle Run, Supabase, Auth, economía, rutas ni
la web congelada.

## Contrato implementado

- `VISUAL_TOKENS` centraliza roles de material, color, tipografía, radios,
  bordes, sombras, tratamiento de iconos, espaciado, safe area, movimiento y
  tiers de calidad.
- `MaterialPanel` aplica esos roles con profundidad nativa Android, color
  semántico opcional y entrada respetuosa de `reduced-motion`.
- `DomainState` usa `MaterialPanel` para carga, vacío y error; el estado
  continúa siendo el contrato vivo recibido por cada pantalla y no genera
  datos, arte ni reglas de juego.
- `ForgeButton` consume el bloque `control.button` para altura, radio, padding,
  gap y feedback de pressed/disabled sin cambiar su API ni sus acciones.
- `ForgeIcon` consume `icon.defaultStroke` como trazo por defecto para que la
  silueta nativa compartida mantenga una lectura consistente entre dominios;
  los overrides existentes siguen siendo explícitos y compatibles.
- `ProgressBar` consume `control.progress` para altura y radio, preservando el
  porcentaje confirmado, el cero válido y la ausencia de datos sin inferencias.
- `DomainHeader` consume `domainHeader` para la geometría compartida de sigil,
  regla y jerarquía de texto, manteniendo la identidad viva de cada dominio.
- `ScreenShell` consume `scene` para la geometría y opacidad de la atmósfera
  compartida, sin convertir esa capa visual en estado de juego.
- `DomainState` consume `state` para la geometría de carga, vacío y error,
  preservando mensajes, accesibilidad y acciones de recuperación.

## Límites

- No se añadieron assets ni datos ficticios.
- No se crea una ruta paralela ni un motor de combate.
- Los tiers de calidad sólo describen degradación visual; no cambian estado,
  geometría semántica ni timing autoritativo.
- El tutorial permanece fuera de este bloque, como exige el protocolo.

## Gates

- `node scripts/verify-mobile-visual-system.mjs`
- `npm run typecheck`
- `git diff --check`
- El workflow APK y la QA visual/táctil quedan pendientes de una ejecución autorizada.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`: falta la verificación humana visual/táctil en APK.
Este bloque no debe elevarse a `PASS`, `OPERATIONAL` ni `TIER1_READY` sin esa
evidencia.