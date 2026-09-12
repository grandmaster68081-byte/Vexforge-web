import { supabase } from "../../lib/supabase";

export async function getTutorialStep(playerId: string): Promise<number> {
  const { data, error } = await supabase
    .from("player_progress")
    .select("tutorial_step")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error || !data) return 0;
  return data.tutorial_step ?? 0;
}

/** Avanza el tutorial_step solo hacia adelante (nunca retrocede). */
export async function advanceTutorialStep(
  playerId: string,
  toStep: number
): Promise<void> {
  await supabase
    .from("player_progress")
    .update({ tutorial_step: toStep, updated_at: new Date().toISOString() })
    .eq("player_id", playerId)
    .lt("tutorial_step", toStep);
}

/** Marca el tutorial como completado/omitido (step 99). */
export async function skipTutorial(playerId: string): Promise<void> {
  await supabase
    .from("player_progress")
    .update({ tutorial_step: 99, updated_at: new Date().toISOString() })
    .eq("player_id", playerId);
}
