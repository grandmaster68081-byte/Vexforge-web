import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rscuzqnfccqvltkdcdny.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58';
const SESSION_KEY = 'vexforge.supabase.session';

type Json = Record<string, unknown>;
export type User = { id: string; email?: string };
export type Session = { access_token: string; refresh_token: string; expires_at?: number; user: User };
export type PublicCard = {
  id: string;
  code: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  specialization?: string | null;
  power?: number | null;
  affinity?: number | null;
  prestige?: number | null;
  charge?: number | null;
  lore?: string | null;
  image_url: string | null;
  supply?: number | null;
  minted?: number | null;
  is_founder?: boolean;
  is_legendary?: boolean;
  card_tier?: string | null;
  card_domain?: string | null;
  marketable?: boolean;
  fusion_enabled?: boolean;
  release_status?: string | null;
  synergy_json?: Record<string, unknown> | null;
};
export type PlayerCard = PublicCard & {
  player_card_id: string;
  card_id: string;
  quantity: number;
  locked: boolean;
  listed: boolean;
  source_tracking: Record<string, unknown> | null;
  acquired_at: string | null;
};
export type DeckSlot = {
  slot_number: number;
  is_champion: boolean;
  card_id: string;
  code: string;
  name: string;
  rarity: string;
  faction: string;
  power: number;
};
export type DeckValidation = {
  valid: boolean;
  errors: string[];
  card_count: number;
  mythic_count: number;
  legendary_count: number;
};
export type SaveDeckResult = { ok: boolean; slots_saved?: number; reason?: string };
export type PlayerProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
  is_admin?: boolean | null;
  is_super_admin?: boolean | null;
  telegram_username?: string | null;
};
export type PlayerProgress = { level: number; xp: number; xp_to_next: number; energy: number; max_energy: number; tutorial_step: number | null; starter_region: string | null };
export type PlayerStats = {
  pvp_wins?: number;
  pvp_losses?: number;
  missions_completed?: number;
  cards_owned?: number;
  market_sales?: number;
  packs_opened?: number;
  boss_kills?: number;
};
export type PlayerRank = {
  ok?: boolean;
  mmr?: number;
  tier?: string;
  tier_color?: string;
  tier_icon?: string;
  tier_min?: number;
  shields?: number;
  wins?: number;
  losses?: number;
  season_id?: string | null;
};
export type PlayerAchievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string | null;
  points: number;
  icon: string | null;
  unlocked_at: string | null;
};
export type Wallet = { vex_ingame: number; vex_tradeable: number; reserved_ingame: number; reserved_tradeable: number };
export type EconomyLedgerEntry = {
  id: string;
  entry_type: string;
  currency: string;
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  source_table: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
export type EconomyStats = {
  ok: boolean;
  entry_count: number;
  total_credited: number;
  total_debited: number;
  net_ingame: number;
  net_tradeable: number;
  largest_credit: number;
  by_type: Array<{ entry_type: string; currency: string; count: number; total_amount: number }>;
};
export type MarketListing = {
  id: string;
  reference_id: string;
  player_id: string;
  player_card_id: string;
  price: number;
  fee: number;
  status: string;
  expires_at: string | null;
  locked: boolean;
  card_name: string | null;
  card_rarity: string | null;
};
export type MarketOwnedCard = {
  id: string;
  card_id: string;
  card_name: string | null;
  card_rarity: string | null;
  quantity: number;
  locked: boolean;
  listed: boolean;
};
export type TreasuryWallet = {
  chain: string;
  token_symbol: string;
  wallet_address: string;
  token_standard: string | null;
};
export type DepositRecord = {
  id: string;
  amount_usdt: number;
  vex_credited: number;
  chain: string;
  token_symbol: string;
  tx_hash: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
};
export type SubmitDepositResult = {
  ok: boolean;
  deposit_id?: string;
  vex_pending?: number;
  reason?: string;
};
export type TradeableBalance = { balance: number; locked: number; pending: boolean };
export type WithdrawalRequest = {
  id: string;
  player_id: string;
  tradeable_amount: number;
  usdt_gross: number;
  fee_usdt: number;
  usdt_net: number;
  status: string;
  rejected_reason: string | null;
  payout_tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
};
export type RequestWithdrawalResult = {
  ok: boolean;
  request_id?: string;
  usdt_gross?: number;
  fee_usdt?: number;
  usdt_net?: number;
  reason?: string;
};
export type ReferralRecord = {
  id: string;
  referred_display_name: string | null;
  status: string;
  reward_granted: boolean;
  first_pack_rewarded: boolean;
  created_at: string;
};
export type ReferralSummary = {
  referral_code: string | null;
  total_referrals: number;
  pending: number;
  completed: number;
  rewards_granted: number;
};
export type Opponent = { player_id: string; display_name: string; mmr: number; wins: number; losses: number };
export type MobileSocialFriend = { id: string; friend_id: string; display_name: string | null; level: number; created_at: string };
export type MobileDirectChallenge = { id: string; challenger_id: string; challenged_id: string; challenger_name: string | null; challenged_name: string | null; status: string; created_at: string };
export type MobileClan = { id: string; code: string | null; name: string; description: string | null; leader_player_id: string | null; prestige: number; contribution_total: number; created_at: string | null; rank_position?: number | null };
export type MobileClanMember = { id: string; player_id: string; role: string; joined_at: string | null; contribution_accumulated: number; display_name: string | null };
export type MobileClanWar = { id: string; clan_a_id: string; clan_b_id: string; status: string; created_at: string; opponent_name: string };
export type MobileSocialMatch = { id: string; player_a: string; player_b: string; winner: string | null; status: string; elo_change_a: number | null; elo_change_b: number | null; created_at: string; opponent_name: string | null };
export type MobilePvpRanking = { player_id: string; display_name: string | null; mmr: number; wins: number; losses: number; draws: number; rank_position: number };
export type MobileSocialSnapshot = { friends: MobileSocialFriend[]; pendingRequests: MobileSocialFriend[]; challenges: MobileDirectChallenge[]; clan: { clan: MobileClan; member: MobileClanMember; members: MobileClanMember[]; wars: MobileClanWar[] } | null; clans: MobileClan[]; rankings: MobilePvpRanking[]; matches: MobileSocialMatch[]; seasonName: string | null };
export type MobileSettings = {
  player_id: string;
  telegram_enabled: boolean;
  notifications_enabled: boolean;
  language: string;
  timezone: string;
  ui_mode: string;
};
export type MobileCosmetic = {
  id: string;
  code: string;
  name: string;
  cosmetic_type: string;
  description: string | null;
  rarity: string | null;
  preview_url: string | null;
  obtainable_via: string[] | null;
  metadata: Record<string, unknown> | null;
};
export type MobilePlayerCosmetic = {
  id: string;
  cosmetic_id: string;
  equipped: boolean;
  obtained_via: string | null;
  obtained_at: string | null;
};
export type MobileRelic = {
  id: string;
  code: string;
  name: string;
  effect_type: string | null;
  effect_value: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};
export type MobilePlayerRelic = {
  id: string;
  relic_id: string;
  equipped: boolean;
  acquired_at: string | null;
  relic: MobileRelic | null;
};
export type MobileNftContract = {
  id: string;
  chain_id: number;
  contract_address: string;
  name: string;
  symbol: string;
  max_supply: number;
  status: string;
  deployed_at: string | null;
};
export type MobileNftWalletLink = {
  id: string;
  wallet_address: string;
  chain_id: number;
  verified: boolean;
  linked_at: string;
};
export type MobileNftMint = {
  id: string;
  card_id: string;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  token_id: number | null;
  error_message: string | null;
  requested_at: string;
  processed_at: string | null;
};
export type MobileAdStats = {
  watched_today: number;
  total_vex_earned: number;
  last_watched_at: string | null;
};
async function resolveMobilePublicNames(session: Session, ids: string[]) { const uniqueIds = [...new Set(ids.filter(Boolean))]; if (!uniqueIds.length) return new Map<string, { display_name: string | null; level: number; mmr: number }>(); const rows = await restRpc('get_public_player_names', { p_player_ids: uniqueIds }, session) as Array<{ id: string; display_name: string | null; level: number; mmr: number }> | null; return new Map((rows ?? []).map((row) => [row.id, row])); }
function mobileSocialAction(result: unknown, fallback: string) { const value = result as { ok?: boolean; success?: boolean; reason?: string; message?: string } | null; const ok = value?.ok === true || value?.success === true; return { ok, reason: value?.reason ?? value?.message ?? (ok ? undefined : fallback) }; }
export async function sendMobileFriendRequest(session: Session, targetId: string) { return mobileSocialAction(await restRpc('send_friend_request', { p_target_id: targetId }, session), 'No se pudo enviar la solicitud.'); }
export async function acceptMobileFriendRequest(session: Session, friendshipId: string) { return mobileSocialAction(await restRpc('accept_friend_request', { p_friendship_id: friendshipId }, session), 'No se pudo aceptar la solicitud.'); }
export async function declineMobileFriendRequest(session: Session, friendshipId: string) { return mobileSocialAction(await restRpc('decline_friend_request', { p_friendship_id: friendshipId }, session), 'No se pudo rechazar la solicitud.'); }
export async function sendMobileChallenge(session: Session, challengedId: string) { return mobileSocialAction(await restRpc('send_challenge', { p_challenged_id: challengedId }, session), 'No se pudo enviar el desafío.'); }
export async function respondToMobileChallenge(session: Session, challengeId: string, accept: boolean) { return mobileSocialAction(await restRpc('respond_to_challenge', { p_challenge_id: challengeId, p_accept: accept }, session), 'No se pudo responder al desafío.'); }
export async function createMobileClan(session: Session, name: string, description: string) { return mobileSocialAction(await restRpc('create_clan', { p_name: name, p_description: description }, session), 'No se pudo crear el clan.'); }
export async function joinMobileClan(session: Session, clanId: string, playerId: string) { return mobileSocialAction(await restRpc('join_clan', { p_clan_id: clanId, p_player_id: playerId }, session), 'No se pudo unir al clan.'); }
export async function leaveMobileClan(session: Session, playerId: string) { return mobileSocialAction(await restRpc('leave_clan', { p_player_id: playerId }, session), 'No se pudo salir del clan.'); }
export async function startMobileGuildWar(session: Session, clanAId: string, clanBId: string) { return mobileSocialAction(await restRpc('vexforge_start_guild_war', { p_clan_a_id: clanAId, p_clan_b_id: clanBId, p_metadata: {} }, session), 'No se pudo registrar la guerra.'); }
export async function loadSocialSnapshot(session: Session, playerId: string): Promise<MobileSocialSnapshot> {
  const relationshipRows = await rest('friendships?select=id%2Cplayer_a_id%2Cplayer_b_id%2Cinitiated_by%2Cstatus%2Ccreated_at&or=(player_a_id.eq.' + encodeURIComponent(playerId) + '%2Cplayer_b_id.eq.' + encodeURIComponent(playerId) + ')&status=in.(accepted%2Cpending)&order=created_at.desc&limit=100', session) as Array<{ id: string; player_a_id: string; player_b_id: string; initiated_by: string; status: string; created_at: string }>;
  const friendIds = relationshipRows.map((row) => row.player_a_id === playerId ? row.player_b_id : row.player_a_id);
  const challengeRows = await rest('direct_challenges?select=id%2Cchallenger_id%2Cchallenged_id%2Cstatus%2Ccreated_at&or=(challenger_id.eq.' + encodeURIComponent(playerId) + '%2Cchallenged_id.eq.' + encodeURIComponent(playerId) + ')&status=in.(pending%2Caccepted%2Crejected%2Cdeclined)&order=created_at.desc&limit=50', session) as Array<{ id: string; challenger_id: string; challenged_id: string; status: string; created_at: string }>;
  const memberRows = await rest('clan_members?select=id%2Cclan_id%2Cplayer_id%2Crole%2Cjoined_at%2Ccontribution_accumulated&player_id=eq.' + encodeURIComponent(playerId) + '&limit=1', session) as Array<{ id: string; clan_id: string; player_id: string; role: string; joined_at: string | null; contribution_accumulated: number }>;
  const seasonRows = await rest('pvp_seasons?select=id%2Cseason_key%2Cname%2Cactive&active=eq.true&order=starts_at.desc&limit=1', session) as Array<{ id: string; season_key: string; name: string; active: boolean }>;
  const season = seasonRows[0];
  const rankingRows = season ? await restRpc('get_public_pvp_rankings', { p_season_id: season.id, p_limit: 25 }, session) as Array<Record<string, unknown>> : [];
  const matchRows = await rest('pvp_matches?select=id%2Cplayer_a%2Cplayer_b%2Cwinner%2Cstatus%2Celo_change_a%2Celo_change_b%2Ccreated_at&or=(player_a.eq.' + encodeURIComponent(playerId) + '%2Cplayer_b.eq.' + encodeURIComponent(playerId) + ')&order=created_at.desc&limit=25', session) as Array<Record<string, unknown>>;
  const clansRows = await rest('clans?select=id%2Ccode%2Cname%2Cmetadata%2Cleader_player_id%2Cprestige%2Ccontribution_total%2Ccreated_at&order=prestige.desc&limit=25', session) as Array<Record<string, unknown>>;
  const relationshipNames = await resolveMobilePublicNames(session, [...friendIds, ...challengeRows.flatMap((row) => [row.challenger_id, row.challenged_id])]);
  const friends = relationshipRows.filter((row) => row.status === 'accepted').map((row) => { const friendId = row.player_a_id === playerId ? row.player_b_id : row.player_a_id; const info = relationshipNames.get(friendId); return { id: row.id, friend_id: friendId, display_name: info?.display_name ?? null, level: Number(info?.level ?? 1), created_at: row.created_at }; });
  const pendingRequests = relationshipRows.filter((row) => row.status === 'pending' && row.initiated_by !== playerId).map((row) => { const friendId = row.initiated_by; const info = relationshipNames.get(friendId); return { id: row.id, friend_id: friendId, display_name: info?.display_name ?? null, level: Number(info?.level ?? 1), created_at: row.created_at }; });
  const challenges = challengeRows.map((row) => ({ id: row.id, challenger_id: row.challenger_id, challenged_id: row.challenged_id, challenger_name: relationshipNames.get(row.challenger_id)?.display_name ?? null, challenged_name: relationshipNames.get(row.challenged_id)?.display_name ?? null, status: row.status, created_at: row.created_at }));
  let clan: MobileSocialSnapshot['clan'] = null;
  if (memberRows[0]) {
    const membership = memberRows[0];
    const clanRows = await rest('clans?select=id%2Ccode%2Cname%2Cmetadata%2Cleader_player_id%2Cprestige%2Ccontribution_total%2Ccreated_at&id=eq.' + encodeURIComponent(membership.clan_id) + '&limit=1', session) as Array<Record<string, unknown>>;
    const clanRow = clanRows[0];
    if (clanRow) {
      const rosterRows = await rest('clan_members?select=id%2Cclan_id%2Cplayer_id%2Crole%2Cjoined_at%2Ccontribution_accumulated&clan_id=eq.' + encodeURIComponent(membership.clan_id) + '&order=contribution_accumulated.desc&limit=100', session) as Array<{ id: string; clan_id: string; player_id: string; role: string; joined_at: string | null; contribution_accumulated: number }>;
      const warRows = await rest('clan_wars?select=id%2Cclan_a_id%2Cclan_b_id%2Cstatus%2Ccreated_at&or=(clan_a_id.eq.' + encodeURIComponent(membership.clan_id) + '%2Cclan_b_id.eq.' + encodeURIComponent(membership.clan_id) + ')&order=created_at.desc&limit=25', session) as Array<{ id: string; clan_a_id: string; clan_b_id: string; status: string; created_at: string }>;
      const warIds = [...new Set(warRows.flatMap((row) => [row.clan_a_id, row.clan_b_id]).filter((id) => id !== membership.clan_id))];
      const warClans = warIds.length ? await rest('clans?select=id%2Cname&id=in.(' + warIds.map(encodeURIComponent).join('%2C') + ')', session) as Array<{ id: string; name: string }> : [];
      const warNames = new Map(warClans.map((row) => [row.id, row.name]));
      const rosterNames = await resolveMobilePublicNames(session, rosterRows.map((row) => row.player_id));
      const mobileMembers = rosterRows.map((row) => ({ id: row.id, player_id: row.player_id, role: row.role, joined_at: row.joined_at, contribution_accumulated: Number(row.contribution_accumulated ?? 0), display_name: rosterNames.get(row.player_id)?.display_name ?? null }));
      const metadata = clanRow.metadata as Record<string, unknown> | null;
      clan = { clan: { id: String(clanRow.id), code: typeof clanRow.code === 'string' ? clanRow.code : null, name: String(clanRow.name ?? 'Clan'), description: typeof metadata?.description === 'string' ? String(metadata.description) : null, leader_player_id: typeof clanRow.leader_player_id === 'string' ? clanRow.leader_player_id : null, prestige: Number(clanRow.prestige ?? 0), contribution_total: Number(clanRow.contribution_total ?? 0), created_at: typeof clanRow.created_at === 'string' ? clanRow.created_at : null }, member: { id: membership.id, player_id: membership.player_id, role: membership.role, joined_at: membership.joined_at, contribution_accumulated: Number(membership.contribution_accumulated ?? 0), display_name: null }, members: mobileMembers, wars: warRows.map((row) => ({ ...row, opponent_name: warNames.get(row.clan_a_id === membership.clan_id ? row.clan_b_id : row.clan_a_id) ?? 'Clan rival' })) };
    }
  }
  const mappedClans = clansRows.map((row, index) => { const metadata = row.metadata as Record<string, unknown> | null; return { id: String(row.id), code: typeof row.code === 'string' ? row.code : null, name: String(row.name ?? 'Clan'), description: typeof metadata?.description === 'string' ? String(metadata.description) : null, leader_player_id: typeof row.leader_player_id === 'string' ? row.leader_player_id : null, prestige: Number(row.prestige ?? 0), contribution_total: Number(row.contribution_total ?? 0), created_at: typeof row.created_at === 'string' ? row.created_at : null, rank_position: index + 1 }; });
  const matchNames = await resolveMobilePublicNames(session, matchRows.flatMap((row) => [String(row.player_a ?? ''), String(row.player_b ?? '')]));
  const matches = matchRows.map((row) => { const playerA = String(row.player_a ?? ''); const playerB = String(row.player_b ?? ''); const opponentId = playerA === playerId ? playerB : playerA; return { id: String(row.id), player_a: playerA, player_b: playerB, winner: typeof row.winner === 'string' ? row.winner : null, status: String(row.status ?? 'unknown'), elo_change_a: row.elo_change_a == null ? null : Number(row.elo_change_a), elo_change_b: row.elo_change_b == null ? null : Number(row.elo_change_b), created_at: String(row.created_at ?? ''), opponent_name: matchNames.get(opponentId)?.display_name ?? null }; });
  return { friends, pendingRequests, challenges, clan, clans: mappedClans, rankings: (rankingRows ?? []).map((row) => ({ player_id: String(row.player_id), display_name: typeof row.display_name === 'string' ? row.display_name : null, mmr: Number(row.mmr ?? 0), wins: Number(row.wins ?? 0), losses: Number(row.losses ?? 0), draws: Number(row.draws ?? 0), rank_position: Number(row.rank_position ?? 0) })), matches, seasonName: season?.name ?? season?.season_key ?? null };
}

export type BattleActor = {
  name: string;
  faction?: string;
  rarity?: string;
  image_url?: string;
  hp?: number;
  max_hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
};
export type BattleEvent = {
  type: string;
  unit?: string;
  side?: 'a' | 'b';
  dmg?: number;
  heal?: number;
  hp?: number;
};
export type BattleTurn = {
  turn: number;
  atk_side?: 'a' | 'b';
  attacker?: BattleActor;
  defender?: BattleActor;
  damage?: number;
  is_crit?: boolean;
  is_kill?: boolean;
  lifesteal_heal?: number;
  events?: BattleEvent[];
  alive_a?: number;
  alive_b?: number;
  p_card?: string;
  o_card?: string;
  p_hp?: number;
  o_hp?: number;
};
export type BattleUnit = {
  name?: string;
  faction?: string;
  rarity?: string;
  hp?: number;
  max_hp?: number;
  alive?: boolean;
};
export type BattleResult = {
  ok: boolean;
  match_id?: string;
  you_won?: boolean;
  winner_id?: string;
  player_name?: string;
  opponent_name?: string;
  total_turns?: number;
  turns?: BattleTurn[];
  final_units?: BattleUnit[];
  engine?: string;
  elo_change?: number;
  error?: string;
  reason?: string;
};
export const TUTORIAL_DONE_STEP = 99;
export const TUTORIAL_TOTAL_STEPS = 7;
export type HomeStats = {
  active_players: number;
  total_battles: number;
  total_cards: number;
  packs_opened: number;
  season: { name: string; ends_at: string } | null;
  active_event: { id: string; name: string; type: string; ends_at: string; progress: number } | null;
  top3: Array<{ rank: number; display_name: string; mmr: number; wins: number }>;
};
export type DailyCard = PublicCard & { rarity: string; faction: string; power: number; lore: string | null };
export type ActivityItem = { id: string; text: string; time: string };
export type HomeMission = { id: string; name: string; energy_cost: number | null; reward_xp: number | null; reward_vex_ingame: number | null; difficulty: string | null; mission_type: string | null };
export type DailyQuest = {
  id: string;
  quest_id: string;
  assigned_date: string;
  status: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  quest: {
    id: string;
    quest_key: string;
    title: string;
    description: string;
    quest_type: string;
    target_count: number;
    reward_vex_ingame: number;
    reward_xp: number;
  } | null;
};
export type DailyQuestClaim = {
  claimed: boolean;
  xp_applied?: number;
  vex_applied?: number;
  pendingRewards?: boolean;
  reason?: string;
};
export type MobileMission = {
  id: string;
  code: string;
  name: string;
  mission_type: string | null;
  energy_cost: number | null;
  reward_xp: number | null;
  reward_vex_ingame: number | null;
  reward_vex_tradeable: number | null;
  cooldown_seconds: number | null;
  difficulty: string | null;
  mission_group: string | null;
};
export type MissionReward = {
  success: boolean;
  run_id?: string;
  xp_reward?: number;
  ingame_reward?: number;
  tradeable_reward?: number;
  energy?: number;
  reason?: string;
};

export type MobilePack = {
  pack_key: string;
  pack_name: string;
  price_vex: number;
  price_usdt: number;
  card_count: number;
  notes: string | null;
  rarity_weights: Record<string, number> | null;
};
export type MobileOpenedCard = {
  id: string;
  name: string;
  rarity: string;
  faction?: string;
  image_url?: string;
  quantity_change?: number;
};
export type MobilePackOrder = {
  id: string;
  pack_key: string;
  price_usdt: number;
  status: string;
  payment_method: string | null;
  cards_received?: MobileOpenedCard[];
  created_at: string;
};
export type MobileShopItem = {
  id: string;
  item_key: string;
  name: string;
  description: string;
  category: string;
  price_usdt: number;
  price_vex: number | null;
  active: boolean;
  icon: string | null;
};
export type MobileShopOrder = {
  id?: string;
  order_id?: string;
  item_key: string;
  item_name?: string;
  price_usdt: number;
  status: string;
  fulfillment_status: string;
  tx_hash?: string | null;
  payer_wallet_address?: string | null;
  treasury_wallet_address?: string;
  chain?: string;
  token_symbol?: string;
  token_standard?: string;
  created_at?: string;
  payment_submitted?: boolean;
};
export type MobileActiveBoost = { id: string; boost_type: string; multiplier: number; expires_at: string };
export type MobileConsumable = { id: string; item_key: string; quantity: number };
export type MobileFusableCard = {
  player_card_id: string;
  card_id: string;
  name: string;
  rarity: string;
  quantity: number;
};
export type MobileFusionPolicy = {
  neededCards: number;
  requiredShards: number;
  ingameCost: number;
  targetRarity: string;
};
export type MobileTargetCard = { id: string; name: string; rarity: string };
export type MobileShardBalance = { rarity: string; quantity: number };
export type MobileEvolutionPath = {
  id: string;
  card_id: string;
  evolves_to_card_id: string;
  cost_json: { vex_ingame?: number; copies_required?: number };
  requirements_json: { level_required?: number; pvp_wins?: number; description?: string };
  from_name: string;
  from_rarity: string;
  from_faction: string;
  to_name: string;
  to_rarity: string;
};

export type MobileWorldBoss = {
  id: string;
  boss_code: string;
  name: string;
  region_id: string | null;
  tier: string;
  power_level: number;
  hp: number;
  reward_pool: Record<string, unknown>;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  image_url: string | null;
};

export type MobileBossEncounter = {
  id: string;
  world_boss_id: string;
  player_id: string;
  damage: number;
  reward_json: Record<string, unknown>;
  status: string;
  created_at: string;
};

export type MobileRaidRun = {
  id: string;
  raid_code: string;
  region_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  metadata: {
    name?: string;
    difficulty?: string;
    max_participants?: number;
    reward_multiplier?: number;
  };
  created_at: string;
};

export type MobileRaidParticipant = {
  id: string;
  raid_run_id: string;
  player_id: string;
  contribution: number;
  status: string;
};

export type MobileLoreEntry = {
  id: string;
  entry_code: string | null;
  title: string | null;
  content: string | null;
  category: string | null;
  related_entity: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type MobileSeasonPass = {
  id: string;
  name: string;
  season_number: number;
  start_at: string;
  end_at: string;
  active: boolean;
  metadata: Record<string, unknown>;
};

export type MobileSeasonTier = {
  tier: number;
  xp_required: number;
  is_premium: boolean;
  reward: Record<string, unknown>;
  unlocked: boolean;
  claimed: boolean;
};

export type MobileSeasonProgress = {
  ok: boolean;
  season_name?: string;
  season_number?: number;
  end_at?: string;
  player_xp?: number;
  current_tier?: number;
  is_premium?: boolean;
  tiers?: MobileSeasonTier[];
  reason?: string;
};

export type MobileSeasonRanking = {
  rank_position: number;
  mmr: number;
  wins: number;
  losses: number;
  draws: number;
  season_key: string;
  player_id: string;
  display_name?: string;
};

export type MobileWorldSnapshot = {
  bosses: MobileWorldBoss[];
  encounters: MobileBossEncounter[];
  raids: MobileRaidRun[];
  lore: MobileLoreEntry[];
  season: MobileSeasonPass | null;
  seasonTiers: MobileSeasonTier[];
  seasonProgress: MobileSeasonProgress | null;
  rankings: MobileSeasonRanking[];
  myRaidIds: string[];
};

export type MobileWorldAction = { ok: boolean; reason?: string };
export type MobileAction = { ok: boolean; reason?: string };

export const STORAGE_BASE = 'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets';
export function storageAsset(path: string) { return `${STORAGE_BASE}/${path}`; }

function headers(accessToken?: string, extra?: Record<string, string>) {
  return { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + (accessToken ?? SUPABASE_ANON_KEY), Accept: 'application/json', 'Content-Type': 'application/json', ...extra };
}

async function parse(response: Response): Promise<any> {
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) throw new Error(body?.msg ?? body?.message ?? body?.error_description ?? body?.error ?? 'Solicitud a Supabase rechazada (' + response.status + ')');
  return body;
}

type AuthResponse = Partial<Session> & { user?: User; message?: string };

async function authRequest(path: string, body: Json) {
  const response = await fetch(SUPABASE_URL + '/auth/v1/' + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  return parse(response) as Promise<AuthResponse>;
}

function requireSession(response: AuthResponse): Session {
  if (!response.access_token || !response.refresh_token || !response.user?.id) {
    throw new Error('Supabase no devolvió una sesión válida.');
  }
  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: response.expires_at,
    user: response.user,
  };
}

async function saveSession(session: Session | null) {
  if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(SESSION_KEY);
}

export async function signIn(email: string, password: string): Promise<Session> {
  const session = requireSession(await authRequest('token?grant_type=password', { email: email.trim(), password }));
  await saveSession(session);
  return session;
}

function parseOAuthFragment(url: string) {
  const fragment = url.split('#')[1] ?? '';
  return Object.fromEntries(fragment.split('&').filter(Boolean).map((part) => {
    const [key, value = ''] = part.split('=');
    return [decodeURIComponent(key), decodeURIComponent(value.replace(/\+/g, ' '))];
  }));
}

export async function signInWithGoogle(): Promise<Session> {
  const redirectTo = Linking.createURL('auth-callback');
  const authorizeUrl = SUPABASE_URL + '/auth/v1/authorize?provider=google&flow_type=implicit&prompt=select_account&redirect_to=' + encodeURIComponent(redirectTo);
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectTo);
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    throw new Error('Inicio con Google cancelado.');
  }
  const params = parseOAuthFragment(result.url);
  if (params.error_description) throw new Error(String(params.error_description));
  const accessToken = String(params.access_token ?? '');
  const refreshToken = String(params.refresh_token ?? '');
  if (!accessToken || !refreshToken) {
    throw new Error('Google no devolvió una sesión válida. Revisa que Google esté habilitado en Supabase.');
  }
  const userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: headers(accessToken) });
  const user = await parse(userResponse) as User;
  const session: Session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + Number(params.expires_in ?? 3600),
    user,
  };
  await saveSession(session);
  return session;
}

