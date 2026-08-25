import AsyncStorage from '@react-native-async-storage/async-storage';

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rscuzqnfccqvltkdcdny.supabase.co';
    const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58';
    const SESSION_KEY = 'vexforge.supabase.session';

    type Json = Record<string, unknown>;
    export type User = { id: string; email?: string };
    export type Session = { access_token: string; refresh_token: string; expires_at?: number; user: User };
    export type PublicCard = { id: string; code: string; name: string; faction: string | null; rarity: string | null; image_url: string | null; power?: number | null };
    export type PlayerProfile = { id: string; display_name: string | null; email: string | null; role: string | null; status: string | null; created_at: string | null };
    export type Wallet = { vex_ingame: number; vex_tradeable: number; reserved_ingame: number; reserved_tradeable: number };
    export type Opponent = { player_id: string; display_name: string; mmr: number; wins: number; losses: number };
    export type BattleResult = { ok: boolean; match_id?: string; you_won?: boolean; winner_id?: string; elo_change?: number; error?: string };

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
    const cards = await rest('cards?select=id%2Ccode%2Cname%2Cfaction%2Crarity%2Cimage_url%2Cpower&active=eq.true&order=name.asc&limit=30', session, { headers: { Prefer: 'count=exact' } }) as PublicCard[];
    return { cardsTotal: cards.length, featuredCards: cards };
    }

    export async function loadPlayerProfile(session: Session): Promise<PlayerProfile | null> {
    const rows = await rest('players?select=id%2Cdisplay_name%2Cemail%2Crole%2Cstatus%2Ccreated_at&auth_user_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as PlayerProfile[];
    return rows[0] ?? null;
    }

    export async function loadWallet(session: Session, playerId: string): Promise<Wallet | null> {
    const rows = await rest('player_wallet?select=vex_ingame%2Cvex_tradeable%2Creserved_ingame%2Creserved_tradeable&player_id=eq.' + encodeURIComponent(session.user.id) + '&limit=1', session) as Wallet[];
    return rows[0] ?? null;
    }

    export async function loadStats(session: Session, playerId: string) {
    return restRpc('get_player_stats', { p_player_id: playerId }, session) as Promise<{ pvp_wins?: number; missions_completed?: number; cards_owned?: number }>;
    }

    async function restRpc(name: string, body: Json, session?: Session) {
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
    