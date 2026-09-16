# VEXFORGE — T0 Android asset matrix

**Fecha:** 2026-09-15
**Unidad:** T0 — asset registry and provenance
**Estado:** `PREPARED / EVIDENCE_REQUIRED`
**Entorno activo:** Android en `mobile/**`
**Baseline observado:** `main` en `624007bb732b40c186495f0a3aab2d872ed86e0f`
**Fuente activa reconciliada:** `public.vexforge_official_documents`
(`vexforge_home_world_system_protocol_v3`, `ACTIVE`, V2.3)
**Hash del protocolo leído:** `cd83250a5f63fe72b5be237bfdf1bb54a1f935927a5fea95136190b837a165ba`

## 1. Autoridad y regla de cero genéricos

La autoridad de assets es el manifiesto canónico y sus consumidores reales:

- `src/lib/assetManifest.ts` — bucket Supabase `vexforge-assets`, assets
  verificados, arte reservado y procedencia residual.
- `mobile/constants/visual.ts` — registro de superficies Android y selección de
  fondos canónicos.
- `docs/VEXFORGE-ASSET-ATLAS.md` — clasificación humana entre canon activo y
  referencias seleccionables.
- `mobile/assets/images/` — arte local que viaja con Android.

Un asset local no se convierte en canon sólo por existir en el repositorio. Un
asset remoto no se convierte en consumidor sólo por existir en Storage. Cada
fila conserva su rol explícito y una superficie no cubierta queda pendiente; no
se sustituye en silencio por stock, una imagen de otra pantalla o una pieza
genérica.

## 2. Inventario local de Android

El baseline contiene 12 imágenes locales. La clasificación siguiente es
intencionalmente conservadora: `CANON_ACTIVE` sólo se usa cuando el atlas o el
registro visual ya asignan un consumidor; `AVAILABLE_UNASSIGNED` no autoriza
consumo automático.

| Archivo | Rol registrado | Estado T0 | Superficie | Fuente / evidencia |
|---|---|---|---|---|
| `mobile/assets/images/vexforge-home-hero.png` | Ancla de escena Nexus | `CANON_ACTIVE` | Home | `mobile/constants/visual.ts`, `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/vexforge-hero-sentinel.png` | Elemento de primer plano | `CANON_ACTIVE` | Home | `mobile/constants/visual.ts`, `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/vexforge-feature-card.png` | Carta destacada | `CANON_ACTIVE` | Home | `mobile/constants/visual.ts`, `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/vexforge-auth-nexus-final.png` | Referencia vertical oficial de escena de acceso/Nexus (`1080×2340`); la UI runtime es nativa | `CANON_ACTIVE` | Auth | `mobile/constants/visual.ts`, `mobile/app/auth.tsx`, `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/battle-reference-scene.png` | Escena de combate | `CANON_ACTIVE` | Battlefield | `VEXFORGE-ASSET-ATLAS.md` |
| `docs/visual-assets/vexforge-battle-screen-premium-1080x2340.png` | Referencia visual Battlefield aprobada; promovida como arte de escena del viewport nativo | `CANON_ACTIVE` | Battlefield | `docs/visual-assets/vexforge-battle-screen-premium-1080x2340.md`, `mobile/constants/visual.ts`, registro T0 |
| `mobile/assets/images/collection-archive-scene.jpg` | Variante residual de escena de Archivo | `AVAILABLE_UNASSIGNED` | Collection | reemplazada por `collection-reference-scene.png` como referencia aprobada |
| `docs/visual-assets/vexforge-collection-screen-premium-1080x2340.png` | Referencia visual Collection aprobada por el operador | `REVIEW_REQUIRED` | Collection | `docs/visual-assets/vexforge-collection-screen-premium-1080x2340.md`, registro T0 |
| `mobile/assets/images/decks-reference-scene.png` | Escena de formación; arte de escena dentro del viewport nativo de Forja | `CANON_ACTIVE` | Deck | `mobile/constants/visual.ts`, `mobile/app/(tabs)/deck.tsx`, `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/profile-reference-scene.png` | Escena de identidad | `CANON_ACTIVE` | Profile | `VEXFORGE-ASSET-ATLAS.md` |
| `docs/visual-assets/vexforge-profile-screen-premium-1080x2340.png` | Referencia visual Profile aprobada por el operador | `REVIEW_REQUIRED` | Profile | `docs/visual-assets/vexforge-profile-screen-premium-1080x2340.md`, registro T0 |
| `mobile/assets/images/home-reference-scene.png` | Escena vertical oficial Home/Nexus (`1080×2340`) | `CANON_ACTIVE` | Home | `mobile/app/(tabs)/index.tsx`, `mobile/constants/visual.ts`, `docs/VE-MOB-3-HOME.md` |
| `mobile/assets/images/icon.jpg` | Referencia de estilo heredado | `AVAILABLE_UNASSIGNED` | Compartido | `VEXFORGE-ASSET-ATLAS.md` |
| `mobile/assets/images/collection-reference-scene.png` | Referencia vertical oficial de Archivo; arte de escena dentro del viewport nativo | `CANON_ACTIVE` | Collection | `mobile/constants/visual.ts`, `mobile/components/ForgeArchiveScene.tsx`, guardia Collection |
| `mobile/assets/images/deck-forge-scene.jpg` | Asset local sin asignación explícita en el atlas | `REVIEW_REQUIRED` | Deck / Forge | inventario de repositorio; requiere decisión de consumidor |

