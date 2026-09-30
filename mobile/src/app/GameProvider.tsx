import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase, SUPABASE_CONFIGURED } from '../services/supabase';
import type { QualityTier } from '../types/game';

interface GameContextValue {
  quality: QualityTier;
  setQuality: (tier: QualityTier) => Promise<void>;
  cycleQuality: () => Promise<void>;
  sessionReady: boolean;
  isAuthenticated: boolean;
  tutorialStep: number;
  setTutorialStep: (step: number) => Promise<void>;
  tutorialDone: boolean;
  haptic: (kind?: 'selection' | 'impact' | 'success' | 'warning') => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);
const QUALITY_KEY = 'vexforge.runtime.quality';
const TUTORIAL_KEY = 'vexforge.runtime.tutorial';
const DONE_STEP = 19;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [quality, setQualityState] = useState<QualityTier>('HIGH');
  const [tutorialStep, setTutorialStepState] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([AsyncStorage.getItem(QUALITY_KEY), AsyncStorage.getItem(TUTORIAL_KEY)]).then(([q, t]) => {
      if (!alive) return;
      if (q === 'LOW' || q === 'MEDIUM' || q === 'HIGH') setQualityState(q);
      const parsed = Number.parseInt(t ?? '0', 10);
      if (Number.isFinite(parsed)) setTutorialStepState(Math.max(0, Math.min(DONE_STEP, parsed)));
    }).finally(() => alive && setSessionReady(true));

    if (!supabase) {
      setSessionReady(true);
      return () => { alive = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setIsAuthenticated(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setIsAuthenticated(Boolean(session));
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  const setQuality = useCallback(async (tier: QualityTier) => {
    setQualityState(tier);
    await AsyncStorage.setItem(QUALITY_KEY, tier);
  }, []);

  const cycleQuality = useCallback(async () => {
    const next: QualityTier = quality === 'LOW' ? 'MEDIUM' : quality === 'MEDIUM' ? 'HIGH' : 'LOW';
    await setQuality(next);
    await Haptics.selectionAsync().catch(() => undefined);
  }, [quality, setQuality]);

  const setTutorialStep = useCallback(async (step: number) => {
    const bounded = Math.max(0, Math.min(DONE_STEP, Math.floor(step)));
    setTutorialStepState(bounded);
    await AsyncStorage.setItem(TUTORIAL_KEY, String(bounded));
  }, []);

  const haptic = useCallback(async (kind: 'selection' | 'impact' | 'success' | 'warning' = 'selection') => {
    try {
      if (kind === 'selection') await Haptics.selectionAsync();
      else if (kind === 'impact') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch { /* haptics are optional */ }
  }, []);

  const value = useMemo(() => ({ quality, setQuality, cycleQuality, sessionReady, isAuthenticated, tutorialStep, setTutorialStep, tutorialDone: tutorialStep >= DONE_STEP, haptic }), [quality, setQuality, cycleQuality, sessionReady, isAuthenticated, tutorialStep, setTutorialStep, haptic]);
  void SUPABASE_CONFIGURED;
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
