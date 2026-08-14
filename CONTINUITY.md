## 2026-08-14 — VE-1-LEADERBOARD-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `LeaderboardRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los sustitutos Unicode del clasificatorio sin cambiar la consulta, filtros, MMR, victorias, derrotas, tiers, posiciones, nombres de campeón ni resultados autoritativos.
- **Cambio:** `LeaderboardRoute.tsx` conserva la lógica y sustituye los pictogramas de rangos, medallas, tiers DPS, encabezado, actualización, estado vacío y campeón por nombres existentes de `ForgeIcon`; se tiparon los mappings para impedir iconos no registrados.
- **Alcance autoritativo:** no se modificaron Supabase, cartas, inventario, economía, recompensas, RPCs, RLS, datos de jugadores, audio ni navegación.
- **Evidencia de código y build:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, el escaneo del archivo objetivo y `git diff --check` finalizaron correctamente. El commit de implementación en `main` es `36898b396f1b8df7c389d8297bed270898a89dc4`.
- **Evidencia pendiente:** ejecutar `npm run verify:build` sobre el commit documental final, esperar la propagación automática y comparar `/build-manifest.json`, `index.html`, hashes de assets y rutas públicas contra `main`.
- **Responsive y accesibilidad:** `ForgeIcon` conserva `aria-hidden` y `focusable=false`; la revisión interactiva del ranking en escritorio, tablet y móvil, incluyendo focus, `prefers-reduced-motion` y una sesión normal autorizada, queda pendiente/bloqueada sin esa sesión.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir ante regresión visual o evidencia autenticada del ranking.
- **Siguiente acción verificable:** finalizar la verificación del build y del deploy público; después abordar otro consumidor Unicode independiente como unidad separada.

## 2026-08-14 — VE-1-SHARDS-ICON — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `ShardsPanel.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar el diamante Unicode del encabezado de Fragmentos de Forja sin cambiar la consulta, el balance, las rarezas, las cantidades, la progresión de forja ni ninguna regla autoritativa.
- **Cambio:** `ShardsPanel.tsx` conserva la estructura, textos, colores, tamaños y lógica existentes, importa `ForgeIcon` y reemplaza sólo `💎` por `ForgeIcon name="spark"`.
- **Alcance autoritativo:** no se modificaron Supabase, cartas, inventario, economía, fusión, recompensas, RPCs, RLS, datos de jugadores, audio ni navegación.
- **Evidencia de código y build:** `main` quedó en `e5216778327f82ec03bab42a8b27ef7cb2ff3a57`; `npm ci --ignore-scripts`, `npm run verify:build`, el escaneo de `ShardsPanel.tsx` y `git diff --check` finalizaron correctamente. El bundle local de `InventoryRoute` y el asset público correspondiente tienen el mismo SHA-256 `35054f92a6f15e21460c9ee0a9945f433f053465516892a6a0f4741d9e5f32c6`.
- **Evidencia pública:** `/build-manifest.json` publica el mismo `sourceCommit`; `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle`, `/packs` e `/inventory` respondieron HTTP 200. La captura pública de `/inventory` muestra la puerta de acceso canónica.
- **Responsive y accesibilidad:** `ForgeIcon` conserva `aria-hidden` y `focusable=false`; la revisión interactiva del panel con sesión normal, responsive, foco y `prefers-reduced-motion` queda bloqueada sin una sesión autorizada del jugador. No se declara `OPERATIONAL` ni se fabrican datos.
- **Deuda y condición de reapertura:** permanecen otros consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir sólo con evidencia autenticada del panel o al detectar una regresión del consumidor.
- **Siguiente acción verificable:** revisar `ShardsPanel` en `/inventory` con una sesión normal autorizada, o continuar con otro consumidor Unicode independiente como unidad separada.

## 2026-08-14 — VE-1-SESSION-SUMMARY-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `SessionSummaryToast.tsx`, `ForgeIcon`, Supabase vivo y el deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los sustitutos Unicode del resumen de sesión sin cambiar el registro de batallas, `sessionStorage`, umbral de aparición, duración, dismiss, textos, recompensas ni resultados autoritativos.
- **Cambio:** `SessionSummaryToast.tsx` conserva la lógica y sustituye la espada, la racha de fuego y el cierre por `ForgeIcon` (`attack`, `spark`, `close`), con iconos decorativos y composición visual equivalente.
- **Alcance autoritativo:** no se modificaron combate, settlement, economía, energía, recompensas, RPCs, RLS, cartas, Storage, datos de jugadores ni audio.
- **Evidencia local reconstruida desde `main`:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; el escaneo de la unidad no conserva `⚔️`, `🔥` ni `✕`. El commit de implementación en `main` es `3a11708b39cb16aa00446be95b237903cce4e798`.
- **Evidencia pública:** el índice público y los cuatro assets raíz coinciden con el build generado desde el código auditado; las rutas `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle` y `/build-manifest.json` respondieron HTTP 200. La revisión se completó después de la propagación automática.
- **Responsive y accesibilidad:** `ForgeIcon` mantiene `aria-hidden` y `focusable=false`; queda pendiente la revisión visual interactiva del toast en escritorio, tablet y móvil, foco y `prefers-reduced-motion`. No se declara `OPERATIONAL` sin esa evidencia.
- **Deuda y condición de reapertura:** el entorno no dispone de navegador interactivo para comprobar la presentación real; reabrir sólo con esa evidencia y no mezclar otros consumidores Unicode.
- **Siguiente acción verificable:** revisar el toast en navegador y después elegir otro consumidor Unicode independiente, sin reabrir unidades ya cerradas.
- **Bloqueo de sincronización canónica:** la Management API de Supabase acepta consultas de lectura y una escritura vacía de control, pero rechaza las actualizaciones con contenido documental mediante HTTP 403 / error 1010. No se usó `service_role` ni un privilegio alternativo; el registro vivo `vexforge_frontend_source_files` y el documento activo quedan pendientes de sincronización. **Condición de reapertura:** disponer de una vía autorizada que acepte esa escritura sin exponer ni elevar credenciales.