`REVIEW_REQUIRED` no significa que el archivo sea inválido. Significa que no
se presenta como canon activo hasta que exista una asignación explícita,
procedencia y evidencia de consumidor.

## 3. Assets remotos verificados y superficies Android

`src/lib/assetManifest.ts` registra 22 rutas de assets verificados en el
bucket oficial. El inventario operativo del baseline reporta 224 assets
inscritos en el manifiesto vivo; las cifras no se mezclan: una ruta verificada
es una entrada concreta del código y un asset inscrito puede pertenecer a un
bundle, reserva o rol residual.

| Superficie / dominio | Resolución canónica | Estado de procedencia |
|---|---|---|
| Auth | `cover/main.jpg` | `VERIFIED_ASSET` |
| Home / Nexus | escena local `vexforge-home-hero.png`; marca desde `logo/IMG_20260606_040509_906.jpg` | local canónico + Storage verificado |
| Battlefield PvP | `backgrounds/bg_pvp.jpg` | `VERIFIED_ASSET` |
| Missions | `backgrounds/bg_missions.jpg` | `VERIFIED_ASSET` |
| Store / packs | `backgrounds/bg_packs.jpg` | `VERIFIED_ASSET` |
| Forge | `heroes/hero_fusion.jpg` | `VERIFIED_ASSET` |
| Collection | `heroes/hero_assets.jpg` | `VERIFIED_ASSET` |
| Economy | `heroes/hero_economy.jpg` | `VERIFIED_ASSET` |
| Profile | `heroes/hero_profile.jpg` | `RESERVED_SURFACE_ART`; no se presenta como consumido sin decisión |
| Social / clans | `backgrounds/bg_clans.jpg` | `VERIFIED_ASSET` |
| Leaderboard | `backgrounds/bg_leaderboard.jpg` | `VERIFIED_ASSET` |
| Achievements | `backgrounds/bg_achievements.jpg` | `VERIFIED_ASSET` |
| World / raids | `backgrounds/bg_bosses.jpg` | `VERIFIED_ASSET` |
| Tutorial | `tutorial/main.png` | `VERIFIED_ASSET` |
| Facciones | `factions/icon_*.png` y `factions/bg_*.jpg` | `VERIFIED_ASSET` |

El registro de `CANONICAL_BACKGROUNDS` puede incluir arte reservado, como
Profile, sin que eso cierre la evidencia de consumo o de QA. La matriz
preserva esa diferencia.

## 4. Assets reservados y deuda explícita

El manifiesto conserva como reserva reversible, entre otros, los fondos de
Profile/Progression/Economy/Settings, regiones, eventos, recompensas, wallet,
tutorial y arte residual. La lista completa permanece en
`RESERVED_SURFACE_ART` y `RESERVED_RESIDUAL_ART`; no se copia aquí para evitar
crear una segunda fuente de verdad.

Estado del baseline:

- 224 assets oficiales inscritos.
- 22 referencias de código verificadas.
- 0 referencias rotas en la guarda registrada.
- 0 comprobaciones HEAD diferidas; las 224 comprobaciones de manifiesto
  terminaron correctamente y `verify:assets` confirmó las 22 rutas declaradas.
- No hay permiso para llamar `VERIFIED` a una superficie sólo por tener una
  referencia local o una URL construible.

## 5. Reconciliación T0 ejecutada el 2026-09-15

La matriz se contrastó con el `main` actual y con el protocolo ACTIVE antes de
abrir otra unidad visual:

| Comprobación | Resultado | Lectura operativa |
|---|---|---|
| `npm run verify:manifest` | `PASS` | 224 archivos inscritos, 22 rutas de código, 0 referencias rotas; 224 HEAD, 0 diferidas |
| `npm run verify:assets` | `PASS` | 22/22 objetos canónicos disponibles |
| `node scripts/verify-residual-art.mjs` | `PASS` | 57 filas residuales, 38 objetos servibles, 4 consumidos, 34 en reserva; manifiesto total 243 |
| Promoción T0 | `NO` | falta evidencia física; la verificación de Storage no sustituye QA de dispositivo |

La revalidación de Storage no promueve ningún elemento
`AVAILABLE_UNASSIGNED` o `REVIEW_REQUIRED`, no añade imágenes de sustitución y
no modifica ningún consumidor Android en este bloque.

## 6. Gate de promoción

Un asset pasa de `AVAILABLE_UNASSIGNED` o `REVIEW_REQUIRED` a consumo de
producción sólo cuando se registran, en la misma unidad:

1. rol semántico y dominio;
2. procedencia y estado canónico;
3. consumidor Android real;
4. comportamiento seguro si la carga falla;
5. captura o evidencia visual/táctil en la matriz de dispositivos;
6. guardas locales y entrada en `CONTINUITY.md`.

Este documento no promueve assets ni afirma compatibilidad física. El estado
T0 permanece `PREPARED / EVIDENCE_REQUIRED`.