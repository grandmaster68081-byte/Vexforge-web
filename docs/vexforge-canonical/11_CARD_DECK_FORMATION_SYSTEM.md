# 11 — CARD / DECK / FORMATION SYSTEM

```text
CARD CATALOG → CARD → OWNERSHIP → INVENTORY → DECK → FORMATION → BATTLE
```

## Código

- Tipos `PublicCard`, `PlayerCard`, `DeckSlot`, `DeckValidation` en `mobile/lib/supabase.ts`.
- Carga de catálogo en `loadCatalogSnapshot`.
- Ownership/collection en `loadPlayerCollection`.
- Deck en `loadPlayerDeck`, `validateDeck`, `saveDeck`.
- Presentación en `mobile/app/(tabs)/collection.tsx`, `deck.tsx`, `ForgeArchiveScene.tsx` y `ForgeFormationPreview.tsx`.
- Identidad piloto/canónica en `mobile/constants/cardIdentity.ts` y `cardPilot.ts`.

## Backend live representativo

`cards`, `cards_canonical`, `player_cards`, `inventory`, `player_deck`, `v_player_forge_formation`, `v_card_master`, además de RPCs de validación y almacenamiento de formación observadas en el catálogo live.

## Separación

- Card data ≠ card image.
- Ownership ≠ catalog.
- Deck ≠ formation.
- Formation ≠ battle result.

El cliente puede seleccionar y presentar; la validez, ownership, slots, reglas y persistencia deben mantenerse en la autoridad backend. Estado: `IMPLEMENTED_UNVERIFIED` salvo evidencia específica.
