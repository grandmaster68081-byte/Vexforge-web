## 2026-08-16 — VE-1-PANELS-SIGNALS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-PANELS-SIGNALS-ICON-LANGUAGE (chevrones de colapso en paneles compartidos y señales de ventaja en PvP).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Baseline:** commit `90d2b7c10f65c6556e8a52adc5fdc60963a3d406`.
- **Auditoría:** barrido Unicode sobre todo `src/`. Los repositorios y hooks no contienen glyphs visibles; los restos se concentraban en `DeckStatsPanel`, `ClanWarsPanel`, `SeasonRewardsPanel` (`▼`) y `PvpRoute` (`▲`, `▼`, `◆`).
- **Cambio:** los tres paneles usan `ForgeIcon name="chevron-right"` con rotación `90deg`/`-90deg` para el estado cerrado/abierto (misma transición de 0.25s); `PvpRoute` sustituye los marcadores de ventaja por `ForgeIcon` (`attack` favorable, `warning` desventaja, `shield` equilibrado) junto al texto, en `inline-flex` con `gap`.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, MMR, emparejamiento, temporadas ni clanes; sólo presentación e iconografía.
- **Accesibilidad:** SVG decorativos (`aria-hidden`, `focusable=false`); los botones de panel conservan su texto visible como nombre accesible y no cambian tamaño táctil.
- **Decisión de alcance:** `•` (viñeta de lista en `DeckBuilderRoute`, `SeasonRankingsRoute`, `ForgeAdsRoute`) y `×` (multiplicador) se conservan por ser tipografía legítima, no sustitutos de icono.
- **Evidencia local:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; `rg` sobre `dist/assets/*.js` no encuentra `▼`/`▲`/`◆`.
- **Deuda y condición de reapertura:** quedan glyphs sólo en comentarios de código (no visibles). Reabrir ante regresión de paneles/PvP o mapping canónico contradictorio.
- **Evidencia pública:** pendiente en esta entrada; se verifica tras el deploy.
- **Siguiente acción verificable:** revisión visual interactiva responsive con foco y `prefers-reduced-motion` real sobre paneles colapsables; QA autenticado sigue `BLOCKED` sin sesión de jugador real.

---

## 2026-08-16 — VE-1-BATTLE-COMPONENTS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-BATTLE-COMPONENTS-ICON-LANGUAGE (símbolos de control y encabezado de log en el tablero interactivo de batalla).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Baseline:** commit `be4cf5f9f3088e5294a150f840a407e82bc373ec`.
- **Auditoría:** barrido Unicode sobre `src/components/battle/*` y `src/lib/forgeFormation.ts`. `ForgeFormationBoard`, `BattleCinematicScreen`, `TutorialBattle`, `ContextualHint`, `FormationSelector`, `BattleBoardEngine`, `BattleResultScreen` y `CardAttackCinematic` ya sólo conservan glyphs en comentarios de código, no en superficie visible. Únicos sustitutos visibles: `⏸`, `▶` (x2) en `InteractiveBattleBoard.tsx`.
- **Cambio:** `InteractiveBattleBoard.tsx` usa `ForgeIcon` (`pause`, `play`, `chevron-right`) en los controles "Pausar" y "Auto" y en el encabezado "LOG DE BATALLA", envueltos en `inline-flex` con `gap` para alineación óptica. Sin cambios de texto, orden ni tamaño táctil.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, MMR, motor de combate, formaciones, RAGE ni navegación; sólo presentación e iconografía.
- **Accesibilidad:** los SVG siguen decorativos (`aria-hidden`, `focusable=false`) y cada botón conserva su texto visible como nombre accesible.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; `rg` sobre `dist/assets/*.js` no encuentra `▶`/`⏸`.
- **Deuda y condición de reapertura:** `×` como multiplicador tipográfico legítimo se conserva (`WinStreakDisplay`, `BattleEffects`, `FormationSelector`). Permanecen glyphs en comentarios de código (no visibles) y superficies aún no auditadas fuera de batalla. Reabrir ante regresión de batalla o mapping canónico contradictorio.
- **Evidencia pública:** pendiente en esta entrada; se verifica tras el deploy (`build-manifest.json`, HTTP 200 y navegación real sin errores de consola).
- **Siguiente acción verificable:** unidad `VE-1-HOOKS-REPOSITORIES-ICON-LANGUAGE` sobre glyphs en repositorios de home/perfil/deck y `TutorialOverlay`; QA autenticado sigue `BLOCKED` sin sesión de jugador real.

---

## 2026-08-16 — VE-1-ECONOMY-INVENTORY-ARROW-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-ECONOMY-INVENTORY-ARROW-LANGUAGE (flechas tipográficas visibles en Economía, Evolución y Sistema/Assets).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los últimos `←`/`→` de superficie visible fuera de batalla sin tocar economía, balances, evolución, depósitos, retiros, autenticación ni navegación.
- **Cambio:** `EconomyRoute.tsx` (CTA "Iniciar sesión", "Depositar", "Retirar") y `EvolutionRoute.tsx` (indicador de transición rareza origen -> destino) usan `ForgeIcon name="chevron-right"`; `AssetsRoute.tsx` usa `ForgeIcon name="chevron-left"` en el enlace "Volver al inicio" e importa `ForgeIcon`. Layouts pasan a `inline-flex` con `gap` para alineación óptica correcta.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, wallet, VEX, fees, mínimos de retiro, rutas ni sesiones; sólo presentación e iconografía.
- **Responsive y accesibilidad:** los SVG siguen decorativos (`aria-hidden`, `focusable=false`) y cada enlace conserva su texto visible como nombre accesible; sin cambios de tamaño táctil ni animaciones.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; el escaneo de `src/routes/*.tsx` ya no conserva `←`/`→` en JSX (solo comentarios de código).
- **Deuda y condición de reapertura:** permanecen glyphs en datos de motores (`aiBattleEngine.ts`, `missionEncounterEngine.ts`, `dailyChallenge.ts`, `forgeFormation.ts`) y separadores en `TutorialOverlay`/repositorios, fuera de esta unidad. Reabrir ante regresión de economía o mapping canónico contradictorio.
- **Evidencia pública:** con consultas cache-busting, `build-manifest.json` publicó `sourceCommit=381a6726b0638123e6307ce66ae08f35d0e3b452`; `/`, `/economy`, `/cards`, `/battle` y `/packs` respondieron HTTP 200. Hashes SHA-256 coincidentes local/público y sin `←`/`→`: `EconomyRoute-CH5erpXa.js` (`5514239dd0a182c826339aa45cc8e988fc41f80111f1e31017da259096597e78`); `EvolutionRoute-COpFAu9C.js` (`f1eb8e2813d67ca2387594e8c38187f125557c18b448c11e4cf58408d55173cd`); `AssetsRoute-CcmXxFTU.js` (`50ab587ef500c1d14ad6be740df6550ee2a990382ee69a0ab6fc9438059b273c`).
- **Siguiente acción verificable:** cadena siguiente sobre los glyphs de datos de motores y revisión visual interactiva responsive con foco y `prefers-reduced-motion` real; no se declara `OPERATIONAL` sin evidencia de navegador real ni sesión autenticada normal.

---

## 2026-08-16 — VE-1-BATTLE-UI-ARROW-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-BATTLE-UI-ARROW-LANGUAGE (flechas tipográficas visibles en preparación de batalla, tutorial de batalla, hints contextuales y log de combate).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los sustitutos Unicode `←`/`→` de la superficie visible de batalla sin cambiar formaciones, daño, RAGE, Forge Ascension, resultados, autenticación ni datos autoritativos.
- **Cambio:** `FormationSelector.tsx` (botón Cancelar) y `TutorialBattle.tsx` + `ContextualHint.tsx` (botones Siguiente) usan `ForgeIcon` (`chevron-left`, `chevron-right`) junto al texto; la descripción de rarezas de `ContextualHint.tsx` y las tres entradas del log de `ForgeFormationBoard.tsx` (`[ATK]`/`[CRIT]`, `RAGE +1`, `REEMPLAZO`) pasan a separador ASCII conservando orden, nombres y cifras.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, MMR, motor de combate ni navegación; sólo texto de presentación e iconografía.
- **Evidencia local:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; el escaneo de `src/components/battle` sólo conserva flechas en comentarios de código, no en UI.
- **Responsive y accesibilidad:** los SVG siguen decorativos (`aria-hidden`, `focusable=false`) y los botones mantienen su texto visible como nombre accesible; no se alteraron tamaños táctiles ni animaciones.
- **Deuda y condición de reapertura:** permanecen glyphs en datos de motores (`aiBattleEngine.ts`, `missionEncounterEngine.ts`, `dailyChallenge.ts`, `forgeFormation.ts`) y flechas en otras rutas (`PacksRoute`, `FusionRoute`, `EvolutionRoute`, `CosmeticsRoute`, `AssetsRoute`, `WithdrawalRoute`, `EconomyRoute`, repositorios de home/pvp/daily, `TutorialOverlay`), fuera de esta unidad. Reabrir ante regresión de batalla o mapping canónico contradictorio.
- **Evidencia pública:** con consultas cache-busting, `build-manifest.json` publicó `sourceCommit=cc3b2bbe241606ca54e198613b6594426bdb58d7`; `/`, `/battle`, `/pvp`, `/cards`, `/packs` y `/economy` respondieron HTTP 200. Los hashes SHA-256 de `index-BxXiRXo-.js` y `PvpRoute-C-0gU_t7.js` coinciden local/público y ninguno de los dos chunks conserva `←`/`→`.
- **Siguiente acción verificable:** cadena siguiente sobre las flechas de rutas de economía/inventario y los glyphs de datos de motores, más revisión visual interactiva responsive con foco y `prefers-reduced-motion`; no se declara `OPERATIONAL` sin evidencia de navegador real ni sesión autenticada normal.

---

## 2026-08-16 — VE-1-LOADER-404-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-LOADER-404-ICON-LANGUAGE (runas tipográficas decorativas de `PageLoader.tsx` y `NotFoundRoute.tsx`).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los últimos glyphs Unicode decorativos de carga y 404 (`✦ ◈ ⬡ ✧ ◆ ⊕ ★ ⟐ ⊗ ⬢`, bloques de glitch `▓░▒█…`, flechas `←`/`→`) sin cambiar rutas, datos, autenticación ni resultados autoritativos.
- **Cambio:** `PageLoader.tsx` orbita ahora `ForgeIcon` (`spark`, `star`, `fusion`, `energy`, `relics`) en lugar de caracteres tipográficos y expone `role="status"`/`aria-live="polite"` con el mensaje como nombre accesible; `NotFoundRoute.tsx` usa `ForgeIcon` en partículas flotantes (`spark`, `star`, `fusion`, `relics`, `energy`, `shield`, `attack`, `veil`, `resonance`, `flux`), separador (`spark`) y CTAs (`chevron-left`, `chevron-right`), y su alfabeto de glitch pasa a caracteres propios de marca (`VEXFORGE0123456789ABCDEF/\|_-`).
- **Accesibilidad y movimiento:** ambas superficies añaden bloque `@media (prefers-reduced-motion: reduce)` que anula animaciones (orbitas, scan CRT, glitch, pulsos) conservando contenido y contraste; los SVG siguen decorativos (`aria-hidden`, `focusable=false`).
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, MMR, autenticación ni navegación.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; el escaneo Unicode de ambos consumidores no conserva los glyphs objetivo.
- **Deuda y condición de reapertura:** permanecen glyphs en datos de motores (`aiBattleEngine.ts`, `missionEncounterEngine.ts`, `dailyChallenge.ts`, repositorios de home/perfil/deck), fuera de esta unidad. El escaneo del bundle público añade deuda observada: flechas y separadores tipográficos (`←`, `→`) en la preparación de batalla y en el log de combate del chunk principal `index`, fuera de esta unidad. Reabrir ante regresión de carga/404, discrepancia del bundle público o mapping canónico contradictorio.
- **Evidencia pública:** con consultas cache-busting, `build-manifest.json` publicó `sourceCommit=bea81f8ac743ce189ca1d0d8ac4e4b78b3550db8`; `/`, `/cards`, `/battle`, `/packs`, `/economy`, `/clans`, una ruta inexistente y `/build-manifest.json` respondieron HTTP 200. Los hashes SHA-256 de `NotFoundRoute-Y0J4fXOX.js` (`1dbb7f74ed04107a227c5462d0a79c71892eaa6f4deee58a474d41e617085a5d`) e `index-aYc4YTRf.js` (`0911b02a635ac05017d8973288c7a1a8495503e134e69f526b447d5e2113b084`) coinciden local/público; el chunk público de 404 no conserva glyphs objetivo y ambos incluyen la regla `prefers-reduced-motion`.
- **Siguiente acción verificable:** cadena siguiente sobre los glyphs de datos de motores y las flechas del chunk principal, y revisión visual interactiva responsive (escritorio, tablet, móvil) con foco y `prefers-reduced-motion` real; no se declara `OPERATIONAL` sin evidencia de navegador real ni sesión autenticada normal.

---

