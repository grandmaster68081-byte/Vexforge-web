# VEXFORGE — PLAN MAESTRO DE TRABAJO
## Versión 1.0 — 2026-07-18 — Chat 42

---

# PARTE 0: PROTOCOLO OBLIGATORIO PARA EL AGENTE EJECUTOR

Este documento es el Plan Maestro de VEXFORGE. Cualquier agente que lo reciba debe leerlo en su totalidad antes de ejecutar una sola línea de código.

## Reglas absolutas

1. **Supabase es la única fuente canónica.** Todo el frontend vive en `vexforge_frontend_source_files`. Toda escritura de código va como UPDATE a esa tabla. NUNCA persistir archivos en disco de Replit.
2. **Credenciales de conexión** — Supabase project ref: `rscuzqnfccqvltkdcdny`. Usar la Management API (`https://api.supabase.com`) con el PAT de Supabase disponible en el entorno.
3. **Checkpoints obligatorios** — Tras cada bloque de trabajo completado: registrar en `vexforge_project_decisions` y actualizar `vexforge_web_registry` si aplica.
4. **Actualizar CONTINUITY.md** — Al cerrar cada sesión, actualizar `backend/handoff/CONTINUITY.md` en `vexforge_frontend_source_files` con el estado real.
5. **Sin placeholders ni mocks.** Solo datos reales de Supabase. Los RPCs son la única vía de escritura a tablas de negocio.
6. **Sin duplicar RPCs.** Antes de crear un RPC nuevo, buscar si existe uno ya implementado.
7. **Stack frontend:** React + Vite + TypeScript + react-router-dom + @supabase/supabase-js. Arquitectura domain-driven (`src/domains/`, `src/routes/`).
8. **Cada nueva carta, boss, relic o sinergia** creada debe registrarse en `canonical_table_registry`.

## Tabla de control del plan

- `vexforge_project_decisions` — historial de decisiones por chat/bloque
- `vexforge_web_registry` — estado por dominio frontend
- `vexforge_frontend_source_files` — 83+ archivos fuente del frontend (fuente de verdad)
- `backend/handoff/CONTINUITY.md` — documento de continuidad entre sesiones

---

# PARTE 1: DEFINICIÓN OFICIAL DE SUPPLY DE CARTAS

## Modelo matemático (horizonte 5 años)

Proyección de jugadores activos: 2.000 (año 1) → 25.000 (año 5 / pico).
Cartas promedio en inventario por jugador por rareza × tasa de quema por fusión × buffer de mercado (30%) × multiplicador acumulativo 5 años (3.5x).

## Supply oficial por carta

| Rareza     | Copias/carta | Cartas únicas | Total en economía | Decaimiento |
|------------|-------------|--------------|-------------------|-------------|
| Common     | **50.000**  | 40 únicas    | 2.000.000         | base        |
| Uncommon   | **20.000**  | 35 únicas    | 700.000           | ÷2.5x       |
| Rare       | **8.000**   | 25 únicas    | 200.000           | ÷2.5x       |
| Epic       | **2.500**   | 15 únicas    | 37.500            | ÷3.2x       |
| Legendary  | **750**     | 8 únicas     | 6.000             | ÷3.33x      |
| Mythic     | **150**     | 4 únicas     | 600               | ÷5x         |
| **TOTAL**  |             | **127 únicas** | **2.944.100**   |             |

## Justificación del supply