export async function signUp(email: string, password: string): Promise<Session | null> {
  const response = await authRequest('signup', { email: email.trim(), password });
  if (response.user) {
    try { await ensurePlayerRow(email); } catch { /* Auth remains valid; the database trigger retries provisioning. */ }
  }
  if (response.access_token && response.refresh_token && response.user) {
    const session = requireSession(response);
    await saveSession(session);
    return session;
  }
  return null;
}

async function ensurePlayerRow(email: string) {
  await restRpc('ensure_player_row', {
    p_email: email.trim(),
    p_display_name: email.trim().split('@')[0],
  });
}

export async function signOut() { await saveSession(null); }

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  let saved: Session;
  try { saved = JSON.parse(raw) as Session; } catch { await saveSession(null); return null; }
  if (saved.expires_at && saved.expires_at * 1000 > Date.now() + 60_000) return saved;
  if (!saved.refresh_token) { await saveSession(null); return null; }
  try {
    const refreshed = requireSession(await authRequest('token?grant_type=refresh_token', { refresh_token: saved.refresh_token }));
    await saveSession(refreshed);
    return refreshed;
  } catch { await saveSession(null); return null; }
}

async function rest(path: string, session?: Session, init?: RequestInit) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...init, headers: { ...headers(session?.access_token), ...(init?.headers as Record<string, string> | undefined) } });
  return parse(response);
}

