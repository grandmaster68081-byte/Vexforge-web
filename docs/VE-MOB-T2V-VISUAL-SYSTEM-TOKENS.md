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
- `ForgeButton` consume `control.button.iconSize` en sus variantes primaria y
  secundaria, manteniendo la misma escala de icono sin literales locales.
- `ForgeIcon` consume `icon.defaultStroke` como trazo por defecto para que la
  silueta nativa compartida mantenga una lectura consistente entre dominios;
  los overrides existentes siguen siendo explícitos y compatibles.
- `ProgressBar` consume `control.progress` para altura y radio, preservando el
  porcentaje confirmado, el cero válido y la ausencia de datos sin inferencias.
- `DomainHeader` consume `domainHeader` para la geometría compartida de sigil,
  regla y jerarquía de texto, manteniendo la identidad viva de cada dominio.
- La jerarquía tipográfica restante de `DomainHeader` —lugar, título,
  propósito, trailing y espaciado de contenido— también consume
  `domainHeader`, sin cambiar el copy ni el dominio activo.
- `ScreenShell` consume `scene` para la geometría y opacidad de la atmósfera
  compartida, sin convertir esa capa visual en estado de juego.
- `DomainState` consume `state` para la geometría de carga, vacío y error,
  preservando mensajes, accesibilidad y acciones de recuperación.
- `ScreenShell` consume `state.assetError` para la geometría compartida del
  fallo de arte oficial; el mensaje sigue declarando que el asset no está
  disponible y no crea un sustituto genérico.
- `ErrorFallback` consume `state.errorFallback` para la superficie de
  recuperación, botón y modal de detalles; conserva `reloadAppAsync`,
  `resetError` y la exposición de diagnóstico sólo en desarrollo.
- `ForgeText` consume `typography` para familia tipográfica, escala,
  interlineado y tracking, conservando las seis variantes y los tonos actuales.
- `ForgeFormationPreview` consume `formation` para la geometría y escala de su
  lectura de Vanguardia, Campeón, Centinela y Reserva, preservando la formación
  derivada del servidor y sus estados de carga, vacío y error.
- `ForgeFormationPreview` consume `border.standard` para el borde de la raíz,
  sigil, tarjetas, feedback y retry, manteniendo una única regla de borde sin
  cambiar colores, estados ni zonas de interacción.
- `ForgeFormationPreview` consume roles de color para el placeholder de arte y
  el borde de feedback, manteniendo los mismos valores visuales sin literales
  aislados en el componente.
- `ForgeFormationPreview` consume pesos tipográficos registrados para kicker,
  título, contador, secciones, roles, nombres, poder, feedback y retry,
  conservando la jerarquía existente sin pesos locales aislados.
- `ForgeBattlefield` consume `battlefield.typography` para la jerarquía del
  campo, turno, formaciones, cartas, reserva, carril de confrontación y
  resultado, preservando los datos y estados confirmados por el servidor.
- `ForgeBattlefield` consume `battlefield.controls` para badge, rails,
  tarjetas, HP, keywords, reserva y carril, manteniendo las mismas zonas de
  interacción y lectura.
- `ForgeBattlefield` consume pesos tipográficos registrados para eyebrow,
  título, turno, identidad, unidades, reserva, carril y resultado, conservando
  la jerarquía existente sin literales locales.

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