- **Common 50.000:** Alta rotación. Son el combustible de la economía: misiones, fusión, entry-packs. Con 25.000 jugadores activos teniendo 30 commons promedio = 750.000 en manos = 37.5% del supply. El otro 62.5% actúa como buffer de mercado y reserva para nuevos jugadores durante 5 años.
- **Uncommon 20.000:** Piezas de mazo frecuentes. La fusión consume 3 Commons para producir 1 Uncommon — esa quema (40% de Commons) genera ~6.667 Uncommons adicionales por carta, bien por debajo del cap de 20.000. Supply sano.
- **Rare 8.000:** Staples competitivos. Packs de rango medio (Expedition, Forge). La fusión produce ~2.000 Rares por carta desde Uncommons.
- **Epic 2.500:** Cartas de alto impacto. Solo packs Forge/Founder. Fusión produce ~500 Epics por carta. Con 25.000 jugadores y avg 6 Epics = 150.000 en circulación máxima — solo el 60% del supply total.
- **Legendary 750:** Pieza central del mazo competitivo. Mayoría de jugadores tendrá 0-3. Escasez diseñada para darles valor en el mercado.
- **Mythic 150:** Ultra-rare. NFT-grade. Solo Founder Pack + fusión de 5 Legendarias. 1 de cada 167 jugadores tendrá 1 Mythic al pico de 25.000 usuarios.

## Regla de actualización del supply

Ningún supply puede aumentarse sin aprobación explícita en `vexforge_project_decisions`. Los supply pueden congelarse (`supply_locked = true`) cuando se acerquen al 85% de emisión. El campo `minted` en la tabla `cards` lleva el conteo en tiempo real.

## Pool de cartas objetivo por fase

```
FASE 1 (lanzamiento):      40 Common + 35 Uncommon + 25 Rare + 15 Epic + 8 Legendary + 4 Mythic = 127 únicas
ESTADO ACTUAL:              4 Common +  4 Uncommon +  4 Rare +  4 Epic + 4 Legendary + 4 Mythic =  24 únicas
CARTAS A DISEÑAR:          36 Common + 31 Uncommon + 21 Rare + 11 Epic + 4 Legendary + 0 Mythic = 103 únicas nuevas
```

---

# PARTE 2: SISTEMA DE KEYWORDS Y HABILIDADES DE CARTAS

## Diseño del sistema de keywords (8 keywords base)

Cada carta puede tener 0-2 keywords activos en su `synergy_json`. Los keywords se resuelven en el motor de combate.

| Keyword     | Descripción                                                           | Facción natural |
|-------------|-----------------------------------------------------------------------|-----------------|
| **Guard**   | Esta carta debe ser eliminada antes de poder atacar al jugador rival  | Guerrero        |
| **Surge**   | Al atacar, aplica +50% del poder en daño adicional al jugador rival   | Guerrero        |
| **Flux**    | Efecto al ser jugada (Battlecry-equivalent). Se define en `rules_json`  | Mago            |
| **Resonance** | Cada carta de la misma facción en el tablero añade +10% a su poder  | Mago            |
| **Veil**    | No puede ser el objetivo de hechizos o efectos del rival en su primer turno | Pícaro     |
| **Drain**   | Al eliminar una carta rival, el jugador recupera salud igual al poder de la carta | Pícaro  |
| **Consecrate** | Al morir, aplica su poder en daño a todas las cartas rivales en el tablero | Paladín  |
| **Forge** | Al ser fusionada o evolucionar, el resultado obtiene +20% de poder permanente | Todos     |

## Estructura de `synergy_json` por carta

```json
{
  "keywords": ["Guard", "Resonance"],
  "faction_bonus": { "Guerrero": 0.15 },
  "conditional_effects": [
    { "trigger": "on_play", "effect": "draw_card", "count": 1 }
  ],
  "combo_ids": ["warrior_wall_combo"]
}
```

## Implementación requerida en Supabase

1. Actualizar `card_synergy_rules` con las 8 reglas base (una fila por keyword)
2. Actualizar `synergy_json` en cada carta de la tabla `cards` (en el proceso de diseño de las 127 cartas)
3. Crear RPC `resolve_keyword_effect(p_keyword text, p_card_id uuid, p_context jsonb)` que devuelva el efecto concreto a aplicar en combate

---

# PARTE 3: MOTOR DE COMBATE TURN-BASED

## Diseño del sistema de combate

El combate actual (sum de power) DEBE reemplazarse. Las tablas `combat_sessions`, `combat_turns`, `combat_effects`, `combat_participants` ya existen — solo hay que implementar la lógica.

### Flujo de una partida

