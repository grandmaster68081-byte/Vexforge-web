# VEXFORGE — MASTER WORK PLAN
**Revisión 122 — Chat 95 — 2026-07-24**

---

## ESTADO GLOBAL

| Campo | Valor |
|-------|-------|
| Chat actual | 95 |
| Revisión | 122 |
| Dominios live | 34 de 34 |
| Archivos en Supabase | 207 |
| Estado | **OPEN BETA READY** |
| AN.4 Card Expansion | **DIFERIDO** (post-launch, cuando el owner decida nuevo set) |
| Diferidos | Telegram, AM.* (ads), AN.4, AN.5 |

---

## NUEVO EJE DE TRABAJO: GAME ENGINE + COMBAT + TUTORIAL + VISUAL EXCELLENCE

**Visión:** VEXFORGE debe sentirse como Yu-Gi-Oh Master Duel meets Hearthstone pero con identidad propia.
Los jugadores deben engancharse en los primeros 5 minutos y querer seguir jugando horas.

**Principios:**
- Todo construido SOBRE lo que ya existe (no romper contratos)
- Primero lo que desbloquea más árbol (AI engine → todo lo demás)
- Visual antes que contenido (sentir antes que volumen)
- Retención F2P y pago en cada bloque

---

## ÉPICA IA — AI BATTLE ENGINE
**Estado: PENDIENTE | Prioridad: CRÍTICA — desbloquea todo el árbol de solo play**

### IA.0 — Motor IA Client-Side
- Engine IA 100% client-side usando estructuras BattleUnit/BattleTurnData existentes
- 3 niveles: Fácil (ataca aleatorio), Normal (prioriza unidades con menos HP), Experto (optimiza DPS + cuenta keywords)
- No toca backend — simula el mismo output que retorna start_pvp_match
- Decks IA por nivel: predefinidos en código, usan cartas existentes de la BD
- Output compatible con InteractiveBattleBoard (mismo formato RealBattleResult)
- Archivo nuevo: src/lib/aiBattleEngine.ts

### IA.1 — Modo Batalla: Selector
- Nueva pantalla pre-batalla: 3 modos — vs IA / vs Jugador / Práctica
- Cards de modo con descripción, recompensas y dificultad visual
- Integrado en PvpRoute como paso previo al matchmaking
- vs IA: sin colas, instantáneo, recompensas reducidas (anti-farm)
- vs Jugador: flujo actual (MatchmakingOverlay)
- Práctica: vs IA Fácil, sin recompensas, sin registrar en pvp_matches

### IA.2 — Daily AI Challenger
- Deck IA especial cambia cada día (seed por fecha)
- Recompensa única por victoria: VEX bonus + badge "Desafío del Día"
- Botón "Desafío Diario" en HomeRoute y PvpRoute
- Un solo intento por día por cuenta
- Requiere IA.0 completado

---

## ÉPICA TU — TUTORIAL REVOLUTION
**Estado: PENDIENTE | Prioridad: ALTA — first impression = retención**

### TU.0 — Tutorial Battle (Batalla Guiada)
- Reemplaza el paso 4 del tutorial ("ve a PvP") por una batalla real guiada
- Deck de 3 cartas predefinido (sin necesidad de colección propia)
- Usa IA.0 en modo Tutorial (IA hace movimientos predecibles)
- Arrows overlay + tooltips contextuales en cada fase de la batalla
- Narrador en pantalla explica: arrastrar para atacar, keywords, HP, resultado
- Al terminar: tutorialStep = 99 (completado)
- Requiere IA.0 completado

### TU.1 — Tutorial Visual Overhaul
- TutorialOverlay actual (texto plano) → cards visuales con iconografía VEXFORGE
- Cada paso tiene imagen/video ilustrativo del concepto
- Botón "saltar" siempre visible pero no prominente
- Transición animada entre pasos (slide horizontal)
- Paso 0: Intro cinematic (BattleIntroScreen reutilizado con texto custom)

### TU.2 — Contextual Hint System
- Globos de ayuda contextuales que aparecen la primera vez en cada ruta
- Persistidos en localStorage (no en BD, no carga al servidor)
- Dismissible por click, desaparece después de 5 segundos
- Rutas priorizadas: /pvp, /deck, /fusion, /market

---

## ÉPICA VX — VISUAL COMBAT EXCELLENCE
**Estado: PENDIENTE | Prioridad: ALTA — impacto visual inmediato**

