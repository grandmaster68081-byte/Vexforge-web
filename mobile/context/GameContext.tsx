import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BattleState = 'ready' | 'victory' | 'defeat';

type GameContextValue = {
  vex: number;
  shards: number;
  wins: number;
  battleState: BattleState;
  playerHealth: number;
  enemyHealth: number;
  turn: number;
  claimMission: () => void;
  playTurn: () => void;
  resetBattle: () => void;
};

const STORAGE_KEY = '@vexforge/progress';
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [vex, setVex] = useState(2450);
  const [shards, setShards] = useState(38);
  const [wins, setWins] = useState(7);
  const [battleState, setBattleState] = useState<BattleState>('ready');
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [turn, setTurn] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) return;
      try {
        const saved = JSON.parse(stored) as { vex?: number; shards?: number; wins?: number };
        if (typeof saved.vex === 'number') setVex(saved.vex);
        if (typeof saved.shards === 'number') setShards(saved.shards);
        if (typeof saved.wins === 'number') setWins(saved.wins);
      } catch {
        // A corrupt local save should not prevent the game from opening.
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ vex, shards, wins }));
  }, [vex, shards, wins]);

  const playTurn = () => {
    if (battleState !== 'ready') return;
    const damage = 18 + ((turn * 7) % 13);
    const retaliation = 7 + ((turn * 5) % 10);
    const nextEnemyHealth = Math.max(0, enemyHealth - damage);
    const nextPlayerHealth = Math.max(0, playerHealth - retaliation);
    setEnemyHealth(nextEnemyHealth);
    setPlayerHealth(nextPlayerHealth);
    setTurn((current) => current + 1);

    if (nextEnemyHealth === 0) {
      setBattleState('victory');
      setWins((current) => current + 1);
      setVex((current) => current + 125);
      setShards((current) => current + 2);
    } else if (nextPlayerHealth === 0) {
      setBattleState('defeat');
    }
  };

  const resetBattle = () => {
    setBattleState('ready');
    setPlayerHealth(100);
    setEnemyHealth(100);
    setTurn(1);
  };

  const claimMission = () => {
    setVex((current) => current + 75);
    setShards((current) => current + 1);
  };

  const value = useMemo(
    () => ({
      vex,
      shards,
      wins,
      battleState,
      playerHealth,
      enemyHealth,
      turn,
      claimMission,
      playTurn,
      resetBattle,
    }),
    [vex, shards, wins, battleState, playerHealth, enemyHealth, turn],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}