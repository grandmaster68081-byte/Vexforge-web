# VE-3-PILOT — Tres cartas canónicas de identidades contrastantes

**Fecha de preflight:** 2026-08-31  
**Unidad:** `VE-3-PILOT`  
**Estado:** `IMPLEMENTED_UNVERIFIED` para el dossier y la guarda de procedencia;
`IN_PROGRESS` para la integración authored por superficie  
**Nivel:** `Q2 → Q3`  
**Fuente de código:** `grandmaster68081-byte/Vexforge-web`, `main`,
`d70663ed13801177736b892459ac083ef4e4c6e8` durante el preflight  
**Fuentes de datos:** Supabase `cards`, manifiesto
`vexforge_official_asset_manifest`, protocolo vivo
`vexforge_master_protocol_v2` v2.8-official-visual-consumption-law y
`docs/VE-1-VISUAL-BIBLE.md`

## Objetivo

Probar que tres cartas reales pueden tener una lectura propia sin romper el
motor común, sustituir datos autoritativos por presentación ni convertir la
rareza o la facción en una identidad intercambiable.

Este lote no modifica estadísticas, keywords, lore, balances, economía,
combate autoritativo, Storage, Auth, RPCs o RLS. No genera imágenes nuevas: las
tres cartas ya tienen arte oficial inscrito y accesible.

## Resultado de preflight

| Código | Nombre | Facción | Rareza | Especialización | Región | Estado de release |
|---|---|---|---|---|---|---|
| `VEX-0016` | Acechador Nocturno | Pícaro | Epic | Base | Catedral del Alba | founder |
| `VEX-0017` | Bastión de Hierro | Guerrero | Legendary | Tank | Reino del Acero | founder |
| `VEX-0097` | Arcanista del Caos | Mago | Rare | Arcanist | `NULL` | active |

Los campos de poder, afinidad, prestigio, carga, lore, `synergy_json`,
`image_url`, dominio canónico y estado activo también fueron consultados en
Supabase y quedan congelados como lectura de esta unidad. La guarda no
hardcodea ni reescribe esos valores.

### Procedencia de arte

| Código | `cards.image_url` relativo | Registro | HTTP |
|---|---|---|---|
| `VEX-0016` | `cards/IMG_20260606_012328_631.jpg` | `card_art`, `official=true`, `enabled=true` | 200 |
| `VEX-0017` | `cards/IMG_20260606_012330_361.jpg` | `card_art`, `official=true`, `enabled=true` | 200 |
| `VEX-0097` | `cards/rare_arcanista_del_caos.jpg` | `card_art`, `official=true`, `enabled=true` | 200 |

## Contrato de identidad

Las decisiones siguientes son tratamientos visuales derivados de datos
existentes, no nuevos hechos de canon:

- **Acechador Nocturno:** lectura de sombra contenida, borde frío y revelado
  lateral breve. El nombre, Pícaro, Epic y las keywords `Drain`, `Veil`,
  `Forge` autorizan una dirección de sigilo, barrera y extracción. No se
  inventa criatura ni se afirma una personalidad.
- **Bastión de Hierro:** lectura vertical, peso metálico y luz de brasa
  sostenida. Guerrero, Legendary, `Tank`, `is_commander`, Reino del Acero y
  `Guard`, `Surge`, `Forge` autorizan una dirección de defensa y autoridad
  posicional. No se convierte `commander` en una regla nueva de combate.
- **Arcanista del Caos:** lectura radial, energía violeta/azul y dispersión
  breve. Mago, Rare, `Arcanist` y `Flux`, `Resonance` autorizan una dirección
  arcana inestable. Como `region_id` es `NULL`, no se asigna región ni
  ambiente regional.

### Campos no disponibles

`element`, `creature_type`, `personality`, relaciones narrativas adicionales,
voz, líneas autorizadas y poderes visuales específicos no constan en el
payload consultado para estas cartas. Su estado es `PENDIENTE_DE_FUENTE`.
No se rellenan con interpretación artística.

## Pasaportes VE-CARD

### VE-CARD-VEX-0016 — Acechador Nocturno

- **Datos canónicos:** `VEX-0016`; Pícaro; Epic; Base; Catedral del Alba;
  `power=64`, `affinity=25`, `prestige=8`, `charge=5`; release `founder`.