---

## 2026-08-14 — VE-1-TUTORIAL-EXIT-ICON — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y build raíz del repositorio.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar el pictograma Unicode de cierre del control `Saltar tutorial` sin cambiar navegación, persistencia, avance, skip/replay, datos ni resultados autoritativos.
- **Cambio:** `src/shared/components/TutorialOverlay.tsx` conserva el texto y la acción `skip()`, y reemplaza `×` por `ForgeIcon name="close"` dentro de una agrupación visual accesible; no se tocaron reglas del juego, RPCs, RLS, economía, recompensas, cartas, Storage ni audio.
- **Evidencia local:** commit de implementación `961deb283ba17bc32662d0186af1f150b59cf66d`; `npm ci --ignore-scripts` y `npm run verify:build` finalizaron correctamente; el build reportó `Build verificado: 961deb283ba17bc32662d0186af1f150b59cf66d`; el escaneo del consumidor confirmó ausencia de `Saltar tutorial ×` y presencia del icono canónico.
- **Responsive y accesibilidad:** el control mantiene su etiqueta textual, acción y botón nativo; queda pendiente revisión visual interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`.
- **Publicación:** pendiente de propagación automática de Cloudflare Pages; la unidad no se cierra como `OPERATIONAL` hasta que `/build-manifest.json` publique el commit auditado.
- **Condición de reapertura:** disponer de navegador interactivo y sesión normal si se necesita revisar el tutorial autenticado; mantener `IMPLEMENTED_UNVERIFIED` hasta obtener esa evidencia.
- **Siguiente acción verificable:** comprobar el manifiesto público y las rutas `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle`; después elegir otro consumidor Unicode independiente sin reabrir esta unidad por deuda ajena.

---

## 2026-08-13 — VE-1-ACHIEVEMENT-ICON-MAPPING — BLOCKED

- **Fuente canónica:** tabla viva `public.achievements` de Supabase y `AchievementToastCard.tsx`.
- **Estado inicial:** `PENDING_SOURCE`; **estado actual:** `BLOCKED`, objetivo Q3.
- **Hallazgo:** los valores reales de `achievements.icon` son datos canónicos Unicode por logro; no existe un mapping autorizado visible en el manifiesto o Storage para traducirlos a `ForgeIcon`.
- **Decisión:** no se sustituyeron el icono dinámico ni el fallback, porque hacerlo inventaría semántica y rompería la regla de procedencia.
- **Condición de reapertura:** registrar una fuente oficial o mapping aprobado por logro; entonces revisar el toast en responsive, foco y `prefers-reduced-motion`.

---

## 2026-08-13 — VE-1-INTERACTIVE-BATTLE-EXIT-ICON — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, `InteractiveBattleBoard.tsx`, `ForgeIcon`, Supabase activo y Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** el botón de salida conserva el texto `Salir` y su acción, pero ya no usa el pictograma Unicode `✕`; utiliza el icono SVG canónico `close`.
- **Alcance autoritativo:** no se modificaron settlement, resultados, recompensas, economía, energía, RPCs, RLS, datos de jugadores ni reglas de batalla.
- **Evidencia de fuente:** el consumidor objetivo quedó sin `✕`; la revisión interactiva de responsive, foco y `prefers-reduced-motion` queda pendiente.
- **Deuda y siguiente acción:** comprobar el botón en los estados de batalla relevantes y después elegir otro consumidor Unicode independiente.

---

## 2026-08-13 — VE-1-FORMATION-SELECTOR-CLOSE-ICON — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, `FormationSelector.tsx`, `ForgeIcon`, Supabase activo y Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** el control para limpiar una unidad de la formación ya no usa el pictograma Unicode `✕`; conserva la acción, feedback, estilos y flujo usando `ForgeIcon` con el icono canónico `close`.
- **Alcance autoritativo:** no se modificaron selección, formación, combate, RPCs, settlement, economía, recompensas, RLS, cartas, Storage ni datos de jugadores.
- **Evidencia de fuente:** el consumidor objetivo quedó sin `✕`; la revisión interactiva de responsive, foco y `prefers-reduced-motion` queda pendiente.
- **Deuda y siguiente acción:** comprobar el control dentro de la selección de formación en escritorio, tablet y móvil; después elegir otro consumidor Unicode independiente.

---

## 2026-08-13 — VE-1-WIN-STREAK-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, `WinStreakDisplay.tsx`, `ForgeIcon`, Supabase activo y Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** la racha ya no usa fuego, trofeo ni espada como pictogramas Unicode; conserva tiers, colores, valores, audio, persistencia, animaciones y textos usando iconos SVG propios.
- **Alcance autoritativo:** no se modificaron RPCs, settlement, economía, recompensas, RLS, cartas, Storage, datos de jugadores ni reglas de combate.
- **Evidencia de fuente:** el archivo objetivo no contiene los pictogramas Unicode retirados y sólo usa nombres existentes de `ForgeIcon`; la revisión interactiva de responsive, foco y `prefers-reduced-motion` queda pendiente.
- **Deuda y siguiente acción:** verificar la variante del badge y el panel en escritorio, tablet y móvil; después abordar otro consumidor Unicode independiente como una unidad separada.

---

## 2026-08-13 — VE-1-BATTLE-ATTACK-CINEMATIC-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, `CardAttackCinematic.tsx`, `ForgeIcon`, Supabase activo y Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** la cinemática de ataque ya no representa facciones, estadísticas, keywords, partículas, perfiles de carta, crítico ni eliminación con emojis o pictogramas Unicode; usa el lenguaje SVG propio de `ForgeIcon` y conserva textos, tiempos, daños, audio, animaciones y flujo existentes.
- **Alcance autoritativo:** no se modificaron RPCs, settlement, economía, recompensas, RLS, cartas, Storage, datos de jugadores ni resultados de combate.
- **Evidencia:** `npm run verify:build` y `npx tsc --noEmit -p tsconfig.app.json` finalizaron correctamente sobre la implementación; el archivo objetivo quedó sin coincidencias de pictogramas; `main` contiene el commit de implementación `dd9a8f109c08e27fd2b761a0791df3cd1f8e3ee2`; el registro documental posterior quedó en `main` y el build público se comprobó tras su propagación; `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` respondieron HTTP 200.
- **Deuda:** no se realizó QA interactivo en navegador para responsive, focus y `prefers-reduced-motion`; permanecen consumidores Unicode separados en otras superficies de combate, que no se mezclan en esta unidad.
- **Siguiente acción verificable:** revisar esta cinemática en escritorio, tablet y móvil, incluyendo focus y movimiento reducido; después elegir el siguiente consumidor Unicode independiente.

---\n\n## 2026-08-13 — VE-1-HOME-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `src/routes/HomeRoute.tsx`, `ForgeIcon`, Supabase activo y Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** la portada ya no usa emojis ni glyphs Unicode como sustitutos visuales en estadísticas, funciones, CTA, evento, carta del día, panel del jugador, actividad, ranking, partículas o navegación; usa el lenguaje SVG propio de `ForgeIcon` y conserva textos, enlaces, valores y datos reales.
- **Alcance autoritativo:** no se cambiaron RPCs, economía, combate, recompensas, RLS, Storage ni datos de jugadores. La actividad sigue leyendo su dato canónico y sólo cambia su representación visual.
- **Evidencia:** formato Prettier correcto; todos los nombres usados existen en `ForgeIcon`; la API de GitHub confirma cero coincidencias de los emojis objetivo en `HomeRoute.tsx`; `main` quedó en `a7947871931c10b10d428248f99878f1eec4712c`; `/build-manifest.json` publica ese commit; `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` responden HTTP 200; la captura pública de portada muestra los iconos propios renderizados.
- **Deuda:** no se ejecutó una revisión interactiva de responsive, foco y `prefers-reduced-motion` de todas las variantes de portada; tampoco se verificó el estado autenticado del panel del jugador con una sesión normal.
- **Siguiente acción verificable:** revisar la portada en escritorio, tablet y móvil, incluyendo el panel autenticado y movimiento reducido; después elegir el siguiente consumidor Unicode independiente.

---

## 2026-08-13 — VE-1-CARDS-INTERACTIVE-QA — BLOCKED

- **Fuente canónica:** código oficial `main`, Supabase activo y `https://vexforge-web.pages.dev/cards`.
- **Estado inicial:** `IMPLEMENTED_UNVERIFIED`, Q2; **estado actual:** `BLOCKED`, objetivo Q3.
- **Verificación realizada:** la implementación contiene selección por Enter/Espacio, foco visible, diálogo semántico, foco inicial/restaurado, cierre con Escape y lectura de `prefers-reduced-motion`; la hoja de estilos desactiva tilt/holograma y reduce animaciones cuando corresponde.
- **Evidencia pública:** el endpoint anónimo de `cards` devuelve registros activos; `/build-manifest.json` coincide con `main`; `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` responden HTTP 200.
- **Bloqueo real:** este entorno no dispone de un navegador automatizable ni de una sesión normal autenticada del jugador, por lo que no se puede comprobar honestamente la interacción, responsive, foco real ni movimiento reducido. No se fabricó QA ni se simularon datos.
- **Alcance:** no se modificaron código, Supabase, Storage, RPCs, RLS, economía, combate ni resultados autoritativos.
- **Condición de reapertura:** contar con navegador interactivo y sesión normal autorizada; revisar escritorio, tablet y móvil, Enter/Espacio, Escape, foco visible/restaurado y `prefers-reduced-motion`; sólo entonces elevar a `CANDIDATE_FOR_REVIEW` o `OPERATIONAL` con evidencia.