export async function loadCatalogSnapshot(session?: Session) {
  const cards = await rest(
    'cards?select=id%2Ccode%2Cname%2Cfaction%2Crarity%2Cspecialization%2Cpower%2Caffinity%2Cprestige%2Ccharge%2Clore%2Cimage_url%2Csupply%2Cminted%2Cis_founder%2Cis_legendary%2Ccard_tier%2Ccard_domain%2Cmarketable%2Cfusion_enabled%2Crelease_status%2Csynergy_json&active=eq.true&order=name.asc&limit=1000',
    session,
  ) as PublicCard[];
  return { cardsTotal: cards.length, featuredCards: cards };
}

export async function loadPlayerCollection(session: Session): Promise<PlayerCard[]> {
  const players = await rest(
    'players?select=id&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1',
    session,
  ) as Array<{ id: string }>;
  const playerId = players[0]?.id;
  if (!playerId) return [];

  const rows = await rest(
    'player_cards?select=id%2Ccard_id%2Cquantity%2Clocked%2Clisted%2Csource_tracking%2Ccreated_at%2Ccards!inner(id%2Ccode%2Cname%2Cfaction%2Crarity%2Cspecialization%2Cpower%2Caffinity%2Cprestige%2Ccharge%2Clore%2Cimage_url%2Csupply%2Cminted%2Cis_founder%2Cis_legendary%2Ccard_tier%2Ccard_domain%2Cmarketable%2Cfusion_enabled%2Crelease_status%2Csynergy_json)&player_id=eq.' +
      encodeURIComponent(playerId) +
      '&quantity=gt.0&order=card_id.asc',
    session,
  ) as Array<Record<string, unknown> & { cards?: PublicCard | PublicCard[] }>;

  return rows.map((row) => {
    const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
    return {
      ...(card ?? {}),
      player_card_id: String(row.id ?? ''),
      card_id: String(row.card_id ?? card?.id ?? ''),
      quantity: Number(row.quantity ?? 0),
      locked: Boolean(row.locked),
      listed: Boolean(row.listed),
      source_tracking: (row.source_tracking as Record<string, unknown> | null) ?? null,
      acquired_at: (row.created_at as string | null) ?? null,
    } as PlayerCard;
  });
}

