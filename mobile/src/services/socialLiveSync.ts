import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { repository } from './repository';

/**
 * Conservative live-social refresh for the mobile runtime.
 * It intentionally uses the verified RPC read surface instead of inventing a
 * Realtime channel name/table contract that is not present in this package.
 */
export function useSocialLiveSync(refresh: () => Promise<void>, enabled = true, intervalMs = 4000) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    const run = async () => { if (!alive) return; await refreshRef.current(); };
    const start = () => { if (timer) clearInterval(timer); timer = setInterval(() => { void run(); }, intervalMs); };
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') { void run(); start(); }
      else if (timer) { clearInterval(timer); timer = null; }
    });
    void run();
    start();
    return () => { alive = false; if (timer) clearInterval(timer); sub.remove(); };
  }, [enabled, intervalMs]);
}

export async function touchSocialPresence() {
  return repository.socialPresence().catch(() => null);
}
