# VE-MOB-5 — CONSTRUCTOR DE MAZOS

## Alcance

Portar a la aplicación Android el constructor de mazos de VEXFORGE:

- colección real del jugador como fuente de cartas disponibles;
- mazo persistido desde `public.player_deck`;
- selección de 5 a 30 cartas, máximo 2 copias y máximo 1 copia de cartas Legendary/Mythic;
- límites globales del contrato vivo: máximo 1 carta Mythic y 3 cartas Legendary por mazo;
- máximo de 2 facciones en el formato estándar;
- lectura de potencia del mazo y selección local de Campeón para orientar la formación;
- validación y guardado a través de `validate_deck` y `save_deck`;
- búsqueda, filtros, estados de carga, error, colección vacía y cero coincidencias.

## Fuentes canónicas

- Código de `main`, `src/routes/DeckBuilderRoute.tsx` y `src/domains/deck/`.
- Supabase vivo: `player_deck`, `player_cards`, `cards`, `validate_deck` y `save_deck`.
- `VEXFORGE_PROTOCOL_V2.md`, sección 0, regla Cero Genéricos.
- `docs/VE-MOB-0-PORT-INVENTORY.md`.

## Criterios de aceptación

1. La pantalla usa las cartas reales de la colección del jugador y no una lista local de demostración.
2. El mazo existente se carga desde Supabase con RLS y conserva el orden de sus slots.
3. La selección táctil aplica los límites del formato estándar y refleja cantidades disponibles.
4. La validación y el guardado pasan por las RPC autoritativas; el cliente no duplica la lógica de persistencia.
5. El Deck Power Score es una lectura visual derivada y no altera combate, daño, settlement, recompensas o economía.
6. Búsqueda y filtros funcionan sin perder el mazo seleccionado.
7. Los estados de carga, error, vacío y cero coincidencias son explícitos; no hay loaders eternos.
8. La unidad conserva iconografía de VEXFORGE, no usa emojis ni arte genérico, muestra explícitamente cualquier arte canónico pendiente y respeta el tema semántico de Android.
9. La entrega se verifica con typecheck móvil, `verify:mobile-deck`, guards web sin regresión y workflow APK oficial exitoso con release correlativo.

## Implementación

- `mobile/lib/supabase.ts`: contratos y lecturas/acciones del mazo contra Supabase.
- `mobile/app/(tabs)/deck.tsx`: superficie táctil del constructor, filtros, resumen, validación y guardado.
- `mobile/app/(tabs)/_layout.tsx`: acceso como quinta pestaña, dentro del máximo Android permitido.
- `scripts/verify-mobile-deck.mjs`: guarda estática específica de la unidad.

## Estado y evidencia

- Estado inicial: `NOT_STARTED` según el inventario de port.
- Estado de implementación: `IMPLEMENTED_UNVERIFIED` después del workflow APK; requiere recorrido del operador en dispositivo o emulador.
- Nivel Q: Q2 actual / Q3 objetivo.
- Datos autoritativos: no se cambiaron tablas, RPCs, RLS, Storage, economía ni resultados de combate.

## Deuda y condición de reapertura

Reabrir si cambia el contrato de `player_deck`, `player_cards` o las RPCs; la pantalla deja de cargar el mazo real; aparecen límites distintos a los del servidor; falla el workflow/release; o el operador encuentra un problema de interacción, overflow, accesibilidad o estado real.

## Siguiente acción verificable

Instalar el APK del commit de cierre y recorrer con una sesión normal: cargar el mazo, añadir/quitar copias, superar y romper límites, validar, guardar, recargar y comprobar el estado vacío de colección. No declarar `OPERATIONAL` hasta recibir esa evidencia.