export async function loadPlayerDeck(session: Session, playerId: string): Promise<DeckSlot[]> {
  const rows = await rest(
    'player_deck?select=slot_number%2Ccard_id%2Cis_champion%2Ccards!inner(code%2Cname%2Crarity%2Cfaction%2Cpower)&player_id=eq.' +
      encodeURIComponent(playerId) +
      '&order=slot_number.asc',
    session,
  ) as Array<Record<string, unknown> & { cards?: PublicCard | PublicCard[] }>;

  return rows
    .map((row) => {
      const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
      return {
        slot_number: Number(row.slot_number ?? 0),
        is_champion: row.is_champion === true,
        card_id: String(row.card_id ?? card?.id ?? ''),
        code: String(card?.code ?? ''),
        name: String(card?.name ?? ''),
        rarity: String(card?.rarity ?? 'Common'),
        faction: String(card?.faction ?? 'Sin facción'),
        power: Number(card?.power ?? 0),
      };
    })
    .filter((slot) => slot.card_id && slot.name);
}

export async function validateDeck(cardIds: string[], session: Session): Promise<DeckValidation> {
  const result = await restRpc('validate_deck', { p_card_ids: cardIds }, session) as Partial<DeckValidation> | null;
  return {
    valid: Boolean(result?.valid),
    errors: Array.isArray(result?.errors) ? result.errors.map(String) : ['El servidor no pudo validar el mazo.'],
    card_count: Number(result?.card_count ?? cardIds.length),
    mythic_count: Number(result?.mythic_count ?? 0),
    legendary_count: Number(result?.legendary_count ?? 0),
  };
}

export async function saveDeck(cardIds: string[], session: Session): Promise<SaveDeckResult> {
  const result = await restRpc('save_deck', { p_card_ids: cardIds }, session) as SaveDeckResult | null;
  return {
    ok: Boolean(result?.ok),
    slots_saved: result?.slots_saved,
    reason: result?.reason,
  };
}

export async function loadHomeStats(): Promise<HomeStats> {
  return restRpc('get_home_stats') as Promise<HomeStats>;
}

async function loadWorldPlayerId(session?: Session): Promise<string | null> {
  if (!session) return null;
  const players = await rest(
    'players?select=id&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1',
    session,
  ) as Array<{ id: string }>;
  return players[0]?.id ?? null;
}

function asWorldTier(row: Record<string, unknown>): MobileSeasonTier {
  return {
    tier: Number(row.tier ?? row.tier_level ?? 0),
    xp_required: Number(row.xp_required ?? 0),
    is_premium: Boolean(row.is_premium),
    reward: (row.reward ?? row.reward_json ?? {}) as Record<string, unknown>,
    unlocked: Boolean(row.unlocked),
    claimed: Boolean(row.claimed),
  };
}

export async function loadWorldSnapshot(session?: Session): Promise<MobileWorldSnapshot> {
  const [bosses, raids, lore, seasons] = await Promise.all([
    rest('world_bosses?select=id%2Cboss_code%2Cname%2Cregion_id%2Ctier%2Cpower_level%2Chp%2Creward_pool%2Cactive%2Cmetadata%2Ccreated_at%2Cimage_url&active=eq.true&order=tier.asc%2Cname.asc&limit=50', session),
    rest('raid_runs?select=id%2Craid_code%2Cregion_id%2Cstatus%2Cstarted_at%2Cended_at%2Cmetadata%2Ccreated_at&status=in.(pending%2Cactive)&order=created_at.desc&limit=50', session),
    rest('lore_codex?select=id%2Centry_code%2Ctitle%2Ccontent%2Ccategory%2Crelated_entity%2Cmetadata%2Ccreated_at&order=category.asc%2Ctitle.asc&limit=100', session),
    rest('season_passes?select=id%2Cname%2Cseason_number%2Cstart_at%2Cend_at%2Cactive%2Cmetadata&active=eq.true&order=season_number.desc&limit=1', session),
  ]) as [MobileWorldBoss[], MobileRaidRun[], MobileLoreEntry[], MobileSeasonPass[]];

  const season = seasons[0] ?? null;
  const playerId = await loadWorldPlayerId(session);
  const [tiers, encounters, seasonProgress, rankingRows, myRaidRows] = await Promise.all([
    season
      ? rest('season_pass_tiers?select=id%2Cseason_pass_id%2Ctier_level%2Cxp_required%2Cis_premium%2Creward_json&season_pass_id=eq.' + encodeURIComponent(season.id) + '&order=tier_level.asc&limit=200', session)
      : Promise.resolve([]),
    playerId
      ? rest('world_boss_encounters?select=id%2Cworld_boss_id%2Cplayer_id%2Cdamage%2Creward_json%2Cstatus%2Ccreated_at&player_id=eq.' + encodeURIComponent(playerId) + '&order=created_at.desc&limit=50', session)
      : Promise.resolve([]),
    playerId
      ? restRpc('get_season_progress', { p_player_id: playerId }, session).catch(() => null)
      : Promise.resolve(null),
    rest('season_rankings?select=rank_position%2Cmmr%2Cwins%2Closses%2Cdraws%2Cseason_key%2Cplayer_id&season_key=eq.S1_2026&order=rank_position.asc&limit=100', session),
    playerId
      ? rest('raid_participants?select=raid_run_id&player_id=eq.' + encodeURIComponent(playerId) + '&limit=100', session)
      : Promise.resolve([]),
  ]) as [Array<Record<string, unknown>>, MobileBossEncounter[], MobileSeasonProgress | null, MobileSeasonRanking[], Array<{ raid_run_id: string }>];

  const playerNames = rankingRows.length
    ? await restRpc('get_public_player_names', { p_player_ids: rankingRows.map((row) => row.player_id) }, session).catch(() => []) as Array<{ id: string; display_name: string }>
    : [];
  const nameMap = Object.fromEntries(playerNames.map((row) => [row.id, row.display_name]));
  const progressTiers = Array.isArray(seasonProgress?.tiers) ? seasonProgress.tiers : [];
  const seasonTiers = progressTiers.length
    ? progressTiers.map((row) => asWorldTier(row as unknown as Record<string, unknown>))
    : tiers.map(asWorldTier);

  return {
    bosses: bosses ?? [],
    encounters: encounters ?? [],
    raids: raids ?? [],
    lore: lore ?? [],
    season,
    seasonTiers,
    seasonProgress,
    rankings: (rankingRows ?? []).map((row) => ({ ...row, display_name: nameMap[row.player_id] ?? undefined })),
    myRaidIds: (myRaidRows ?? []).map((row) => row.raid_run_id),
  };
}

