# VE-AUDIT-LIB-SUPABASE-CATALOG

Auditoria de solo lectura de `mobile/lib/supabase.ts` (1808 lineas, HEAD de main).
Sin cambios de codigo. Unidad: VE-AUDIT-02-SUPABASE-LIB. Estado: OPERATIONAL (documental).

## 1. Resumen

- 111 funciones declaradas: 91 exportadas, 20 privadas.
- 0 funciones privadas muertas (todas se usan).
- 0 nombres de funcion duplicados.
- 4 primitivas de transporte: `headers`, `parse`, `rest`, `restRpc` (+`authRequest` para Auth).
- 45 RPC distintos y 46 tablas/vistas distintas accedidas por REST.

## 2. Mapa jerarquico (capas)

```text
NIVEL 0 - constantes
  SUPABASE_URL / ANON_KEY / STORAGE_BASE / storageAsset

NIVEL 1 - transporte
  headers -> parse
    authRequest   (GoTrue /auth/v1)
    rest          (PostgREST tablas)
    restRpc       (PostgREST /rpc)

NIVEL 2 - sesion e identidad
  requireSession, saveSession, parseOAuthFragment, ensurePlayerRow
  loadWorldPlayerId / currentPlayerId  (resolutores de player_id)

NIVEL 3 - adaptadores
  mobileSocialAction, resolveMobilePublicNames, economyNumber,
  nestedRow, mobileReference, asWorldTier,
  pvpBattleStorageKey / getOrCreatePvpBattleKey / clearPvpBattleKey

NIVEL 4 - dominios (API publica consumida por las pantallas)
  AUTH        signIn, signUp, signInWithProvider, signInWithGoogle,
              resetPassword, signOut, loadSession
  CATALOGO    loadCatalogSnapshot, loadDailyFeaturedCard
  COLECCION   loadPlayerCollection, loadPlayerDeck, validateDeck, saveDeck
  HOGAR       loadHomeStats, loadRecentActivity, loadHomeMissions
  MISIONES    loadMissions, executeMobileMission, loadDailyQuests, claimDailyQuest
  PERFIL      loadPlayerProfile, loadProgress, loadStats, loadPlayerRank,
              loadPlayerAchievements, advanceTutorialStep, skipTutorial,
              loadMobileSettings, updateMobileSettings
  ECONOMIA    loadWallet, loadEconomyStats, loadEconomyLedger,
              loadTreasuryWallets, loadMyDeposits, submitMobileDeposit,
              loadTradeableBalance, loadMyWithdrawals, requestMobileWithdrawal,
              loadReferralSummary
  MERCADO     loadMarketListings, loadMarketOwnedCards, createMarketListing,
              buyMarketListing, cancelMarketListing
  TIENDA      loadMobileShopCatalog, loadMobileShopItems, loadMobileShopOrders,
              createMobileShopOrder, submitMobileShopPayment
  SOBRES      loadMobilePacks, loadMobilePackBalance, loadMobilePackHistory,
              buyMobilePack, openMobilePack
  FORJA       loadMobileFusableCards, loadMobileFusionPolicy,
              loadMobileFusionTargets, loadMobileShards, applyMobileFusion,
              loadMobileEvolutionPaths, evolveMobileCard
  SOCIAL      loadSocialSnapshot, sendMobileFriendRequest,
              acceptMobileFriendRequest, declineMobileFriendRequest,
              sendMobileChallenge, respondToMobileChallenge,
              createMobileClan, joinMobileClan, leaveMobileClan,
              startMobileGuildWar
  MUNDO       loadWorldSnapshot, loadWorldRaidParticipants, joinWorldRaid,
              contributeWorldRaid, claimWorldSeasonTier
  COSMETICA   loadMobileCosmetics, equipMobileCosmetic, unequipMobileCosmetic
  RELIQUIAS   loadMobileRelics, claimMobileStarterRelics,
              equipMobileRelic, unequipMobileRelic
  NFT         loadMobileNft, linkMobileWallet
  ADS         loadMobileAdStats, recordMobileAdView
  TELEMETRIA  insertTelemetryEvent
  PVP         findOpponents, startBattle
```

