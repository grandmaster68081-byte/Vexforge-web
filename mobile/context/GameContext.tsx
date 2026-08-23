import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
    import { findOpponents, loadCatalogSnapshot, loadPlayerProfile, loadSession, loadStats, loadWallet, signIn as signInRemote, signOut as signOutRemote, signUp as signUpRemote, startBattle as startBattleRemote, type BattleResult, type Opponent, type PlayerProfile, type PublicCard, type Session, type Wallet } from '@/lib/supabase';

    export type SyncState = 'loading' | 'connected' | 'offline';
    type GameContextValue = {
    session: Session | null;
    player: PlayerProfile | null;
    wallet: Wallet | null;
    stats: { pvp_wins?: number; missions_completed?: number; cards_owned?: number } | null;
    cardsTotal: number;
    featuredCards: PublicCard[];
    syncState: SyncState;
    authLoading: boolean;
    authError: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    refresh: () => Promise<void>;
    opponents: Opponent[];
    battleLoading: boolean;
    battleResult: BattleResult | null;
    findOpponents: () => Promise<void>;
    startBattle: (opponentId: string) => Promise<void>;
    clearBattleResult: () => void;
    };

    const GameContext = createContext<GameContextValue | null>(null);

    export function GameProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [player, setPlayer] = useState<PlayerProfile | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [stats, setStats] = useState<GameContextValue['stats']>(null);
    const [cardsTotal, setCardsTotal] = useState(0);
    const [featuredCards, setFeaturedCards] = useState<PublicCard[]>([]);
    const [syncState, setSyncState] = useState<SyncState>('loading');
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [battleLoading, setBattleLoading] = useState(false);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

    const refresh = async () => {
      setSyncState('loading');
      try {
        const catalog = await loadCatalogSnapshot(session ?? undefined);
        setCardsTotal(catalog.cardsTotal);
        setFeaturedCards(catalog.featuredCards);
        if (session) {
          const nextPlayer = await loadPlayerProfile(session);
          setPlayer(nextPlayer);
          if (nextPlayer) {
            const [nextWallet, nextStats] = await Promise.all([loadWallet(session, nextPlayer.id), loadStats(session, nextPlayer.id)]);
            setWallet(nextWallet); setStats(nextStats);
          } else { setWallet(null); setStats(null); }
        } else { setPlayer(null); setWallet(null); setStats(null); }
        setSyncState('connected');
      } catch (error) { setSyncState('offline'); if (!session) setAuthError(error instanceof Error ? error.message : 'No se pudo conectar con Supabase'); }
    };

    useEffect(() => { loadSession().then((saved) => { setSession(saved); setAuthLoading(false); }).catch(() => setAuthLoading(false)); }, []);
    useEffect(() => { if (!authLoading) void refresh(); }, [authLoading, session]);

    const signIn = async (email: string, password: string) => { setAuthError(null); setAuthLoading(true); try { const next = await signInRemote(email, password); setSession(next); } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesión'); } finally { setAuthLoading(false); } };
    const signUp = async (email: string, password: string) => { setAuthError(null); setAuthLoading(true); try { const next = await signUpRemote(email, password); if (next) setSession(next); return Boolean(next); } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudo crear la cuenta'); return false; } finally { setAuthLoading(false); } };
    const signOut = async () => { await signOutRemote(); setSession(null); setPlayer(null); setWallet(null); setStats(null); setOpponents([]); };
    const find = async () => { if (!session || !player) return; try { setOpponents(await findOpponents(session, player.id)); } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudieron cargar oponentes'); } };
    const battle = async (opponentId: string) => { if (!session || !player) return; setBattleLoading(true); setBattleResult(null); try { setBattleResult(await startBattleRemote(session, player.id, opponentId)); await refresh(); } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar el combate'); } finally { setBattleLoading(false); } };

    const value = useMemo(() => ({ session, player, wallet, stats, cardsTotal, featuredCards, syncState, authLoading, authError, signIn, signUp, signOut, refresh, opponents, battleLoading, battleResult, findOpponents: find, startBattle: battle, clearBattleResult: () => setBattleResult(null) }), [session, player, wallet, stats, cardsTotal, featuredCards, syncState, authLoading, authError, opponents, battleLoading, battleResult]);
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
    }

    export function useGame() { const context = useContext(GameContext); if (!context) throw new Error('useGame must be used inside GameProvider'); return context; }
    