## 2026-08-16 — VE-1-SHARED-STATES-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ForgeIcon`, Supabase vivo y deploy público.
- **Unidad:** VE-1-SHARED-STATES-ICON-LANGUAGE (cierres y marcadores Unicode en Inventario, PvP, Reliquias, ContextualHints y LevelUpModal).
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los últimos sustitutos Unicode visibles de cierre (`✕`), energía (`⚡`) y celebración (`⭐`) sin cambiar datos, filtros, MMR, recompensas, autenticación ni resultados autoritativos.
- **Cambio:** `InventoryRoute.tsx` (cierre de modal de carta y botón Limpiar), `PvpRoute.tsx` (cierres de banners de VEX, cap diario y cambio de MMR), `RelicsRoute.tsx` (insignia EQUIPADA y cabecera de reliquias activas), `ContextualHints.tsx` (cierre) y `LevelUpModal.tsx` (marca de subida de nivel) usan mappings canónicos de `ForgeIcon` (`close`, `energy`, `star`). Los botones sin texto visible reciben `aria-label="Cerrar"`.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, inventario, MMR, autenticación ni navegación.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y `git diff --check` finalizaron correctamente; el escaneo Unicode de los cinco consumidores no conserva los glyphs objetivo.
- **Responsive y accesibilidad:** los SVG de `ForgeIcon` permanecen decorativos (`aria-hidden`/`focusable=false`), los cierres ganan nombre accesible y se conservan textos, colores y callbacks. Queda pendiente revisión visual interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`.
- **Deuda y condición de reapertura:** permanecen runas tipográficas decorativas en `PageLoader.tsx` y `NotFoundRoute.tsx`, y glyphs en datos de motores (`aiBattleEngine.ts`, `missionEncounterEngine.ts`, `dailyChallenge.ts`, repositorios de home/perfil/deck); no se mezclan con esta unidad. Reabrir ante regresión de estas superficies, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** cadena siguiente sobre las runas decorativas de carga y 404, y revisión visual interactiva responsive con foco y `prefers-reduced-motion`; no se declara `OPERATIONAL` sin evidencia de navegador real ni sesión autenticada normal.

---

## 2026-08-15 — VE-1-ECONOMY-ICON-LANGUAGE — CANDIDATE_FOR_REVIEW

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN.
- **Unidad:** VE-1-ECONOMY-ICON-LANGUAGE. **Fuente canónica:** código real de main, ForgeIcon, Supabase vivo y protocolo VEXFORGE.
- **Estado inicial:** NOT_STARTED; **estado actual:** CANDIDATE_FOR_REVIEW; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar sustitutos Unicode de la ruta de Economía sin cambiar balances, ledger, filtros, navegación, autenticación, RPCs, RLS ni resultados autoritativos.
- **Cambio:** EconomyRoute.tsx conserva consultas, cálculos, filtros, cantidades, etiquetas y callbacks; las métricas públicas, el podio, el estado de acceso, los movimientos, la actualización y los CTAs usan mappings semánticos de ForgeIcon.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, datos de jugadores, autenticación ni reglas del juego.
- **Evidencia local:** el checkout b0fbc17cfa706f8082dfb747145152dcdd8cf4c8 pasó npm run verify:build y git diff --check; el chunk EconomyRoute-DxD2zvzV.js y dist/index.html fueron reconstruidos correctamente.
- **Responsive y accesibilidad:** los iconos son decorativos (aria-hidden/focusable=false) y los textos/controles visibles se conservan; queda pendiente revisión visual interactiva responsive, foco y prefers-reduced-motion.
- **Deuda y condición de reapertura:** otros consumidores Unicode independientes no se mezclan con esta unidad. Reabrir ante regresión de Economía, discrepancia del bundle o mapping canónico contradictorio.
- **Evidencia pública:** build-manifest.json publicó sourceCommit=b0fbc17cfa706f8082dfb747145152dcdd8cf4c8; /, /economy, /tutorial, /cards, /battle, /packs, /manifest.json y /build-manifest.json respondieron HTTP 200. El hash SHA-256 del chunk EconomyRoute-DxD2zvzV.js (7d3782a84fa36e578821048a42234a053e348a2e7d311672d7249b47b4f227cd) y de index.html (5a1d4a2d238338e0ac0568f9499b56b8422192d1e465b7d039166b525d3784fd) coincide local/public; el chunk público no conserva sustitutos Unicode objetivo.
- **Siguiente acción verificable:** revisión visual interactiva en escritorio, tablet y móvil, incluyendo foco y prefers-reduced-motion; elevar sólo con evidencia de navegador real.

---

## 2026-08-15 — VE-1-CLANS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ClansRoute.tsx`, `ClanWarsPanel.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar sustitutos Unicode de la superficie de Clanes sin cambiar datos, roles, guerras, acciones, autenticación ni resultados autoritativos.
- **Cambio:** `ClansRoute.tsx` conserva sus callbacks, estados, permisos y textos; guerra, identidad de clan, roles, encabezado, cierres, desplegables y CTAs usan mappings canónicos de `ForgeIcon` (`attack`, `clans`, `crown`, `spark`, `close`, `chevron-*`).
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, autenticación, navegación ni reglas de clanes.
- **Evidencia local:** el escaneo del consumidor no conserva los glyphs objetivo; `git diff --check` y `npm run verify:build` finalizaron correctamente sobre el candidato publicado `b1afdfe7f67bfc5aed457c912259850fc701b653`.
- **Evidencia pública:** con consultas cache-busting, `build-manifest.json` publicó `sourceCommit=b1afdfe7f67bfc5aed457c912259850fc701b653`; `/`, `/clans`, `/manifest.json`, `/tutorial`, `/cards`, `/battle` y `/packs` respondieron HTTP 200. El bundle público de Clanes (`ClansRoute-DhcURRbP.js`) no conserva los glyphs objetivo y contiene los mappings `ForgeIcon` canónicos.
- **Responsive y accesibilidad:** se conservaron botones nativos, textos visibles y acciones existentes; `ForgeIcon` permanece decorativo. Queda pendiente revisión visual interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`, además de cualquier flujo autenticado normal.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir ante regresión de Clanes, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** mantener la unidad `IMPLEMENTED_UNVERIFIED` hasta contar con revisión visual interactiva responsive, foco, `prefers-reduced-motion` y cualquier prueba autenticada normal autorizada; no fabricar sesiones ni resultados.

## 2026-08-15 — VE-1-ERROR-BOUNDARY-ICON-LANGUAGE — OPERATIONAL

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: estado de recuperación global en ErrorBoundary.
- Fuente canónica: código real de main, ForgeIcon y protocolo VEXFORGE.
- Objetivo: retirar sustitutos Unicode de advertencia y reintento sin cambiar diagnóstico, recuperación, textos, autenticación, datos ni resultados autoritativos.
- Cambio: se incorporó ForgeIcon con los mappings canónicos warning y refresh; se conservaron el color de advertencia y la acción Reintentar.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, inventario ni navegación.
- Evidencia: actualización confirmada por GitHub Contents API en main; build y revisión visual interactiva quedan pendientes de verificación proporcional.
- Responsive y accesibilidad: ForgeIcon conserva aria-hidden y focusable=false; la acción y su texto visible permanecen sin cambios.
- Deuda y condición de reapertura: verificar bundle público, build y estados responsive antes de elevar la unidad a OPERATIONAL; reabrir ante discrepancia del mapping o regresión del recovery flow.
- Siguiente acción verificable: comprobar que main y el deploy sirven la unidad actualizada sin errores.

## 2026-08-14 — VE-1-EMPTY-STATE-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `EmptyState`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar iconos Unicode usados como propiedades de presentación en estados vacíos vivos sin cambiar textos, filtros, acciones, datos, autenticación ni resultados autoritativos.
- **Cambio:** `SeasonPassRoute.tsx`, `RelicsRoute.tsx`, `LoreRoute.tsx` y `FriendsRoute.tsx` conservan sus flujos y sustituyen los iconos de texto de `EmptyState` por mappings semánticos existentes de `ForgeIcon`: temporada, reliquias, lore, amigos, notificaciones y desafíos.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas, inventario, autenticación ni navegación.
- **Evidencia local:** `npm run verify:build` y `git diff --check` finalizaron correctamente; el build verificado corresponde al commit `9b5056aa01831614ddeefe41697a39c7d0a0976f`; no quedan props `icon="..."` en los consumidores `EmptyState`.
- **Evidencia pública:** `/build-manifest.json` publica `sourceCommit=9b5056aa01831614ddeefe41697a39c7d0a0976f`; `/`, `/tutorial`, `/cards`, `/battle`, `/packs`, `/friends`, `/lore`, `/relics` y `/season-pass` respondieron HTTP 200.
- **Responsive y accesibilidad:** los SVG de `ForgeIcon` permanecen decorativos (`aria-hidden`/`focusable=false`) y los textos visibles se conservan; queda pendiente revisión interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies, incluidos otros elementos de las mismas rutas; no se mezclan con esta unidad. Reabrir ante regresión de un estado vacío, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** encadenar otro consumidor vivo de iconografía sin reabrir unidades anteriores; mantener esta unidad `IMPLEMENTED_UNVERIFIED` hasta contar con evidencia visual interactiva.

## 2026-08-14 — VE-1-ACCOUNT-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `AccountRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar sustitutos Unicode genéricos de Cuenta sin cambiar inicio de sesión, registro, recuperación, cierre de sesión, navegación ni sesión autoritativa.
- **Cambio:** `AccountRoute.tsx` conserva todos sus estados, callbacks y llamadas de autenticación; el estado de sesión activa, las cuatro tarjetas de navegación y el regreso al inicio usan `ForgeIcon`, y el separador visual genérico del encabezado se reemplaza por texto de marca.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, autenticación, economía, recompensas ni datos de jugadores.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build` y el escaneo del consumidor finalizaron correctamente; `AccountRoute.tsx` no conserva los glyphs objetivo. El commit de implementación en `main` es `7983c311e7b54a16c5bc5b6b854963cb3e7dabf2`.
- **Responsive y accesibilidad:** `ForgeIcon` mantiene `aria-hidden` y `focusable=false`; queda pendiente revisar la cuenta autenticada y las pantallas de acceso en escritorio, tablet y móvil, foco y `prefers-reduced-motion`. No se declara `OPERATIONAL` ni se fabrican sesiones.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir sólo ante regresión de Cuenta, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** esperar la propagación automática y comprobar `/build-manifest.json`, `/`, `/account`, `/manifest.json` y el bundle servido; después continuar con otro consumidor Unicode independiente.

## 2026-08-14 — VE-1-SETTINGS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `SettingsRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar sustitutos Unicode genéricos de Configuración sin cambiar preferencias, autenticación, guardado, navegación ni datos autoritativos.
- **Cambio:** `SettingsRoute.tsx` conserva sus consultas, callbacks y estados, sustituye la iconografía del encabezado y secciones por `ForgeIcon`, elimina glyphs de los modos de interfaz y usa un chevron semántico para los enlaces; el toast conserva su mensaje y tipo de éxito sin prefijo genérico.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, autenticación, economía, recompensas ni preferencias persistidas.
- **Evidencia local:** `npm ci --ignore-scripts`, `npx tsc --noEmit -p tsconfig.app.json` y `npm run verify:build` finalizaron correctamente; la unidad no conserva los sustitutos Unicode objetivo. El commit de implementación en `main` es `923337bfe2193c5c99391462b83e99bf4ace8ced`.
- **Evidencia pública:** `/build-manifest.json` publica `sourceCommit=923337bfe2193c5c99391462b83e99bf4ace8ced`; `/`, `/manifest.json`, `/settings` y las rutas principales auditadas respondieron HTTP 200. El bundle público de Configuración no conserva los glyphs objetivo.
- **Responsive y accesibilidad:** `ForgeIcon` mantiene `aria-hidden` y `focusable=false`; queda pendiente revisar la ruta autenticada en escritorio, tablet y móvil, foco y `prefers-reduced-motion`. No se declara `OPERATIONAL` ni se fabrican datos.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir sólo ante regresión de Configuración, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** revisar visualmente la ruta autenticada en navegador con evidencia responsive, foco y `prefers-reduced-motion`; después continuar con otro consumidor Unicode independiente sin reabrir esta unidad por deuda ajena.

## 2026-08-14 — VE-1-DECK-BUILDER-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `DeckBuilderRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los pictogramas genéricos del Constructor de Mazos sin cambiar selección de cartas, filtros, validación, guardado, cálculo DPS, campeón ni datos autoritativos.
- **Cambio:** `DeckBuilderRoute.tsx` conserva el flujo y sustituye la iconografía Unicode de cartas, energía, advertencias, búsqueda, validación, guardado, DPS, campeón, encabezado, cierre y estados vacíos por `ForgeIcon` semántico. Los textos, límites y callbacks permanecen sin cambios.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, autenticación, economía, recompensas ni reglas de construcción de mazos.
- **Evidencia local:** el candidato pasó `npm ci --ignore-scripts`, `npm run verify:build`, `git diff --check` y el escaneo del consumidor; no conserva pictogramas Unicode en `DeckBuilderRoute.tsx`. El commit de código publicado en `main` es `8a97b77d7c627d0f86fe5b37ac046b7cf4a8fa70`.
- **Responsive y accesibilidad:** `ForgeIcon` mantiene `aria-hidden` y `focusable=false`; queda pendiente la revisión visual interactiva en escritorio, tablet y móvil, foco, `prefers-reduced-motion` y una sesión normal autorizada del jugador. No se declara `OPERATIONAL` ni se fabrican datos.
- **Deuda y condición de reapertura:** permanecen otros consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir sólo ante regresión del Constructor, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** esperar la propagación automática, comprobar `/build-manifest.json`, `/`, `/deck-builder`, `/manifest.json` y el bundle servido; después continuar con otro consumidor Unicode independiente.

---

## 2026-08-14 — VE-1-COSMETICS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `CosmeticsRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los pictogramas genéricos de la superficie de Cosméticos sin cambiar consultas, propiedad, equipamiento, desequipamiento, filtros, autenticación ni datos autoritativos.
- **Cambio:** `CosmeticsRoute.tsx` conserva su flujo y sustituye la iconografía Unicode del preview, loadout, filtros de tipo, estado vacío, encabezado y acciones de cierre/actualización por `ForgeIcon` con un mapping semántico por tipo de cosmético. Los textos y la lógica de `useCosmetics` permanecen sin cambios.
- **Alcance autoritativo:** no se modificaron Supabase, Storage, RPCs, RLS, cartas, economía, recompensas, autenticación ni reglas de equipamiento.
- **Evidencia local:** el candidato pasó `npm ci --ignore-scripts`, `npm run verify:build`, `git diff --check` y el escaneo del consumidor; no conserva pictogramas Unicode en `CosmeticsRoute.tsx`. El commit de código publicado en `main` es `a0ba7716aed0a848feaf0446f728af8fc0c44407`.
- **Responsive y accesibilidad:** `ForgeIcon` mantiene `aria-hidden` y `focusable=false`; queda pendiente la revisión visual interactiva en escritorio, tablet y móvil, foco, `prefers-reduced-motion` y una sesión normal autorizada del jugador. No se declara `OPERATIONAL` ni se fabrican datos.
- **Deuda y condición de reapertura:** permanecen otros consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir sólo ante regresión de Cosméticos, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** esperar la propagación automática, comprobar `/build-manifest.json`, `/`, `/cosmetics`, `/manifest.json` y el bundle servido; después continuar con otro consumidor Unicode independiente.

---

## 2026-08-14 — VE-1-CLAN-WARS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO / IMPLEMENTACIÓN. **Fuente canónica:** código real de `main`, `ClanWarsPanel.tsx`, `ForgeIcon`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los pictogramas Unicode de la superficie Clan Wars sin cambiar datos de clanes, guerras, roles, estados, acciones, autenticación ni reglas autoritativas.
- **Cambio:** `ClanWarsPanel.tsx` conserva el flujo y sustituye guerra, identidad de clan, roles, estado vacío y CTAs por iconos SVG existentes de `ForgeIcon`; el mapping de roles queda tipado y los textos visibles se mantienen.
- **Correcciones de compilación asociadas:** se corrigieron una ruta de importación de `ForgeIcon` y dos fallbacks de presentación que aún referían una propiedad eliminada; ahora usan el icono canónico del terreno. No se modificaron settlement, economía, RPCs, RLS, datos ni Storage.
- **Evidencia local:** el candidato `60c5830b38fbacdf93b30b08c0521d7e36e86355` pasó `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build`, `git diff --check` y el escaneo del consumidor; no quedan pictogramas visuales Unicode en `ClanWarsPanel.tsx`.
- **Responsive y accesibilidad:** se conservan botones nativos, textos semánticos y acciones existentes; `ForgeIcon` permanece decorativo. Queda pendiente la revisión visual interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`, además de cualquier prueba autenticada normal del jugador.
- **Deuda y condición de reapertura:** la unidad no se eleva a `OPERATIONAL` sin evidencia de navegador; reabrir ante regresión del panel, discrepancia del bundle público o mapping canónico contradictorio.
- **Siguiente acción verificable:** promover el candidato, esperar la propagación automática y comprobar `/build-manifest.json`, `/`, `/pvp`, `/manifest.json` y el bundle servido; después continuar con otro consumidor independiente sin reabrir esta unidad por deuda ajena.

---

## 2026-08-14 — VE-1-FORMATION-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Unidad:** `VE-1-FORMATION-ICON-LANGUAGE`. **Fuente canónica:** `main`, `ForgeIcon`, `ForgeFormationBoard.tsx`, Supabase vivo y deploy público.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar pictogramas genéricos de la formación y sus cinemáticas sin alterar simulación, daño, settlement, resultados, recompensas, economía, energía, RPCs, RLS ni datos autoritativos.
- **Cambio:** el terreno de facción, partículas de invocación, medidores de rage, rarezas, reserva, jefe entrante, objetivo, salida, logs, reliquias, formación pura y estados vacíos usan `ForgeIcon` propio o texto semántico; se conservaron colores, timing, etiquetas y flujo visual.
- **Evidencia:** commit de código `b7ab96e01f74`; escaneo autenticado del blob de `main` sin los pictogramas objetivo ni `particleEmoji`; tras la propagación, `build-manifest.json` publicó `sourceCommit` coincidente y `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle`, `/packs` y `/build-manifest.json` respondieron HTTP 200.
- **Responsive y accesibilidad:** los iconos se mantienen decorativos (`aria-hidden`/`focusable=false` en `ForgeIcon`) y las etiquetas visibles permanecen; queda pendiente revisión interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`.
- **Deuda y bloqueo:** el escaneo global conserva consumidores Unicode en otras superficies; no se mezclan con esta unidad. La revisión autenticada normal del jugador sigue bloqueada sin sesión interactiva autorizada; no se fabricaron resultados.
- **Siguiente acción verificable:** encadenar el siguiente consumidor vivo independiente de iconografía, manteniendo esta unidad `IMPLEMENTED_UNVERIFIED` hasta contar con evidencia visual interactiva.