- **Keywords reales:** `Drain`, `Veil`, `Forge`; faction bonus Pícaro `0.18`.
- **Lore autorizado:** “En la noche perfecta, el ruido de una daga es más
  fuerte que un grito.”
- **Arte actual:** `cards/IMG_20260606_012328_631.jpg`, `card_art`, oficial,
  habilitado, Storage 200.
- **Diagnóstico:** el arte actual ya es canónico y debe permanecer como
  baseline; el tratamiento authored debe aumentar reconocimiento sin cubrir
  nombre, stats ni ilustración.
- **Silueta/material/luz/paleta derivados:** perfil estrecho; superficie
  obsidiana velada; luz rasante fría con brasa mínima; violeta oscuro y
  verde de Pícaro como acento de estado. Son decisiones de presentación, no
  metadata de juego.
- **Entrada/reveal:** `APLICA`; entrada lateral corta, opacidad y
  desplazamiento, sin cámara exclusiva todavía.
- **Idle/presencia:** `APLICA`; reposo casi estático con respiración tenue.
- **Ataque/keyword/impacto:** `APLICA`; `Drain` usa lectura de corazón/flujo,
  `Veil` lectura de bloqueo y `Forge` lectura de ataque mediante `ForgeIcon`;
  la animación sólo se dispara con el evento real.
- **Daño/curación/muerte:** `APLICA`; conserva cues existentes y reduced
  motion; `Drain` no inventa curación si el turno no la devuelve.
- **Campeón/reserva/reliquia/terreno:** `PENDIENTE_DE_FUENTE` para una
  interacción específica; se conserva el tratamiento común.
- **Victoria/derrota/retirada/replay:** `APLICA` con el resultado existente,
  sin desenlace narrativo nuevo.
- **Pack/recompensa/evolución/colección:** `APLICA`; usa el arte de carta y
  los datos reales, sin nueva portada.
- **Lore/relaciones:** `APLICA` sólo para el lore entregado; relaciones
  adicionales `PENDIENTE_DE_FUENTE`.
- **Audio:** `APLICA` para `sfx:ui`, `sfx:combat` y `sfx:rewards` según
  contexto; motif exclusivo y voz `PENDIENTE_DE_FUENTE`.
- **Prompt/negative prompt/variantes:** `NO APLICA`; no se generó arte nuevo.
  Una regeneración futura debe abrir `VE-ASSET-VEX-0016`, preservar este
  baseline, conservar procedencia y guardar la versión anterior.

### VE-CARD-VEX-0017 — Bastión de Hierro

- **Datos canónicos:** `VEX-0017`; Guerrero; Legendary; Tank; Reino del
  Acero; `power=150`, `affinity=34`, `prestige=18`, `charge=8`; release
  `founder`; `is_commander=true`.
- **Keywords reales:** `Guard`, `Surge`, `Forge`; faction bonus Guerrero `0.25`.
- **Lore autorizado:** “El verdadero muro no se mueve, no duda y no cae.”
- **Arte actual:** `cards/IMG_20260606_012330_361.jpg`, `card_art`, oficial,
  habilitado, Storage 200.
- **Diagnóstico:** el arte y la rareza ya producen el mayor peso visual del
  piloto; authored treatment debe priorizar estabilidad y lectura de rol, no
  añadir una recompensa o regla.
- **Silueta/material/luz/paleta derivados:** masa ancha; hierro forjado;
  vertical de luz ámbar; rojo de Guerrero subordinado a la rareza dorada.
- **Entrada/reveal:** `APLICA`; entrada vertical con desaceleración pesada.
- **Idle/presencia:** `APLICA`; pulso de borde de baja frecuencia, limitado
  para no competir con la lectura de la formación.
- **Ataque/keyword/impacto:** `APLICA`; `Guard` se expresa con `shield`,
  `Surge` con `energy` y `Forge` con `attack`, sólo como lectura visual de
  keywords reales.
- **Daño/curación/muerte:** `APLICA`; el impacto y la barra HP siguen al
  evento autoritativo; no se altera el daño por tener identidad de Tank.
