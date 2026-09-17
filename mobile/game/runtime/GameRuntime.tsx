import { useEffect, type ReactNode } from 'react';
import type { Session } from '@/lib/supabase';
import type { SyncState } from '@/context/GameContext';
import { BootScene } from '@/game/scenes/BootScene';
import { GameRenderSurface } from '@/game/render/GameRenderSurface';
import { GameRuntimeProvider, useGameRuntime } from '@/game/runtime/GameRuntimeContext';

type GameRuntimeProps = {
  session: Session | null;
  authLoading: boolean;
  syncState: SyncState;
  onRetry?: () => void;
  children: ReactNode;
};

function RuntimeScene({ session, authLoading, syncState, onRetry, children }: GameRuntimeProps) {
  const { scene, transitionTo } = useGameRuntime();
  const readyForShell = Boolean(session) && !authLoading && syncState === 'connected';

  useEffect(() => {
    transitionTo(readyForShell ? 'shell' : 'boot');
  }, [readyForShell, transitionTo]);

  if (scene === 'boot') {
    return <BootScene authLoading={authLoading} syncState={syncState} onRetry={onRetry} />;
  }

  return <GameRenderSurface>{children}</GameRenderSurface>;
}

export function GameRuntime(props: GameRuntimeProps) {
  return (
    <GameRuntimeProvider>
      <RuntimeScene {...props} />
    </GameRuntimeProvider>
  );
}