```
1. MATCH CREATION: start_pvp_match(p_a, p_b) → crea combat_session en status 'pending'
2. DECK SELECTION: ambos jugadores seleccionan su mazo activo (player_deck)
3. MULLIGAN: cada jugador roba 5 cartas, puede devolver hasta 2
4. TURN LOOP:
   a. El jugador activo recibe +1 carga de mana (máx 10, acumula por turno)
   b. Puede jugar cartas de su mano que cuesten ≤ su mana disponible
   c. Puede atacar con cartas en su tablero
   d. Al finalizar su turno, roba 1 carta
5. WIN CONDITION: reducir la vida del rival (20 HP) a 0, o agotar su mazo
6. RESOLUTION: resolve_pvp_match() aplica ELO + recompensas
```

### RPCs de combate a crear

| RPC | Parámetros | Descripción |
|-----|-----------|-------------|
| `start_combat_session(p_player_a uuid, p_player_b uuid, p_format text)` | — | Crea sesión, asigna mazos, distribuye mano inicial |
| `play_card(p_session_id uuid, p_card_id uuid, p_target_id uuid)` | — | Juega una carta del hand al tablero, aplica Flux/on_play |
| `declare_attack(p_session_id uuid, p_attacker_id uuid, p_target_id uuid)` | — | Declara ataque carta→carta o carta→jugador, aplica Guard/Surge/Drain |
| `end_turn(p_session_id uuid)` | — | Finaliza turno activo, roba carta, pasa turno al rival |
| `get_combat_state(p_session_id uuid)` | — | Devuelve estado completo del tablero para el cliente |
| `concede_match(p_session_id uuid)` | — | El jugador activo se rinde |

### Tablas existentes a poblar

- `combat_sessions` → una fila por partida activa
- `combat_turns` → una fila por acción (play_card, attack, end_turn)
- `combat_effects` → efectos activos en el tablero (buffs, debuffs, keywords)
- `combat_participants` → estado de cada jugador (HP, mano, mazo, tablero)
- `combat_results` → resultado final con stats

---

# PARTE 4: SISTEMA DE DECK BUILDING

## Reglas del mazo oficial (Standard Format)

| Parámetro | Regla |
|-----------|-------|
| Cartas por mazo | **30 cartas exactas** |
| Copias de una misma carta | **Máximo 2** (Legendary y Mythic: máximo 1) |
| Restricción de facción | Máximo 2 facciones por mazo |
| Cartas mínimas de facción | Al menos 15 de las 30 deben ser de la facción principal |
| Curva de mana | Sin restricción, pero recomendada por el UI |
| Nombre del mazo | Texto libre, 3-40 caracteres |
| Mazos por jugador | Máximo 6 mazos guardados simultáneamente |

## RPCs de deck building a crear

| RPC | Descripción |
|-----|-------------|
| `create_deck(p_name text, p_card_ids uuid[])` | Crea un mazo validando todas las reglas |
| `update_deck(p_deck_id uuid, p_card_ids uuid[])` | Actualiza un mazo existente |
| `delete_deck(p_deck_id uuid)` | Elimina un mazo |
| `validate_deck(p_card_ids uuid[])` | Devuelve si el mazo es legal + errores |
| `set_active_deck(p_deck_id uuid)` | Establece el mazo activo para PvP |

## Actualización de tabla `player_deck`

La tabla actual tiene solo `slot_number` + `card_id`. Necesita ampliarse o crear tabla hermana `player_decks` (listado de mazos) que referencia los `player_deck` entries.

---

# PARTE 5: FULFILLMENT DE PACKS

## Problema crítico actual

`vexforge_mark_pack_paid` marca la orden como pagada y registra el ledger, pero **NUNCA entrega cartas**. Es el bloqueador más crítico del modelo de negocio.

## RPC a crear: `vexforge_fulfill_pack_order(p_order_id uuid)`

