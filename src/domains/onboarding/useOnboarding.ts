import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const STORAGE_KEY = "vexforge_onboarding_v1";

/**
 * V.1 chat79 — Detecta jugador nuevo (tutorial_step=0) y controla
 * visibilidad del OnboardingModal. Flag localStorage evita repetición.
 */
export function useOnboarding() {
  const [show, setShow]             = useState(false);
  const [playerName, setPlayerName] = useState("Forjador");

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "done") return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const { data: playerRow } = await supabase
        .from("players").select("id, display_name")
        .eq("auth_user_id", session.user.id).maybeSingle();
      if (!playerRow || cancelled) return;
      if (playerRow.display_name) setPlayerName(playerRow.display_name);
      const { data: progress } = await supabase
        .from("player_progress").select("tutorial_step")
        .eq("player_id", playerRow.id).maybeSingle();
      if (!cancelled && (progress?.tutorial_step ?? 0) === 0) setShow(true);
    })();
    return () => { cancelled = true; };
  }, []);

  function dismiss() { localStorage.setItem(STORAGE_KEY, "done"); setShow(false); }
  return { show, playerName, dismiss };
}
