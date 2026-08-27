import AsyncStorage from '@react-native-async-storage/async-storage';

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
export type Opponent = { player_id: string; display_name: string; mmr: number; wins: number; losses: number };
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
    'player_deck?select=slot_number%2Ccard_id%2Ccards!inner(code%2Cname%2Crarity%2Cfaction%2Cpower)&player_id=eq.' +
      encodeURIComponent(playerId) +
      '&order=slot_number.asc',
    session,
  ) as Array<Record<string, unknown> & { cards?: PublicCard | PublicCard[] }>;

  return rows
    .map((row) => {
      const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
      return {
        slot_number: Number(row.slot_number ?? 0),
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

export async function loadWallet(session: Session, playerId: string): Promise<Wallet | null> {
  const rows = await rest('player_wallet?select=vex_ingame%2Cvex_tradeable%2Creserved_ingame%2Creserved_tradeable&player_id=eq.' + encodeURIComponent(playerId) + '&limit=1', session) as Wallet[];
  return rows[0] ?? null;
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
    