---

## 2026-08-13 — VE-1-CARDS-PUBLIC-REVIEW — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `main`, Supabase activo y `https://vexforge-web.pages.dev/cards`.
- **Estado inicial:** `IMPLEMENTED_UNVERIFIED`, Q2; **estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio en esta sesión:** no se modificó código, Supabase, Storage, RPCs, RLS, economía ni resultados autoritativos. Se verificó la publicación existente y la lectura pública del catálogo.
- **Evidencia pública:** `main` y `/build-manifest.json` exponen el mismo commit `7beb3d4b6ec3fa63fe1f78537dab49e418c607c9`; `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` responden HTTP 200; el endpoint público de `cards` devuelve registros activos.
- **Accesibilidad y responsive:** la captura pública no interactiva confirma la superficie visual, pero no sustituye la revisión de teclado/foco, `prefers-reduced-motion` ni la sesión normal autenticada requerida por el protocolo.
- **Bloqueo:** no se declara `Q3`, `OPERATIONAL` ni QA autenticada sin esa evidencia; no se fabricaron sesiones, colecciones ni resultados.
- **Siguiente acción verificable:** reabrir con una sesión normal autorizada del jugador y revisar escritorio, tablet y móvil, foco visible, diálogo, Escape y movimiento reducido; mantener esta unidad sin cambios hasta entonces.