---

## 2026-08-14 — VE-1-PACK-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código de `main`, `ForgeIcon`, `PackOpenSequence.tsx`, `PacksRoute.tsx`, manifiesto/Storage y deploy público.
- **Estado inicial:** `IN_PROGRESS`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar emojis y símbolos genéricos de la superficie real de packs sin alterar compra, apertura, pity timer, cartas obtenidas, duplicados, fragmentos, inventario ni recompensas.
- **Cambio:** el mapping de packs ahora usa nombres `ForgeIcon` semánticos; la apertura, explosión, reverso de carta, resumen, rareza, navegación, inventario, título, pity timer, compra y apertura pendiente usan `ForgeIcon` y texto visible.
- **Restricción preservada:** no se modificaron RPCs, settlement, economía, RLS, autenticación, datos de cartas, metadatos autoritativos ni Storage.
- **Evidencia:** commit `8e7b3d87b1b37d74ed7bb519ec32b880b31a4487`; build-manifest público con `sourceCommit` coincidente; `/`, `/packs`, `/manifest.json` y `/build-manifest.json` respondieron HTTP 200; lectura autenticada de los blobs de `main` sin coincidencias de los sustitutos Unicode objetivo en ambos archivos.
- **Responsive y accesibilidad:** los iconos siguen siendo decorativos (`aria-hidden`/`focusable=false` en `ForgeIcon`) y el texto de las acciones permanece visible; queda pendiente revisión interactiva autenticada y responsive.
- **Deuda y condición de reapertura:** el escaneo global aún encuentra consumidores genéricos en otras superficies; no se mezclan con esta unidad. Reabrir si el bundle público deja de coincidir o si una revisión visual revela pérdida de jerarquía o foco.
- **Siguiente acción verificable:** encadenar el siguiente consumidor vivo de iconografía sin esperar selección intermedia.

---

## 2026-08-14 — VE-SYSTEM-AUTONOMOUS-CONTEXTUAL-EXECUTION-LAW — REFINED

- **Tipo de sesión:** DOCUMENTACIÓN / RECONCILIACIÓN. **Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, Supabase vivo y deploy público.
- **Estado inicial:** `IN_PROGRESS`; **estado actual:** `REFINED`; **nivel:** Q3 documental; **objetivo:** Q4 para el flujo autónomo documentado.
- **Cambio:** se incorporó la Ley de Ejecución Autónoma Contextual. La IA debe encadenar unidades sin detenerse por decisiones rutinarias, y cuando falte un recurso visual debe comprender el contexto, comprobar todas las fuentes, crear un candidato propio con prompt, negative prompt y procedencia, integrarlo sin alterar datos autoritativos y continuar con trabajo seguro.
- **Guardas preservadas:** no se exponen secretos, no se fabrican sesiones o resultados, no se suplantan jugadores, no se falsea QA, no se alteran RLS/RPCs/economía/historial y no se salta el flujo autorizado para acciones irreversibles.
- **Reconciliación adicional:** `backend/pending/backend-gaps.md` ahora distingue sus cifras históricas de las métricas live verificadas: 215 tablas públicas, 93 vistas, 335 funciones, RLS 215/215 y 0 vistas `SECURITY DEFINER` detectadas.
- **Evidencia:** `main` auditado en `b8460d00c5f2284e70e9a82d020738ef11a76ad7`; Supabase `ACTIVE_HEALTHY`; consulta read-only HTTP 201; `/`, `/manifest.json`, `/tutorial`, `/cards`, `/battle` y `/build-manifest.json` respondieron HTTP 200.
- **Deuda y condición de reapertura:** la ley queda sujeta a verificación de build y bundle público después de la propagación automática; las pruebas que requieran una sesión normal siguen requiriendo evidencia autenticada real y no se fabrican.
- **Siguiente acción verificable:** continuar automáticamente con la siguiente unidad viva de presentación o sistema, sin reabrir trabajo histórico ni esperar una selección intermedia.

---

## 2026-08-14 — VE-1-WORLD-BOSS-STATUS-ICON — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `WorldBossesRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar el check Unicode del estado de ataques recientes sin cambiar el estado autoritativo del ataque, settlement, recompensas, energía ni autenticación.
- **Cambio:** el estado `completed` conserva su color y condición, reemplaza `✓` por `ForgeIcon name="check"` y añade el texto visible `Completado` para mantener claridad y accesibilidad; los demás estados siguen mostrando su valor real.
- **Alcance autoritativo:** no se modificaron Supabase, RPCs, RLS, combate, economía, recompensas, cartas, Storage ni reglas de World Boss.
- **Evidencia local:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run verify:build`, `git diff --check` y el escaneo del consumidor finalizaron correctamente antes de publicar el commit.
- **Responsive y accesibilidad:** el estado conserva texto semántico y el icono `ForgeIcon` es decorativo; queda pendiente revisar la lista autenticada en escritorio, tablet y móvil, foco y `prefers-reduced-motion`.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies y no se mezclan con esta unidad. Reabrir ante regresión del estado de ataque o evidencia canónica contradictoria.
- **Siguiente acción verificable:** comprobar el manifiesto público y revisar la lista de ataques recientes con una sesión normal autorizada; no fabricar una sesión ni resultados.

## 2026-08-14 — VE-1-CONTEXTUAL-HINTS-ICON-LANGUAGE — DEFERRED

- **Tipo de sesión:** AUDITORÍA / CORRECCIÓN. **Fuente canónica:** código real de `main`, `App.tsx`, `CardsRoute.tsx`, `ContextualHints.tsx`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `IMPLEMENTED_UNVERIFIED`; **estado actual:** `DEFERRED`; **nivel actual:** Q1 para este componente no montado; **objetivo:** Q3 cuando exista un consumidor real.
- **Hallazgo:** la búsqueda en `App.tsx` y `CardsRoute.tsx` no encontró ningún montaje de `ContextualHint` ni `useContextualHint`; la captura pública de `/cards` tampoco mostró el hint. El componente no forma parte actualmente de una superficie visible verificable.
- **Decisión:** se revirtió únicamente el cambio de iconos de `ContextualHints.tsx` para no mantener una mejora sin consumidor ni inventar un flujo de producto. No se añadió wiring nuevo, no se cambió la arquitectura y no se tocaron datos ni lógica autoritativa.
- **Evidencia:** el commit previo `4a0311fbd879393be55cab63dece0b0e6cd5b6c0` se comprobó publicado, pero la unidad queda sin cerrar por falta de consumidor real. Esta corrección conserva el historial y deja la unidad explícitamente aplazada.
- **Bloqueo y condición de reapertura:** reabrir solo cuando una ruta real monte el componente y exista un criterio de primera visita comprobable; entonces mapear iconos canónicos, revisar responsive, foco y `prefers-reduced-motion`, y repetir build/deploy.
- **Siguiente acción verificable:** elegir otra unidad que sí tenga un consumidor vivo; no continuar con `ContextualHints.tsx` como si fuera una superficie operativa.

## 2026-08-14 — VE-1-PROGRESS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `ProgressRoute.tsx`, `AnimatedProgressBar.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar pictogramas Unicode de la superficie de progreso sin cambiar lecturas de progreso, cálculos de nivel/XP/energía, navegación, autenticación ni estados autoritativos.
- **Cambio:** `ProgressRoute.tsx` conserva el flujo y sustituye los pictogramas de progreso, XP, energía, tutorial y navegación por `ForgeIcon`; `AnimatedProgressBar` acepta `ReactNode` para renderizar el icono canónico sin convertirlo en texto.
- **Alcance autoritativo:** no se modificaron Supabase, RPCs, RLS, economía, energía, recompensas, cartas, Storage ni reglas del juego.
- **Evidencia local:** sobre el árbol de `main` previo al cambio, `npx tsc --noEmit -p tsconfig.app.json` y `npm run verify:build` finalizaron correctamente; el build verificó el SHA base `10396c76301b69ba3a459ab4bd605308af8f5fed`. El cambio se publica en un commit atómico separado sobre ese mismo `main`.
- **Responsive y accesibilidad:** se mantiene el texto semántico y la navegación nativa; queda pendiente la revisión visual interactiva en escritorio, tablet y móvil, foco y `prefers-reduced-motion`, además de una sesión normal autorizada si se prueban datos autenticados.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies y no se mezclan con esta unidad. Reabrir ante regresión de progreso o evidencia canónica contradictoria.
- **Siguiente acción verificable:** comprobar que el manifiesto público refleja el commit de esta unidad y revisar la superficie de progreso en navegador antes de cerrar el estado.

## 2026-08-14 — VE-1-FUSION-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de main, FusionRoute.tsx, ForgeIcon, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** NOT_STARTED; **estado actual:** IMPLEMENTED_UNVERIFIED; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los sustitutos Unicode de la superficie Crucible de Fusión sin cambiar selección de cartas, políticas, costes, shards, mutación de fusión ni estados autoritativos.
- **Cambio:** se conservaron la lógica, textos, condiciones y flujo, sustituyendo la carta vacía, el encabezado, el resultado exitoso y la acción principal por iconos SVG canónicos de ForgeIcon.
- **Alcance autoritativo:** no se modificaron Supabase, RPCs, RLS, cartas, economía, recompensas, inventario ni reglas de fusión.
- **Responsive y accesibilidad:** se mantiene el botón nativo, el texto semántico y los estados existentes; queda pendiente la revisión visual interactiva en escritorio, tablet y móvil, foco y prefers-reduced-motion.
- **Evidencia pendiente:** ejecutar build desde la raíz, comprobar el consumidor objetivo y verificar que el bundle público y build-manifest corresponden al commit auditado.
- **Deuda y condición de reapertura:** revisar otros consumidores Unicode independientes como unidades separadas; reabrir por regresión del Crucible o evidencia canónica contradictoria.
- **Siguiente acción verificable:** terminar la verificación local y pública de esta unidad antes de elegir el siguiente consumidor.

## 2026-08-14 — VE-1-ENERGY-BAR-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `EnergyBar.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar el rayo Unicode del indicador global de energía sin cambiar la sincronización `sync_player_energy`, el cálculo de porcentaje, el contador de regeneración, los estados de autenticación ni los datos autoritativos.
- **Cambio:** `EnergyBar.tsx` conserva toda la lógica y sustituye el pictograma por `ForgeIcon name="energy"`, manteniendo el color y glow dependientes del porcentaje.
- **Alcance autoritativo:** no se modificaron Supabase, RPCs, RLS, economía, energía autoritativa, recompensas, cartas, audio ni navegación.
- **Evidencia local:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, el escaneo del archivo objetivo y `git diff --check` finalizaron correctamente. El commit de implementación en `main` es `5553bcee0d0bcb89de62d379255e067b975a87a5`.
- **Evidencia de build y deploy:** `npm run verify:build` pasó sobre el commit documental `3466fa694d9e4dbd3c857499ede0fe8d80fa0206`, y `/build-manifest.json` publicó ese mismo `sourceCommit`. El `index.html` local y público coincidió en SHA-256 `cbedcb0ee9ad37085e73d75807054b5253cb2cdf82f3545b1c2acecc6328cf68`. La unidad usa el bundle compartido de la aplicación; `/`, `/leaderboard`, `/cards`, `/battle`, `/inventory`, `/tutorial`, `/packs`, `/manifest.json` y `/build-manifest.json` respondieron HTTP 200.
- **Responsive y accesibilidad:** `ForgeIcon` conserva `aria-hidden` y `focusable=false`; la revisión interactiva del indicador en escritorio, tablet y móvil, focus, movimiento reducido y una sesión normal autorizada queda pendiente/bloqueada sin esa sesión.
- **Deuda y condición de reapertura:** permanecen consumidores Unicode independientes en otras superficies; no se mezclan con esta unidad. Reabrir ante regresión del indicador global o evidencia autenticada contradictoria.
- **Siguiente acción verificable:** finalizar la verificación del build y del deploy público; después abordar otro consumidor Unicode independiente como unidad separada.

