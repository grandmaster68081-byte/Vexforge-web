# 08 — FEATURE MATRIX

| Feature | Android code | Web code | Supabase | UI | Persistence | Status | Evidence |
|---|---|---|---|---|---|---|---|
| Auth/session | `mobile/app/auth.tsx`, `mobile/lib/supabase.ts` | `src/providers/AuthProvider.tsx` | Auth/players/sessions | auth + guards | AsyncStorage/session | IMPLEMENTED_UNVERIFIED | code paths |
| Home/Nexus | `mobile/app/(tabs)/index.tsx` | `src/routes/*` | home loaders | Nexus tab | live reads | IMPLEMENTED_UNVERIFIED | mobile route |
| Collection/cards | `collection.tsx`, `ForgeArchiveScene` | web collection routes | cards/player_cards/catalog | Archivo | live reads | IMPLEMENTED_UNVERIFIED | verifier + code |
| Deck/formation | `deck.tsx`, `ForgeFormationPreview` | web deck/battle | player_deck/formation | Forja | save/validate | IMPLEMENTED_UNVERIFIED | verifier + code |
| Battle | `battle.tsx`, `ForgeBattlefield`, `aiBattle.ts` | web battle components | battle/combat/pvp | Arena | battle result/replay | PARTIAL | code + protocol |
| Missions | `missions.tsx` | web missions | missions/runs/rewards | Missions | progress/claim | IMPLEMENTED_UNVERIFIED | route + client |
| Rewards/packs | store/rewards loaders | web store | rewards/packs/wallet | Store | live actions | IMPLEMENTED_UNVERIFIED | verifier + code |
| Economy | `economy.tsx` | web economy | ledger/wallet/treasury | Economy | live actions | EVIDENCE_REQUIRED | code + live map |
| World/raid | `world.tsx` | web world | bosses/raids/seasons | World | live actions | IMPLEMENTED_UNVERIFIED | verifier + code |
| Profile/meta | `profile.tsx`, `meta.tsx` | web profile/meta | profile/achievements/settings | Legado/Meta | live reads/writes | IMPLEMENTED_UNVERIFIED | route + verifier |
| Social/clans | `social.tsx` | web social | clans/friends/challenges | Social | live actions | IMPLEMENTED_UNVERIFIED | route + client |
| OTA | `publish-ota.mjs`, app updates | n/a | updates function/registry | runtime | remote bundle | EVIDENCE_REQUIRED | workflow + config |