---

## 2026-08-13 — VE-1-BATTLE-AUDIO-CONTROLS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `src/components/battle/AudioControls.tsx` y `src/shared/components/ForgeIcon.tsx` del código oficial en `main`.
- **Estado inicial:** `NOT_STARTED`. **Estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** los controles de audio ya no usan pictogramas Unicode para mute, configuración, música ni efectos; usan iconos SVG propios, conservando mute, sliders y valores reales.
- **Alcance autoritativo:** no se tocaron mezclas, volúmenes persistidos, lógica de `AudioEngine`, combate, economía, recompensas, RPCs, RLS ni datos de jugadores.
- **Accesibilidad y movimiento:** los botones exponen `aria-pressed`, el panel de volumen expone `aria-expanded` y `aria-label`, y los iconos decorativos mantienen `aria-hidden`; no se alteraron animaciones.
- **Evidencia local:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build`, `git diff --check` y el escaneo de los archivos de la unidad terminaron correctamente; no quedan pictogramas/símbolos visuales Unicode en ellos.
- **Evidencia Supabase:** se mantiene el proyecto `ACTIVE_HEALTHY`; no se modificó Supabase.
- **Deuda y bloqueo:** la revisión visual interactiva de controles dentro de una batalla sigue bloqueada sin una sesión normal autorizada del jugador; no se fabricó QA autenticada.
- **Siguiente acción verificable:** publicar el commit en `main`, comprobar que Cloudflare sirve el SHA fuente y revisar las variantes compacta/expandida en responsive, foco y `prefers-reduced-motion` con sesión normal.

## 2026-08-13 — VE-1-BATTLE-INTRO-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `src/components/battle/BattleIntroScreen.tsx` y `src/shared/components/ForgeIcon.tsx` del código oficial en `main`.
- **Estado inicial:** `NOT_STARTED`. **Estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** la introducción de batalla ya no usa pictogramas Unicode para facciones, runas, navegación ni decoración; conserva el flujo cinematográfico, nombres, colores, cuenta atrás y feedback existentes usando iconos SVG propios.
- **Alcance autoritativo:** no se tocaron daño, settlement, resultados, recompensas, economía, energía, RPCs, RLS, datos de jugadores ni reglas de batalla.
- **Accesibilidad y movimiento:** los SVG decorativos mantienen `aria-hidden`, el texto semántico permanece visible y no se alteraron las duraciones ni las animaciones del flujo.
- **Evidencia local:** `npm run verify:build`, `npx tsc --noEmit -p tsconfig.app.json`, `git diff --check` y el escaneo de `BattleIntroScreen.tsx` terminaron correctamente; no quedan pictogramas/símbolos visuales Unicode en la unidad.
- **Evidencia remota:** la consulta de Supabase confirmó el proyecto `ACTIVE_HEALTHY` y la existencia de las tablas canónicas; no se modificó Supabase. Tras el push, `main` quedó en `a1954193090cb26d0f8b8e629ce9a200f33483e3`; `/build-manifest.json` publicó el mismo commit y `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` respondieron `200`.
- **Deuda y bloqueo:** la revisión visual interactiva de combate sigue bloqueada sin una sesión normal autorizada del jugador; no se fabricaron resultados ni se declaró QA autenticada.
- **Siguiente acción verificable:** revisar la pantalla en navegador con una sesión normal autorizada, incluyendo responsive, foco y `prefers-reduced-motion`; mantener esta unidad `IMPLEMENTED_UNVERIFIED` hasta contar con esa evidencia.

## 2026-08-13 — VE-1-STARTER-DECK-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `src/shared/components/StarterDeckReveal.tsx` y `ForgeIcon` del código oficial en `main`.
- **Estado inicial:** `NOT_STARTED`. **Estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** la revelación del mazo inicial ya no usa pictogramas Unicode para facciones, portada vacía, estadísticas ni CTA; todos los indicadores usan iconos SVG propios de `ForgeIcon`, conservando el texto y los valores reales.
- **Alcance autoritativo:** no se tocaron asignación del mazo, RPC `vexforge_assign_starter_deck`, cartas, economía, recompensas, energía, RLS ni reglas del juego.
- **Accesibilidad y movimiento:** se mantiene el texto semántico y los títulos de estadísticas; no se añadieron animaciones nuevas ni se alteró la duración del flujo existente.
- **Evidencia local:** `npm run build`, `npx tsc --noEmit -p tsconfig.app.json` y `git diff --check` finalizaron correctamente. El escaneo del archivo no conserva pictogramas visuales Unicode; las tildes y el texto español no son sustitutos visuales.
- **Evidencia pública:** commit `0c080a40dc828990f75e80ea9580afab0b1f5b3b` en `main`; el check de Cloudflare terminó en `success`; `/build-manifest.json` publica el mismo commit y `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` responden HTTP 200.
- **Deuda y bloqueo:** la verificación autenticada del onboarding sigue bloqueada sin sesión normal autorizada del jugador; no se fabricaron resultados ni se declaró QA autenticada.
- **Siguiente acción verificable:** revisar la revelación del mazo inicial en navegador con una sesión normal autorizada, incluyendo responsive, foco y `prefers-reduced-motion`; mantener esta unidad `IMPLEMENTED_UNVERIFIED` hasta contar con esa evidencia.

## 2026-08-13 — VE-1-BATTLE-UNICODE-MICRO-FIX — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** `src/components/battle/BattleBoardEngine.tsx` y `src/styles.css` en `main`.
- **Estado inicial:** `IMPLEMENTED_UNVERIFIED`. **Estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** el indicador de crítico y el daño flotante conservan su feedback pero usan `ForgeIcon`; el divisor visual del tablero usa una forma CSS propia en lugar de un glifo Unicode.
- **Restricción preservada:** no se cambiaron daño, settlement, resultados autoritativos, recompensas, economía, energía, RPCs, RLS ni datos de jugadores.
- **Evidencia local y pública:** `npm run verify:build` finalizó correctamente; los dos archivos editados no contienen los glifos Unicode objetivo; `main` quedó en `de52d49f49262b847b9b855460b2405536b2ceea`, `/build-manifest.json` publica ese commit y `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` responden HTTP 200.
- **Deuda y bloqueo:** la superficie de batalla requiere sesión autenticada para revisar el flujo interactivo; no se fabricaron resultados ni se declaró QA autenticada. Persisten consumidores Unicode en otros lotes de combate.
- **Siguiente acción verificable:** revisar el flujo interactivo en navegador con sesión normal; sin esa sesión, mantener la unidad `BLOCKED` para QA autenticada y abordar el siguiente consumidor como unidad separada.

## 2026-08-13 — VE-1-BATTLE-UNICODE-DEBT — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, especialmente `src/lib/battleTypes.ts`, `src/components/battle/BattleBoardEngine.tsx` y `src/components/battle/InteractiveBattleBoard.tsx`.
- **Estado inicial:** `NOT_STARTED`. **Estado actual:** `IMPLEMENTED_UNVERIFIED`, objetivo Q3.
- **Cambio:** se retiraron los sustitutos Unicode del lenguaje visible de combate: facciones, estadísticas, keywords, turnos, daño, KO, drenaje, veneno, guardia, curación, estados, controles, resultados, partículas y placeholders ahora usan `ForgeIcon` o texto semántico.
- **Restricción preservada:** no se cambiaron daño, settlement, resultados autoritativos, recompensas, economía, energía, RPCs, RLS ni datos de jugadores.
- **Evidencia:** `main` en `133170cca8bf1d40b8da0fff2a903ee8cf11abd1`; escaneo de los tres archivos afectados sin coincidencias de los glifos objetivo; `https://vexforge-web.pages.dev/build-manifest.json` publica el mismo commit; `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle` y `/build-manifest.json` respondieron HTTP 200.
- **Deuda:** falta revisión interactiva en navegador de legibilidad, foco, `prefers-reduced-motion` y responsive para el flujo de batalla. No se realizaron pruebas autenticadas ni se simularon resultados.
- **Siguiente acción verificable:** reabrir esta unidad sólo con evidencia de navegador; después continuar con la siguiente unidad oficial elegible sin reabrir trabajo histórico.

