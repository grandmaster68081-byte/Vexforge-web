import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { getTutorialStep, advanceTutorialStep, skipTutorial } from "./repository";

export const TUTORIAL_DONE_STEP = 99;
export const TUTORIAL_TOTAL_STEPS = 7;

export function useTutorial() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return; }
      const uid = session.user.id;
      setPlayerId(uid);
      getTutorialStep(uid).then(step => {
        setTutorialStep(step);
        setLoading(false);
      });
    });
  }, []);

  const advance = useCallback(async (toStep: number) => {
    if (!playerId || tutorialStep === null) return;
    const next = Math.max(tutorialStep + 1, toStep);
    await advanceTutorialStep(playerId, next);
    setTutorialStep(next);
  }, [playerId, tutorialStep]);

  const skip = useCallback(async () => {
    if (!playerId) return;
    await skipTutorial(playerId);
    setTutorialStep(TUTORIAL_DONE_STEP);
  }, [playerId]);

  const showTutorial =
    !loading &&
    tutorialStep !== null &&
    tutorialStep >= 0 &&
    tutorialStep < TUTORIAL_TOTAL_STEPS;

  return { tutorialStep: tutorialStep ?? 0, loading, advance, skip, showTutorial };
}
