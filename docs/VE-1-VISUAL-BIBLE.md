# VE-1 — Biblia visual mínima de VEXFORGE

**Fecha:** 2026-08-31  
**Unidad:** `VE-1-VISUAL-BIBLE`  
**Tipo:** `SYSTEM` — contrato visual, de movimiento y audio  
**Fuente canónica:** protocolo vivo `vexforge_master_protocol_v2` v2.8-official-visual-consumption-law, plan `vexforge_forge_formation_engine_v1` v1.2-universal-re-evaluable-roadmap, `main` en `49e474bb5ee80c2c8956194067148ec8123cce95`, `CONTINUITY.md`, `src/styles.css`, `src/shared/components/ForgeIcon.tsx`, `mobile/components/ForgeIcon.tsx`, `src/lib/assetManifest.ts` y `mobile/constants/visual.ts`  
**Estado:** `IMPLEMENTED_UNVERIFIED` — documentación integrada; falta validación visual manual en navegador y dispositivo  
**Nivel:** `Q0 → Q2` para este lote; objetivo posterior `Q3`  

## Propósito

VEXFORGE es un DCCG premium donde cada pantalla debe sentirse como una cámara
del mismo mundo: forja, carta, Campeón, formación, combate y recompensa. Esta
biblia convierte la identidad existente en reglas de decisión reutilizables.
No crea canon, no cambia balances, no decide resultados y no añade contratos de
Supabase.

## Autoridad y límites

1. Los datos reales de Supabase, el manifiesto oficial de assets y los contratos
   existentes son la autoridad. La presentación nunca inventa atributos,
   resultados, recompensas, lore o estados de cuenta.
2. `ForgeIcon` es el lenguaje visual de interfaz. Un alias de compatibilidad en
   Android puede conservar el nombre que espera una pantalla, pero siempre debe
   acabar renderizando una geometría SVG propia de VEXFORGE.
3. Un asset diegético se resuelve primero desde el registro visual y Storage
   oficial. Si falta, se abre su pista de producción; no se oculta con una
   imagen de muestra, emoji, icono de sistema, texto Unicode o forma CSS.
4. Las formas CSS sólo representan geometría de interfaz, separadores, barras,
   estados de carga y feedback no diegético. No representan criaturas, armas,
   edificios, cartas ni objetos del mundo.
5. La ausencia de QA humana no se convierte en evidencia. Esta unidad queda
   `IMPLEMENTED_UNVERIFIED` hasta que exista revisión visual real.

## Gramática de identidad

### Materiales y capas

- **Capa 0 — Obsidiana:** `--layer-0` y `--layer-1` sostienen el espacio de
  lectura y separan la escena del contenido.
- **Capa 1 — Forja:** `--layer-2` a `--layer-4` forman placas, paneles y
  superficies de interacción. Deben conservar contraste y no competir con el
  arte de una carta.
- **Capa 2 — Metal y brasa:** `--forge-iron` estructura; `--ember-gold` y sus
  variantes señalan foco, progreso, confirmación y valor.
- **Capa 3 — Resonancia:** `--arcane-violet` y su variante clara se reservan
  para energía arcana, rareza o información de sistema que realmente tenga
  ese significado.
- **Capa 4 — Estado:** rojo para peligro/daño, verde para resultado positivo y
  azul para información de facción o lectura contextual, siempre subordinados
  al significado de los datos.

La paleta se deriva de los tokens existentes en `src/styles.css`; no se
introduce una segunda paleta por ruta. La profundidad procede de capas,
bordes, iluminación y arte registrado, no de paneles blancos intercambiables.

### Tipografía

- **Cinzel Decorative:** títulos de identidad y momentos de proclamación.
- **Cinzel:** encabezados, nombres de dominios y títulos de cartas.
- **Rajdhani:** navegación, controles, etiquetas y lectura operativa.
- **IBM Plex Mono:** valores, estados técnicos, identificadores y números que
  necesitan alineación.

El texto de acción debe ser corto y explícito. Un icono nunca reemplaza una
etiqueta crítica cuando el significado no sea obvio; los iconos decorativos
permanecen ocultos a lectores de pantalla.

## Lenguaje de iconos

