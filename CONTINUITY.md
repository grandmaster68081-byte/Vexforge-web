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