## 2026-08-14 — VE-1-LEADERBOARD-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- **Tipo de sesión:** REFINAMIENTO. **Fuente canónica:** código real de `main`, `LeaderboardRoute.tsx`, `ForgeIcon`, Supabase vivo y deploy automático de Cloudflare Pages.
- **Estado inicial:** `NOT_STARTED`; **estado actual:** `IMPLEMENTED_UNVERIFIED`; **nivel actual:** Q2; **objetivo:** Q3.
- **Objetivo:** retirar los sustitutos Unicode del clasificatorio sin cambiar la consulta, filtros, MMR, victorias, derrotas, tiers, posiciones, nombres de campeón ni resultados autoritativos.
- **Cambio:** `LeaderboardRoute.tsx` conserva la lógica y sustituye los pictogramas de rangos, medallas, tiers DPS, encabezado, actualización, estado vacío y campeón por nombres existentes de `ForgeIcon`; se tiparon los mappings para impedir iconos no registrados.
- **Alcance autoritativo:** no se modificaron Supabase, cartas, inventario, economía, recompensas, RPCs, RLS, datos de jugadores, audio ni navegación.
- **Evidencia de código y build:** `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, el escaneo del archivo objetivo y `git diff --check` finalizaron correctamente. El commit de implementación en `main` es `36898b396f1b8df7c389d8297bed270898a89dc4`.
- **Evidencia de build y deploy:** `npm run verify:build` pasó sobre el commit documental `77081b5e459aae58604f8d0cdb650ad1c4405bd1`, y `/build-manifest.json` publicó ese mismo `sourceCommit`. El `index.html` local y público coincidió en SHA-256 `18c42640a21c294752aec67180f66165918b224c5d46dc017392b33dd55103a2`; el chunk público `LeaderboardRoute-CeCdXzTx.js` coincidió en SHA-256 `6e02bc4af3d9e8e720d9f69716d0e24de71713e6e5504d7f58bd0dfa07e6b06f`. `/`, `/leaderboard`, `/cards`, `/battle`, `/inventory`, `/tutorial`, `/packs`, `/manifest.json` y `/build-manifest.json` respondieron HTTP 200.
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
## 2026-08-15 — VE-1-ERROR-BOUNDARY-ICON-LANGUAGE — VERIFICATION UPDATE

- main confirma el cambio de ErrorBoundary y ForgeIcon; la rama responde correctamente.
- El bundle público responde HTTP 200 pero build-manifest.json todavía informa sourceCommit=96feae3f409bbccfa2f8cb6256863e069500b7ec.
- Estado conservado: IMPLEMENTED_UNVERIFIED; no se declara OPERATIONAL porque el deploy público no refleja todavía main.
- No se forzó publicación: requiere autorización explícita y verificación de build conforme al protocolo.
- Siguiente acción: publicar por el flujo autorizado y repetir la comprobación de main, manifest y rutas críticas.

## 2026-08-15 — VE-1-REFERRAL-EMPTY-STATE-ICON-LANGUAGE — OPERATIONAL

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: estado vacío del historial de referidos en ReferralRoute.
- Fuente canónica: código real de main, ForgeIcon y protocolo VEXFORGE.
- Objetivo: retirar el símbolo Unicode de personas sin cambiar el flujo de referidos, textos, datos, autenticación ni recompensas.
- Cambio: se incorporó ForgeIcon con el mapping canónico friends y se conservó la jerarquía visual del estado vacío.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, economía, cartas, inventario ni navegación.
- Evidencia: actualización confirmada por GitHub Contents API en main; build y bundle público siguen pendientes de verificación.
- Responsive y accesibilidad: ForgeIcon conserva aria-hidden y focusable=false; los mensajes visibles permanecen sin cambios.
- Deuda y condición de reapertura: comprobar el bundle público y el estado vacío en escritorio, tablet y móvil antes de elevar la unidad a OPERATIONAL.
- Siguiente acción verificable: confirmar que ReferralRoute sirve sin error y que main conserva ambos mappings canónicos.

## 2026-08-15 — VE-1-ICON-LANGUAGE — OPERATIONAL CLOSURE

- **Estado actual:** OPERATIONAL para ErrorBoundary y el estado vacío de ReferralRoute.
- **Evidencia de código:** main contiene los mappings ForgeIcon warning, refresh y friends; no quedan los sustitutos Unicode de esas dos unidades.
- **Evidencia de publicación:** main y build-manifest.json coinciden en sourceCommit=bf78c537981b1e38c3b860be10def30678ab4ad9.
- **Evidencia de rutas:** /, /tutorial, /cards, /battle, /packs, /friends, /lore, /relics, /season-pass y /referrals respondieron HTTP 200.
- **Alcance autoritativo:** no se modificaron datos, autenticación, RPCs, RLS, economía, recompensas ni reglas de combate.
- **Accesibilidad:** ForgeIcon mantiene aria-hidden=true y focusable=false; los textos y acciones visibles permanecen disponibles.
- **Deuda restante:** la auditoría visual interactiva completa de todas las superficies no pertenece a estas dos unidades; reabrir solo ante regresión, discrepancia del bundle o mapping canónico contradictorio.

## 2026-08-15 — VE-1-EVOLUTION-ICON-LANGUAGE — OPERATIONAL

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: título, acción de refresco y estado vacío de EvolutionRoute.
- Fuente canónica: código real de main, ForgeIcon, EmptyState y protocolo VEXFORGE.
- Objetivo: retirar los sustitutos Unicode de evolución y refresco sin cambiar evolución de cartas, filtros, mensajes, autenticación, datos ni resultados autoritativos.
- Cambio: se incorporaron los mappings canónicos evolution y refresh; se conservaron los textos visibles, la acción Actualizar y el icon prop semántico del estado vacío.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, economía, recompensas, cartas ni inventario.
- Evidencia inicial: actualización confirmada por GitHub Contents API en main; queda pendiente verificar el bundle público y las rutas críticas.
- Responsive y accesibilidad: ForgeIcon mantiene aria-hidden y focusable=false; los controles siguen siendo botones y los mensajes visibles permanecen.
- Deuda y condición de reapertura: verificar build-manifest, /evolution y rutas críticas antes de elevar la unidad a OPERATIONAL.
- Siguiente acción verificable: confirmar que main y el deploy contienen los mappings evolution y refresh.

### Corrección de alcance — VE-1-EVOLUTION-ICON-LANGUAGE

- La primera comprobación encontró un cuarto sustituto Unicode en la acción Evolucionar.
- Se reemplazó por el mapping canónico ForgeIcon evolution sin cambiar la acción, el estado evolving ni el resultado autoritativo.
- La unidad permanece IMPLEMENTED_UNVERIFIED hasta que el bundle público refleje esta corrección y se repitan las rutas críticas.

### Cierre operativo — VE-1-EVOLUTION-ICON-LANGUAGE

- Estado actual: OPERATIONAL.
- main actual: c482edfbde8a02c39054cf16e7c9939a4cf63327. El último cambio de EvolutionRoute es ancestro del commit publicado; la comparación mostró solo un commit posterior de CONTINUITY.md.
- build-manifest.json público: HTTP 200, sourceCommit=c482edfbde8a02c39054cf16e7c9939a4cf63327.
- Rutas verificadas: /, /tutorial, /cards, /battle, /packs, /friends, /lore, /relics, /season-pass, /referrals y /evolution respondieron HTTP 200.
- Código verificado: mappings ForgeIcon evolution y refresh presentes; no quedan los sustitutos Unicode de la unidad.
- Accesibilidad: ForgeIcon conserva aria-hidden=true y focusable=false; acción y textos visibles intactos.
- Alcance no modificado: datos, autenticación, RPCs, RLS, economía, recompensas, inventario y reglas de combate.

## 2026-08-15 — VE-1-QUESTS-ICON-LANGUAGE — OPERATIONAL

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: recompensas, título y estado vacío de QuestsRoute.
- Fuente canónica: código real de main, ForgeIcon y protocolo VEXFORGE.
- Objetivo: retirar sustitutos Unicode de VEX, XP y misiones sin cambiar quests, reclamaciones, recompensas, autenticación ni datos autoritativos.
- Cambio: se incorporaron los mappings coin, spark y quests; se conservaron textos, cantidades y flujo de claim.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, economía, cartas, inventario ni combate.
- Evidencia inicial: actualización confirmada por GitHub Contents API en main; queda pendiente verificar el bundle público y las rutas críticas.
- Responsive y accesibilidad: ForgeIcon mantiene aria-hidden y focusable=false; el texto de recompensas y los controles permanecen visibles.
- Deuda y condición de reapertura: comprobar build-manifest y /quests antes de elevar la unidad a OPERATIONAL.
- Siguiente acción verificable: confirmar que main y el deploy contienen coin, spark y quests sin sustitutos Unicode.

### Cierre operativo — VE-1-QUESTS-ICON-LANGUAGE

- Estado actual: OPERATIONAL.
- Evidencia de código: QuestsRoute contiene mappings ForgeIcon coin, spark y quests; no quedan 💎, ⭐ ni 📜 en esta unidad.
- Evidencia de publicación: main y build-manifest.json coinciden en sourceCommit=e015b96dd3aad634c44becb0bfd6af2878a79179.
- Rutas verificadas: /, /tutorial, /cards, /battle, /packs, /friends, /lore, /relics, /season-pass, /referrals, /evolution y /quests respondieron HTTP 200.
- Alcance no modificado: quests, claim, recompensas, datos, autenticación, RPCs, RLS, economía, cartas, inventario y combate.
- Accesibilidad: ForgeIcon mantiene aria-hidden=true y focusable=false; textos y controles permanecen disponibles.

## 2026-08-15 — VE-1-ADMIN-GUARD-ICON-LANGUAGE — BLOCKED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: estados no autenticado y denegado de ProtectedAdminRoute.
- Fuente canónica: código real de main, ForgeIcon y protocolo VEXFORGE.
- Objetivo: retirar candado, bloqueo y flecha Unicode sin cambiar sesión, RPC vexforge_is_control_admin, redirecciones ni autorización.
- Cambio: se incorporaron los mappings lock, warning y chevron-left; se conservaron mensajes y botones.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, roles ni datos administrativos.
- Evidencia inicial: actualización confirmada por GitHub Contents API en main; queda pendiente verificar bundle, /admin y rutas críticas.
- Responsive y accesibilidad: ForgeIcon mantiene aria-hidden y focusable=false; los controles y sus textos permanecen disponibles.
- Deuda y condición de reapertura: comprobar publicación y estados protegidos antes de elevar la unidad a OPERATIONAL.
- Siguiente acción verificable: confirmar que la ruta administrativa sirve sin errores y que los mappings llegan al bundle público.

### Cierre verificable — VE-1-ADMIN-GUARD-ICON-LANGUAGE

- Código y publicación: verificados; main y build-manifest.json coinciden en el commit actual.
- Rutas públicas verificadas: /, /admin, /account, /battle y /cards respondieron HTTP 200.
- Mappings verificados en ProtectedAdminRoute: lock, warning y chevron-left; no quedan 🔒, ⛔ ni ← Volver al Inicio.
- Estado BLOCKED: no existe una sesión normal autorizada del owner para probar el estado denied del guardia.
- Regla aplicada: no se usó service_role, no se suplantó un jugador/admin y no se declaró PASS para la rama autenticada.
- Condición de reapertura: disponer de una sesión autorizada normal del owner y repetir únicamente la comprobación del estado denied y su recuperación.

## 2026-08-16 — VE-1-ICON-LANGUAGE-BATCH-SOCIAL-RELICS-HINTS-404 — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN / REFINAMIENTO (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidades: FriendsRoute, RelicsRoute, ContextualHints y NotFoundRoute.
- Fuente canónica: código real de main (b4d7453), ForgeIcon y protocolo VEXFORGE V2 (regla de cero genéricos).
- Baseline verificado: main = b4d7453eddf7e4273ac870d20c3368477a36dc33 y build-manifest.json público informaban el mismo sourceCommit; Supabase rscuzqnfccqvltkdcdny ACTIVE_HEALTHY con 308 objetos en public.
- Problema: las cuatro superficies seguían usando emojis Unicode como identidad visual final.
- Cambio realizado:
  - ForgeIcon: se amplió el lenguaje canónico con mail, gift, helmet, chestplate, ring, banner, amulet y map (SVG propios, misma rejilla 24 y mismas props de accesibilidad).
  - FriendsRoute: título, pestañas Amigos/Solicitudes/Desafíos, acción Desafiar, aceptar/rechazar y tarjeta de desafío usan ForgeIcon; se retiró el emoji del texto del toast.
  - RelicsRoute: SLOT_ICON pasó de emojis a ForgeIconName tipado (amulet, shield, attack, helmet, chestplate, ring, banner, relics) con fallback canónico relics; el kit inicial usa gift.
  - ContextualHints: HintDefinition.icon pasa de string a ForgeIconName y las nueve pistas usan iconos propios coloreados con su accentColor.
  - NotFoundRoute: las rutas de rescate usan icono propio + etiqueta de texto.
- Alcance autoritativo: no se modificaron Supabase, Storage, RPCs, RLS, roles, economía, recompensas, cartas, inventario, combate ni autenticación. Sólo capa de presentación.
- Accesibilidad: ForgeIcon conserva aria-hidden=true y focusable=false; los botones de aceptar/rechazar solicitudes ganaron aria-label porque quedaron sin texto visible.
- Verificación ejecutada: tsc -p tsconfig.app.json --noEmit sin errores y vite build correcto.
- Nivel Q: de Q2 a Q3 en las cuatro superficies (identidad propia, sin sustitutos genéricos).
- Deuda registrada: siguen con emojis u otros sustitutos Unicode, entre otros, HomeRoute, ProfileRoute, SeasonPassRoute, MissionsRoute, MarketRoute, ShopRoute, InventoryRoute, CosmeticsRoute, PvpRoute, AchievementsRoute, DepositRoute, AdminDashboardRoute, componentes de batalla y algunos módulos de lib. Los RUNE_SYMS y GLITCH_CHARS decorativos de NotFoundRoute quedan pendientes de decisión canónica (efecto tipográfico, no icono).
- Bloqueos: la verificación autenticada de jugador/owner sigue BLOCKED; no se fabrican sesiones ni resultados con service_role.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar que el deploy de Cloudflare Pages informa el commit de esta sesión y que /friends, /relics y las rutas críticas responden HTTP 200; después continuar el lote siguiente de la línea de iconos.

### Cierre verificable — VE-1-ICON-LANGUAGE-BATCH-SOCIAL-RELICS-HINTS-404

- Estado actual: OPERATIONAL para las cuatro superficies en su capa de presentación.
- Publicación: main = 563a46decd1418e628f9954dbbb10f2802d350f1 y build-manifest.json público informa el mismo sourceCommit.
- Rutas verificadas HTTP 200: /, /friends, /relics, /cards, /battle, /packs, /tutorial, /lore, /season-pass, /referrals, /evolution, /quests, /admin, /account, /pvp, /missions, /leaderboard, /inventory, /market y /fusion.
- Verificación de runtime: navegación headless a /, /friends, /relics y una ruta inexistente sin errores de consola ni pageerror.
- Build: tsc sin errores y vite build correcto antes de publicar.
- Estado BLOCKED conservado: la vista autenticada de /friends (lista, solicitudes y desafíos reales) no se probó porque no existe sesión normal autorizada del jugador; no se usó service_role para sustituirla. Condición de reapertura: sesión autorizada del owner o jugador de prueba.

## 2026-08-16 — VE-1-SEASONPASS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: lenguaje de iconos de las superficies de Temporada (`src/routes/SeasonPassRoute.tsx`, `src/shared/components/SeasonRewardsPanel.tsx`) y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de main, `VEXFORGE_PROTOCOL_V2.md`, `ForgeIcon` y esta continuidad.
- Estado inicial: `IN_PROGRESS` (lote previo cerró social/reliquias/pistas/404). Estado actual: `IMPLEMENTED_UNVERIFIED`.
- Nivel Q: actual `Q2` → objetivo `Q3` (identidad propia, sin sustitutos Unicode).
- Problema: las superficies de Season Pass y del panel de recompensas de temporada seguían usando emojis y símbolos Unicode como identidad visual, prohibido por la regla de cero genéricos.
- Cambio realizado:
  - `ForgeIcon`: se añadieron dos glifos canónicos nuevos, `copy` y `hourglass`, con el mismo contrato (`aria-hidden`, `focusable=false`, `currentColor`, `viewBox 0 0 24 24`).
  - `SeasonPassRoute`: `rewardIcon` pasa de devolver emoji a devolver `ForgeIconName` (`cards`, `cosmetics`, `coin`, `spark`, `gift`); se sustituyeron candado, estrellas premium, checks, portapapeles, aviso de wallet, reloj de verificación, emblema premium, chips de beneficios, encabezados de temporada, acción Actualizar, distintivo PREMIUM y las seis fuentes de XP por mappings canónicos.
  - `SeasonRewardsPanel`: `REWARD_ICONS` pasa a `ForgeIconName` con `REWARD_COLORS` por rareza; medallas top 3 usan `trophy` con color de posición; el emblema de temporada usa `arena` y el bonus de XP usa `energy`.
- Alcance autoritativo: no se modificaron Supabase, Storage, migraciones, RPCs, RLS, economía, precios, tiers, XP, reclamaciones, órdenes de pago, autenticación ni resultados autoritativos. Sólo capa de presentación.
- Textos visibles: sin cambios de copy; el botón de copiar dirección ganó `aria-label` y `title` explícitos, mejorando accesibilidad sin alterar el flujo.
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` completado; barrido Unicode sobre los tres archivos de la unidad sin coincidencias.
- Deuda registrada: `src/lib/rankUtils.ts` conserva los iconos Unicode de rango (Mythic, Diamond, Platinum, Gold, Silver, Bronze, Iron) consumidos por `SeasonRewardsPanel` y `SeasonRankingsRoute`; requiere unidad propia `VE-1-RANK-ICON-LANGUAGE` porque cambia un contrato compartido. Otras rutas (`AdminDashboardRoute`, `ProfileRoute`, `AchievementsRoute`, `ShopRoute`, `MarketRoute`, `DepositRoute`, `SeasonRankingsRoute`, motores de `src/lib`) siguen pendientes.
- Bloqueos: la validación autenticada del jugador (compra premium, claim de tiers) requiere sesión normal autorizada; no se fabricó QA ni se usó service_role. Marcada `BLOCKED` hasta que exista sesión interactiva del owner.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/season-pass` y rutas críticas; después abrir `VE-1-RANK-ICON-LANGUAGE`.

### Cierre operativo — VE-1-SEASONPASS-ICON-LANGUAGE

- Estado actual: `OPERATIONAL` para la capa de presentación de la unidad; nivel Q3.
- Commit publicado: `60f98666edf72a612c8d3f4890b91a146fbe50da` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=60f98666edf72a612c8d3f4890b91a146fbe50da`, `sourceBranch=main`.
- Evidencia de bundle: el chunk público `assets/SeasonPassRoute-CYCwZNCV.js` coincide byte a byte con el build local (SHA-256 `55ae9b2404bae743b51b67d34c86221da8cca1e21539d16c9e24586a3dfc3be9`) y no conserva ningún sustituto Unicode.
- Rutas verificadas HTTP 200: `/`, `/tutorial`, `/cards`, `/battle`, `/packs`, `/friends`, `/lore`, `/relics`, `/season-pass`, `/referrals`, `/evolution`, `/quests`, `/economy`, `/profile`, `/missions` y `/build-manifest.json`.
- Compilación: `tsc --noEmit` y `vite build` sin errores sobre el commit publicado.
- Alcance no modificado: datos, autenticación, RPCs, RLS, economía, órdenes de pago, tiers, XP y recompensas.
- QA autenticada del claim y de la compra premium permanece `BLOCKED` por falta de sesión normal autorizada; no se fabricaron resultados.
- Siguiente unidad: `VE-1-RANK-ICON-LANGUAGE` sobre `src/lib/rankUtils.ts` y sus consumidores.