### Regla semántica

Cada icono se elige por la acción o el objeto que representa, no por su
parecido superficial:

| Contexto | Símbolos canónicos |
|---|---|
| Entrada y navegación | `home`, `cards`, `collection`, `map`, `more` |
| Combate y formación | `attack`, `shield`, `target`, `crown`, `skull`, `deck` |
| Progresión | `missions`, `quests`, `trophy`, `achievements`, `progress`, `season` |
| Economía | `coin`, `wallet`, `ledger`, `market`, `deposit`, `withdrawal` |
| Mundo y social | `boss`, `raid`, `clans`, `friends`, `leaderboard`, `lore` |
| Estados y control | `check`, `warning`, `lock`, `refresh`, `close`, `volume-on`, `volume-off` |

La geometría base es lineal, de trazo redondeado y proporción `viewBox
0 0 24 24`. El color comunica estado sólo cuando el texto o el dato lo
confirma. No se usan emojis, iconos de sistema, caracteres Unicode ni
icon-fonts como salida final.

### Cobertura actual y deuda

- Web: `src/shared/components/ForgeIcon.tsx` contiene el catálogo tipado y las
  geometrías SVG consumidas por navegación, cartas, estados, economía y
  combate.
- Android: `mobile/components/ForgeIcon.tsx` conserva contratos históricos
  mediante aliases, pero renderiza las geometrías propias con
  `react-native-svg`.
- La guarda de identidad y los documentos de cierre existentes reportan
  cobertura estática sin sustitutos genéricos en el estado actual.
- Queda deuda de Q3: mantener el catálogo tipado cerrado, evitar que un nombre
  nuevo caiga en una forma por defecto y verificar visualmente las superficies
  completas en web y Android.

## Gramática de movimiento

Toda animación con significado de juego sigue cinco momentos, sólo cuando
exista un evento real que presentar:

1. **Anticipación:** prepara la mirada sin bloquear el input.
2. **Acción:** mueve o revela el objeto que corresponde al evento.
3. **Impacto:** hace legible el daño, escudo, curación, muerte o recompensa.
4. **Recuperación:** devuelve el foco a la información estable.
5. **Reposo:** mantiene una respiración ambiental tenue, nunca ruido constante.

La velocidad y la intensidad se modulan por contexto y por datos existentes
como rareza, facción, elemento o resultado cuando estén presentes. No se
repiten partículas o cámaras como sustituto de identidad. Un efecto no puede
cambiar ni sugerir un resultado distinto al autorizado por backend.

### Reduced motion

`prefers-reduced-motion` ya aparece en la hoja global y en varias superficies
de presentación, incluyendo batalla, cartas, carga y estado no encontrado.
Este lote establece la regla: al activarse, se conservan orden, causa,
resultado, contraste y feedback mediante transiciones cortas o estados
estáticos; se eliminan parallax, shake, spins, partículas repetitivas y
entradas que oculten el contenido. La cobertura global sigue siendo deuda
`VE-9` y no se declara resuelta por esta biblia.

## Gramática de audio

- `src/lib/audioEngine.ts`, `src/providers/AudioProvider.tsx` y
  `src/components/battle/AudioControls.tsx` son la cadena existente de
  reproducción y control.
- El audio contextual acompaña la ruta y el evento; no debe competir con
  nombres, estadísticas ni instrucciones.
- Los SFX de facción sólo se usan cuando el dato de facción es real. Un sonido
  común se acepta como lenguaje de interfaz compartido, no como identidad de
  una carta concreta.
- No se inventan voces ni líneas de lore. Si no existe una línea autorizada,
  se usa silencio o un motif no verbal documentado, con mute y volumen
  respetados.
- Reduced motion también reduce o elimina capas sonoras ligadas a efectos
  visuales; nunca elimina el texto o la explicación del estado.

## Aplicación en cuatro superficies de referencia

La biblia se prueba contra ejemplos reales, sin agregar una ruta nueva:

