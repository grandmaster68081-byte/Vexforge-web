import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadCatalogSnapshot, type PublicCard } from '@/lib/supabase';

export type BattleState = 'ready' | 'victory' | 'defeat';
export type SyncState = 'loading' | 'connected' | 'offline';

type GameContextValue = {
  vex: number;
  shards: number;
  wins: number;
  cardsTotal: number;
  featuredCards: PublicCard[];
  syncState: SyncState;
  battleState: BattleState;
  playerHealth: number;
  enemyHealth: number;
  turn: number;
  claimMission: () => void;
  playTurn: () => void;
  resetBattle: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [cardsTotal, setCardsTotal] = useState(0);
  const [featuredCards, setFeaturedCards] = useState<PublicCard[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('loading');
  const [battleState, setBattleState] = useState<BattleState>('ready');
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [turn, setTurn] = useState(1);

  useEffect(() => {
    let mounted = true;
    loadCatalogSnapshot()
      .then((snapshot) => {
        if (!mounted) return;
        setCardsTotal(snapshot.cardsTotal);
        setFeaturedCards(snapshot.featuredCards);
        setSyncState('connected');
      })
      .catch(() => {
        if (mounted) setSyncState('offline');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const playTurn = () => {
    if (battleState !== 'ready') return;
    const damage = 18 + ((turn * 7) % 13);
    const retaliation = 7 + ((turn * 5) % 10);
    const nextEnemyHealth = Math.max(0, enemyHealth - damage);
    const nextPlayerHealth = Math.max(0, playerHealth - retaliation);
    setEnemyHealth(nextEnemyHealth);
    setPlayerHealth(nextPlayerHealth);
    setTurn((current) => current + 1);
    if (nextEnemyHealth === 0) setBattleState('victory');
    else if (nextPlayerHealth === 0) setBattleState('defeat');
  };

  const resetBattle = () => {
    setBattleState('ready');
    setPlayerHealth(100);
    setEnemyHealth(100);
    setTurn(1);
  };

  const value = useMemo(
    () => ({
      vex: 0,
      shards: 0,
      wins: 0,
      cardsTotal,
      featuredCards,
      syncState,
      battleState,
      playerHealth,
      enemyHealth,
      turn,
      claimMission: () => undefined,
      playTurn,
      resetBattle,
    }),
    [cardsTotal, featuredCards, syncState, battleState, playerHealth, enemyHealth, turn],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}