Lógica:
1. Verificar que la orden está en status `paid` (no `pending_payment` ni `fulfilled`)
2. Leer `vexforge_pack_contents` para el `pack_key` de la orden
3. Para cada slot del pack:
   a. Seleccionar aleatoriamente una carta del pool de rareza indicada (`item_key = 'common'` → tabla `cards` WHERE `rarity = 'Common'` AND `active = true` AND `minted < supply`)
   b. Insertar en `player_cards` (quantity + 1) con `source_tracking = 'pack_purchase'`
   c. Incrementar `minted` en la tabla `cards` para esa carta
4. Actualizar la orden a status `fulfilled`
5. Registrar el log en `vexforge_official_seed_log`
6. Retornar `{ ok: true, cards_granted: [...], order_id }`

## Integración en el flujo de pago

`vexforge_mark_pack_paid` debe llamar a `vexforge_fulfill_pack_order` al final (o el webhook de pago puede hacerlo separadamente).

## Probabilidades reales de packs (pity system)

La tabla `vexforge_pack_contents` actualmente tiene `chance_pct = 100` en todos los slots. Necesita migración a probabilidades reales:

```
Seed Pack (1 USDT):   2 Common (100%), 1 Uncommon (100%), resource (100%)
                       Pity: +5% Rare por cada Seed Pack abierto sin Rare
Scout Pack (5 USDT):  3 Common (100%), 1 Uncommon (100%), Rare (30%), recurso
                       Pity: garantizada 1 Rare cada 5 Scout Packs
Expedition (10 USDT): 3 Common, 1 Uncommon, 1 Rare (100%), Epic (15%), recurso
                       Pity: garantizado 1 Epic cada 8 Expedition Packs
Forge Pack (25 USDT): 2 Uncommon, 3 Rare (100%), Epic (40%), cosmético
                       Pity: garantizado 1 Epic cada 5 Forge Packs
Founder Pack (50 USDT): 2 Rare, 1 Epic (100%), Legendary (20%), badge exclusivo
                         Pity: garantizado 1 Legendary cada 4 Founder Packs
```

---

# PARTE 6: CONTENIDO DEL MUNDO

## World Bosses (10 bosses iniciales, tablas existen y están vacías)

| Boss | Región | Tier | Power Level | HP | Reward Pool |
|------|--------|------|-------------|-----|-------------|
| Karrath el Devorador | Norte Fracturado | 1 | 500 | 10.000 | 50 VEX + 1 Common random |
| La Sombra del Olvido | Ruinas del Sur | 2 | 1.200 | 25.000 | 120 VEX + 1 Uncommon random |
| Pyrethis, Señor del Caos | Volcán Eterno | 3 | 3.000 | 60.000 | 300 VEX + 1 Rare random |
| Nexus-7, El Calculador | Ciudad Muerta | 3 | 3.500 | 70.000 | 350 VEX + 1 Rare + Shard |
| Valdris el Inmortal | Cúpula de Cristal | 4 | 7.000 | 150.000 | 700 VEX + 1 Epic random |
| La Reina Vacía | Abismo Sin Fondo | 4 | 8.500 | 180.000 | 850 VEX + 1 Epic + Banner |
| Aetherion, Dios Roto | Templo Perdido | 5 | 18.000 | 400.000 | 1.800 VEX + 1 Legendary |
| El Tejedor de Realidades | Plano Fracturado | 5 | 22.000 | 500.000 | 2.200 VEX + 1 Legendary |
| VEXUS Prime | Núcleo del Mundo | 6 | 50.000 | 1.200.000 | 5.000 VEX + 1 Mythic shard |
| El Origen | Vacío Absoluto | 6 | 100.000 | 3.000.000 | 10.000 VEX + 1 Mythic card |

## Relics (20 reliquias iniciales, tabla existe y está vacía)

Las reliquias se equiman en el perfil y dan bonificaciones pasivas en combate.