| Superficie | Fuente real | Decisión de identidad |
|---|---|---|
| Carta | `src/components/battle/BattleCard.tsx`, `src/routes/CardsRoute.tsx` | El arte oficial y sus datos dominan; stats e iconos explican la función sin cubrir la ilustración. |
| Batalla | `src/components/battle/ForgeFormationBoard.tsx` | Vanguardia, Campeón, Centinela, reserva, targeting y resultado siguen una lectura de escena; los efectos sólo presentan eventos autoritativos. |
| Ruta | `src/routes/CardsRoute.tsx` y el registro de assets | El fondo y el ambiente proceden del manifiesto; el contenido permanece por encima de la decoración y conserva carga/error/vacío explícitos. |
| Tutorial | `src/shared/components/TutorialOverlay.tsx` y `OnboardingModal.tsx` | El icono refuerza la acción guiada, no sustituye la explicación; el foco permanece sobre la interfaz real y permite recuperación. |

Para Android, el mismo contrato se expresa con `mobile/constants/visual.ts`,
los componentes nativos y el arte de Storage oficial. Las diferencias de
layout son de plataforma, no de identidad.

## Estados y accesibilidad

Cada superficie debe conservar `loading`, `empty`, `error`, `locked`,
`success` y `failure` sólo cuando apliquen a su contrato. Cada estado debe
tener escena, objeto, acción y feedback; si falta fuente de datos, se muestra
un estado explícito y accesible, nunca un sustituto diegético.

- Los controles críticos tienen etiqueta textual o accesible.
- Los SVG decorativos no duplican el nombre del control.
- El foco, teclado, tamaño táctil y contraste no se sacrifican por la
  composición.
- La información autoritativa se muestra aunque se reduzcan efectos.
- El layout se prueba por debajo de 480 px y en el viewport Android.

## Presupuesto y verificación

Este documento no añade assets, peticiones, partículas ni dependencias. La
implementación conserva los consumidores y el peso actuales. Antes de
promover una unidad a `OPERATIONAL` se requiere:

1. `npm run typecheck`.
2. `npm run verify:build`.
3. `npm run verify:ui-identity`.
4. `npm run verify:motion`.
5. `npm run verify:audio-flow`.
6. `npm run verify:manifest` y `npm run verify:assets`.
7. Revisión visual de una entrada, una carta, un error, un vacío, una batalla
   y una superficie Android; registrar evidencia sin inventar QA.

## Decisiones derivadas y reversibilidad

- **Derivada:** la biblia usa los tokens y catálogos existentes como contrato
  común web/Android en lugar de crear otro sistema visual.  
  **Contexto:** ambos clientes ya consumen ForgeIcon y registros de assets
  distintos por plataforma.  
  **Impacto:** reduce divergencia sin tocar Auth, RPCs, RLS, economía,
  combate ni datos.  
  **Reversibilidad:** cualquier regla futura puede versionarse en esta unidad
  y reabrirse como `CANDIDATE_FOR_REVIEW` sin borrar el historial.
- **Derivada:** la cobertura de reduced-motion se declara parcial.  
  **Contexto:** el código contiene soporte localizado, pero no existe todavía
  una evidencia única de matriz global.  
  **Impacto:** evita declarar Q3/Q5 por inferencia.  
  **Reversibilidad:** `VE-9` puede centralizar la política y elevar el nivel
  con una verificación dedicada.

## Criterio de aceptación y deuda

La unidad cumple Q2 documental cuando una carta, una batalla, una ruta y un
tutorial pueden describirse con la misma gramática de materiales, iconos,
movimiento, audio, estados y accesibilidad, sin inventar datos ni recursos.

Deuda para Q3:

1. Ejecutar la matriz visual en navegador y Android real.
2. Centralizar la evidencia de reduced-motion en todas las superficies
   animadas.
3. Auditar el catálogo móvil para impedir nombres sin geometría explícita.
4. Seleccionar tres cartas canónicas contrastantes y crear sus pasaportes
   `VE-CARD` antes de diseñar identidad audiovisual específica por carta.
5. Mantener pendiente cualquier asset visual o de audio que no esté inscrito
   en el manifiesto oficial.

**Condición de reapertura:** cambio de contrato de `ForgeIcon`, de los tokens,
del registro visual/audio, aparición de un consumidor genérico o evidencia
visual que muestre que una superficie ya no comparte identidad con el resto
del juego.