## 2026-08-13 — VE-1-CARDS-ACCESSIBILITY-REDUCED-MOTION — IMPLEMENTED_UNVERIFIED

- **Fuente canónica:** código oficial `main`, `src/routes/CardsRoute.tsx` y
  `src/styles.css`, reconciliados con Supabase activo y el deploy público.
- **Estado inicial:** `CANDIDATE_FOR_REVIEW`, Q2. **Estado actual:** `IMPLEMENTED_UNVERIFIED`,
  objetivo Q3.
- **Cambio:** las tarjetas ahora son operables con Enter/Espacio y exponen foco visible;
  el detalle usa diálogo semántico, foco inicial/restaurado y cierre con Escape; filtros
  tienen etiquetas y `aria-pressed`; el tilt y holograma respetan `prefers-reduced-motion`.
- **Evidencia:** commit `c586e288a26f648bea95904145473ca4b34ebc58` en `main`;
  `npm run verify:build` y `npx tsc --noEmit -p tsconfig.app.json` finalizaron
  correctamente; Cloudflare publica el mismo commit en `/build-manifest.json`.
  `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle` y `/build-manifest.json`
  respondieron HTTP 200. El bundle público contiene los marcadores de teclado,
  diálogo y `prefers-reduced-motion`; la captura post-publicación muestra las
  127 cartas cargadas.