- **Campeón/reserva/reliquia/terreno:** `APLICA` sólo en la presentación común
  del Campeón/formation; una interacción authored exclusiva queda
  `PENDIENTE_DE_FUENTE`.
- **Victoria/derrota/retirada/replay:** `APLICA` con el resultado existente,
  sin declarar que `commander` cambie el settlement.
- **Pack/recompensa/evolución/colección:** `APLICA`; conserva el tratamiento
  Legendary existente y el arte oficial.
- **Lore/relaciones:** `APLICA` sólo para el motto/lore indicado; lo demás
  `PENDIENTE_DE_FUENTE`.
- **Audio:** `APLICA` para contextos existentes; SFX propio de metal o voz
  `PENDIENTE_DE_FUENTE`, porque no existe un asset/brief canónico.
- **Prompt/negative prompt/variantes:** `NO APLICA`; no se generó arte nuevo.
  Toda mejora futura debe ser versionada y reversible.

### VE-CARD-VEX-0097 — Arcanista del Caos

- **Datos canónicos:** `VEX-0097`; Mago; Rare; Arcanist; región `NULL`;
  `power=31`, `affinity=16`, `prestige=5`, `charge=3`; release `active`.
- **Keywords reales:** `Flux`, `Resonance`; faction bonus Mago `0.12`.
- **Lore autorizado:** “Transforma el caos en energía arcana pura.”
- **Arte actual:** `cards/rare_arcanista_del_caos.jpg`, `card_art`, oficial,
  habilitado, Storage 200.
- **Diagnóstico:** es el control del piloto contra el exceso de aura de
  rareza; el authored treatment debe ser legible y breve, no simular que Rare
  tiene el peso de Legendary o Mythic.
- **Silueta/material/luz/paleta derivados:** figura de contorno abierto;
  vidrio/energía arcana; luz radial azul-violeta; nunca se asigna un paisaje
  regional porque `region_id` no existe.
- **Entrada/reveal:** `APLICA`; revelado radial pequeño con foco en el arte.
- **Idle/presencia:** `APLICA`; variación contenida de energía, desactivable
  por reduced motion.
- **Ataque/keyword/impacto:** `APLICA`; `Flux` y `Resonance` usan la lectura
  `spark` ya declarada por el catálogo, sin texto o efecto inventado.
- **Daño/curación/muerte:** `APLICA` con cues actuales; no se deduce daño
  adicional del nombre “Caos”.
- **Campeón/reserva/reliquia/terreno:** `PENDIENTE_DE_FUENTE` para un
  tratamiento específico; se mantiene la presentación común.
- **Victoria/derrota/retirada/replay:** `APLICA` con el resultado real,
  sin narrativa nueva.
- **Pack/recompensa/evolución/colección:** `APLICA`; conserva rareza Rare y
  arte oficial.
- **Lore/relaciones:** `APLICA` sólo para la línea autorizada; relaciones
  adicionales `PENDIENTE_DE_FUENTE`.
- **Audio:** `APLICA` para ambientación de contexto y `sfx:combat`; motif
  arcano exclusivo y voz `PENDIENTE_DE_FUENTE`.
- **Prompt/negative prompt/variantes:** `NO APLICA`; no se generó arte nuevo.
  La ausencia de región impide un fondo regional authored.

## Integración prevista y estado actual

| Superficie | Consumidor actual | Baseline comprobable | Integración authored |
|---|---|---|---|
| Tile/lista | `src/routes/CardsRoute.tsx` | `image_url`, rareza, facción y keywords provienen de `cards` | `IN_PROGRESS` |
| Inspector | `src/routes/CardsRoute.tsx` | consulta `getCardByCode` y muestra datos reales | `IN_PROGRESS` |
| Entrada al tablero | `src/components/battle/BattleCard.tsx` | imagen, rareza, facción, stats y keywords vienen de `BattleUnit` | `PENDIENTE_DE_FUENTE`: el payload de batalla no transporta `code` |
| Idle/ataque/impacto | `BattleCard`, `ForgeFormationBoard`, cues de combate | eventos y estados actuales conservados | `IN_PROGRESS`; authored por carta requiere `code` o un identificador canónico |
| Resultado | `BattleResultScreen` y escena de combate | resultado/turnos siguen siendo autoritativos | `APLICA` común; no authored hasta tener fuente |
| Pack/evolución/colección | rutas de colección y pack | arte y datos reales | `IN_PROGRESS` |
| Android colección/deck | `mobile/lib/supabase.ts` y pantallas nativas | `PublicCard` transporta `code`, `image_url`, rareza, facción y synergy | `IMPLEMENTED_UNVERIFIED` en Colección; falta QA APK |