| Código | Nombre | Efecto | Rareza |
|--------|--------|--------|--------|
| REL-001 | Amuleto del Forjador | +5% poder a cartas Common | Common |
| REL-002 | Cristal de Resonancia | Keyword Resonance activo sin facción | Uncommon |
| REL-003 | Espada Rota de Karrath | +10% poder al primer ataque de cada turno | Rare |
| REL-004 | Escudo de la Cúpula | Todas tus cartas obtienen Guard por 1 turno al inicio | Rare |
| REL-005 | Ojo de Nexus-7 | Puedes ver la mano del rival por 2 turnos | Epic |
| REL-006 | Núcleo de Aetherion | +20% poder a todas las cartas Legendary y Mythic | Legendary |
| REL-007 | Fragmento del Origen | Una vez por partida: revive la última carta eliminada con 50% de poder | Mythic |
| [+13 más por diseñar en ejecución] | — | — | — |

## Raids (sistema de raids grupales, tablas existen)

Raids son misiones cooperativas de 2-5 jugadores contra World Bosses. Los jugadores contribuyen con el poder de sus mazos. Las recompensas se distribuyen proporcionalmente a la contribución.

RPC a crear: `start_raid_run(p_boss_id uuid, p_player_ids uuid[])`

---

# PARTE 7: EVOLUCIÓN Y SINERGIAS DE CARTAS

## Paths de evolución (tabla `card_evolution_paths` existe y está vacía)

Cada carta tiene potencialmente una "forma evolucionada" que se obtiene por:
- Fusión especial con materiales específicos
- Alcanzar cierto número de victorias en PvP con esa carta en el mazo

Ejemplo:
```
Aprendiz de Runas (Common, Mago) 
  → [3 copias + 200 VEX + 10 victorias con Mago] 
  → Archimago de la Tormenta (Rare, Mago, +Flux, +Resonance)
```

## Reglas de sinergia (tabla `card_synergy_rules` existe y está vacía)

Cada regla define un bonus cuando se cumplen ciertas condiciones en el tablero:

```json
{
  "rule_id": "warrior_wall",
  "name": "Muralla de Acero",
  "condition": { "faction": "Guerrero", "min_cards_on_board": 3 },
  "effect": { "type": "bonus_power_all", "value": 0.15, "targets": "faction_Guerrero" },
  "description": "Cuando hay 3+ cartas Guerrero en el tablero, todas obtienen +15% de poder"
}
```

Diseñar 20 reglas de sinergia mínimas para lanzamiento (5 por facción).

---

# PARTE 8: PROGRESIÓN Y RETENCIÓN DE JUGADORES

## Daily Quests (sistema nuevo, no existe en DB)

Tablas a crear:
- `daily_quests` — pool de misiones diarias disponibles (20-30 distintas rotando)
- `player_daily_quests` — asignación diaria por jugador (3 por día)
- `player_quest_progress` — progreso en tiempo real

Ejemplos de daily quests:
- "Gana 2 partidas de PvP hoy" → 50 VEX + 200 XP
- "Completa 3 misiones de cualquier tipo" → 30 VEX + 150 XP
- "Funde una carta" → 20 VEX + 100 XP
- "Compra o vende en el mercado" → 25 VEX + 120 XP
- "Juega 10 cartas en combate" → 40 VEX + 180 XP

## Season Pass (Battle Pass)

Una temporada = 60 días. Estructura:
- 50 niveles de recompensas (1 nivel = 1.000 XP de temporada)
- Nivel gratuito: VEX Ingame + cartas Common/Uncommon
- Nivel premium (pago en VEX Tradeable): cosmetics + Rare/Epic garantizados + avatar frame

Tablas a crear: `season_pass_tiers`, `player_season_pass`

## Achievement System

Tabla a crear: `achievements` con achievements permanentes:
- "Primera Victoria" (gana tu primer PvP)
- "Coleccionista" (obtén 50 cartas únicas distintas)
- "Forjador" (realiza 10 fusiones)
- "Mercader" (completa 5 ventas en el mercado)
- etc. (50+ achievements)

---

# PARTE 9: SISTEMA DE COSMÉTICOS

Los cosméticos no afectan el gameplay pero son clave para la monetización secundaria.

## Tipos de cosméticos (tablas a crear o poblar)

