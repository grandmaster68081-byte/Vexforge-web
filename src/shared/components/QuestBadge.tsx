import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

/**
 * QuestBadge — R.4 chat78
 * Mostra un círculo rojo con el número de quests diarias completadas pero aún no reclamadas.
 * Se monta en el sidebar junto al enlace /quests.
 * Reacciona a: autenticación, vexforge:quests-updated, vexforge:energy-updated.
 */
export function QuestBadge() {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCount(0); return; }
    const { data: player } = await supabase.from("players")
      .select("id").eq("auth_user_id", session.user.id).maybeSingle();
    if (!player) { setCount(0); return; }
    const { count: n } = await supabase
      .from("player_daily_quests")
      .select("*", { count: "exact", head: true })
      .eq("player_id", player.id)
      .eq("status", "completed");
    setCount(n ?? 0);
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    // Refresh when quests complete or when energy/missions update (missions can progress quests)
    window.addEventListener("vexforge:quests-updated", load);
    window.addEventListener("vexforge:energy-updated", load);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("vexforge:quests-updated", load);
      window.removeEventListener("vexforge:energy-updated", load);
    };
  }, [load]);

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} quest${count !== 1 ? "s" : ""} lista${count !== 1 ? "s" : ""} para reclamar`}
      style={{
        background: "#E84040",
        color: "#fff",
        borderRadius: "50%",
        minWidth: 16,
        height: 16,
        fontSize: 9,
        fontWeight: 900,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 3px",
        marginLeft: "auto",
        flexShrink: 0,
        lineHeight: 1,
        boxShadow: "0 0 6px rgba(232,64,64,0.5)",
      }}
    >
      {count}
    </span>
  );
}