## 3. Duplicaciones probadas

| # | Duplicacion | Evidencia | Severidad |
|---|---|---|---|
| D1 | `loadWorldPlayerId` (911) y `currentPlayerId` (1034) son el mismo query `players?select=id&auth_user_id=eq.<uid>&limit=1`; solo difieren en que una acepta `session` opcional. | lineas 911-918 vs 1034-1041 | alta |
| D2 | El mismo query de player_id esta ademas repetido en linea (sin helper) en `loadPlayerCollection` (833), `updateMobileSettings` (1124) y `linkMobileWallet` (1187). 6 ocurrencias en total. | grep `players?select=id` | alta |
| D3 | Tipos identicos `MobileWorldAction` (679) y `MobileAction` (680): `{ ok: boolean; reason?: string }`. | lineas 679-680 | media |
| D4 | `mobileSocialAction` es el normalizador real de TODA accion RPC (social, cosmetica, reliquias), pero su nombre solo describe el dominio social. Uso fuera de social: `equipMobileCosmetic`, `claimMobileStarterRelics`, `equipMobileRelic`, `unequipMobileRelic`. | lineas 1139-1176 | media |
| D5 | Lectura duplicada de `player_wallet`: `loadWallet` (1216) y `loadMobilePackBalance` (1580) golpean la misma tabla con proyecciones distintas. | lineas 1216, 1580 | media |
| D6 | Lectura duplicada de `player_settings` y del resolutor de player en `loadMobileSettings`/`updateMobileSettings`; la segunda no reutiliza `currentPlayerId`. | lineas 1111-1130 | media |
| D7 | `get_public_player_names` se invoca desde 3 sitios con normalizacion propia: `resolveMobilePublicNames`, `loadWorldSnapshot`, `loadRecentActivity`. Solo el primero es el helper canonico. | grep RPC | media |
| D8 | `cards` se consulta con 4 proyecciones distintas: `loadCatalogSnapshot`, `loadDailyFeaturedCard`, `loadMobileFusableCards`, `loadMobileFusionTargets`. | grep tablas | baja |
| D9 | `player_cards` en 3 lecturas: `loadPlayerCollection`, `loadMarketOwnedCards`, `loadMobileFusableCards`. `missions` en 2 (`loadHomeMissions`, `loadMissions`). `raid_participants` en 2. `player_progress` en 3. `vexforge_ad_views` en 2. `vexforge_nft_wallet_links` en 2. | grep tablas | baja |
| D10 | Coercion numerica repetida: `economyNumber` existe, pero hay 27 usos sueltos de `Number(x ?? 0)` que no lo usan (p.ej. `loadMobilePackBalance`). | grep | baja |
| D11 | `signInWithGoogle` es un alias de una linea de `signInWithProvider('google')`. | linea 763 | informativa |
| D12 | 45 concatenaciones manuales `'tabla?select=...' + encodeURIComponent(...)` sin constructor de query compartido. | grep | media |

Nota externa ya registrada: `store.tsx` importa `storageAsset` sin usarlo.

## 4. Catalogo funcion por funcion

Formato: `linea EXP|prv nombre` + firma + rpc + tablas + llamadas internas.