| Tipo | Descripción | Obtención |
|------|-------------|-----------|
| **Card Frame** | Marco visual de la carta (oro, platino, VEX, void...) | Packs, Season Pass, Logros |
| **Board Skin** | Tablero de juego alternativo | Founder Pack, Season Pass premium |
| **Avatar** | Imagen de perfil | Logros, PvP rankings |
| **Title** | Título bajo el nombre ("Forjador de Mitos") | Logros especiales |
| **Clan Banner** | Banner visual del clan | Clan wars rewards |
| **Card Back** | Reverso alternativo de las cartas | Eventos especiales |
| **Emote** | Emotes de combate (taunt, saludo, GG) | Season Pass, packs |

---

# PARTE 10: PLAN DE EJECUCIÓN POR FASES

## FASE 1 — FUNDACIÓN DEL JUEGO (Prioridad Máxima)
**Objetivo: Que VEXFORGE sea un TCG jugable.**

### Bloque 1.1 — Supply y diseño de cartas
- [ ] Actualizar supply en tabla `cards`: modificar las 24 cartas existentes para que `supply` refleje los valores oficiales (50.000, 20.000, 8.000, 2.500, 750, 150 según rareza)
- [ ] Diseñar e insertar 103 cartas nuevas en Supabase (hasta 127 total) con: nombre, lore, faction, rarity, power, affinity, synergy_json con keywords, image_url (via storage de Supabase), card_tags
- [ ] Asignar keywords a las 24 cartas existentes (actualizar synergy_json)
- [ ] Poblar `card_synergy_rules` con las 8 keywords base + 20 reglas de sinergia de facción
- [ ] Actualizar `card_evolution_paths` con al menos 15 paths de evolución
- [ ] Imágenes: generar con IA (Midjourney/DALL-E) y subir a Supabase Storage en `vexforge-assets/cards/`

### Bloque 1.2 — Pack Fulfillment (CRÍTICO)
- [ ] Crear RPC `vexforge_fulfill_pack_order(p_order_id uuid)` → selección aleatoria real de cartas según `vexforge_pack_contents`, inserta en `player_cards`, incrementa `minted`
- [ ] Actualizar `vexforge_mark_pack_paid` para llamar a `vexforge_fulfill_pack_order` al final
- [ ] Migrar `vexforge_pack_contents`: añadir campo `pity_counter` y actualizar probabilidades reales (Rare 30% en Scout, Epic 15% en Expedition, etc.)
- [ ] Crear RPC `get_pity_state(p_player_id uuid, p_pack_key text)` → devuelve el contador de pity actual
- [ ] Frontend: actualizar `src/routes/PacksRoute.tsx` con pantalla de apertura de pack (animación, reveal de cartas obtenidas)
- [ ] Frontend: crear `src/domains/packs/PackOpeningOverlay.tsx`

### Bloque 1.3 — Deck Builder
- [ ] Crear tabla `player_decks` (id, player_id, name, faction_primary, card_count, active, created_at)
- [ ] Modificar `player_deck` para referenciar `player_decks.id`
- [ ] Crear RPCs: `create_deck`, `update_deck`, `delete_deck`, `validate_deck`, `set_active_deck`
- [ ] Frontend: crear `src/routes/DeckBuilderRoute.tsx` y `src/domains/decks/`
- [ ] Agregar ruta `/decks` en App.tsx
- [ ] Reglas UI: contador de 30 cartas, restricción de duplicados, curva de mana visual