## 2026-08-16 — VE-1-PANELS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN.
- Unidad: lenguaje de iconos propio en DeckStatsPanel, MatchHistoryPanel y AchievementToastCard.
- Fuente canónica: código real de main, `ForgeIcon` y VEXFORGE_PROTOCOL_V2.
- Estado inicial: OPERATIONAL con sustitutos Unicode residuales. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: actual Q3, objetivo Q4.
- Objetivo: retirar sustitutos Unicode genéricos sin alterar datos, textos visibles, historial PvP, recompensas, logros ni resultados autoritativos.
- Cambio real:
  - DeckStatsPanel: cabecera con `ForgeIcon progress` en lugar del glifo de gráfico.
  - MatchHistoryPanel: `ForgeIcon energy` en las barras y filas de poder, `ForgeIcon gift` en recompensas, `ForgeIcon arena` en el título y `ForgeIcon attack` en el estado vacío.
  - AchievementToastCard: `ForgeIcon trophy` en la cabecera y `ForgeIcon achievements` como fallback cuando el logro no trae icono canónico desde datos.
- Alcance autoritativo no modificado: Supabase, Storage, RPCs, RLS, ELO, economía, recompensas, cartas, inventario ni reglas de combate.
- Accesibilidad: ForgeIcon conserva `aria-hidden=true` y `focusable=false`; todos los textos y controles visibles permanecen intactos.
- Evidencia local de esta sesión: `tsc -p tsconfig.app.json --noEmit` sin errores y `npm run build` completado; el escaneo de sustitutos Unicode en los tres archivos devuelve cero coincidencias.
- Deuda: el icono de logro sigue proviniendo del dato oficial (`achievement.icon`); si la fuente canónica entrega glifos genéricos, corresponde a una unidad de datos, no de UI.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar en el deploy público que `build-manifest.json` refleja el commit de esta sesión y que las rutas críticas responden HTTP 200.

## 2026-08-16 — VE-1-RANK-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: contrato compartido de iconos de rango (`src/lib/rankUtils.ts`) y sus consumidores de presentación.
- Fuente canónica: código real de main (`3b56fb1`), `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda registrada por la unidad VE-1-SEASONPASS-ICON-LANGUAGE. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad propia, sin sustitutos Unicode) en todas las superficies de rango.
- Problema: `RANK_TIERS` entregaba emojis (💎, 💠, 🔮, 🥇, 🥈, 🥉, ⚒️) como identidad visual final del rango, propagados a seis superficies.
- Cambio realizado:
  - `ForgeIcon`: siete glifos canónicos nuevos `rank-mythic`, `rank-diamond`, `rank-platinum`, `rank-gold`, `rank-silver`, `rank-bronze` y `rank-iron`, con el mismo contrato (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `rankUtils`: el campo `icon` pasa de `string` con emoji a `ForgeIconName` tipado; umbrales, colores, escudos y orden de tiers permanecen idénticos al RPC `get_player_rank`.
  - `PvpRoute`: emblemas del duelo (yo/oponente), tarjeta de oponente, banner de rango propio y filas del ranking público usan `ForgeIcon` coloreado con `tier.color`.
  - `ProfileRoute`: emblema del RankCard usa el glifo canónico del tier y el contador de escudos usa `ForgeIcon shield`.
  - `MatchHistoryPanel`, `WeeklyTournamentPanel` y `SeasonRewardsPanel`: cabeceras, filas de seeds, favorito predictivo, ranking de temporada y tarjeta de rango propio usan `ForgeIcon`.
- Decisión canónica registrada: en `ProfileRoute` el emblema deja de leer `rank.tier_icon` (dato que entrega glifos genéricos) y se deriva del tier calculado; el nombre y el color del tier siguen respetando el dato autoritativo. No se modificó ninguna columna ni RPC.
- Alcance autoritativo: no se modificaron Supabase, Storage, migraciones, RPCs, RLS, MMR, ELO, escudos, economía, recompensas, cartas, inventario, combate ni autenticación. Sólo capa de presentación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; el nombre textual del tier acompaña siempre al glifo, por lo que no se pierde información.
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre `rankUtils` y las superficies de rango sin coincidencias en la unidad.
- Deuda registrada: `ProfileRoute` (accesos rápidos, estadísticas, wallet, estados vacíos), `PvpRoute` (avisos y cierres), `AdminDashboardRoute`, `AchievementsRoute`, `ShopRoute`, `MarketRoute`, `DepositRoute`, `SeasonRankingsRoute` y módulos de `src/lib` siguen con sustitutos Unicode.
- Bloqueos: la verificación autenticada de PvP y perfil sigue BLOCKED por falta de sesión normal autorizada; no se fabrican sesiones ni resultados con service_role.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/pvp`, `/profile` y rutas críticas; después abrir la unidad de iconos de `ProfileRoute`.

### Cierre operativo — VE-1-RANK-ICON-LANGUAGE

