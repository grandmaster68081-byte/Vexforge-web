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
export type PlayerProfile = { id: string; display_name: string | null; email: string | null; role: string | null; status: string | null; created_at: string | null };
export type PlayerProgress = { level: number; xp: number; xp_to_next: number; energy: number; max_energy: number; tutorial_step: number | null; starter_region: string | null };
export type Wallet = { vex_ingame: number; vex_tradeable: number; reserved_ingame: number; reserved_tradeable: number };
export type Opponent = { player_id: string; display_name: string; mmr: number; wins: number; losses: number };
export type BattleResult = { ok: boolean; match_id?: string; you_won?: boolean; winner_id?: string; elo_change?: number; error?: string };
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

export async function loadPlayerProfile(session: Session): Promise<PlayerProfile | null> {
  const rows = await rest('players?select=id%2Cdisplay_name%2Cemail%2Crole%2Cstatus%2Ccreated_at&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as PlayerProfile[];
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

export async function loadStats(session: Session, playerId: string) {
  return restRpc('get_player_stats', { p_player_id: playerId }, session) as Promise<{ pvp_wins?: number; missions_completed?: number; cards_owned?: number }>;
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
    