- **Bundle público:** `assets/index-CHk8jG-Q.js` SHA-256
  `1da5221f60566beb7f77cecc78468b8e154572a8ca83d0664247cea1c1e10713`;
  `assets/CardsRoute-Sr7CBDiK.js` SHA-256
  `6c71c1143c2af14c2a872cc0953a4c72264151be704fb55fbbbb46080c30a171`;
  `assets/index-CgrJ7iqE.css` SHA-256
  `91fba4fd93a42a38d1e109043e3c15b715105c0e6bfd4f11eec05329e7f74ff9`.
- **Deuda:** no se realizaron pruebas autenticadas ni se simularon resultados de
  juego; queda una revisión interactiva de teclado/foco y reduced motion para elevar
  la unidad a Q3, además del siguiente lote de Unicode de combate.
- **Siguiente acción verificable:** reabrir la unidad sólo con evidencia de navegador
  para foco/reduced motion; después continuar con `VE-1-BATTLE-UNICODE-DEBT`.

## 2026-08-13 — VE-SYSTEM-CANONICAL-BUILD-SYNC — OPERATIONAL

- **Fuente canónica:** código oficial `main`, raíz del repositorio, `package.json`,
  `vite.config.ts` y el build automático de Cloudflare Pages.
- **Problema corregido:** `main` contenía un `dist/` precompilado anterior al código
  fuente y además una segunda copia histórica en `vexforge/dist/`. El build real de
  la raíz generaba otro bundle; por eso la comparación contra el `dist/` versionado
  señalaba erróneamente que el público estaba desactualizado.
- **Corrección:** se eliminó la salida anidada y la publicación manual del package;
  `dist/` pasó a ser salida generada, se añadió `build-manifest.json` con el commit
  fuente y `npm run verify:build` valida commit, index y assets antes del push.
- **Evidencia:** `npm ci --ignore-scripts`, `npm run build` y la verificación del
  bundle produjeron `index-Ce_aGBEF.js` y `CardsRoute-CE5dWwEr.js`; sus SHA-256 son
  `89a05f2b308c1f5ebca305175e808fd6c6257e20f6e966698ee051384396eb36` y
  `a24c2143389de9a72bb39ee8f94b9e6a52597063badafef5da44e71af99650ef`, coincidiendo
  con los assets públicos observados.
- **Estado actual:** `OPERATIONAL`, Q2; la fuente y el build quedan unificados y el
  cierre de cada sesión exige verificar el manifiesto público del commit.
- **Siguiente acción:** continuar con la revisión visual responsive, focus y
  `prefers-reduced-motion` de la unidad de cartas; no reabrir esta sincronización.

## 2026-08-12 — VE-1-CARDS-ICON-BATCH — CANDIDATE_FOR_REVIEW

- **Fuente canónica:** código oficial `main` y `ForgeIcon`.
- **Objetivo:** retirar pictogramas Unicode visibles del compendio de cartas sin cambiar valores, filtros, navegación, audio, estados ni reglas autoritativas.
- **Lote:** `src/routes/CardsRoute.tsx` usa `ForgeIcon` para facciones, cabecera, filtros, estados de carga/vacío, badges, acciones, cierre y estados de colección.
- **Estado actual:** `CANDIDATE_FOR_REVIEW`, Q2; objetivo Q3.

### Evidencia

- `main` en commit `2295c2b5837311616259d9dc5aa6e79fc7cebc28`; check de Cloudflare Pages `completed/success`.
- `npm ci` y `npm run build` finalizaron correctamente; el build produjo `index-Ce_aGBEF.js` y `CardsRoute-CE5dWwEr.js`.
- SHA-256 del entrypoint local y público: `89a05f2b308c1f5ebca305175e808fd6c6257e20f6e966698ee051384396eb36`.
- SHA-256 del chunk `CardsRoute` local y público: `a24c2143389de9a72bb39ee8f94b9e6a52597063badafef5da44e71af99650ef`.
- `/`, `/manifest.json`, `/tutorial`, `/cards` y `/battle` respondieron HTTP 200; el catálogo vivo contiene 127 cartas activas y el acceso anónimo al recurso `cards` respondió correctamente.
- No se alteraron eventos, cálculos, textos, duración de animaciones, settlement, economía, RPCs, RLS, datos canónicos ni Storage.