No se puede afirmar integración authored completa en batalla hasta que el
contrato entregue un identificador canónico sin cambiar la autoridad del
combate. Añadirlo es una unidad de integración posterior; no se usa el nombre
como clave silenciosa.

### Android — Colección y detalle

La pantalla nativa de Colección consume el mismo piloto por `PublicCard.code`
mediante `mobile/constants/cardPilot.ts`. El tratamiento sólo añade overlay,
borde e icono authored sobre el `image_url` oficial ya entregado por Supabase;
no crea una ruta de Storage, no reemplaza el arte y no cambia estadísticas,
colección, combate o recompensas. Los tres códigos tienen una marca visual
verificable `card-pilot-<code>` para la validación del APK.

## Responsive, accesibilidad y rendimiento

- La imagen oficial mantiene `alt`/`accessibilityLabel` con el nombre real.
- El color de rareza/facción nunca es el único canal: nombre, stats,
  keywords y labels permanecen visibles.
- Reduced-motion conserva reveal, impacto, estado y resultado en forma estática
  y desactiva tilt, shake, shimmer, partículas y cámara no esenciales.
- El tratamiento authored debe usar transform/opacity/filter, no forzar
  reflow; el objetivo es 60 FPS en viewport desktop y Android.
- No se añaden requests: las imágenes siguen siendo `cards.image_url` y el
  audio sigue el manifiesto procedural de contexto.
- Los estados `loading`, `empty`, `error`, `locked` y `unlocked` no reciben
  sustitutos diegéticos. Si falta el arte, el estado debe ser explícito.

## Guardas y evidencia

La guarda `npm run verify:card-pilot` comprobará:

1. los tres códigos exactos existen y están activos;
2. sus campos canónicos obligatorios no están vacíos;
3. cada `image_url` resuelve a un asset `card_art` oficial y habilitado;
4. los tres objetos públicos de Storage responden;
5. los consumidores web continúan leyendo arte y datos desde payloads reales;
6. no se introducen rutas `cards/` literales para sustituir el registro.

Guardas existentes ejecutadas durante el preflight:

- `verify:card-art`: 127/127 cartas, arte biyectivo, inscrito y presente.
- `verify:surface-art`: 29 inscritos, 18 consumidos, 11 en reserva.
- `verify:combat-scene`: 7 ramas y 7 labels, con reduced-motion.
- `verify:residual-art`: 237 filas de manifiesto, sin referencias residuales
  inválidas.

## Nivel, deuda y reapertura

El dossier y la guarda alcanzan `IMPLEMENTED_UNVERIFIED`, `Q2 → Q3`. No se
declara `OPERATIONAL`, `PASS` ni `TIER1_READY`.

Deuda concreta:

1. Integrar el mapa authored seguro para los tres códigos en tile/inspector/
   pack y en el contrato de batalla sin usar nombres como claves.
2. Decidir si se crean motifs no verbales por carta; hasta entonces sólo se
   usan contextos `sfx:ui`, `sfx:combat` y `sfx:rewards`.
3. Resolver los campos `element`, criatura, personalidad y relaciones sólo
   cuando una fuente oficial los proporcione.
4. Ejecutar la matriz visual en navegador y Android real, incluida la variante
   reduced-motion; la integración de Colección Android queda
   `IMPLEMENTED_UNVERIFIED` hasta esa revisión.
5. Comparar cada carta contra otra carta del mismo sistema y registrar peso,
   memoria, carga y estabilidad.

**Condición de reapertura:** cambio en cualquiera de los tres registros,
`image_url`, manifest, `synergy_json`, contrato de `BattleUnit`, consumidor
visual, reduced-motion o fuente narrativa; aparición de un fallback genérico;
o evidencia de que las tres cartas vuelven a parecer la misma plantilla.