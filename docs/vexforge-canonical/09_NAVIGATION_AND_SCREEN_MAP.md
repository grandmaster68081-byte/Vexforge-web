# 09 — NAVIGATION AND SCREEN MAP

## Unity Android active

La navegación activa pertenece a Unity y pasa por `VexforgeDiegeticInputRouter`
y `NavigationService`. Los gateways del Nexus conectan explícitamente con
`NEXUS`, `ARCHIVE`, `FORGE`, `BATTLEFIELD`, `MISSIONS` y `ECONOMY`.

| Route | Unity surface | Auth | Status |
|---|---|---|---|
| `NEXUS` | `NexusPresentationRoot` | yes | IMPLEMENTED_UNVERIFIED |
| `ARCHIVE` | `GameShellController` + `VexforgeCardPool` | yes | IMPLEMENTED_UNVERIFIED |
| `FORGE` | `GameShellController` + server validation | yes | IMPLEMENTED_UNVERIFIED |
| `BATTLEFIELD` | `GameShellController` + server resolve | yes | IMPLEMENTED_UNVERIFIED |
| `MISSIONS` | `GameShellController` | yes | IMPLEMENTED_UNVERIFIED |
| `ECONOMY` | `GameShellController` | yes | IMPLEMENTED_UNVERIFIED |

## Legacy / historical mobile record

| Route | File | Parent/entry | Auth | Data/acciones | Status |
|---|---|---|---|---|---|
| `/auth` | `mobile/app/auth.tsx` | root stack | no | sign in/up/OAuth/reset | ACTIVE |
| `/tutorial` | `mobile/app/tutorial.tsx` | root stack | yes | tutorial progress/skip | ACTIVE |
| `/(tabs)` | `mobile/app/(tabs)/_layout.tsx` | root stack | yes | auth/tutorial guard | ACTIVE |
| `/(tabs)/` | `mobile/app/(tabs)/index.tsx` | tabs | yes | home stats/activity/missions | ACTIVE |
| `/(tabs)/battle` | `mobile/app/(tabs)/battle.tsx` | tabs | yes | opponents/battle/formation/events | ACTIVE |
| `/(tabs)/collection` | `mobile/app/(tabs)/collection.tsx` | tabs | yes | catalog/player cards | ACTIVE |
| `/(tabs)/deck` | `mobile/app/(tabs)/deck.tsx` | tabs | yes | deck validate/save | ACTIVE |
| `/(tabs)/profile` | `mobile/app/(tabs)/profile.tsx` | tabs | yes | profile/progress/achievements | ACTIVE |
| `/world` | `mobile/app/world.tsx` | root stack | yes | bosses/raids/lore/season/rank | ACTIVE |
| `/missions` | `mobile/app/missions.tsx` | root stack | yes | mission execution/rewards | ACTIVE |
| `/economy` | `mobile/app/economy.tsx` | root stack | yes | wallet/ledger/deposit/withdrawal | ACTIVE |
| `/store` | `mobile/app/store.tsx` | root stack | yes | packs/shop/orders | ACTIVE |
| `/social` | `mobile/app/social.tsx` | root stack | yes | friends/challenges/clans | ACTIVE |
| `/meta` | `mobile/app/meta.tsx` | root stack | yes | settings/cosmetics/relics/NFT/referrals | ACTIVE |
| `+not-found` | `mobile/app/+not-found.tsx` | root stack | no | not found | ACTIVE |

## Web / shared / unknown

Las rutas siguientes describen únicamente el legado `mobile/**`; no son
superficies activas ni una arquitectura paralela. `src/**` contiene rutas web
históricas y no debe considerarse cliente activo.