### VX.0 — Floating Damage Numbers
- Números de daño animados flotando sobre la carta atacada
- Rojo para daño recibido, verde para lifesteal/curación
- Número de crítico: más grande, destello dorado, "+CRÍTICO" label
- Fade-up animation 1s, luego desaparece
- Implementado en InteractiveBattleBoard.tsx

### VX.1 — Keyword Activation Animations
- Poison: nube verde pulsante sobre la carta envenenada
- Shield: burbuja azul que explota en shield_block
- Lifesteal: partículas rojas fluyendo del atacante al defensor
- Double Strike: doble flash rápido (2 impacts)
- Guard: icono de escudo estático con brillo dorado mientras activo
- Rush: trail de velocidad en el ataque inicial
- Implementado como overlay CSS animations en BattleCard.tsx

### VX.2 — Card Death Animation
- Carta derrotada: escala a 0 con rotación + partículas de la facción
- 600ms animation antes de remover la carta del board
- Usa particleEngine existente para las partículas de muerte
- Sonido de muerte por rareza (Common = silencio, Legendary = fanfare corta)

### VX.3 — HP Bar Segmentation + Turn Transition
- HP bar dividida en 5 segmentos tipo Hearthstone (cada segmento = 20% HP)
- Cuando un segmento se vacía: flash de color del segmento
- Transición de turno: slide lateral con indicador "TURNO DEL OPONENTE / TU TURNO"
- Contador de turno visible en todo momento (Turno 3/12)

---

## ÉPICA BA — BOARD ATMOSPHERE
**Estado: PENDIENTE | Prioridad: MEDIA**

### BA.0 — Animated Board Background per Faction
- Cada facción dominante (más unidades vivas) cambia el ambiente del tablero
- Guerrero: brasas + tonos rojos pulsantes
- Mago: estrellas azules + niebla arcana
- Explorador: partículas verdes + hojas
- Comerciante: monedas doradas + destellos
- Implementado como canvas overlay en BattleBoardEngine.tsx

### BA.1 — Dynamic Particle Intensity
- Densidad de partículas aumenta cuando quedan pocas HP (< 20%)
- "Último de pie": efectos más dramáticos cuando solo queda 1 carta
- partleEngine existente amplificado con nuevo modo "critical"

---

## ÉPICA CX — CARD VISUAL EXCELLENCE
**Estado: PENDIENTE | Prioridad: MEDIA**

### CX.0 — Holographic Shimmer (Legendary/Mythic/Founder)
- CSS: gradiente animado tipo holo-foil sobre las cartas Legendary+
- Shimmer sigue el movimiento del cursor (CSS perspective/transform)
- Solo en CardsRoute y en BattleCard durante la batalla
- No requiere assets nuevos — CSS puro

### CX.1 — Rarity Aura (in-battle)
- Aura constante alrededor de la carta mientras está viva en batalla
- Intensidad según rareza: Common = sin aura, Mythic = máxima
- Usa RARITY_GLOW existente como base, anima el box-shadow
- Pulso suave (2s cycle)

### CX.2 — Card Reveal Flip (pack opening + battle intro)
- Animación flip 3D al revelar una carta nueva
- Anverso: reverso genérico VEXFORGE (★)
- Reverso: carta real con sus stats
- Aplicado en PacksRoute (apertura de packs) y BattleIntroScreen (reveal de unidades)

---

## ÉPICA GL — GAME LOOP ENGAGEMENT
**Estado: PENDIENTE | Prioridad: ALTA — retención F2P**

### GL.0 — Win Streak System
- Contador de victorias consecutivas visible en PvpRoute
- 3 victorias: +15% VEX bonus | 5 victorias: +30% | 7+: +50%
- Racha se rompe con derrota o después de 24h sin jugar
- Persistido en player_progress o localStorage
- Badge "EN RACHA" animado en el perfil del jugador

### GL.1 — Revenge Button (Revancha)
- Botón "REVANCHA" en BattleResultScreen después de vs IA
- Lanza nueva batalla inmediata con mismo nivel IA
- Sin delay, sin confirmación — impulso de "una más"

### GL.2 — Quick Battle (HomeRoute)
- Botón prominente "BATALLA RÁPIDA" en HomeRoute hero section
- Lanza vs IA Normal directamente sin pasar por PvpRoute
- Segundo CTA más importante después del "Desafío Diario"

### GL.3 — Session Engagement Summary
- Al cerrar la app (beforeunload) o después de 3+ batallas: resumen de sesión
- "Hoy: 3 victorias · +450 VEX · Racha actual: 3"
- Toast discreto en la parte inferior, desaparece en 4s

---