### Bloque 1.4 — Motor de Combate
- [ ] Crear RPC `start_combat_session(p_player_a, p_player_b, p_format)` → inicializa combat_session + combat_participants (HP: 20 cada uno, manos iniciales de 5 cartas, mazos shuffleados)
- [ ] Crear RPC `play_card(p_session_id, p_card_id, p_target_id)` → aplica el costo de mana, mueve carta a tablero, resuelve Flux/on_play
- [ ] Crear RPC `declare_attack(p_session_id, p_attacker_id, p_target_id)` → resuelve combate carta-vs-carta o carta-vs-jugador, aplica Guard/Surge/Drain/Consecrate
- [ ] Crear RPC `end_turn(p_session_id)` → cambia turno activo, da +1 mana al siguiente, roba carta, verifica win condition
- [ ] Crear RPC `get_combat_state(p_session_id)` → estado completo del tablero (mano, tablero, HP, mana, turno actual)
- [ ] Modificar `start_pvp_match` para usar `start_combat_session` en lugar del sum(power)
- [ ] Frontend: crear `src/routes/BattleRoute.tsx` (tablero de juego completo)
- [ ] Frontend: crear `src/domains/battle/` con useBattle hook, BoardView, CardInHand, CardOnBoard

### Bloque 1.5 — Deck Building UI
- [ ] Crear `src/routes/DeckBuilderRoute.tsx`
- [ ] Filtros de cartas por rareza, facción, keyword, power
- [ ] Deck list lateral con contador, curva de mana (bar chart), facción indicator
- [ ] Botón "Ir a Combate" que valida el mazo y entra a matchmaking

## FASE 2 — CONTENIDO Y COMPETITIVIDAD

### Bloque 2.1 — World Content
- [ ] Insertar 10 World Bosses en `world_bosses` con stats del plan maestro
- [ ] Insertar 20 Relics en `relics` con efectos definidos
- [ ] Crear RPC `start_world_boss_encounter(p_boss_id, p_player_ids)`
- [ ] Crear RPC `start_raid_run(p_boss_id, p_player_ids)`
- [ ] Frontend: crear `src/routes/WorldRoute.tsx` (mapa interactivo con 5 regiones, bosses, misiones disponibles)
- [ ] Frontend: crear `src/routes/RaidsRoute.tsx`

### Bloque 2.2 — Daily Quests + Achievement System
- [ ] Crear tablas: `daily_quests`, `player_daily_quests`, `player_quest_progress`, `achievements`, `player_achievements`
- [ ] Insertar 30 daily quests y 50 achievements base
- [ ] Crear RPCs: `get_daily_quests(p_player_id)`, `update_quest_progress(p_player_id, p_event_type)`, `claim_quest_reward(p_quest_id)`
- [ ] Frontend: integrar daily quests en `HomeRoute.tsx` y `ProfileRoute.tsx`
- [ ] Frontend: panel de achievements en `ProgressRoute.tsx`

### Bloque 2.3 — Season Pass
- [ ] Crear tablas: `season_pass_tiers`, `player_season_pass`, `season_xp_events`
- [ ] Insertar 50 tiers para la temporada actual con recompensas free y premium
- [ ] Crear RPC `grant_season_xp(p_player_id, p_amount, p_source)`
- [ ] Frontend: crear `src/routes/SeasonPassRoute.tsx` (UI de tiers con progress bar)

### Bloque 2.4 — Clan Wars
- [ ] Poblar la lógica de `clan_wars` (tablas existen, sin RPCs de combate entre clanes)
- [ ] Crear RPC `start_clan_war(p_clan_a_id, p_clan_b_id)`
- [ ] Crear RPC `resolve_clan_war(p_war_id)`
- [ ] Frontend: sección de Clan War en `ClansRoute.tsx`

### Bloque 2.5 — Draft/Arena Format
- [ ] Crear tabla `draft_sessions` (id, player_id, picks, deck_built, status)
- [ ] Crear RPC `start_draft(p_player_id)` → genera 3 opciones de 3 cartas aleatorias (30 rondas)
- [ ] Crear RPC `pick_draft_card(p_draft_id, p_card_id)`
- [ ] Frontend: `src/routes/DraftRoute.tsx`

## FASE 3 — PULIDO WORLD-CLASS

### Bloque 3.1 — Cosméticos
- [ ] Crear tablas: `cosmetics`, `player_cosmetics`, `equipped_cosmetics`
- [ ] Insertar cosmetics iniciales (20+ frames, 5 boards, 10 avatars, 15 titles)
- [ ] Sistema de equipamiento en ProfileRoute