### Deuda y condición de reapertura

- Falta evidencia de revisión visual responsive, navegación por teclado/focus y `prefers-reduced-motion` para cerrar el lote en Q3.
- Persisten pictogramas Unicode en otras superficies de combate; deben abordarse como lotes separados y revisables.

### Siguiente acción verificable

- Reabrir con una revisión de navegador en escritorio, tablet y móvil, incluyendo focus y movimiento reducido; después elegir el siguiente consumidor Unicode independiente.

---

## 2026-08-12 — VE-PROTOCOL-PUBLICATION-FLOW-AMENDMENT — SUPERSEDED

- **Fuente canónica:** VEXFORGE_PROTOCOL_V2.md y política operativa del repositorio oficial.
- **Cambio permanente:** el push a `main`, la publicación automática vinculada de Cloudflare Pages y la comprobación pública forman parte obligatoria del cierre; no requieren autorización adicional. Se mantiene prohibida únicamente la publicación manual o paralela.
- **Estado:** SUPERSEDED; la discrepancia se resolvió reconciliando el código fuente
  con el artefacto generado desde la raíz. Esta entrada ya no es una instrucción
  activa ni un estado pendiente de la continuidad.
- **Evidencia final:** el build de la raíz genera el mismo entrypoint y chunk de cartas
  que sirve el deploy público; la evidencia vigente está en la entrada
  `VE-SYSTEM-CANONICAL-BUILD-SYNC`.

---

# VEXFORGE — CONTINUITY ACTIVA

## 2026-08-12 — VE-SYSTEM-BUILD-SYNC — OPERATIONAL

- **Fuente canónica:** código oficial `main`, commit `b47f8c4962f89bf66459beadad53f9b18ae941e2`.
- **Objetivo:** reconstruir y versionar el bundle de producción para que el build generado por `main` quede reflejado antes del cierre.
- **Verificación:** `npm ci` y `npm run build` finalizaron correctamente; el bundle local `dist/assets/index-CpbXz6oq.js` coincide byte a byte con el bundle público servido por Cloudflare.
- **Estado actual:** `OPERATIONAL`, Q2; commit publicado en `main`, check automático de Cloudflare `completed/success` y bundle público verificado.
- **Evidencia:** SHA-256 público y local `fc5226ee529e22a0d2d299b28d8ff9b11ac53d60c8baedfd94c4cc4b47d34a7e`.
- **Alcance:** sólo artefactos de build y continuidad; no se modificaron lógica de juego, economía, contratos, RPCs, RLS, datos canónicos ni Storage.
- **Siguiente acción:** continuar con la revisión visual pendiente de VE-1 en responsive, focus y `prefers-reduced-motion`; no declarar Q3 hasta contar con esa evidencia.

---

## 2026-08-12 — VE-1-BATTLE-CARD-ICON-BATCH — IN_PROGRESS

- **Fuente canónica:** código oficial `main` y `ForgeIcon`; no se usaron los assets genéricos sin mapping semántico.
- **Objetivo:** retirar los pictogramas Unicode de la tarjeta de combate sin cambiar valores, animaciones, estados ni reglas.
- **Lote:** `src/components/battle/BattleCard.tsx` usa `ForgeIcon` para placeholder de facción, poison, HP, ATK, DEF, SPD, derrota y badges de keywords mediante un mapping local explícito.
- **Estado provisional:** `IMPLEMENTED_UNVERIFIED`, Q2; pendiente de sincronización y propagación pública.

---


## 2026-08-12 — VE-1-BATTLE-EFFECTS-ICON-BATCH — CANDIDATE_FOR_REVIEW

- **Fuente canónica:** código oficial `main` y `ForgeIcon`; no se asignaron los assets `icon_01`–`icon_07` porque el manifiesto vivo no autoriza esa semántica.
- **Objetivo:** retirar pictogramas Unicode de la capa visual de efectos flotantes sin alterar eventos, números, textos, duración ni reglas autoritativas.
- **Lote:** `src/components/battle/BattleEffects.tsx` usa `ForgeIcon` para shield, poison, lifesteal, double strike, rush y critical.
- **Estado inicial:** `CANDIDATE_FOR_REVIEW` de VE-1 con deuda Unicode en combate.
- **Estado actual:** `CANDIDATE_FOR_REVIEW`, Q2; objetivo Q3.

### Evidencia

- Supabase confirmó `project_version = ve1-2026-08-12-effects` para `BattleEffects.tsx` y `CONTINUITY.md`; el marcador `ForgeIcon` está presente y el pictograma de poison ya no aparece en la fuente de `BattleEffects`.
- El check de Cloudflare Pages del commit de implementación terminó en `success`.
- La portada pública, `/manifest.json`, `/tutorial`, `/cards` y `/battle` respondieron HTTP 200; el bundle principal se sirvió como JavaScript real con 242 KB.
- No se alteraron eventos, cálculos, textos, duración de animaciones, settlement, economía ni reglas autoritativas.

### Deuda y reapertura