- Estado actual: OPERATIONAL para la capa de presentación de la unidad; nivel Q3.
- Commit publicado: `4a213396a27a5c5213a9a17dcbb87cbb27f737c7` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=4a213396a27a5c5213a9a17dcbb87cbb27f737c7`, `sourceBranch=main`.
- Evidencia de bundle: el chunk público `assets/index-DEtNzJai.js` contiene los mappings `rank-*` y no conserva los emojis de rango.
- Rutas verificadas HTTP 200: `/`, `/pvp`, `/profile`, `/cards`, `/battle`, `/packs`, `/friends`, `/relics`, `/season-pass`, `/quests`, `/missions`, `/leaderboard`, `/inventory`, `/market` y `/economy`.
- Verificación de runtime: navegación headless a `/`, `/pvp`, `/profile` y `/leaderboard` sin errores de consola ni `pageerror` una vez propagado el deploy (la primera pasada, en pleno despliegue, mostró chunks antiguos ya purgados; repetida tras la propagación devolvió cero errores).
- Compilación: `tsc -p tsconfig.app.json --noEmit` y `vite build` sin errores sobre el código publicado.
- Alcance no modificado: datos, autenticación, RPCs, RLS, MMR/ELO, escudos, economía, recompensas, cartas, inventario y combate.
- Estado BLOCKED conservado: la vista autenticada de PvP y perfil (rango real del jugador, escudos, historial) no se probó por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados. Condición de reapertura: sesión autorizada del owner o jugador de prueba.
- Siguiente unidad: iconos de `ProfileRoute` (accesos rápidos, estadísticas, wallet y estados vacíos).

## 2026-08-16 — VE-1-PROFILE-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: superficies de `src/routes/ProfileRoute.tsx` (accesos rápidos, estadísticas, wallet, distintivos, estados vacíos) y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de main (`1e6c69ee`), `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda registrada por VE-1-RANK-ICON-LANGUAGE. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad propia, sin sustitutos Unicode) en la ruta de perfil.
- Cambio realizado:
  - `ForgeIcon`: dos glifos canónicos nuevos, `key` y `telegram`, con el mismo contrato (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `QUICK_LINKS` y `StatsGrid` pasan de emoji a `ForgeIconName` tipado (`progress`, `economy`, `assets`, `cards`, `missions`, `settings`, `attack`, `market`, `skull`, `packs`).
  - `WalletSnapshotSection`: VEX Ingame usa `energy` y VEX Tradeable usa `coin`, coloreados con el color existente de cada tarjeta.
  - Distintivos de identidad: Super Admin usa `spark`, Admin usa `key`, Telegram usa `telegram` y los puntos totales de logros usan `trophy`; los textos visibles se conservan sin el emoji.
  - Estados: no autenticado usa `lock`, perfil no encontrado usa `warning` y logros vacíos usa `achievements`.
- Alcance autoritativo: no se modificaron Supabase, Storage, migraciones, RPCs, RLS, roles, wallet, economía, estadísticas, logros ni autenticación. Sólo capa de presentación.
- Deuda mantenida: `AchievementBadge` sigue renderizando `ach.icon` tal como lo entrega el dato oficial; corresponde a una unidad de datos, no de UI.
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre `ProfileRoute` sin coincidencias (sólo los separadores tipográficos de comentarios).
- Bloqueos: la vista autenticada del perfil real sigue BLOCKED por falta de sesión normal autorizada; no se usó service_role.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/profile` y rutas críticas.

### Cierre operativo — VE-1-PROFILE-ICON-LANGUAGE

- Estado actual: OPERATIONAL para la capa de presentación de la unidad; nivel Q3.
- Commit publicado: `af29f252dcb0ba9a091ea92655ec07df2544fcfc` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=af29f252dcb0ba9a091ea92655ec07df2544fcfc`, `sourceBranch=main`.
- Rutas verificadas HTTP 200: `/`, `/profile`, `/pvp`, `/cards`, `/battle`, `/packs`, `/friends`, `/relics`, `/season-pass`, `/quests`, `/missions`, `/leaderboard`, `/inventory`, `/market`, `/economy`, `/progress` y `/settings`.
- Verificación de runtime: navegación headless a `/`, `/profile`, `/progress` y `/economy` sin errores de consola ni `pageerror`.
- Compilación: `tsc -p tsconfig.app.json --noEmit` y `vite build` sin errores sobre el código publicado.
- Alcance no modificado: datos, autenticación, roles, RPCs, RLS, wallet, economía, estadísticas y logros.
- Estado BLOCKED conservado: la vista autenticada del perfil (identidad real, wallet, logros desbloqueados) no se probó por falta de sesión normal autorizada; no se fabricaron resultados con service_role.
- Siguiente unidad: `VE-1-ACHIEVEMENTS-ICON-LANGUAGE` sobre `AchievementsRoute` y el contrato de `achievement.icon`.

## 2026-08-16 — VE-1-ACHIEVEMENTS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: REFINAMIENTO / IMPLEMENTACIÓN (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: `src/routes/AchievementsRoute.tsx`, `src/shared/components/AchievementToastCard.tsx`, nuevo módulo `src/lib/achievementIcons.ts` y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de main (`a17ef441c94df4cfa18cd3781bf8fafdfa9272aa`), Supabase vivo `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en el cierre de VE-1-PROFILE-ICON-LANGUAGE ("siguiente unidad: VE-1-ACHIEVEMENTS-ICON-LANGUAGE sobre AchievementsRoute y el contrato de achievement.icon"). Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad propia, sin sustitutos Unicode) en la Sala de la Gloria y en el toast de logro.
- Baseline verificado: main = `a17ef441c94df4cfa18cd3781bf8fafdfa9272aa`; consulta a la Management API de Supabase confirma que `public.achievements` sirve 9 categorías (`bosses`, `collection`, `daily`, `economy`, `fusion`, `missions`, `packs`, `pvp`, `social`) y que la columna `icon` sigue conteniendo sustitutos Unicode heredados.
- Problema: la ruta de logros usaba emojis como identidad final (categorías, tarjeta, estadísticas, candado, check, encabezado) y el toast renderizaba directamente `achievement.icon` del dato oficial, que es un emoji.
- Cambio realizado:
  - `ForgeIcon`: nuevo glifo canónico `calendar` (mismo contrato: `viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `src/lib/achievementIcons.ts`: mapa canónico categoría → `ForgeIconName` con fallback `achievements`. Traduce la categoría autoritativa a glifo propio SIN modificar el dato.
  - `AchievementsRoute`: `CATEGORY_LABELS.icon` pasa de emoji a `ForgeIconName` tipado; la tarjeta usa `achievementIcon(ach.category)` cuando está desbloqueado y `lock` cuando no; el check usa `check`; el encabezado usa `achievements`; las tres métricas usan `trophy`, `spark` y `progress`; el estado no autenticado usa `lock`; el fallback de categoría desconocida usa el mapa canónico.
  - `AchievementToastCard`: deja de renderizar `current.icon` (emoji del dato) y usa `achievementIcon(current.category)` con el color de rareza existente.
- Contrato de datos: `achievements.icon` permanece intacto en Supabase; la UI ya no depende de él. Deuda de datos registrada, no de UI.
- Alcance autoritativo: no se modificaron Supabase, Storage, migraciones, RPCs, RLS, roles, puntos, recompensas VEX/XP, desbloqueos ni autenticación. Sólo capa de presentación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; todos los textos y controles visibles se mantienen; los chips de categoría siguen siendo `button` nativo con su etiqueta de texto.
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre los tres archivos de la unidad sin coincidencias.
- Deuda registrada: siguen con sustitutos Unicode, entre otros, HomeRoute, MissionsRoute, MarketRoute, ShopRoute, InventoryRoute, CosmeticsRoute, PvpRoute, DepositRoute, AdminDashboardRoute, componentes de batalla y módulos de `src/lib`. La columna `achievements.icon` sigue conteniendo emojis en el dato oficial (unidad de datos futura, requiere decisión canónica).
- Bloqueos: la vista autenticada de logros reales (desbloqueos, fechas, puntos ganados) sigue BLOCKED por falta de sesión normal autorizada del jugador u owner; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre main y el bundle público, o mapping canónico contradictorio.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/achievements` y rutas críticas.

## 2026-08-16 — VE-1-STORE-ADMIN-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN / REFINAMIENTO (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: `src/routes/SeasonRankingsRoute.tsx`, `src/routes/ShopRoute.tsx`, `src/routes/DepositRoute.tsx`, `src/routes/MarketRoute.tsx`, `src/routes/AdminDashboardRoute.tsx` y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de `main` del repositorio oficial, Supabase vivo `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en VE-1-ACHIEVEMENTS-ICON-LANGUAGE (MarketRoute, ShopRoute, DepositRoute, AdminDashboardRoute con sustitutos Unicode). Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad visual propia, sin sustitutos Unicode) en rankings, tienda, depósitos, mercado y panel administrativo.
- Cambio realizado:
  - `ForgeIcon`: 12 glifos canónicos nuevos (`chain`, `chain-eth`, `chain-bsc`, `chain-sol`, `chain-tron`, `card`, `ledger`, `search`, `arrow-up`, `arrow-down`, `star`, `clipboard`) con el mismo contrato (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `SeasonRankingsRoute`: medallas y tiers de MMR pasan a `rank-*`, `crown` y `shield`.
  - `ShopRoute`: categorías e items derivan su glifo del contrato (`item_key`/categoría) mediante `shopItemIcon`, sin depender de emojis del catálogo.
  - `DepositRoute`: `CHAIN_META.emoji` → `icon: ForgeIconName` (`chain-eth|bsc|sol|tron`); tabs Crypto/Stripe/Historial, estados de depósito, copiado, aviso de memo y CTA con glifos propios; `STATUS_LABEL` queda como texto limpio + `STATUS_ICON`.
  - `MarketRoute`: pastillas de orden con `arrow-up`/`arrow-down`/`spark`/`star`, tabs con `market`/`clipboard`/`coin`, toasts con `warning`/`check`, vacíos con `market`/`collection`, bloqueo con `lock`, botones de compra/cancelar/listar con glifos propios; placeholder de búsqueda sin emoji.
  - `AdminDashboardRoute`: `TABS.icon` y `KpiCard.icon` pasan a `ForgeIconName`; KPIs, cabecera, insignias de admin/super-admin, refresco, órdenes de tienda, flujo de VEX y estados vacíos con glifos propios.
- Contrato de datos: sin cambios. Ninguna columna, RPC, política ni dato fue modificado; la traducción símbolo → glifo ocurre solo en presentación.
- Alcance no modificado: Supabase, Storage, migraciones, RPCs, RLS, roles, wallet, economía, precios, fees del mercado, aprobación de depósitos y autenticación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; todas las etiquetas textuales y controles nativos se mantienen.
- Verificaciones ejecutadas: `tsc --noEmit` sin errores en la unidad; `npm run build` correcto; barrido Unicode sobre los cinco archivos sin coincidencias.
- Deuda registrada: siguen con sustitutos Unicode HomeRoute, MissionsRoute, InventoryRoute, CosmeticsRoute, PvpRoute, componentes de batalla y módulos de `src/lib`. La columna `achievements.icon` sigue conteniendo emojis en el dato oficial (unidad de datos futura).
- Bloqueos: las vistas autenticadas de depósitos, mercado y panel admin (datos reales, saldo, listados propios, KPIs) siguen BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o mapping canónico contradictorio.
- Siguiente unidad: `VE-1-HOME-MISSIONS-ICON-LANGUAGE` sobre `HomeRoute` y `MissionsRoute`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/market`, `/shop`, `/deposit`, `/season-rankings` y `/admin`.

## 2026-08-16 — VE-1-MISSIONS-NFT-KEYWORDS-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN / REFINAMIENTO (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: `src/routes/MissionsRoute.tsx`, `src/routes/NftRoute.tsx`, `src/lib/keywords.ts` y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de `main` del repositorio oficial (baseline `caa6b76dac8c30e54cc8387a1cba101c4b2ff542`), Supabase vivo `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en VE-1-STORE-ADMIN-ICON-LANGUAGE (MissionsRoute y módulos de `src/lib` con sustitutos Unicode). `HomeRoute` fue auditado y ya está libre de sustitutos, por lo que la unidad se reorientó a MisionesNFT+keywords. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad visual propia, sin sustitutos Unicode) en misiones, NFT Forge y el glosario de keywords.
- Baseline verificado: auditoría por regex Unicode sobre todo `src/`; 7 símbolos en `MissionsRoute`, 7 en `NftRoute`, 10 en `keywords.ts`.
- Cambio realizado:
  - `ForgeIcon`: 5 glifos canónicos nuevos (`wallet`, `flux`, `drain`, `veil`, `resonance`) con el mismo contrato (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `MissionsRoute`: banner de sesión, chip de quest reclamada, contador de reinicio, insignias COMPLETADA/cooldown, botón de ejecución (completada / cooldown / energía insuficiente) y cabecera de FASE 2 pasan a `check`, `refresh`, `hourglass` y `energy`.
  - `NftRoute`: cabecera con `nft`, estado del contrato con `check`/`hourglass`, wallet y CTA de MetaMask con el nuevo glifo `wallet`, rarezas minteables con `cards`, cola de minteo con `clipboard` y vacío con `nft`. Corregido además el rótulo "Raridades" → "Rarezas".
  - `src/lib/keywords.ts`: `KeywordDef.icon` pasa de `string` con emoji a `ForgeIconName` tipado; mapping canónico Guard→`shield`, Surge→`energy`, Flux→`flux`, Consecrate→`spark`, Drain→`drain`, Veil→`veil`, Forge→`fusion`, Resonance→`resonance`. Alineado con `KeywordTooltip`/`KeywordActivationFX`, que ya renderizan `ForgeIcon`.
- Contrato de datos: sin cambios. Ninguna columna, RPC, política, recompensa ni coste de energía fue modificado; la traducción símbolo → glifo ocurre solo en presentación.
- Alcance no modificado: Supabase, Storage, migraciones, RPCs, RLS, roles, wallet real, economía, XP/VEX/T-VEX, cooldowns, minteo NFT y autenticación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; todos los textos y controles nativos se mantienen.
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre los cuatro archivos de la unidad sin coincidencias.
- Deuda registrada: siguen con sustitutos Unicode `NotFoundRoute`, `PageLoader`, `PvpRoute`, `EconomyRoute`, `CosmeticsRoute`, `InventoryRoute`, `FusionRoute`, `EvolutionRoute`, `PacksRoute`, `RelicsRoute`, `RaidsRoute`, `WithdrawalRoute`, `AssetsRoute`, componentes de batalla (`ForgeFormationBoard`, `ContextualHint`, `InteractiveBattleBoard`, `BattleCinematicScreen`, `TutorialBattle`, `FormationSelector`), paneles compartidos (`SeasonRewardsPanel`, `DeckStatsPanel`, `ClanWarsPanel`, `ContextualHints`, `TutorialOverlay`, `LevelUpModal`) y módulos de `src/lib` (`aiBattleEngine`, `missionEncounterEngine`, `dailyChallenge`, `forgeFormation`) y `src/domains` (`home`, `profile`, `pvp`, `deck`, `daily`). La columna `achievements.icon` sigue conteniendo emojis en el dato oficial (unidad de datos futura).
- Bloqueos: las vistas autenticadas de misiones y NFT (energía real, runs, wallet vinculada, cola de minteo) siguen BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o mapping canónico contradictorio de keywords.
- Siguiente unidad: `VE-1-LIB-ENGINES-ICON-LANGUAGE` sobre `src/lib/aiBattleEngine.ts`, `src/lib/missionEncounterEngine.ts` y `src/lib/dailyChallenge.ts` (glifos de enemigos, biomas y retos diarios).
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/missions` y `/nft`.

## 2026-08-16 — VE-1-LIB-ENGINES-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN / REFINAMIENTO (continuación de la línea VE-1-ICON-LANGUAGE).
- Unidad: `src/lib/aiBattleEngine.ts`, `src/lib/missionEncounterEngine.ts`, `src/lib/dailyChallenge.ts`, consumidores `src/routes/MissionsRoute.tsx` y `src/routes/PvpRoute.tsx`, y ampliación canónica de `src/shared/components/ForgeIcon.tsx`.
- Fuente canónica: código real de `main` (baseline `fb3548d`), Supabase vivo `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada como "Siguiente unidad" en el cierre de VE-1-MISSIONS-NFT-KEYWORDS-ICON-LANGUAGE. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 (identidad propia, sin sustitutos Unicode) en modos de batalla, modificadores regionales y desafío diario.
- Baseline verificado: barrido Unicode sobre los tres módulos; 7 símbolos en `BATTLE_MODE_META`, 7 en `REGIONAL_MODIFIERS`, 2 en `getDailyChallengeLabel`.
- Cambio realizado:
  - `ForgeIcon`: 8 glifos canónicos nuevos (`automaton`, `sun`, `eclipse`, `crescent`, `gear`, `leaf`, `gem`, `flame`) con el mismo contrato (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`, `focusable=false`).
  - `aiBattleEngine`: `BATTLE_MODE_META.icon` pasa de `string` con emoji a `ForgeIconName` tipado — pvp→`attack`, ai_easy→`automaton`, ai_normal→`shield`, ai_expert→`skull`, ai_legend→`gem`, practice→`target`, tutorial→`lore`.
  - `missionEncounterEngine`: `RegionalModifier.icon` pasa a `ForgeIconName` — Torres Rúnicas→`resonance`, Catedral del Alba→`sun`, Fortaleza Abisal→`eclipse`, Sombras del Eclipse→`crescent`, Reino del Acero→`gear`, Telegram→`leaf`, `_default`→`map`.
  - `dailyChallenge`: `getDailyChallengeLabel()` devuelve texto limpio ("Desafío Élite" / "Desafío Diario") y se añade `getDailyChallengeIcon()` tipado (`flame` / `attack`).
  - `MissionsRoute`: los dos puntos que renderizaban `regionMod.icon`/`regionModifier.icon` como texto ahora usan `<ForgeIcon />`.
  - `PvpRoute`: la cabecera "DESAFÍO DEL DÍA" usa el glifo del modo real (`meta.icon`) en lugar de un icono fijo.
- Contrato de datos: sin cambios. Ninguna columna, RPC, política, recompensa, MMR/ELO, energía ni buff regional fue modificado; la traducción símbolo → glifo ocurre sólo en presentación.
- Alcance no modificado: Supabase, Storage, migraciones, RPCs, RLS, roles, wallet, economía, recompensas y autenticación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; todos los textos y controles nativos se mantienen; sin animación añadida (reduced motion no afectado).
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre los seis archivos de la unidad sin coincidencias.
- Deuda registrada: siguen con sustitutos Unicode `NotFoundRoute`, `PageLoader`, `EconomyRoute`, `CosmeticsRoute`, `InventoryRoute`, `FusionRoute`, `EvolutionRoute`, `PacksRoute`, `RelicsRoute`, `RaidsRoute`, `WithdrawalRoute`, `AssetsRoute`, componentes de batalla, paneles compartidos, `src/lib/forgeFormation` y `src/domains`. La columna `achievements.icon` sigue conteniendo emojis en el dato oficial.
- Bloqueos: la verificación autenticada de PvP, desafío diario y misiones (energía real, runs, recompensas) sigue BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o mapping canónico contradictorio de modos/regiones.
- Siguiente unidad: `VE-1-BATTLE-COMPONENTS-ICON-LANGUAGE` sobre `ForgeFormationBoard`, `InteractiveBattleBoard`, `BattleCinematicScreen`, `TutorialBattle` y `ContextualHint`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/pvp`, `/missions` y rutas críticas.

## 2026-08-16 — VE-1-RESIDUAL-ICON-LANGUAGE — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN / REFINAMIENTO (continuación y cierre del barrido de la línea VE-1-ICON-LANGUAGE).
- Unidad: `src/routes/ProfileRoute.tsx`, `src/domains/profile/repository.ts`, `src/domains/home/repository.ts`, `src/domains/deck/useDeck.ts`, `src/routes/RaidsRoute.tsx`, `src/routes/EconomyRoute.tsx`.
- Fuente canónica: código real de `main` (baseline `c64c183e`), Supabase vivo `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `src/lib/achievementIcons.ts`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en VE-1-ACHIEVEMENTS/PROFILE (`AchievementBadge` renderizaba `ach.icon` del dato) y sustitutos Unicode residuales en `src/domains` y dos rutas. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 en perfil, actividad reciente del home, mensaje de guardado de mazo, raids y cabecera de economía.
- Baseline verificado: barrido Unicode sobre todo `src/`; tras el cambio sólo quedan flechas tipográficas en comentarios de código y separadores en `styles.css`, ninguna en identidad visible.
- Cambio realizado:
  - `ProfileRoute`: `AchievementBadge` deja de renderizar el emoji del dato y usa `<ForgeIcon name={achievementIcon(ach.category)} />` con el color de categoría existente.
  - `src/domains/profile/repository.ts`: el fallback del contrato pasa de `"🏆"` a `""`; el dato oficial `achievements.icon` no se modifica y ya no se usa como identidad visual.
  - `src/domains/home/repository.ts`: `ActivityItem.icon` pasa de `string` con emoji a `ForgeIconName` tipado con valor `missions`, alineado con el `ForgeIcon` que ya renderiza `HomeRoute`.
  - `src/domains/deck/useDeck.ts`: el mensaje de guardado pierde el check Unicode y conserva el texto real y el número autoritativo de slots.
  - `RaidsRoute`: el botón de recarga usa el glifo `refresh` más la etiqueta "Actualizar" (antes `↺` como icono).
  - `EconomyRoute`: el distintivo "En vivo" usa un punto CSS con `aria-hidden` en vez del carácter `●`.
- Contrato de datos: sin cambios. Ninguna columna, RPC, política, recompensa, energía, wallet ni resultado autoritativo fue tocado; sólo presentación.
- Alcance no modificado: Supabase, Storage, migraciones, RPCs, RLS, roles, economía, logros, raids y autenticación.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; el punto de estado es decorativo con `aria-hidden`; todos los textos y controles nativos se mantienen; sin animación nueva (reduced motion no afectado).
- Verificaciones ejecutadas: `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode sobre los seis archivos de la unidad sin sustitutos visibles.
- Deuda registrada: la columna `achievements.icon` sigue conteniendo emojis en el dato oficial (unidad de datos futura, requiere decisión canónica). Quedan flechas y separadores tipográficos únicamente en comentarios y CSS, sin impacto de identidad.
- Bloqueos: las vistas autenticadas de perfil, mazo, raids y economía real (logros desbloqueados, slots guardados, raids del jugador) siguen BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o decisión canónica sobre `achievements.icon` en el dato.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/profile`, `/raids`, `/economy` y rutas críticas.

### Cierre operativo — VE-1-RESIDUAL-ICON-LANGUAGE

- Estado actual: OPERATIONAL para la capa de presentación de la unidad; nivel Q3.
- Commit publicado: `e44a68a8daa436990f24806589039555c0c25eee` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=e44a68a8daa436990f24806589039555c0c25eee`, `sourceBranch=main`.
- Rutas verificadas HTTP 200: `/`, `/profile`, `/raids`, `/economy`, `/cards`, `/pvp`, `/battle`, `/packs`, `/missions`, `/inventory`, `/market`, `/leaderboard`, `/achievements`, `/nft`, `/quests`, `/relics`, `/season-pass`, `/friends`, `/progress` y `/settings`.
- Verificación de runtime: navegación headless a `/`, `/profile`, `/economy`, `/raids` y `/achievements` sin errores de consola ni `pageerror`.
- Compilación: `tsc -p tsconfig.app.json --noEmit` y `vite build` sin errores sobre el código publicado.
- Alcance no modificado: datos, autenticación, roles, RPCs, RLS, wallet, economía, logros y resultados de combate.
- Estado BLOCKED conservado: vistas autenticadas (logros reales, mazo guardado, raids del jugador) sin sesión normal autorizada; no se usó service_role.
- Siguiente unidad sugerida: decisión canónica sobre el dato `achievements.icon` en Supabase (unidad de datos, no de UI).

## 2026-08-16 — VE-2-ACHIEVEMENTS-ICON-DATA — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN (unidad de datos + presentación, continuación y cierre de la línea VE-1-ICON-LANGUAGE).
- Unidad: `public.achievements.icon` en Supabase `rscuzqnfccqvltkdcdny`, `supabase/migrations/0007_ve2_achievements_icon_canonical.sql`, `src/lib/achievementIcons.ts`, `src/routes/AchievementsRoute.tsx`, `src/routes/ProfileRoute.tsx`, `src/shared/components/AchievementToastCard.tsx`, `src/routes/DeckBuilderRoute.tsx`, `src/routes/ForgeAdsRoute.tsx`, `src/routes/SeasonRankingsRoute.tsx`.
- Fuente canónica: código real de `main` (baseline `3295eb8`), datos vivos de Supabase, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en VE-1-RESIDUAL-ICON-LANGUAGE ("decisión canónica sobre `achievements.icon` en el dato"); 25 filas con emoji en el dato oficial y 3 sustitutos Unicode residuales en UI. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 en el dato de logros y en su identidad visual por logro (antes sólo por categoría).
- Baseline verificado: consulta de las 25 filas de `public.achievements` vía Management API; barrido Unicode sobre todo `src/` (sólo 5 coincidencias visibles, 2 en comentarios).
- Cambio realizado:
  - Migración `0007`: respaldo de cada emoji heredado en `metadata.legacy_icon` (idempotente, no sobrescribe respaldo previo), asignación canónica `code → glifo ForgeIcon` para los 25 logros y degradación a `achievements` para cualquier valor no canónico. No toca puntos, recompensas, categorías, RLS, RPCs ni desbloqueos.
  - `src/lib/achievementIcons.ts`: nuevo `ACHIEVEMENT_CODE_ICON` (identidad propia por logro), conjunto blanco `ALLOWED_DATA_ICONS` derivado de los mapas canónicos y `resolveAchievementIcon({code, category, icon})` con orden dato-canónico → code → categoría → fallback. Un icono desconocido nunca se renderiza tal cual.
  - `AchievementsRoute`, `ProfileRoute` y `AchievementToastCard` pasan de `achievementIcon(category)` a `resolveAchievementIcon(ach)`; ahora cada logro tiene glifo diferenciado.
  - `DeckBuilderRoute`: viñeta `•` de errores de validación → `ForgeIcon name="warning"`.
  - `ForgeAdsRoute` y `SeasonRankingsRoute`: viñetas `•` → rombo CSS decorativo con `aria-hidden`, precedente de `EconomyRoute`.
- Contrato de datos: `achievements.icon` cambia de emoji a nombre de glifo canónico; el valor heredado queda en `metadata.legacy_icon` (reversible con un UPDATE inverso). Ninguna otra columna, RPC o política fue modificada.
- Alcance no modificado: Storage, autenticación, roles, economía, energía, wallet, recompensas y resultados autoritativos.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; los rombos son decorativos con `aria-hidden`; ningún texto ni control se eliminó; sin animación nueva (reduced motion no afectado).
- Verificaciones ejecutadas: migración aplicada vía Management API con SELECT posterior de las 25 filas (icono canónico + `legacy_icon` presente); `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; barrido Unicode posterior sobre `src/` sin sustitutos visibles.
- Deuda registrada: quedan flechas y separadores tipográficos únicamente en comentarios de código y CSS (sin impacto de identidad). Otras tablas de catálogo no fueron auditadas en busca de emojis en el dato (unidad futura).
- Bloqueos: la vista autenticada de logros reales (desbloqueos, toast en vivo, perfil del jugador) sigue BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o decisión canónica distinta sobre el mapping `code → glifo`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/achievements`, `/profile`, `/deck-builder`, `/season-rankings` y `/forge-ads`.

### Cierre operativo — VE-2-ACHIEVEMENTS-ICON-DATA

- Estado actual: OPERATIONAL para el dato de logros y su capa de presentación; nivel Q3.
- Commit publicado: `cedb061dbdd300fac15c82fd779c5f7158484d59` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=cedb061dbdd300fac15c82fd779c5f7158484d59`, `sourceBranch=main`.
- Rutas verificadas HTTP 200: `/`, `/achievements`, `/profile`, `/deck-builder`, `/season-rankings`, `/forge-ads`, `/cards`, `/pvp`, `/battle`, `/packs`, `/missions`, `/inventory`, `/market`, `/leaderboard`, `/nft`, `/quests`, `/relics`, `/season-pass`, `/economy`, `/raids` y `/settings`.
- Verificación de runtime: navegación headless a `/`, `/achievements`, `/profile`, `/deck-builder`, `/season-rankings` y `/forge-ads` sin errores de consola ni `pageerror`.
- Verificación de datos: las 25 filas de `public.achievements` devuelven glifo canónico en `icon` y su emoji heredado en `metadata.legacy_icon`.
- Estado BLOCKED conservado: vistas autenticadas de logros (desbloqueos reales, toast en vivo) sin sesión normal autorizada; no se usó service_role.
- Siguiente unidad sugerida: auditoría de emojis en el dato de otras tablas de catálogo (cartas, misiones, tienda) y decisión canónica equivalente.

## 2026-08-16 — VE-2-RANK-NOTIF-SHOP-ICON-DATA — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN (unidad de datos + funciones vivas + presentación; continuación de la línea VE-2-ICON-DATA).
- Unidad: `public.player_notifications.icon`, `public.vexforge_shop_catalog.icon`, funciones vivas `public.fn_notify_mission_complete()` y `public.get_player_rank()`, migración `supabase/migrations/0008_ve2_rank_notification_shop_icon_canonical.sql`, `src/lib/notificationIcons.ts` (nuevo), `src/shared/components/NotificationBell.tsx`, `src/routes/ShopRoute.tsx`.
- Fuente canónica: código real de `main` (baseline `bec5077`), datos y funciones vivas de Supabase `rscuzqnfccqvltkdcdny`, `ForgeIcon`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en el cierre de VE-2-ACHIEVEMENTS-ICON-DATA ("auditoría de emojis en el dato de otras tablas de catálogo"). Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 en el dato de notificaciones, catálogo de tienda y rango PvP.
- Baseline verificado: barrido programático sobre TODAS las columnas `text`/`varchar` de tablas base de `public` (codepoint > 8000) y sobre `pg_proc.prosrc` de todas las funciones de `public`. Resultado: 9 emojis en `vexforge_shop_catalog.icon`, 8 en `player_notifications.icon`, 7 emojis de tier en `get_player_rank`, 1 en `fn_notify_mission_complete`. Las tablas `vexforge_*` de registro/documentación interna contienen símbolos sólo en texto documental (sin impacto de identidad de jugador) y quedan como deuda registrada. Los guiones largos de `events.name`, `pvp_seasons.name`, `cosmetics.description` y `vexforge_shop_catalog.description` son tipografía legítima, no sustitutos visuales: no se tocan.
- Cambio realizado:
  - Migración `0008` (idempotente, transaccional): nueva tabla de auditoría `public.vexforge_icon_legacy` (respaldo `source_table`/`source_column`/`row_key`/`legacy_value`/`canonical_value`, GRANT sólo a `service_role`, RLS habilitada sin políticas), respaldo de los 17 valores heredados y asignación canónica `type → glifo` en notificaciones y `item_key → glifo` en el catálogo de tienda.
  - `fn_notify_mission_complete()`: el `INSERT` de notificación pasa de `'🎯'` a `'missions'`. No cambia condiciones, recompensas ni enlaces.
  - `get_player_rank()`: `tier_icon` pasa de emoji a glifo canónico (`rank-mythic`…`rank-iron`). Umbrales de MMR, colores, shields, wins/losses y contrato JSON intactos.
  - `src/lib/notificationIcons.ts`: `NOTIFICATION_TYPE_ICON`, conjunto blanco `ALLOWED_NOTIFICATION_DATA_ICONS` y `resolveNotificationIcon({type, icon})` con orden dato-canónico → tipo → fallback `notification`.
  - `NotificationBell`: deja de renderizar un glifo fijo `spark` para toda notificación y usa `resolveNotificationIcon(notif)`; cada tipo tiene identidad diferenciada.
  - `ShopRoute`: `shopItemIcon()` acepta el icono del dato sólo si pertenece al conjunto blanco; `charm_rare` pasa a `gem` y `charm_common` a `star` para alinear código y dato.
- Contrato de datos: `player_notifications.icon` y `vexforge_shop_catalog.icon` pasan de emoji a nombre de glifo canónico; `get_player_rank().tier_icon` idem. Todo valor heredado queda en `public.vexforge_icon_legacy` (reversible con UPDATE inverso). Ninguna otra columna, RPC, política, precio ni recompensa fue modificada.
- Alcance no modificado: Storage, autenticación, roles, RLS de tablas de jugador, economía, energía, wallet, MMR, shields, fulfilment de tienda y resultados autoritativos.
- Accesibilidad: `ForgeIcon` conserva `aria-hidden=true` y `focusable=false`; no se eliminó texto ni control; sin animación nueva (reduced motion no afectado).
- Verificaciones ejecutadas: migración aplicada vía Management API (respuesta sin error) con SELECT posterior — 9/9 filas de tienda y 8/8 notificaciones con glifo canónico, 17 respaldos en `vexforge_icon_legacy`, y consulta de `pg_proc` confirmando 0 codepoints > 8000 en `get_player_rank` y `fn_notify_mission_complete`; `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto.
- Deuda registrada: las tablas internas `vexforge_project_decisions`, `vexforge_frontend_source_files`, `vexforge_official_documents`, `vexforge_web_registry`, `vexforge_project_documents`, `vexforge_project_chat_registry`, `vexforge_system_config`, `vexforge_function_consolidation_registry` y `tg_events` conservan símbolos en texto documental (no son identidad de jugador; unidad futura de higiene documental). Comentarios de código y CSS con flechas tipográficas siguen sin impacto de identidad.
- Bloqueos: la verificación autenticada de la campana de notificaciones en vivo, la compra real en tienda y el rango PvP del jugador siguen BLOCKED por falta de sesión normal autorizada; no se usó service_role para suplantar jugadores ni se fabricaron notificaciones, órdenes ni resultados.
- Condición de reapertura: regresión visual, discrepancia entre `main` y el bundle público, o decisión canónica distinta sobre el mapping `type → glifo` / `item_key → glifo`.
- Siguiente unidad sugerida: higiene documental de las tablas internas `vexforge_*` y auditoría de `Storage`/manifiesto de assets frente a los consumidores reales.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/shop`, `/pvp`, `/profile` y rutas críticas.

## 2026-08-16 — VE-3-ASSET-REF-INTEGRITY — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: AUDITORÍA + IMPLEMENTACIÓN (integridad de referencias a assets de Storage).
- Unidad: `src/lib/assetManifest.ts` (nuevo), `scripts/verify-assets.mjs` (nuevo), `package.json`, `src/App.tsx`, `src/domains/assets/repository.ts`, `src/components/battle/InteractiveBattleBoard.tsx`, `src/routes/AchievementsRoute.tsx`, `RaidsRoute.tsx`, `WorldBossesRoute.tsx`, `FusionRoute.tsx`, `SeasonRankingsRoute.tsx`, `PvpRoute.tsx`, `PacksRoute.tsx`, `MissionsRoute.tsx`, `ClansRoute.tsx`, `AccountRoute.tsx`, `AssetsRoute.tsx`, `CardsRoute.tsx`, `InventoryRoute.tsx`, `MarketRoute.tsx`, `HomeRoute.tsx`.
- Fuente canónica: código real de `main` (baseline `e58e4bf`), `storage.objects` vivo del bucket público `vexforge-assets`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en el cierre de VE-2-RANK-NOTIF-SHOP-ICON-DATA ("auditoría de Storage/manifiesto de assets frente a los consumidores reales"). Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 en la capa de assets de superficie (referencias reales y deuda explícita en lugar de imágenes rotas silenciosas).
- Baseline verificado: 17 URLs de Storage codificadas a mano en `src`, comprobadas una a una contra el bucket público. Resultado: 13 responden HTTP 200 y 4 referencias responden HTTP 400 por objeto inexistente — `backgrounds/bg_achievements.jpg`, `backgrounds/bg_bosses.jpg` (usada por `/raids` y `/world-bosses`), `backgrounds/bg_forge.jpg` y `backgrounds/bg_leaderboard.jpg`. Inventario completo del bucket obtenido desde `storage.objects`: la carpeta `backgrounds/` sólo contiene `bg_clans`, `bg_missions`, `bg_packs` y `bg_pvp`.
- Cambio realizado:
  - `src/lib/assetManifest.ts`: `STORAGE_BASE` único, `VERIFIED_ASSETS` (14 rutas comprobadas contra Storage vivo), `storageAsset()` tipado sobre esas rutas, `SURFACE_BACKGROUND` por superficie y `PENDING_SOURCE_BACKGROUNDS` con superficie, ruta esperada y brief del recurso propio que falta.
  - Superficies sin asset propio (`achievements`, `leaderboard`, `raids`, `world-bosses`): su fondo pasa a `null` y las rutas lo renderizan con su tratamiento base de VEXFORGE. No se sustituye por arte de otra superficie ni por stock; el navegador deja de solicitar 4 imágenes inexistentes.
  - `/fusion`: pasa de la inexistente `backgrounds/bg_forge.jpg` al asset propio y existente `heroes/hero_fusion.jpg`, que es el recurso canónico de esa superficie (mismo patrón que `heroes/hero_market.jpg` en `/market` y `heroes/hero_assets.jpg` en `/assets`).
  - Todas las URLs de Storage codificadas a mano en `src` pasan a `storageAsset()`/`STORAGE_BASE`; ya no existe ninguna URL literal del bucket fuera del manifiesto.
  - `scripts/verify-assets.mjs` + `npm run verify:assets`: comprueba por HEAD que cada ruta de `VERIFIED_ASSETS` existe en el Storage público y falla si alguna deja de estarlo.
- Contrato de datos: ninguno. No se modificó Supabase (ni esquema, ni datos, ni RPCs, ni RLS, ni Storage): la sesión es de referencias en el frontend.
- Alcance no modificado: autenticación, roles, economía, energía, wallet, recompensas, MMR, resultados de combate y cualquier resultado autoritativo.
- Accesibilidad y rendimiento: sin cambios de texto ni de controles; sin animación nueva (reduced motion no afectado); se eliminan 4 peticiones de imagen fallidas por carga en las rutas afectadas.
- Verificaciones ejecutadas: inventario de `storage.objects` vía Management API; comprobación HTTP de las 17 referencias previas y de las 14 del manifiesto (`verify:assets` → 14/14 disponibles); `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto.
- Deuda registrada: 3 fondos propios pendientes de creación canónica (`bg_achievements`, `bg_leaderboard`, `bg_bosses`) con brief en `PENDING_SOURCE_BACKGROUNDS`; sigue pendiente la higiene documental de las tablas internas `vexforge_*`; el manifiesto oficial `vexforge_official_asset_manifest` sigue registrando sólo ZIPs y no archivos individuales.
- Bloqueos: verificación autenticada de las superficies de jugador (raids reales, ranking de temporada del jugador, fusión real) sigue BLOCKED por falta de sesión normal autorizada; no se usó service_role ni se fabricaron resultados.
- Condición de reapertura: publicación de los fondos propios pendientes en Storage, cambio del inventario del bucket, o regresión detectada por `verify:assets`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/achievements`, `/raids`, `/world-bosses`, `/fusion`, `/season-rankings` y rutas críticas.

### Cierre operativo — VE-3-ASSET-REF-INTEGRITY

- Estado actual: OPERATIONAL para la capa de referencias de assets; nivel Q3.
- Commit publicado: `2dde949b77c0d7a6e2a888be73a22ca2c0945ff1` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=2dde949b77c0d7a6e2a888be73a22ca2c0945ff1`, `sourceBranch=main`.
- Rutas verificadas HTTP 200 (27): `/`, `/achievements`, `/raids`, `/world-bosses`, `/fusion`, `/season-rankings`, `/cards`, `/pvp`, `/battle`, `/packs`, `/missions`, `/inventory`, `/market`, `/leaderboard`, `/nft`, `/quests`, `/relics`, `/season-pass`, `/economy`, `/profile`, `/shop`, `/clans`, `/settings`, `/deck-builder`, `/assets`, `/account` y `/forge-ads`.
- Verificación de runtime sobre el sitio publicado: navegación headless a `/`, `/achievements`, `/raids`, `/world-bosses`, `/fusion`, `/season-rankings`, `/missions` y `/packs` sin errores de consola, sin `pageerror` y sin ninguna respuesta HTTP >= 400 (antes había 4 imágenes de fondo respondiendo 400).
- Verificación de assets: `npm run verify:assets` → 14/14 rutas del manifiesto disponibles en el Storage oficial.
- Estado BLOCKED conservado: superficies autenticadas del jugador sin sesión normal autorizada; no se usó service_role.
- Siguiente unidad sugerida: creación canónica de los 3 fondos propios pendientes (`bg_achievements`, `bg_leaderboard`, `bg_bosses`) y su publicación en Storage, o higiene documental de las tablas internas `vexforge_*`.

## 2026-08-16 — VE-4-CANONICAL-BACKGROUNDS — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN (unidad VE-ASSET: creación y publicación de los fondos propios pendientes).
- Unidad: objetos de Storage `backgrounds/bg_achievements.jpg`, `backgrounds/bg_leaderboard.jpg`, `backgrounds/bg_bosses.jpg` en el bucket público `vexforge-assets`; `src/lib/assetManifest.ts`; `docs/VE-4-CANONICAL-BACKGROUNDS.md` (nuevo).
- Fuente canónica: código real de `main` (baseline `a190840`), inventario vivo del bucket `vexforge-assets`, briefs registrados en `PENDING_SOURCE_BACKGROUNDS` (VE-3), `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda del cierre de VE-3-ASSET-REF-INTEGRITY — 4 superficies (`achievements`, `leaderboard`, `raids`, `world-bosses`) sin fondo propio y renderizadas con tratamiento base. Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q3 → Q4 en la capa de fondos de superficie (identidad propia por superficie en lugar de ausencia declarada).
- Baseline verificado: las 3 rutas esperadas no existían en Storage (HTTP 400 previo, confirmado en VE-3); diagnóstico del lenguaje visual sobre `bg_pvp.jpg`, `bg_missions.jpg` y `bg_clans.jpg` antes de crear nada.
- Cambio realizado:
  - Creación dirigida de 3 fondos propios siguiendo el brief canónico de VE-3 y el lenguaje visual existente (pintura digital, forja gótica, azul noche + naranja fundido, sin texto ni personajes protagonistas). No se sustituye ningún asset previo: las tres rutas estaban vacías.
  - Publicación en el Storage oficial (`backgrounds/`), JPEG progresivo 1024x1024, q86, 124–187 KB por archivo, coherente con el peso de los fondos existentes.
  - `assetManifest.ts`: las 3 rutas entran en `VERIFIED_ASSETS` (14 → 17), las 4 superficies pasan de `null` a su asset propio y `PENDING_SOURCE_BACKGROUNDS` queda vacío. `raids` y `world-bosses` comparten `bg_bosses.jpg` según la decisión canónica ya registrada en VE-3.
  - `docs/VE-4-CANONICAL-BACKGROUNDS.md`: procedencia, licencia, versión, prompts, negative brief, dimensiones, peso, SHA-256, consumidores, reversión y deuda restante.
- Contrato de datos: ninguno. No se tocó esquema, tablas, RPCs, RLS, triggers, roles ni datos; sólo se añadieron 3 objetos nuevos al bucket público de assets.
- Alcance no modificado: autenticación, economía, energía, wallet, recompensas, MMR, evolución y cualquier resultado autoritativo. No se usó service_role para suplantar a ningún jugador; su único uso fue la subida de assets propios al Storage oficial.
- Accesibilidad y rendimiento: los fondos son decorativos (`backgroundImage` CSS, sin texto alternativo requerido); no se añadió animación (reduced motion no afectado); se mantienen los mismos consumidores y capas de contraste; 3 peticiones de imagen nuevas, cacheables, en lugar de superficies sin fondo.
- Verificaciones ejecutadas: subida HTTP 200 de los 3 objetos y lectura pública HTTP 200 con el tamaño esperado; `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto; `npm run verify:assets` → 17/17 rutas del manifiesto disponibles en Storage.
- Deuda registrada: `vexforge_official_asset_manifest` sigue registrando sólo ZIPs y no archivos individuales (unidad de datos futura); sin variantes responsive dedicadas para móvil; sigue pendiente la higiene documental de las tablas internas `vexforge_*`.
- Bloqueos: la verificación autenticada de `/raids`, `/world-bosses` y `/season-rankings` con datos reales del jugador sigue BLOCKED por falta de sesión normal autorizada; no se fabricaron runs, settlements ni recompensas.
- Condición de reapertura: decisión canónica distinta sobre alguno de los 3 fondos, cambio del inventario del bucket, o regresión detectada por `verify:assets`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en `/achievements`, `/season-rankings`, `/raids`, `/world-bosses` y rutas críticas, sin peticiones de imagen >= 400.

### Cierre operativo — VE-4-CANONICAL-BACKGROUNDS

- Estado actual: OPERATIONAL para la capa de fondos de superficie; nivel Q4.
- Commit publicado: `d1caa78fb1e6e8930c6afe0cf337015ecc9fca97` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=d1caa78fb1e6e8930c6afe0cf337015ecc9fca97`, `sourceBranch=main`.
- Rutas verificadas HTTP 200 (28): `/`, `/achievements`, `/season-rankings`, `/raids`, `/world-bosses`, `/fusion`, `/cards`, `/pvp`, `/battle`, `/packs`, `/missions`, `/inventory`, `/market`, `/leaderboard`, `/nft`, `/quests`, `/relics`, `/season-pass`, `/economy`, `/profile`, `/shop`, `/clans`, `/settings`, `/deck-builder`, `/assets`, `/account`, `/forge-ads` y `/` raíz del bundle.
- Verificación de runtime sobre el sitio publicado: navegación headless a `/`, `/achievements`, `/season-rankings`, `/raids`, `/world-bosses`, `/fusion`, `/missions` y `/packs` sin errores de consola, sin `pageerror` y sin ninguna respuesta HTTP >= 400 (los 3 fondos nuevos cargan desde el Storage oficial).
- Verificación de assets: `npm run verify:assets` → 17/17 rutas del manifiesto disponibles en Storage; lectura pública de los 3 objetos nuevos con HTTP 200 y el peso registrado en `docs/VE-4-CANONICAL-BACKGROUNDS.md`.
- Estado BLOCKED conservado: superficies autenticadas del jugador sin sesión normal autorizada; no se usó service_role para suplantar jugadores ni para fabricar QA.
- Siguiente unidad sugerida: inscripción de los archivos individuales de assets en `vexforge_official_asset_manifest` (unidad de datos), o higiene documental de las tablas internas `vexforge_*`.

## 2026-08-16 — VE-5-ASSET-MANIFEST-DATA — IMPLEMENTED_UNVERIFIED

- Tipo de sesión: IMPLEMENTACIÓN (unidad de datos VE-ASSET: manifiesto oficial de assets en base de datos).
- Unidad: `public.vexforge_official_asset_manifest`, migración `supabase/migrations/0009_ve5_official_asset_manifest_files.sql`, `scripts/verify-manifest.mjs` (nuevo), `package.json` (script `verify:manifest`), `docs/VE-5-ASSET-MANIFEST-DATA.md` (nuevo).
- Fuente canónica: código real de `main` (baseline `69de81c`), datos vivos de Supabase `rscuzqnfccqvltkdcdny` (`storage.objects`, `cards`, `world_bosses`, `vexforge_official_asset_manifest`), `src/lib/assetManifest.ts`, `VEXFORGE_PROTOCOL_V2.md` y esta continuidad.
- Estado inicial: deuda declarada en el cierre de VE-4-CANONICAL-BACKGROUNDS ("`vexforge_official_asset_manifest` sigue registrando sólo ZIPs y no archivos individuales"). Estado actual: IMPLEMENTED_UNVERIFIED.
- Nivel Q: Q2 → Q3 en el dato del manifiesto oficial (de inventario parcial con 3 rutas rotas a inventario coherente y verificable de los assets realmente consumidos).
- Baseline verificado: 73 filas (19 bundles + 54 archivos); 3 filas apuntando a `progresión/…` inexistente en Storage; 127 artes de carta y 15 de jefe mundial consumidos por el dato vivo sin inscribir; 7 fondos consumidos por el cliente sin inscribir; 0 URLs de carta/jefe rotas.
- Cambio realizado: migración `0009` idempotente y transaccional — respaldo de las 3 rutas heredadas en `public.vexforge_icon_legacy` y corrección a `progression/`; inscripción de 127 filas `card_art` con `display_name` tomado de `cards.name`; 15 filas `world_boss_art` con `display_name` de `world_bosses.name`; 7 fondos de superficie/facción sólo cuando el objeto existe en Storage. Herramienta nueva `npm run verify:manifest` que valida con rol `anon` la coherencia entre código, manifiesto de datos y Storage.
- Contrato de datos: sólo se añaden filas al manifiesto y se corrigen 3 `internal_path`/`source_zip_url`. No se creó, sustituyó ni eliminó ningún asset; ningún nombre visible es inventado.
- Alcance no modificado: esquema de juego, RLS, RPCs, triggers, autenticación, roles, economía, energía, wallet, MMR, recompensas, evolución y resultados autoritativos. No se usó `service_role` para suplantar jugadores ni fabricar QA.
- Accesibilidad y rendimiento: sin cambios de UI; ningún componente, texto, control ni animación fue modificado (reduced motion no afectado); no se añaden peticiones nuevas en runtime.
- Verificaciones ejecutadas: migración aplicada vía Management API sin error; post-estado 222 filas (19 bundles + 203 archivos), `broken=0`, `cards_unregistered=0`, `bosses_unregistered=0`; `npm run verify:manifest` → 203 archivos inscritos, 17 rutas del código presentes, 0 referencias rotas; `npm run verify:assets` → 17/17; `tsc -p tsconfig.app.json --noEmit` sin errores; `npm run build` correcto.
- Deuda registrada: artes duplicados del bucket sin rol semántico canónico (`bosses/BOSS_*.jpg`, `bosses/boss_*.jpg`, `cards/IMG_2026*.jpg`) siguen sin inscribir a la espera de decisión canónica; higiene documental de las tablas internas `vexforge_*`; sin variantes responsive dedicadas para móvil.
- Bloqueos: verificación autenticada de superficies del jugador sigue BLOCKED por falta de sesión normal autorizada.
- Condición de reapertura: cambio del inventario del bucket, decisión canónica sobre los artes duplicados, o fallo de `npm run verify:manifest`.
- Siguiente acción verificable: confirmar `build-manifest.json` público con el commit de esta sesión y HTTP 200 en las rutas críticas del deploy.

### Cierre operativo — VE-5-ASSET-MANIFEST-DATA

- Estado actual: OPERATIONAL para el manifiesto oficial de assets en base de datos; nivel Q3.
- Commit publicado: `5e57c98070e146d6cf5f6aa3c3bb34b000ef29c0` en main.
- Evidencia de publicación: `/build-manifest.json` público informa `sourceCommit=5e57c98070e146d6cf5f6aa3c3bb34b000ef29c0`, `sourceBranch=main`.
- Rutas verificadas HTTP 200 (27): `/`, `/achievements`, `/season-rankings`, `/raids`, `/world-bosses`, `/fusion`, `/cards`, `/pvp`, `/battle`, `/packs`, `/missions`, `/inventory`, `/market`, `/leaderboard`, `/nft`, `/quests`, `/relics`, `/season-pass`, `/economy`, `/profile`, `/shop`, `/clans`, `/settings`, `/deck-builder`, `/assets`, `/account` y `/forge-ads`.
- Verificación de runtime sobre el sitio publicado: navegación headless a `/`, `/cards`, `/achievements`, `/world-bosses`, `/raids`, `/leaderboard`, `/assets`, `/packs` y `/missions` sin errores de consola, sin `pageerror` y sin ninguna respuesta HTTP >= 400.
- Verificación de datos contra el deploy: `npm run verify:manifest` (rol `anon`) → 203 archivos inscritos, 17 rutas del código presentes, 0 referencias rotas; `npm run verify:assets` → 17/17.
- Estado BLOCKED conservado: superficies autenticadas del jugador sin sesión normal autorizada; no se usó `service_role` para suplantar jugadores ni para fabricar QA.
- Siguiente unidad sugerida: decisión canónica sobre los artes duplicados del bucket (`bosses/BOSS_*.jpg`, `bosses/boss_*.jpg`, `cards/IMG_2026*.jpg`) — inscribir con rol semántico o retirar — o higiene documental de las tablas internas `vexforge_*`.