export async function loadWorldRaidParticipants(raidRunId: string, session?: Session): Promise<MobileRaidParticipant[]> {
  return rest(
    'raid_participants?select=id%2Craid_run_id%2Cplayer_id%2Ccontribution%2Cstatus&raid_run_id=eq.' + encodeURIComponent(raidRunId) + '&order=contribution.desc&limit=50',
    session,
  ) as Promise<MobileRaidParticipant[]>;
}

export async function joinWorldRaid(raidRunId: string, session?: Session): Promise<MobileWorldAction> {
  if (!session) return { ok: false, reason: 'Inicia sesión para unirte al raid.' };
  const result = await restRpc('vexforge_join_raid', { p_raid_run_id: raidRunId }, session) as MobileWorldAction | null;
  return result ?? { ok: false, reason: 'El servidor no devolvió una respuesta.' };
}

export async function contributeWorldRaid(raidRunId: string, session?: Session): Promise<MobileWorldAction> {
  if (!session) return { ok: false, reason: 'Inicia sesión para contribuir.' };
  const result = await restRpc('vexforge_contribute_raid', { p_raid_run_id: raidRunId, p_contribution: 1 }, session) as MobileWorldAction | null;
  return result ?? { ok: false, reason: 'El servidor no devolvió una respuesta.' };
}

export async function claimWorldSeasonTier(tier: number, session?: Session): Promise<MobileWorldAction> {
  if (!session) return { ok: false, reason: 'Inicia sesión para reclamar recompensas.' };
  const result = await restRpc('claim_season_pass_reward', { p_player_id: await loadWorldPlayerId(session), p_tier: tier }, session) as MobileWorldAction | null;
  return result ?? { ok: false, reason: 'El servidor no devolvió una respuesta.' };
}

export async function loadDailyFeaturedCard(): Promise<DailyCard | null> {
  const cards = await rest('cards?select=id%2Ccode%2Cname%2Crarity%2Cfaction%2Cpower%2Clore%2Cimage_url&active=eq.true&rarity=in.(Legendary,Mythic)&order=id.asc&limit=1000') as DailyCard[];
  if (!cards || cards.length === 0) return null;
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
  return cards[dayOfYear % cards.length] ?? null;
}

export async function loadRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const rows = await rest(`mission_runs?select=id%2Cupdated_at%2Cplayer_id%2Cmissions(name)&status=eq.claimed&order=updated_at.desc&limit=${limit}`) as Array<{ id: string; updated_at: string; player_id: string; missions?: { name?: string } | Array<{ name?: string }> | null }>;
  if (!rows || rows.length === 0) return [];
  const playerIds = [...new Set(rows.map((row) => row.player_id).filter(Boolean))];
  const names = playerIds.length
    ? await restRpc('get_public_player_names', { p_player_ids: playerIds }) as Array<{ id: string; display_name: string }>
    : [];
  const nameMap = Object.fromEntries((names ?? []).map((row) => [row.id, row.display_name]));
  return rows.map((row) => {
    const mission = Array.isArray(row.missions) ? row.missions[0] : row.missions;
    return {
      id: row.id,
      text: `${nameMap[row.player_id] ?? 'Un forjador'} completó "${mission?.name ?? 'una misión'}"`,
      time: row.updated_at,
    };
  });
}

export async function loadHomeMissions(session?: Session): Promise<HomeMission[]> {
  return rest('missions?select=id%2Cname%2Cenergy_cost%2Creward_xp%2Creward_vex_ingame%2Cdifficulty%2Cmission_type&active=eq.true&production_ready=eq.true&order=mission_order.asc&limit=3', session) as Promise<HomeMission[]>;
}

async function currentPlayerId(session: Session): Promise<string | null> {
  const players = await rest(
    'players?select=id&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1',
    session,
  ) as Array<{ id: string }>;
  return players[0]?.id ?? null;
}

export async function loadDailyQuests(session: Session): Promise<DailyQuest[]> {
  const playerId = await currentPlayerId(session);
  if (!playerId) return [];
  const rows = await rest(
    'player_daily_quests?select=id%2Cquest_id%2Cassigned_date%2Cstatus%2Cprogress%2Ccompleted_at%2Cclaimed_at%2Cdaily_quests%28id%2Cquest_key%2Ctitle%2Cdescription%2Cquest_type%2Ctarget_count%2Creward_vex_ingame%2Creward_xp%29&player_id=eq.' +
      encodeURIComponent(playerId) +
      '&order=assigned_date.desc',
    session,
  ) as Array<Record<string, unknown> & { daily_quests?: DailyQuest['quest'] | DailyQuest['quest'][] | null }>;
  return rows.map((row) => {
    const quest = Array.isArray(row.daily_quests) ? row.daily_quests[0] : row.daily_quests;
    return {
      id: String(row.id ?? ''),
      quest_id: String(row.quest_id ?? ''),
      assigned_date: String(row.assigned_date ?? ''),
      status: String(row.status ?? 'active'),
      progress: Number(row.progress ?? 0),
      completed_at: (row.completed_at as string | null) ?? null,
      claimed_at: (row.claimed_at as string | null) ?? null,
      quest: quest ?? null,
    };
  });
}

export async function claimDailyQuest(session: Session, assignmentId: string): Promise<DailyQuestClaim> {
  const result = await restRpc('claim_daily_quest', { p_quest_assignment_id: assignmentId }, session) as DailyQuestClaim | null;
  return {
    claimed: Boolean(result?.claimed ?? (result as { ok?: boolean } | null)?.ok),
    xp_applied: result?.xp_applied,
    vex_applied: result?.vex_applied,
    pendingRewards: result?.pendingRewards,
    reason: result?.reason,
  };
}

export async function loadMissions(session: Session): Promise<MobileMission[]> {
  return rest(
    'missions?select=id%2Ccode%2Cname%2Cmission_type%2Cenergy_cost%2Creward_xp%2Creward_vex_ingame%2Creward_vex_tradeable%2Ccooldown_seconds%2Cdifficulty%2Cmission_group&active=eq.true&system_locked=eq.false&production_ready=eq.true&order=mission_order.asc',
    session,
  ) as Promise<MobileMission[]>;
}

export async function executeMobileMission(
  session: Session,
  playerId: string,
  missionId: string,
): Promise<MissionReward> {
  const execution = await restRpc('execute_mission', { p_player: playerId, p_mission: missionId }, session) as MissionReward | null;
  if (!execution?.success) {
    throw new Error(execution?.reason ?? 'La misión fue rechazada por el servidor.');
  }
  if (!execution.run_id) return execution;

  const claim = await restRpc('claim_mission_reward', {
    p_mission_run_id: execution.run_id,
    p_player_id: playerId,
    p_reference_id: `mission:${execution.run_id}`,
  }, session) as { success?: boolean; ok?: boolean; reason?: string } | null;
  if (!claim?.success && !claim?.ok) {
    throw new Error(claim?.reason ?? 'La recompensa de la misión no pudo liquidarse.');
  }
  return execution;
}

export async function loadPlayerProfile(session: Session): Promise<PlayerProfile | null> {
  const rows = await rest('players?select=id%2Cdisplay_name%2Cemail%2Crole%2Cstatus%2Ccreated_at%2Cis_admin%2Cis_super_admin%2Ctelegram_username&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as PlayerProfile[];
  return rows[0] ?? null;
}

export async function loadMobileSettings(session: Session): Promise<MobileSettings | null> {
  const rows = await rest('player_settings?select=player_id%2Ctelegram_enabled%2Cnotifications_enabled%2Clanguage%2Ctimezone%2Cui_mode&limit=1', session) as MobileSettings[];
  return rows[0] ?? null;
}

export async function updateMobileSettings(session: Session, patch: Partial<Omit<MobileSettings, 'player_id'>>): Promise<MobileSettings | null> {
  const playerRows = await rest('players?select=id&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as Array<{ id: string }>;
  const playerId = playerRows[0]?.id;
  if (!playerId) throw new Error('No se encontró tu perfil de jugador.');
  const rows = await rest('player_settings?player_id=eq.' + encodeURIComponent(playerId), session, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) }) as MobileSettings[];
  return rows[0] ?? null;
}

export async function loadMobileCosmetics(session: Session): Promise<{ catalog: MobileCosmetic[]; owned: MobilePlayerCosmetic[] }> {
  const [catalog, owned] = await Promise.all([
    rest('cosmetics?select=id%2Ccode%2Cname%2Ccosmetic_type%2Cdescription%2Crarity%2Cpreview_url%2Cobtainable_via%2Cmetadata&active=eq.true&order=rarity.asc%2Cname.asc&limit=100', session) as Promise<MobileCosmetic[]>,
    rest('player_cosmetics?select=id%2Ccosmetic_id%2Cequipped%2Cobtained_via%2Cobtained_at&limit=100', session) as Promise<MobilePlayerCosmetic[]>,
  ]);
  return { catalog: catalog ?? [], owned: owned ?? [] };
}

export async function equipMobileCosmetic(session: Session, cosmeticId: string, slot: string): Promise<MobileAction> {
  return mobileSocialAction(await restRpc('equip_cosmetic', { p_cosmetic_id: cosmeticId, p_slot: slot }, session), 'No se pudo equipar el cosmético.');
}

export async function unequipMobileCosmetic(session: Session, cosmeticId: string): Promise<MobileAction> {
  await rest('equipped_cosmetics?cosmetic_id=eq.' + encodeURIComponent(cosmeticId), session, { method: 'DELETE' });
  return { ok: true };
}