- Persisten pictogramas Unicode en `BattleBoardEngine`, `BattleCard`, `BattleIntroScreen`, `CardAttackCinematic`, `ForgeFormationBoard`, `InteractiveBattleBoard`, `AudioControls` y `WinStreakDisplay`.
- Reabrir la unidad por lote separado cuando exista tiempo para revisar cada superficie con responsive, focus y `prefers-reduced-motion`.

---


## 2026-08-12 — VE-1-ICON-LANGUAGE-PILOT — IN_PROGRESS

### Primera operación verificable

- **Fuente canónica:** manifiesto vivo `vexforge_official_asset_manifest` y `ForgeIcon` del código oficial en `main`.
- **Estado inicial:** `PENDING_SOURCE` para `icon_01`–`icon_07`; el manifiesto no asigna consumidores ni semántica funcional.
- **Lote ejecutado:** se sustituyeron los pictogramas Unicode de `KeywordTooltip` y `KeywordActivationFX` por iconos SVG propios de `ForgeIcon`.
- **Alcance autoritativo:** no se tocaron resultados de combate, settlement, economía, RPCs, RLS, cartas, lore, Storage ni reglas del juego.
- **Procedencia:** no se copiaron ni reinterpretaron los JPEG genéricos del paquete oficial.
- **Accesibilidad y movimiento:** se conserva el texto visible de cada keyword; el icono se mantiene decorativo y las animaciones existentes no cambian su duración ni su lógica.

### Estado actual

- `VE-1-ICON-LANGUAGE-PILOT`: `CANDIDATE_FOR_REVIEW`.
- **Nivel:** Q2 actual, objetivo Q3.
- **Deuda:** permanecen otros consumidores Unicode en superficies de combate; deben abordarse en lotes separados y revisables.
- **QA pendiente:** responsive, focus, reduced motion y bundle público requieren verificación posterior a la propagación de `main`; no se declara `OPERATIONAL` todavía.

### Evidencia de verificación

- GitHub `main` contiene el commit de implementación de este lote y el check de Cloudflare Pages terminó en `success`.
- La portada pública, `/manifest.json`, `/tutorial`, `/cards` y `/battle` respondieron HTTP 200 después de la propagación.
- Supabase confirmó `project_version = ve1-2026-08-12` para `KeywordTooltip.tsx`, `KeywordActivationFX.tsx`, `CONTINUITY.md` y `replit.md`; los marcadores de implementación están presentes y no queda referencia al plan retirado.
- La inspección del bundle público todavía encuentra Unicode en otras superficies de combate no incluidas en este lote; esto queda como deuda y no como fallo de esta unidad.

### Siguiente acción verificable

- Revisar visualmente este lote en navegador con evidencia responsive, focus y `prefers-reduced-motion`; después abordar el siguiente consumidor Unicode como una unidad separada.

---

## Autoridad vigente

- **Protocolo activo:** `VEXFORGE_PROTOCOL_V2.md` en la raíz de este repositorio.
- **Código oficial:** rama `main` de `grandmaster68081-byte/Vexforge-web`.
- **Backend, datos, RPCs, RLS y Storage:** proyecto oficial de Supabase `rscuzqnfccqvltkdcdny`.
- **Frontend público:** Cloudflare Pages `https://vexforge-web.pages.dev`, propagado desde `main`.

## Registro de esta sesión — 2026-08-11

### VE-SYSTEM-CANONICAL-SOURCE-FLOW — REFINED

- Se detectó que el antiguo plan de trabajo y su matriz de validación seguían visibles como si fueran instrucciones activas.
- Se retiraron esos documentos del árbol operativo del repositorio.
- Se eliminó de la guía del repositorio la obligación de leerlos y se sustituyó por la referencia única al protocolo V2 y a esta continuidad.
- El historial de Git permanece intacto; conservarlo no convierte sus documentos retirados en autoridad vigente.
- No se modificaron lógica de juego, economía, RPCs, RLS, cartas, lore, Storage ni migraciones aplicadas.

### Estado

- **Unidad:** `VE-SYSTEM-CANONICAL-SOURCE-FLOW`
- **Estado:** `REFINED`
- **Nivel actual:** `Q3` documental
- **Objetivo:** que una sesión nueva encuentre primero la fuente V2 y no un plan histórico.

## Deuda y bloqueos

- La validación autenticada normal del jugador/owner requiere una sesión interactiva autorizada. Sin ella no se fabrican resultados ni se declara QA autenticada.
- La semántica de los assets sólo puede inferirse cuando existe mapping oficial en el manifiesto o en una fuente canónica autorizada.

## Siguiente acción verificable

- Leer primero `VEXFORGE_PROTOCOL_V2.md`, después esta continuidad y las fuentes activas de `backend/`.
- Elegir la unidad más pequeña, reversible y verificable que indique el protocolo V2.
- Registrar cualquier cambio real aquí y no reabrir material histórico retirado salvo que el owner lo reincorpore explícitamente como una nueva fuente vigente.

## Historial

Los commits anteriores siguen disponibles en Git para auditoría y reversión. Los documentos históricos retirados no deben copiarse ni tratarse como plan activo.