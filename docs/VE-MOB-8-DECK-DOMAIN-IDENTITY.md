# VE-MOB-8 — DECK DOMAIN IDENTITY

## Target

The Android Forge screen in `mobile/app/(tabs)/deck.tsx`.

## Current behavior

The screen had the shared `ScreenShell`, but its programmatic surface introduced its own heading instead of announcing the shared Forja domain identity.

## Visual and data delta

The heading now consumes `DomainHeader` with `domain="forja"`. Its status remains grounded in live state:

- `SINCRONIZANDO MAZOS` while collection or deck data is loading;
- `SIN SEÑAL · TOCA PARA REINTENTAR` for the existing offline/error state;
- saved card count and factions when an official deck exists;
- the existing purpose text when the player has no saved deck.

The visible refresh action remains in the shared header's trailing slot.

## Source of truth

The header status uses the existing `useGame()` sync state, `loadPlayerDeck()` result, and `summarizeDeck(savedSlots)` projection. No deck, faction, card, or status values are fabricated.

## Acceptance

- Forja is announced through the shared domain identity registry.
- The existing programmatic surface, measured frame, controls, routes, save flow, and responsive layout remain intact.
- Loading and offline/error states remain explicit.
- The block remains `IMPLEMENTED_UNVERIFIED` until APK/device QA.