export async function loadMobileRelics(session: Session): Promise<{ catalog: MobileRelic[]; owned: MobilePlayerRelic[] }> {
  const [catalog, owned] = await Promise.all([
    rest('relics?select=id%2Ccode%2Cname%2Ceffect_type%2Ceffect_value%2Cmetadata%2Ccreated_at&order=name.asc&limit=100', session) as Promise<MobileRelic[]>,
    rest('player_relics?select=id%2Crelic_id%2Cis_equipped%2Cacquired_at%2Crelic%3Arelics(id%2Ccode%2Cname%2Ceffect_type%2Ceffect_value%2Cmetadata%2Ccreated_at)&order=acquired_at.asc&limit=100', session) as Promise<Array<Record<string, unknown>>>,
  ]);
  return {
    catalog: catalog ?? [],
    owned: (owned ?? []).map((row) => ({
      id: String(row.id ?? ''),
      relic_id: String(row.relic_id ?? ''),
      equipped: row.is_equipped === true,
      acquired_at: typeof row.acquired_at === 'string' ? row.acquired_at : null,
      relic: (row.relic as MobileRelic | null) ?? null,
    })),
  };
}

export async function claimMobileStarterRelics(session: Session): Promise<MobileAction> {
  return mobileSocialAction(await restRpc('grant_starter_relics', {}, session), 'No se pudieron reclamar las reliquias iniciales.');
}

export async function equipMobileRelic(session: Session, relicId: string): Promise<MobileAction> {
  return mobileSocialAction(await restRpc('equip_relic', { p_relic_id: relicId }, session), 'No se pudo equipar la reliquia.');
}

export async function unequipMobileRelic(session: Session, relicId: string): Promise<MobileAction> {
  return mobileSocialAction(await restRpc('unequip_relic', { p_relic_id: relicId }, session), 'No se pudo retirar la reliquia.');
}

export async function loadMobileNft(session: Session): Promise<{ contract: MobileNftContract | null; wallet: MobileNftWalletLink | null; queue: MobileNftMint[] }> {
  const [contracts, wallets, queue] = await Promise.all([
    rest('vexforge_nft_contracts?select=id%2Cchain_id%2Ccontract_address%2Cname%2Csymbol%2Cmax_supply%2Cstatus%2Cdeployed_at&order=created_at.desc&limit=1', session) as Promise<MobileNftContract[]>,
    rest('vexforge_nft_wallet_links?select=id%2Cwallet_address%2Cchain_id%2Cverified%2Clinked_at&order=linked_at.desc&limit=1', session) as Promise<MobileNftWalletLink[]>,
    rest('vexforge_nft_mint_queue?select=id%2Ccard_id%2Cwallet_address%2Cstatus%2Ctx_hash%2Ctoken_id%2Cerror_message%2Crequested_at%2Cprocessed_at&order=requested_at.desc&limit=20', session) as Promise<MobileNftMint[]>,
  ]);
  return { contract: contracts?.[0] ?? null, wallet: wallets?.[0] ?? null, queue: queue ?? [] };
}

export async function linkMobileWallet(session: Session, walletAddress: string): Promise<MobileNftWalletLink | null> {
  const playerRows = await rest('players?select=id&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as Array<{ id: string }>;
  const playerId = playerRows[0]?.id;
  if (!playerId) throw new Error('No se encontró tu perfil de jugador.');
  const rows = await rest('vexforge_nft_wallet_links?on_conflict=player_id%2Cwallet_address', session, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ player_id: playerId, wallet_address: walletAddress, chain_id: 137, verified: true }),
  }) as MobileNftWalletLink[];
  return rows[0] ?? null;
}

export async function loadMobileAdStats(session: Session): Promise<MobileAdStats> {
  const day = new Date().toISOString().split('T')[0];
  const [today, allTime] = await Promise.all([
    rest('vexforge_ad_views?select=id%2Cvex_awarded%2Ccreated_at&player_auth_id=eq.' + encodeURIComponent(session.user.id) + '&created_at=gte.' + encodeURIComponent(day) + '&order=created_at.desc', session) as Promise<Array<{ id: string; vex_awarded: number; created_at: string }>>,
    rest('vexforge_ad_views?select=vex_awarded&player_auth_id=eq.' + encodeURIComponent(session.user.id), session) as Promise<Array<{ vex_awarded: number }>>,
  ]);
  return { watched_today: today?.length ?? 0, total_vex_earned: (allTime ?? []).reduce((total, row) => total + Number(row.vex_awarded ?? 0), 0), last_watched_at: today?.[0]?.created_at ?? null };
}

export async function recordMobileAdView(session: Session): Promise<MobileAction> {
  const response = await rest('vexforge_ad_views', session, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ player_auth_id: session.user.id, ad_network: 'organic', completed: true, vex_awarded: 20, watched_pct: 100 }),
  }) as unknown[];
  return { ok: Array.isArray(response) && response.length > 0, reason: 'No se pudo registrar el anuncio.' };
}

export async function loadWallet(session: Session, playerId: string): Promise<Wallet | null> {
  const rows = await rest('player_wallet?select=vex_ingame%2Cvex_tradeable%2Creserved_ingame%2Creserved_tradeable&player_id=eq.' + encodeURIComponent(playerId) + '&limit=1', session) as Wallet[];
  return rows[0] ?? null;
}

const economyNumber = (value: unknown) => Number(value ?? 0);

export async function loadEconomyStats(session: Session): Promise<EconomyStats> {
  const result = await restRpc('vexforge_get_my_economy_stats', {}, session) as Partial<EconomyStats> & { reason?: string } | null;
  if (!result?.ok) throw new Error(result?.reason ?? 'No se pudieron cargar las estadísticas económicas.');
  return {
    ok: true,
    entry_count: economyNumber(result.entry_count),
    total_credited: economyNumber(result.total_credited),
    total_debited: economyNumber(result.total_debited),
    net_ingame: economyNumber(result.net_ingame),
    net_tradeable: economyNumber(result.net_tradeable),
    largest_credit: economyNumber(result.largest_credit),
    by_type: Array.isArray(result.by_type)
      ? result.by_type.map((item) => ({
          entry_type: String(item.entry_type ?? ''),
          currency: String(item.currency ?? ''),
          count: economyNumber(item.count),
          total_amount: economyNumber(item.total_amount),
        }))
      : [],
  };
}

export async function loadEconomyLedger(session: Session, limit = 30, offset = 0): Promise<EconomyLedgerEntry[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  const rows = await rest(
    'economy_ledger?select=id%2Centry_type%2Ccurrency%2Camount%2Cbalance_before%2Cbalance_after%2Csource_table%2Cmetadata%2Ccreated_at&order=created_at.desc&limit=' +
      safeLimit + '&offset=' + safeOffset,
    session,
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    entry_type: String(row.entry_type ?? ''),
    currency: String(row.currency ?? ''),
    amount: economyNumber(row.amount),
    balance_before: row.balance_before == null ? null : economyNumber(row.balance_before),
    balance_after: row.balance_after == null ? null : economyNumber(row.balance_after),
    source_table: row.source_table == null ? null : String(row.source_table),
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    created_at: String(row.created_at ?? ''),
  }));
}

function nestedRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return (value as Record<string, unknown> | null) ?? null;
}

export async function loadMarketListings(session: Session): Promise<MarketListing[]> {
  const rows = await rest(
    'market_listings?select=id%2Creference_id%2Cplayer_id%2Cplayer_card_id%2Cprice%2Cfee%2Cstatus%2Cexpires_at%2Clocked%2Cplayer_cards%21player_card_id%28cards%21card_id%28name%2Crarity%29%29&status=eq.active&order=price.asc',
    session,
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const playerCard = nestedRow(row.player_cards);
    const card = nestedRow(playerCard?.cards);
    return {
      id: String(row.id ?? ''),
      reference_id: String(row.reference_id ?? ''),
      player_id: String(row.player_id ?? ''),
      player_card_id: String(row.player_card_id ?? ''),
      price: economyNumber(row.price),
      fee: economyNumber(row.fee),
      status: String(row.status ?? ''),
      expires_at: row.expires_at == null ? null : String(row.expires_at),
      locked: Boolean(row.locked),
      card_name: card?.name == null ? null : String(card.name),
      card_rarity: card?.rarity == null ? null : String(card.rarity),
    };
  });
}

export async function loadMarketOwnedCards(session: Session, playerId: string): Promise<MarketOwnedCard[]> {
  const rows = await rest(
    'player_cards?select=id%2Ccard_id%2Cquantity%2Clocked%2Clisted%2Ccards%21card_id%28name%2Crarity%29&player_id=eq.' +
      encodeURIComponent(playerId) + '&listed=eq.false&locked=eq.false&quantity=gt.0&order=created_at.asc',
    session,
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const card = nestedRow(row.cards);
    return {
      id: String(row.id ?? ''),
      card_id: String(row.card_id ?? ''),
      card_name: card?.name == null ? null : String(card.name),
      card_rarity: card?.rarity == null ? null : String(card.rarity),
      quantity: economyNumber(row.quantity),
      locked: Boolean(row.locked),
      listed: Boolean(row.listed),
    };
  });
}