### Bloque 3.2 — Ranked System Real
- [ ] Diseño de rangos: Iron → Bronze → Silver → Gold → Platinum → Diamond → Mythic
- [ ] Implementar protección de rango (escudos por tier)
- [ ] Actualizar `pvp_rankings` y `resolve_pvp_match` para usar el sistema de rangos
- [ ] Frontend: ranking visual con badges en `PvpRoute.tsx`

### Bloque 3.3 — Social Features
- [ ] Crear tabla `friendships` (player_a, player_b, status)
- [ ] Crear tabla `direct_challenges` (challenger, challenged, status, deck_id)
- [ ] RPCs: `send_friend_request`, `accept_friend_request`, `send_challenge`
- [ ] Frontend: lista de amigos + duelos directos

### Bloque 3.4 — Spectating y Replays
- [ ] `combat_sessions` ya guarda todos los turnos → replay = reproducir `combat_turns`
- [ ] Crear endpoint RPC `get_match_replay(p_session_id)`
- [ ] Frontend: `BattleRoute` con modo espectador (read-only)

### Bloque 3.5 — Mobile / PWA
- [ ] Configurar PWA manifest + service worker para la app web
- [ ] Optimizar BattleRoute para pantallas táctiles (drag & drop cards)
- [ ] O: migrar a Expo React Native con mismo backend Supabase

---

# PARTE 11: MÉTRICAS DE ÉXITO POR FASE

| Fase | Métricas de completitud |
|------|------------------------|
| Fase 1 | 127 cartas únicas con keywords activos. Pack opening entrega cartas realmente. Deck builder funcional con validación. Partida completa de PvP turn-by-turn jugable en browser. |
| Fase 2 | 10 world bosses activos. 50 achievements. Daily quests generando retención diaria. Season Pass con 50 tiers. Clan Wars con resolución automática. |
| Fase 3 | Ranked system con 7 rangos. Friend system. Replays funcionales. 20+ cosméticos disponibles. Mobile-ready. |

---

# PARTE 12: ESTADO ACTUAL DEL PROYECTO (referencia para el agente ejecutor)

## Lo que YA existe y funciona (no tocar sin razón)

- Backend económico completo: VEX Ingame, VEX Tradeable, economy_ledger, retiros, fusión (5 tiers)
- Mercado P2P: create_listing, buy_listing, cancel_listing
- Autenticación: Supabase Auth + on_auth_user_created (trigger auto-crea player row)
- Frontend: 15 dominios, 83+ archivos, React+Vite+TypeScript, todos live en `vexforge_frontend_source_files`
- Pack orders: vexforge_create_pack_order, vexforge_mark_pack_paid (falta fulfillment)
- Misiones: 31 activas, execute_mission funcional
- Clanes: create_clan funcional
- PvP base: start_pvp_match (instantáneo por power), pvp_seasons activa
- Fusión: vexforge_apply_fusion completo

## RPCs existentes verificados (no re-crear)

execute_mission, vexforge_apply_fusion, fuse_cards, create_listing, buy_listing, cancel_listing, create_clan, start_pvp_match, resolve_pvp_match, vexforge_create_pack_order, vexforge_mark_pack_paid, assert_caller_is_player, vexforge_ensure_player_state

## Tablas que existen pero están vacías (a poblar)

world_bosses, relics, card_evolution_paths, card_synergy_rules, combat_sessions, combat_turns, combat_effects, combat_participants, combat_results, raid_runs, raid_participants, raid_rewards, pvp_matchmaking_queue, pvp_rewards

---

# FIRMA DEL PLAN

- Documento creado: 2026-07-18 — Chat 42
- Próxima sesión empieza por: **Bloque 1.1 (Supply de cartas + diseño de 103 cartas nuevas)**
- Destino de persistencia: `vexforge_frontend_source_files` file_path: `docs/MASTER_WORK_PLAN.md`
- Decisión registrada en: `vexforge_project_decisions` key: `chat42_master_work_plan_v1`