```text
300 prv resolveMobilePublicNames
      sig: async function resolveMobilePublicNames(session: Session, ids: string[])
      rpc: get_public_player_names
      ->  restRpc
 301 prv mobileSocialAction
      sig: function mobileSocialAction(result: unknown, fallback: string)
 302 EXP sendMobileFriendRequest
      sig: export async function sendMobileFriendRequest(session: Session, targetId: string)
      rpc: send_friend_request
      ->  mobileSocialAction, restRpc
 303 EXP acceptMobileFriendRequest
      sig: export async function acceptMobileFriendRequest(session: Session, friendshipId: string)
      rpc: accept_friend_request
      ->  mobileSocialAction, restRpc
 304 EXP declineMobileFriendRequest
      sig: export async function declineMobileFriendRequest(session: Session, friendshipId: string)
      rpc: decline_friend_request
      ->  mobileSocialAction, restRpc
 305 EXP sendMobileChallenge
      sig: export async function sendMobileChallenge(session: Session, challengedId: string)
      rpc: send_challenge
      ->  mobileSocialAction, restRpc
 306 EXP respondToMobileChallenge
      sig: export async function respondToMobileChallenge(session: Session, challengeId: string, accept: boolean)
      rpc: respond_to_challenge
      ->  mobileSocialAction, restRpc
 307 EXP createMobileClan
      sig: export async function createMobileClan(session: Session, name: string, description: string)
      rpc: create_clan
      ->  mobileSocialAction, restRpc
 308 EXP joinMobileClan
      sig: export async function joinMobileClan(session: Session, clanId: string, playerId: string)
      rpc: join_clan
      ->  mobileSocialAction, restRpc
 309 EXP leaveMobileClan
      sig: export async function leaveMobileClan(session: Session, playerId: string)
      rpc: leave_clan
      ->  mobileSocialAction, restRpc
 310 EXP startMobileGuildWar
      sig: export async function startMobileGuildWar(session: Session, clanAId: string, clanBId: string)
      rpc: vexforge_start_guild_war
      ->  mobileSocialAction, restRpc
 311 EXP loadSocialSnapshot
      sig: export async function loadSocialSnapshot(session: Session, playerId: string): Promise<MobileSocialSnapshot>
      rpc: get_public_pvp_rankings
      tbl: friendships, direct_challenges, clan_members, pvp_seasons, pvp_matches, clans, clan_wars
      ->  resolveMobilePublicNames, rest, restRpc
 683 EXP storageAsset
      sig: export function storageAsset(path: string)
 685 prv headers
      sig: function headers(accessToken?: string, extra?: Record<string, string>)
 689 prv parse
      sig: async function parse(response: Response): Promise<any>
 699 prv authRequest
      sig: async function authRequest(path: string, body: Json)
      ->  headers, parse
 704 prv requireSession
      sig: function requireSession(response: AuthResponse): Session
 716 prv saveSession
      sig: async function saveSession(session: Session | null)
 721 EXP signIn
      sig: export async function signIn(email: string, password: string, remember = true): Promise<Session>
      ->  authRequest, requireSession, saveSession, ensurePlayerRow
 728 prv parseOAuthFragment
      sig: function parseOAuthFragment(url: string)
 736 EXP signInWithProvider
      sig: export async function signInWithProvider(provider: OAuthProvider, remember = true): Promise<Session>
      ->  headers, parse, saveSession, parseOAuthFragment, ensurePlayerRow
 763 EXP signInWithGoogle
      sig: export async function signInWithGoogle(remember = true): Promise<Session>
      ->  signInWithProvider
 767 EXP resetPassword
      sig: export async function resetPassword(email: string): Promise<void>
      ->  authRequest
 771 EXP signUp
      sig: export async function signUp(email: string, password: string): Promise<Session | null>
      ->  authRequest, requireSession, saveSession, ensurePlayerRow
 782 prv ensurePlayerRow
      sig: async function ensurePlayerRow(email: string, session: Session)
      rpc: ensure_player_row
      ->  restRpc
 789 EXP signOut
      sig: export async function signOut()
      ->  saveSession
 791 EXP loadSession
      sig: export async function loadSession(): Promise<Session | null>
      ->  parse, authRequest, requireSession, saveSession
 805 prv rest
      sig: async function rest(path: string, session?: Session, init?: RequestInit)
      ->  headers, parse
 810 EXP insertTelemetryEvent
      sig: export async function insertTelemetryEvent(
      tbl: vexforge_telemetry_events
      ->  rest
 823 EXP loadCatalogSnapshot
      sig: export async function loadCatalogSnapshot(session?: Session)
      tbl: cards
      ->  rest
 831 EXP loadPlayerCollection
      sig: export async function loadPlayerCollection(session: Session): Promise<PlayerCard[]>
      tbl: players, player_cards
      ->  rest
 861 EXP loadPlayerDeck
      sig: export async function loadPlayerDeck(session: Session, playerId: string): Promise<DeckSlot[]>
      tbl: player_deck
      ->  rest
 887 EXP validateDeck
      sig: export async function validateDeck(cardIds: string[], session: Session): Promise<DeckValidation>
      rpc: validate_deck
      ->  restRpc
 898 EXP saveDeck
      sig: export async function saveDeck(cardIds: string[], session: Session): Promise<SaveDeckResult>
      rpc: save_deck
      ->  restRpc
 907 EXP loadHomeStats
      sig: export async function loadHomeStats(): Promise<HomeStats>
      rpc: get_home_stats
      ->  restRpc
 911 prv loadWorldPlayerId
      sig: async function loadWorldPlayerId(session?: Session): Promise<string | null>
      tbl: players
      ->  rest
 920 prv asWorldTier
      sig: function asWorldTier(row: Record<string, unknown>): MobileSeasonTier
 931 EXP loadWorldSnapshot
      sig: export async function loadWorldSnapshot(session?: Session): Promise<MobileWorldSnapshot>
      rpc: get_season_progress, get_public_player_names
      tbl: world_bosses, raid_runs, lore_codex, season_passes, season_pass_tiers, world_boss_encounters, season_rankings, raid_participants
      ->  rest, loadWorldPlayerId, asWorldTier, restRpc
 979 EXP loadWorldRaidParticipants
      sig: export async function loadWorldRaidParticipants(raidRunId: string, session?: Session): Promise<MobileRaidParticipant[]>
      tbl: raid_participants
      ->  rest
 986 EXP joinWorldRaid
      sig: export async function joinWorldRaid(raidRunId: string, session?: Session): Promise<MobileWorldAction>
      rpc: vexforge_join_raid
      ->  restRpc
 992 EXP contributeWorldRaid
      sig: export async function contributeWorldRaid(raidRunId: string, session?: Session): Promise<MobileWorldAction>
      rpc: vexforge_contribute_raid
      ->  restRpc
 998 EXP claimWorldSeasonTier
      sig: export async function claimWorldSeasonTier(tier: number, session?: Session): Promise<MobileWorldAction>
      rpc: claim_season_pass_reward
      ->  loadWorldPlayerId, restRpc
1004 EXP loadDailyFeaturedCard
      sig: export async function loadDailyFeaturedCard(): Promise<DailyCard | null>
      tbl: cards
      ->  rest
1012 EXP loadRecentActivity
      sig: export async function loadRecentActivity(limit = 8): Promise<ActivityItem[]>
      rpc: get_public_player_names
      tbl: mission_runs
      ->  rest, restRpc
1030 EXP loadHomeMissions
      sig: export async function loadHomeMissions(session?: Session): Promise<HomeMission[]>
      tbl: missions
      ->  rest
1034 prv currentPlayerId
      sig: async function currentPlayerId(session: Session): Promise<string | null>
      tbl: players
      ->  rest
1042 EXP loadDailyQuests
      sig: export async function loadDailyQuests(session: Session): Promise<DailyQuest[]>
      tbl: player_daily_quests
      ->  rest, currentPlayerId
1066 EXP claimDailyQuest
      sig: export async function claimDailyQuest(session: Session, assignmentId: string): Promise<DailyQuestClaim>
      rpc: claim_daily_quest
      ->  restRpc
1077 EXP loadMissions
      sig: export async function loadMissions(session: Session): Promise<MobileMission[]>
      tbl: missions
      ->  rest
1084 EXP executeMobileMission
      sig: export async function executeMobileMission(
      rpc: execute_mission, claim_mission_reward
      ->  restRpc
1106 EXP loadPlayerProfile
      sig: export async function loadPlayerProfile(session: Session): Promise<PlayerProfile | null>
      tbl: players
      ->  rest
1111 EXP loadMobileSettings
      sig: export async function loadMobileSettings(session: Session): Promise<MobileSettings | null>
      tbl: player_settings
      ->  rest, currentPlayerId
1123 EXP updateMobileSettings
      sig: export async function updateMobileSettings(session: Session, patch: Partial<Omit<MobileSettings, 'player_id'>>): Promise<MobileSettings | nu
      tbl: players, player_settings
      ->  rest
1131 EXP loadMobileCosmetics
      sig: export async function loadMobileCosmetics(session: Session): Promise<
      tbl: cosmetics, player_cosmetics
      ->  rest
1139 EXP equipMobileCosmetic
      sig: export async function equipMobileCosmetic(session: Session, cosmeticId: string, slot: string): Promise<MobileAction>
      rpc: equip_cosmetic
      ->  mobileSocialAction, restRpc
1143 EXP unequipMobileCosmetic
      sig: export async function unequipMobileCosmetic(session: Session, cosmeticId: string): Promise<MobileAction>
      tbl: equipped_cosmetics
      ->  rest
1148 EXP loadMobileRelics
      sig: export async function loadMobileRelics(session: Session): Promise<
      tbl: relics, player_relics
      ->  rest
1165 EXP claimMobileStarterRelics
      sig: export async function claimMobileStarterRelics(session: Session): Promise<MobileAction>
      rpc: grant_starter_relics
      ->  mobileSocialAction, restRpc
1169 EXP equipMobileRelic
      sig: export async function equipMobileRelic(session: Session, relicId: string): Promise<MobileAction>
      rpc: equip_relic
      ->  mobileSocialAction, restRpc
1173 EXP unequipMobileRelic
      sig: export async function unequipMobileRelic(session: Session, relicId: string): Promise<MobileAction>
      rpc: unequip_relic
      ->  mobileSocialAction, restRpc
1177 EXP loadMobileNft
      sig: export async function loadMobileNft(session: Session): Promise<
      tbl: vexforge_nft_contracts, vexforge_nft_wallet_links, vexforge_nft_mint_queue
      ->  rest
1186 EXP linkMobileWallet
      sig: export async function linkMobileWallet(session: Session, walletAddress: string): Promise<MobileNftWalletLink | null>
      tbl: players, vexforge_nft_wallet_links
      ->  rest
1198 EXP loadMobileAdStats
      sig: export async function loadMobileAdStats(session: Session): Promise<MobileAdStats>
      tbl: vexforge_ad_views
      ->  rest
1207 EXP recordMobileAdView
      sig: export async function recordMobileAdView(session: Session): Promise<MobileAction>
      tbl: vexforge_ad_views
      ->  rest
1216 EXP loadWallet
      sig: export async function loadWallet(session: Session, playerId: string): Promise<Wallet | null>
      tbl: player_wallet
      ->  rest
1221 prv economyNumber
      sig: const economyNumber = (value: unknown) => Number(value ?? 0);
1223 EXP loadEconomyStats
      sig: export async function loadEconomyStats(session: Session): Promise<EconomyStats>
      rpc: vexforge_get_my_economy_stats
      ->  economyNumber, restRpc
1245 EXP loadEconomyLedger
      sig: export async function loadEconomyLedger(session: Session, limit = 30, offset = 0): Promise<EconomyLedgerEntry[]>
      tbl: economy_ledger
      ->  rest, economyNumber
1266 prv nestedRow
      sig: function nestedRow(value: unknown): Record<string, unknown> | null
1271 EXP loadMarketListings
      sig: export async function loadMarketListings(session: Session): Promise<MarketListing[]>
      tbl: market_listings
      ->  rest, economyNumber, nestedRow
1295 EXP loadMarketOwnedCards
      sig: export async function loadMarketOwnedCards(session: Session, playerId: string): Promise<MarketOwnedCard[]>
      tbl: player_cards
      ->  rest, economyNumber, nestedRow
1315 prv mobileReference
      sig: function mobileReference(prefix: string)
1319 EXP createMarketListing
      sig: export async function createMarketListing(
      rpc: create_listing
      ->  mobileReference, restRpc
1339 EXP buyMarketListing
      sig: export async function buyMarketListing(
      rpc: buy_listing
      ->  mobileReference, restRpc
1354 EXP cancelMarketListing
      sig: export async function cancelMarketListing(
      rpc: cancel_listing
      ->  mobileReference, restRpc
1369 EXP loadTreasuryWallets
      sig: export async function loadTreasuryWallets(session: Session): Promise<TreasuryWallet[]>
      tbl: vexforge_treasury
      ->  rest
1377 EXP loadMyDeposits
      sig: export async function loadMyDeposits(session: Session): Promise<DepositRecord[]>
      rpc: vexforge_get_my_deposits
      ->  economyNumber, restRpc
1394 EXP submitMobileDeposit
      sig: export async function submitMobileDeposit(
      rpc: vexforge_submit_deposit
      ->  restRpc
1412 EXP loadTradeableBalance
      sig: export async function loadTradeableBalance(session: Session, playerId: string): Promise<TradeableBalance | null>
      tbl: player_economy_state
      ->  rest, economyNumber
1426 EXP loadMyWithdrawals
      sig: export async function loadMyWithdrawals(session: Session, playerId: string): Promise<WithdrawalRequest[]>
      tbl: vexforge_withdrawal_requests_official
      ->  rest, economyNumber
1447 EXP requestMobileWithdrawal
      sig: export async function requestMobileWithdrawal(
      rpc: vexforge_request_withdrawal
      ->  restRpc
1459 EXP loadReferralSummary
      sig: export async function loadReferralSummary(session: Session): Promise<
      tbl: players, vexforge_referrals
      ->  rest
1481 EXP loadProgress
      sig: export async function loadProgress(session: Session, playerId: string): Promise<PlayerProgress | null>
      rpc: sync_player_energy
      tbl: player_progress
      ->  rest, restRpc
1487 EXP advanceTutorialStep
      sig: export async function advanceTutorialStep(session: Session, playerId: string, toStep: number): Promise<void>
      tbl: player_progress
      ->  rest
1500 EXP skipTutorial
      sig: export async function skipTutorial(session: Session, playerId: string): Promise<void>
      tbl: player_progress
      ->  rest
1512 EXP loadStats
      sig: export async function loadStats(session: Session, playerId: string): Promise<PlayerStats>
      rpc: get_player_stats
      ->  restRpc
1516 EXP loadPlayerRank
      sig: export async function loadPlayerRank(session: Session, playerId: string): Promise<PlayerRank | null>
      rpc: get_player_rank
      ->  restRpc
1521 EXP loadPlayerAchievements
      sig: export async function loadPlayerAchievements(session: Session, playerId: string): Promise<PlayerAchievement[]>
      tbl: player_achievements
      ->  rest
1562 EXP loadMobilePacks
      sig: export async function loadMobilePacks(): Promise<MobilePack[]>
      tbl: vexforge_pack_catalog
      ->  rest
1580 EXP loadMobilePackBalance
      sig: export async function loadMobilePackBalance(session: Session): Promise<number>
      tbl: player_wallet
      ->  rest, currentPlayerId
1590 EXP loadMobilePackHistory
      sig: export async function loadMobilePackHistory(session: Session): Promise<MobilePackOrder[]>
      tbl: vexforge_pack_orders
      ->  rest, currentPlayerId
1609 EXP buyMobilePack
      sig: export async function buyMobilePack(session: Session, packKey: string): Promise<
      rpc: vexforge_buy_pack_with_vex
      ->  restRpc
1614 EXP openMobilePack
      sig: export async function openMobilePack(session: Session, orderId: string): Promise<
      rpc: vexforge_open_pack
      ->  restRpc
1623 EXP loadMobileShopCatalog
      sig: export async function loadMobileShopCatalog(): Promise<MobileShopItem[]>
      tbl: vexforge_shop_catalog
      ->  rest
1628 EXP loadMobileShopItems
      sig: export async function loadMobileShopItems(session: Session): Promise<
      tbl: player_active_boosts, player_consumables
      ->  rest, currentPlayerId
1639 EXP loadMobileShopOrders
      sig: export async function loadMobileShopOrders(session: Session): Promise<MobileShopOrder[]>
      rpc: vexforge_get_my_shop_orders
      ->  restRpc
1644 EXP createMobileShopOrder
      sig: export async function createMobileShopOrder(session: Session, itemKey: string): Promise<MobileShopOrder>
      rpc: vexforge_create_shop_order
      ->  restRpc
1657 EXP submitMobileShopPayment
      sig: export async function submitMobileShopPayment(
      rpc: vexforge_submit_shop_order_payment
      ->  restRpc
1673 EXP loadMobileFusableCards
      sig: export async function loadMobileFusableCards(session: Session, playerId: string): Promise<MobileFusableCard[]>
      tbl: player_cards, cards
      ->  rest
1692 EXP loadMobileFusionPolicy
      sig: export async function loadMobileFusionPolicy(sourceRarity: string): Promise<MobileFusionPolicy | null>
      rpc: vexforge_fusion_policy
      ->  restRpc
1704 EXP loadMobileFusionTargets
      sig: export async function loadMobileFusionTargets(targetRarity: string): Promise<MobileTargetCard[]>
      tbl: cards
      ->  rest
1710 EXP loadMobileShards
      sig: export async function loadMobileShards(session: Session, playerId: string): Promise<MobileShardBalance[]>
      tbl: vexforge_player_shards
      ->  rest
1715 EXP applyMobileFusion
      sig: export async function applyMobileFusion(session: Session, playerId: string, sourceCardId: string, targetCardId: string): Promise<
      rpc: vexforge_apply_fusion
      ->  restRpc
1724 EXP loadMobileEvolutionPaths
      sig: export async function loadMobileEvolutionPaths(): Promise<MobileEvolutionPath[]>
      tbl: card_evolution_paths
      ->  rest
1742 EXP evolveMobileCard
      sig: export async function evolveMobileCard(session: Session, playerId: string, cardId: string): Promise<
      rpc: vexforge_evolve_card
      ->  restRpc
1748 prv restRpc
      sig: async function restRpc(name: string, body: Json =
      ->  headers, parse
1753 prv pvpBattleStorageKey
      sig: function pvpBattleStorageKey(playerId: string, opponentId: string)
1757 prv getOrCreatePvpBattleKey
      sig: async function getOrCreatePvpBattleKey(playerId: string, opponentId: string)
      ->  pvpBattleStorageKey
1778 prv clearPvpBattleKey
      sig: async function clearPvpBattleKey(playerId: string, opponentId: string)
      ->  pvpBattleStorageKey
1782 EXP findOpponents
      sig: export async function findOpponents(session: Session, playerId: string): Promise<Opponent[]>
      rpc: get_pvp_opponents
      ->  restRpc
1798 EXP startBattle
      sig: export async function startBattle(session: Session, playerId: string, opponentId: string): Promise<BattleResult>
      rpc: vexforge_battle_resolve
      ->  restRpc, getOrCreatePvpBattleKey, clearPvpBattleKey
```