function mobileReference(prefix: string) {
  return `mobile-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createMarketListing(
  session: Session,
  playerId: string,
  playerCardId: string,
  price: number,
): Promise<{ ok: boolean; listing_id?: string; reason?: string }> {
  if (!Number.isFinite(price) || price <= 0) return { ok: false, reason: 'El precio debe ser mayor que 0.' };
  const data = await restRpc('create_listing', {
    p_player_id: playerId,
    p_player_card_id: playerCardId,
    p_price: price,
    p_reference_id: mobileReference('listing'),
    p_fee: 0,
    p_expires_at: null,
    p_metadata: { source: 'mobile' },
  }, session) as string | null;
  if (!data) return { ok: false, reason: 'El servidor no devolvió el listado creado.' };
  return { ok: true, listing_id: String(data) };
}

export async function buyMarketListing(
  session: Session,
  playerId: string,
  listingId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const data = await restRpc('buy_listing', {
    p_buyer_id: playerId,
    p_listing_id: listingId,
    p_reference_id: mobileReference('buy'),
    p_metadata: { source: 'mobile' },
  }, session) as { ok?: boolean; reason?: string } | null;
  if (data?.ok === false) return { ok: false, reason: data.reason ?? 'La compra fue rechazada por el servidor.' };
  return { ok: true };
}

export async function cancelMarketListing(
  session: Session,
  playerId: string,
  listingId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const data = await restRpc('cancel_listing', {
    p_player_id: playerId,
    p_listing_id: listingId,
    p_reference_id: mobileReference('cancel'),
    p_metadata: { source: 'mobile' },
  }, session) as { ok?: boolean; reason?: string } | null;
  if (data?.ok === false) return { ok: false, reason: data.reason ?? 'La cancelación fue rechazada por el servidor.' };
  return { ok: true };
}

export async function loadTreasuryWallets(session: Session): Promise<TreasuryWallet[]> {
  const rows = await rest(
    'vexforge_treasury?select=chain%2Ctoken_symbol%2Cwallet_address%2Ctoken_standard&active=eq.true&purpose=eq.project_treasury&order=chain.asc',
    session,
  ) as TreasuryWallet[];
  return rows;
}

export async function loadMyDeposits(session: Session): Promise<DepositRecord[]> {
  const data = await restRpc('vexforge_get_my_deposits', {}, session) as unknown;
  return Array.isArray(data) ? data.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? ''),
      amount_usdt: economyNumber(item.amount_usdt),
      vex_credited: economyNumber(item.vex_credited),
      chain: String(item.chain ?? ''),
      token_symbol: String(item.token_symbol ?? ''),
      tx_hash: String(item.tx_hash ?? ''),
      status: String(item.status ?? ''),
      created_at: String(item.created_at ?? ''),
    };
  }) : [];
}

export async function submitMobileDeposit(
  session: Session,
  amountUsdt: number,
  chain: string,
  tokenSymbol: string,
  txHash: string,
  payerWalletAddress: string,
): Promise<SubmitDepositResult> {
  const data = await restRpc('vexforge_submit_deposit', {
    p_amount_usdt: amountUsdt,
    p_chain: chain,
    p_token_symbol: tokenSymbol,
    p_tx_hash: txHash.trim(),
    p_payer_wallet_address: payerWalletAddress.trim(),
  }, session) as SubmitDepositResult | null;
  return data ?? { ok: false, reason: 'El servidor no devolvió el resultado del depósito.' };
}

export async function loadTradeableBalance(session: Session, playerId: string): Promise<TradeableBalance | null> {
  const rows = await rest(
    'player_economy_state?select=trade_balance%2Ctrade_balance_locked%2Cwithdrawal_pending&player_id=eq.' +
      encodeURIComponent(playerId) + '&limit=1',
    session,
  ) as Array<Record<string, unknown>>;
  const row = rows[0];
  return row ? {
    balance: economyNumber(row.trade_balance),
    locked: economyNumber(row.trade_balance_locked),
    pending: Boolean(row.withdrawal_pending),
  } : null;
}

export async function loadMyWithdrawals(session: Session, playerId: string): Promise<WithdrawalRequest[]> {
  const rows = await rest(
    'vexforge_withdrawal_requests_official?select=id%2Cplayer_id%2Ctradeable_amount%2Cusdt_gross%2Cfee_usdt%2Cusdt_net%2Cstatus%2Crejected_reason%2Cpayout_tx_hash%2Ccreated_at%2Cprocessed_at&player_id=eq.' +
      encodeURIComponent(playerId) + '&order=created_at.desc',
    session,
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    player_id: String(row.player_id ?? ''),
    tradeable_amount: economyNumber(row.tradeable_amount),
    usdt_gross: economyNumber(row.usdt_gross),
    fee_usdt: economyNumber(row.fee_usdt),
    usdt_net: economyNumber(row.usdt_net),
    status: String(row.status ?? ''),
    rejected_reason: row.rejected_reason == null ? null : String(row.rejected_reason),
    payout_tx_hash: row.payout_tx_hash == null ? null : String(row.payout_tx_hash),
    created_at: String(row.created_at ?? ''),
    processed_at: row.processed_at == null ? null : String(row.processed_at),
  }));
}

export async function requestMobileWithdrawal(
  session: Session,
  playerId: string,
  tradeableAmount: number,
): Promise<RequestWithdrawalResult> {
  const data = await restRpc('vexforge_request_withdrawal', {
    p_player_id: playerId,
    p_tradeable_amount: tradeableAmount,
  }, session) as RequestWithdrawalResult | null;
  return data ?? { ok: false, reason: 'El servidor no devolvió el resultado del retiro.' };
}

export async function loadReferralSummary(session: Session): Promise<{ summary: ReferralSummary; referrals: ReferralRecord[] }> {
  const players = await rest(
    'players?select=referral_code&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1',
    session,
  ) as Array<{ referral_code?: string | null }>;
  const referrals = await rest(
    'vexforge_referrals?select=id%2Creferred_display_name%2Cstatus%2Creward_granted%2Cfirst_pack_rewarded%2Ccreated_at&referrer_auth_id=eq.' +
      encodeURIComponent(session.user.id) + '&order=created_at.desc&limit=50',
    session,
  ) as ReferralRecord[];
  return {
    summary: {
      referral_code: players[0]?.referral_code ?? null,
      total_referrals: referrals.length,
      pending: referrals.filter((item) => item.status === 'pending').length,
      completed: referrals.filter((item) => item.status === 'completed').length,
      rewards_granted: referrals.filter((item) => item.reward_granted).length,
    },
    referrals,
  };
}

export async function loadProgress(session: Session, playerId: string): Promise<PlayerProgress | null> {
  await restRpc('sync_player_energy', {}, session);
  const rows = await rest('player_progress?select=level%2Cxp%2Cxp_to_next%2Cenergy%2Cmax_energy%2Ctutorial_step%2Cstarter_region&player_id=eq.' + encodeURIComponent(playerId) + '&limit=1', session) as PlayerProgress[];
  return rows[0] ?? null;
}

export async function advanceTutorialStep(session: Session, playerId: string, toStep: number): Promise<void> {
  const target = Math.max(0, Math.min(TUTORIAL_DONE_STEP, Math.floor(toStep)));
  await rest(
    'player_progress?player_id=eq.' + encodeURIComponent(playerId) + '&tutorial_step=lt.' + target,
    session,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ tutorial_step: target, updated_at: new Date().toISOString() }),
    },
  );
}

export async function skipTutorial(session: Session, playerId: string): Promise<void> {
  await rest(
    'player_progress?player_id=eq.' + encodeURIComponent(playerId),
    session,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ tutorial_step: TUTORIAL_DONE_STEP, updated_at: new Date().toISOString() }),
    },
  );
}

export async function loadStats(session: Session, playerId: string): Promise<PlayerStats> {
  return restRpc('get_player_stats', { p_player_id: playerId }, session) as Promise<PlayerStats>;
}

export async function loadPlayerRank(session: Session, playerId: string): Promise<PlayerRank | null> {
  const result = await restRpc('get_player_rank', { p_player_id: playerId }, session) as PlayerRank | null;
  return result && result.ok !== false ? result : null;
}

export async function loadPlayerAchievements(session: Session, playerId: string): Promise<PlayerAchievement[]> {
  const rows = await rest(
    'player_achievements?select=achievement_id%2Cunlocked_at%2Cachievements%21inner%28code%2Ctitle%2Cdescription%2Ccategory%2Cpoints%2Cicon%29&player_id=eq.' +
      encodeURIComponent(playerId) +
      '&order=unlocked_at.desc&limit=50',
    session,
  ) as Array<{
    achievement_id?: string;
    unlocked_at?: string | null;
    achievements?: {
      code?: string;
      title?: string;
      description?: string;
      category?: string | null;
      points?: number;
      icon?: string | null;
    } | Array<{
      code?: string;
      title?: string;
      description?: string;
      category?: string | null;
      points?: number;
      icon?: string | null;
    }> | null;
  }>;

  return rows.map((row) => {
    const achievement = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
    return {
      id: String(row.achievement_id ?? ''),
      code: String(achievement?.code ?? ''),
      title: String(achievement?.title ?? 'Logro'),
      description: String(achievement?.description ?? ''),
      category: achievement?.category ?? null,
      points: Number(achievement?.points ?? 0),
      icon: achievement?.icon ?? null,
      unlocked_at: row.unlocked_at ?? null,
    };
  }).filter((achievement) => achievement.id && achievement.code);
}

export async function loadMobilePacks(): Promise<MobilePack[]> {
  const rows = await rest(
    'vexforge_pack_catalog?select=pack_key%2Cpack_name%2Cprice_vex%2Cprice_usdt%2Ccard_count%2Cnotes%2Cmetadata&active=eq.true&order=price_vex.asc',
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const metadata = (row.metadata as { rarity_weights?: Record<string, number> } | null) ?? {};
    return {
      pack_key: String(row.pack_key ?? ''),
      pack_name: String(row.pack_name ?? ''),
      price_vex: Number(row.price_vex ?? 0),
      price_usdt: Number(row.price_usdt ?? 0),
      card_count: Number(row.card_count ?? 0),
      notes: (row.notes as string | null) ?? null,
      rarity_weights: metadata.rarity_weights ?? null,
    };
  }).filter((pack) => pack.pack_key && pack.pack_name);
}

export async function loadMobilePackBalance(session: Session): Promise<number> {
  const playerId = await currentPlayerId(session);
  if (!playerId) return 0;
  const rows = await rest(
    'player_wallet?select=vex_tradeable&player_id=eq.' + encodeURIComponent(playerId) + '&limit=1',
    session,
  ) as Array<{ vex_tradeable?: number }>;
  return Number(rows[0]?.vex_tradeable ?? 0);
}

export async function loadMobilePackHistory(session: Session): Promise<MobilePackOrder[]> {
  const playerId = await currentPlayerId(session);
  if (!playerId) return [];
  const rows = await rest(
    'vexforge_pack_orders?select=id%2Cpack_key%2Cprice_usdt%2Cstatus%2Cpayment_method%2Cmetadata%2Ccreated_at&player_id=eq.' +
      encodeURIComponent(playerId) + '&order=created_at.desc&limit=20',
    session,
  ) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    pack_key: String(row.pack_key ?? ''),
    price_usdt: Number(row.price_usdt ?? 0),
    status: String(row.status ?? ''),
    payment_method: (row.payment_method as string | null) ?? null,
    cards_received: ((row.metadata as { cards?: MobileOpenedCard[] } | null)?.cards),
    created_at: String(row.created_at ?? ''),
  }));
}

export async function buyMobilePack(session: Session, packKey: string): Promise<{ ok: boolean; orderId?: string; reason?: string }> {
  const result = await restRpc('vexforge_buy_pack_with_vex', { p_pack_key: packKey }, session) as { ok?: boolean; order_id?: string; reason?: string } | null;
  return { ok: Boolean(result?.ok), orderId: result?.order_id, reason: result?.reason };
}

export async function openMobilePack(session: Session, orderId: string): Promise<{ ok: boolean; cards?: MobileOpenedCard[]; reason?: string }> {
  const result = await restRpc('vexforge_open_pack', { p_order_id: orderId }, session) as { ok?: boolean; cards?: Array<MobileOpenedCard & { card_id?: string }>; reason?: string } | null;
  return {
    ok: Boolean(result?.ok),
    cards: result?.cards?.map((card) => ({ ...card, id: card.id || card.card_id || '' })),
    reason: result?.reason,
  };
}

export async function loadMobileShopCatalog(): Promise<MobileShopItem[]> {
  const rows = await rest('vexforge_shop_catalog?select=id%2Citem_key%2Cname%2Cdescription%2Ccategory%2Cprice_usdt%2Cprice_vex%2Cactive%2Cicon&active=eq.true&order=sort_order.asc%2Cprice_usdt.asc') as MobileShopItem[];
  return rows ?? [];
}

export async function loadMobileShopItems(session: Session): Promise<{ boosts: MobileActiveBoost[]; consumables: MobileConsumable[] }> {
  const playerId = await currentPlayerId(session);
  if (!playerId) return { boosts: [], consumables: [] };
  const now = new Date().toISOString();
  const [boosts, consumables] = await Promise.all([
    rest('player_active_boosts?select=id%2Cboost_type%2Cmultiplier%2Cexpires_at&player_id=eq.' + encodeURIComponent(playerId) + '&expires_at=gt.' + encodeURIComponent(now) + '&order=expires_at.asc', session) as Promise<MobileActiveBoost[]>,
    rest('player_consumables?select=id%2Citem_key%2Cquantity&player_id=eq.' + encodeURIComponent(playerId) + '&quantity=gt.0', session) as Promise<MobileConsumable[]>,
  ]);
  return { boosts: boosts ?? [], consumables: consumables ?? [] };
}

export async function loadMobileShopOrders(session: Session): Promise<MobileShopOrder[]> {
  const rows = await restRpc('vexforge_get_my_shop_orders', { p_limit: 10 }, session);
  return Array.isArray(rows) ? rows as MobileShopOrder[] : [];
}

export async function createMobileShopOrder(session: Session, itemKey: string): Promise<MobileShopOrder> {
  const reference = 'mobile-shop-' + itemKey + '-' + Date.now();
  const result = await restRpc('vexforge_create_shop_order', {
    p_item_key: itemKey,
    p_client_reference: reference,
    p_payment_reference: null,
    p_tx_hash: null,
    p_payer_wallet_address: null,
  }, session) as MobileShopOrder & { ok?: boolean; reason?: string };
  if (!result?.ok) throw new Error(result?.reason ?? 'No se pudo crear la orden.');
  return result;
}

export async function submitMobileShopPayment(
  session: Session,
  orderId: string,
  txHash: string,
  payerWalletAddress: string,
): Promise<MobileShopOrder> {
  const result = await restRpc('vexforge_submit_shop_order_payment', {
    p_order_id: orderId,
    p_tx_hash: txHash,
    p_payer_wallet_address: payerWalletAddress,
    p_payment_reference: null,
  }, session) as MobileShopOrder & { ok?: boolean; reason?: string };
  if (!result?.ok) throw new Error(result?.reason ?? 'No se pudo registrar el pago.');
  return result;
}

export async function loadMobileFusableCards(session: Session, playerId: string): Promise<MobileFusableCard[]> {
  const owned = await rest(
    'player_cards?select=id%2Ccard_id%2Cquantity%2Clocked%2Clisted&player_id=eq.' + encodeURIComponent(playerId) +
      '&locked=eq.false&listed=eq.false&quantity=gt.0',
    session,
  ) as Array<{ id: string; card_id: string; quantity: number }>;
  if (!owned.length) return [];
  const ids = owned.map((card) => card.card_id).join(',');
  const definitions = await rest(
    'cards?select=id%2Cname%2Crarity%2Cfusion_enabled&id=in.(' + encodeURIComponent(ids) + ')&fusion_enabled=eq.true&active=eq.true',
    session,
  ) as Array<{ id: string; name: string; rarity: string }>;
  const byId = new Map(definitions.map((card) => [card.id, card]));
  return owned.filter((card) => byId.has(card.card_id)).map((card) => {
    const definition = byId.get(card.card_id)!;
    return { player_card_id: card.id, card_id: card.card_id, name: definition.name, rarity: definition.rarity, quantity: Number(card.quantity) };
  });
}

export async function loadMobileFusionPolicy(sourceRarity: string): Promise<MobileFusionPolicy | null> {
  const result = await restRpc('vexforge_fusion_policy', { p_source_rarity: sourceRarity });
  const row = Array.isArray(result) ? result[0] : result;
  if (!row) return null;
  return {
    neededCards: Number(row.needed_cards ?? 0),
    requiredShards: Number(row.required_shards ?? 0),
    ingameCost: Number(row.ingame_cost ?? 0),
    targetRarity: String(row.target_rarity ?? ''),
  };
}

export async function loadMobileFusionTargets(targetRarity: string): Promise<MobileTargetCard[]> {
  return rest(
    'cards?select=id%2Cname%2Crarity&rarity=eq.' + encodeURIComponent(targetRarity) + '&fusion_enabled=eq.true&active=eq.true&order=name.asc',
  ) as Promise<MobileTargetCard[]>;
}

export async function loadMobileShards(session: Session, playerId: string): Promise<MobileShardBalance[]> {
  const rows = await rest('vexforge_player_shards?select=shard_rarity%2Cquantity&player_id=eq.' + encodeURIComponent(playerId), session) as Array<{ shard_rarity: string; quantity: number }>;
  return rows.map((row) => ({ rarity: row.shard_rarity, quantity: Number(row.quantity) }));
}

export async function applyMobileFusion(session: Session, playerId: string, sourceCardId: string, targetCardId: string): Promise<{ ok: boolean; reason?: string }> {
  const result = await restRpc('vexforge_apply_fusion', {
    p_player_id: playerId,
    p_source_card_id: sourceCardId,
    p_target_card_id: targetCardId,
  }, session) as { ok?: boolean; reason?: string } | null;
  return { ok: Boolean(result?.ok), reason: result?.reason };
}

export async function loadMobileEvolutionPaths(): Promise<MobileEvolutionPath[]> {
  const rows = await rest(
    'card_evolution_paths?select=id%2Ccard_id%2Cevolves_to_card_id%2Ccost_json%2Crequirements_json%2Cfrom_card%3Acards!card_id(name%2Crarity%2Cfaction)%2Cto_card%3Acards!evolves_to_card_id(name%2Crarity)&order=created_at.asc',
  ) as Array<Record<string, unknown> & { from_card?: Record<string, string>; to_card?: Record<string, string> }>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    card_id: String(row.card_id ?? ''),
    evolves_to_card_id: String(row.evolves_to_card_id ?? ''),
    cost_json: (row.cost_json as MobileEvolutionPath['cost_json']) ?? {},
    requirements_json: (row.requirements_json as MobileEvolutionPath['requirements_json']) ?? {},
    from_name: row.from_card?.name ?? '',
    from_rarity: row.from_card?.rarity ?? '',
    from_faction: row.from_card?.faction ?? '',
    to_name: row.to_card?.name ?? '',
    to_rarity: row.to_card?.rarity ?? '',
  })).filter((path) => path.id && path.card_id && path.from_name && path.to_name);
}

export async function evolveMobileCard(session: Session, playerId: string, cardId: string): Promise<{ ok: boolean; message?: string }> {
  const result = await restRpc('vexforge_evolve_card', { p_card_id: cardId, p_player_id: playerId }, session) as { ok?: boolean; message?: string; reason?: string } | null;
  const ok = result?.ok !== false;
  return { ok, message: result?.message ?? result?.reason ?? (ok ? 'Carta evolucionada.' : 'No se pudo evolucionar la carta.') };
}

async function restRpc(name: string, body: Json = {}, session?: Session) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: headers(session?.access_token), body: JSON.stringify(body) });
  return parse(response);
}

export async function findOpponents(session: Session, playerId: string): Promise<Opponent[]> {
  const rows = await restRpc('get_leaderboard', { p_limit: 20 }, session) as any[];
  return (rows ?? []).filter((row) => row.player_id !== playerId).slice(0, 10).map((row) => ({ player_id: row.player_id, display_name: row.display_name ?? 'Forjador', mmr: Number(row.mmr ?? 1000), wins: Number(row.wins ?? 0), losses: Number(row.losses ?? 0) }));
}

export async function startBattle(session: Session, playerId: string, opponentId: string): Promise<BattleResult> {
  const result = await restRpc('vexforge_battle_resolve', { p_challenger_id: playerId, p_opponent_id: opponentId, p_idempotency_key: 'mobile_' + playerId + '_' + opponentId + '_' + Date.now() }, session) as BattleResult;
  if (!result?.ok) throw new Error(result?.error ?? 'El combate fue rechazado por el servidor');
  return result;
}
    