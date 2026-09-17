import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type GameRuntimeScene = 'boot' | 'shell';

type GameRuntimeContextValue = {
  scene: GameRuntimeScene;
  transitionTo: (scene: GameRuntimeScene) => void;
};

const GameRuntimeContext = createContext<GameRuntimeContextValue | null>(null);

export function GameRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [scene, setScene] = useState<GameRuntimeScene>('boot');
  const transitionTo = useCallback((nextScene: GameRuntimeScene) => {
    setScene(nextScene);
  }, []);
  const value = useMemo(() => ({ scene, transitionTo }), [scene, transitionTo]);

  return <GameRuntimeContext.Provider value={value}>{children}</GameRuntimeContext.Provider>;
}

export function useGameRuntime() {
  const context = useContext(GameRuntimeContext);
  if (!context) throw new Error('useGameRuntime must be used inside GameRuntimeProvider');
  return context;
}