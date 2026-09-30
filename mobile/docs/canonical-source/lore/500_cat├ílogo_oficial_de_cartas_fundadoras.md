---
  title: "Catálogo Oficial de Cartas Fundadoras"
  category: "lore"
  version: "1.0"
  status: "superseded"
  doc_key: "vexforge_founder_cards_catalog"
  updated_at: "2026-07-04T20:13:03.995698+00:00"
  ---

  # Catálogo Oficial de Cartas Fundadoras

Las siguientes cartas representan el núcleo inicial del universo.

## Paladines de Aether

Aetherion
Rol: Tanque

Seraphina
Rol: Curación

Valgard
Rol: Defensa

Lumina
Rol: Soporte

## Legión Umbral

Nocthar
Rol: Asesino

Morgath
Rol: Debuff

Umbriel
Rol: Daño

Vorak
Rol: Ejecutor

## Sindicato Mecánico

Unit-07
Rol: Control

Omega Core
Rol: Invocador

Steelmind
Rol: Soporte

Machina Prime
Rol: Tanque

## Hijos del Vacío

Xal'Kor
Rol: Caos

Nethra
Rol: Corrupción

Void Spawn
Rol: Daño

Abyss Walker
Rol: Disrupción

## Guardianes Primordiales

Sylvara
Rol: Regeneración

Thorn King
Rol: Tanque

Gaia Spirit
Rol: Soporte

Ancient Root
Rol: Resistencia

Regla Oficial:

Estas cartas constituyen el núcleo fundador del juego.

  ---
  ## CORRECCIÓN OFICIAL (2026-07-04)

  Este documento describe un sistema narrativo (5 facciones: Paladines de Aether, Legión Umbral, Sindicato Mecánico, Hijos del Vacío, Guardianes Primordiales / 20 cartas fundadoras) que **NO coincide con la implementación real en la base de datos**.

  La estructura realmente implementada (tabla `factions` con 4 filas, usada por FK en `cards`, `tg_cards`, `player_factions`, `faction_perks`, `player_state.faction_id`, `user_profile.faction`) es:

  - **Guerrero** (facción común, junto con Mago)
  - **Mago**
  - **Paladín** (infrecuente)
  - **Pícaro** (rara/épica)

  Y el catálogo de cartas fundadoras realmente implementado (tabla `tg_cards`, slots `FOUNDER_SLOT_1`..`FOUNDER_SLOT_24`) es de **24 cartas**, no 20, distribuidas como pirámide de rareza: 12 Común / 6 Infrecuente / 4 Rara / 2 Épica, con suministro 20000/20000/7500/1500/300.

  Este documento queda marcado como **superseded** (no autoritativo para desarrollo). Se conserva íntegro por valor histórico/narrativo. Los nombres, arte e historia individuales de las 24 cartas reales aún NO están definidos en ningún documento oficial ni en la base de datos — esto es un pendiente de contenido creativo que requiere decisión del equipo/propietario del proyecto. No se han inventado nombres para llenar este vacío.

  Ver decisión oficial: `decision_faction_founder_reconciliation_2026_07` en `vexforge_project_decisions`.
  ---
  