## ÉPICA AU — AUDIO EXPANSION
**Estado: PENDIENTE | Prioridad: MEDIA**

### AU.0 — Combat Phase Music
- 3 tracks procedurales Web Audio API (sin archivos externos):
  - Intro phase: 8-bar loop tenso
  - Mid-battle: 12-bar loop más activo según HP promedio
  - Last stand (< 30% HP alguno): loop más dramático, BPM aumenta
- Transición suave entre fases (crossfade 2s)
- AudioEngine.ts ampliado con método startCombatMusic(phase)

### AU.1 — Keyword SFX
- Poison: sssss (noise filtered)
- Shield: clang metálico
- Lifesteal: whoosh + suction
- Double strike: zwei hits rápidos
- All Web Audio API — zero files
- AudioEngine.ts: sfxPoison, sfxShield, sfxLifesteal, sfxDoubleStrike

### AU.2 — Rarity Card Sounds (Collection + Opening)
- Common: click suave
- Rare: chime corto
- Epic: boom bajo
- Legendary: fanfare 1s
- Mythic: dramatic hit + reverb tail
- Triggered en CardsRoute hover (según rareza) y PacksRoute opening

---

## ORDEN DE EJECUCIÓN

| Bloque | Título | Prioridad | Sesiones | Dependencias |
|--------|--------|-----------|----------|--------------|
| **IA.0** | Motor IA Client-Side | 🔴 CRÍTICA | 1 | ninguna |
| **IA.1** | Battle Mode Selector | 🔴 CRÍTICA | 1 | IA.0 |
| **VX.0** | Floating Damage Numbers | 🔴 ALTA | 0.5 | ninguna |
| **VX.1** | Keyword Animations | 🔴 ALTA | 1 | ninguna |
| **GL.1** | Revenge Button | 🟡 ALTA | 0.5 | ninguna |
| **GL.2** | Quick Battle Home | 🟡 ALTA | 0.5 | IA.0 |
| **TU.0** | Tutorial Battle | 🔴 ALTA | 1.5 | IA.0 + VX.0 |
| **TU.1** | Tutorial Visual | 🟡 ALTA | 1 | ninguna |
| **IA.2** | Daily AI Challenger | 🟡 MEDIA | 1 | IA.0 |
| **GL.0** | Win Streak | 🟡 MEDIA | 1 | IA.0 |
| **VX.2** | Card Death Animation | 🟡 MEDIA | 1 | ninguna |
| **VX.3** | HP Segmentation + Turn | 🟡 MEDIA | 0.5 | ninguna |
| **CX.0** | Holographic Shimmer | 🟢 MEDIA | 0.5 | ninguna |
| **CX.1** | Rarity Aura in-battle | 🟢 MEDIA | 0.5 | ninguna |
| **CX.2** | Card Flip Reveal | 🟢 MEDIA | 1 | ninguna |
| **BA.0** | Animated Board | 🟢 MEDIA | 1 | ninguna |
| **BA.1** | Dynamic Particles | 🟢 MEDIA | 0.5 | BA.0 |
| **AU.0** | Combat Phase Music | 🟢 MEDIA | 1 | ninguna |
| **AU.1** | Keyword SFX | 🟢 MEDIA | 0.5 | ninguna |
| **AU.2** | Rarity Card Sounds | 🟢 MEDIA | 0.5 | ninguna |
| **TU.2** | Contextual Hints | 🟢 BAJA | 0.5 | TU.0 |
| **GL.3** | Session Summary | 🟢 BAJA | 0.5 | GL.0 |

---

## BLOQUES DIFERIDOS (sin fecha)

| Bloque | Razón |
|--------|-------|
| AN.4 Card Expansion (200+) | Post-launch, cuando el owner decida nuevo set |
| AN.5 Real-time PvP | Rediseño mayor del sistema de batalla |
| AM.* Ads | Requiere cuentas externas del owner |
| Telegram | Post-web launch |

---

## PENDIENTE OWNER (pre-deploy)

| Acción | Estado |
|--------|--------|
| AN.3: Run SQL migration NFT schema | Pendiente |
| AN.3: Deploy VexforgeCards.sol a Polygon | Pendiente |
| AN.3: Actualizar CONTRACT_ADDRESS | Pendiente |
| AN.3: Insert row en vexforge_nft_contracts | Pendiente |
| AL.3: Export Supabase → GitHub (Temus) | Pendiente |
| AL.3: Deploy Cloudflare Pages | Pendiente |

---

*Revisión 122 — Chat 95 — 2026-07-24 — GAME ENGINE PLAN ACTIVATED*