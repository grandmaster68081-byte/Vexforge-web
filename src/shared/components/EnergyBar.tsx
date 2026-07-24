import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface EnergyState {
  energy: number;
  max_energy: number;
  updated_at: string | null;
}

const REFILL_PERIOD = 600; // seconds — +1 energy every 10 min

function calcSecsUntil(updatedAt: string | null, energy: number, max: number): number {
  if (!updatedAt || energy >= max) return 0;
  const since = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  return Math.max(0, Math.round(REFILL_PERIOD - (since % REFILL_PERIOD)));
}

/** EnergyBar — EPICA R / T.4
 * Refresca en 3 casos:
 *   1. Montaje inicial.
 *   2. Evento global 'vexforge:energy-updated' (dispatched por useMissions.execute post-misión).
 *   3. Cambio de estado de autenticación.
 * T.4: Countdown timer — muestra "en Xm Ys" hasta la próxima recarga.
 */
export function EnergyBar() {
  const [state, setState] = useState<EnergyState | null>(null);
  const [secsUntil, setSecsUntil] = useState(0);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState(null); return; }
    const { data } = await supabase
      .from("player_progress")
      .select("energy, max_energy, updated_at")
      .maybeSingle();
    if (data) setState({
      energy:     data.energy     ?? 0,
      max_energy: data.max_energy ?? 100,
      updated_at: data.updated_at ?? null,
    });
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    window.addEventListener("vexforge:energy-updated", load as EventListener);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("vexforge:energy-updated", load as EventListener);
    };
  }, [load]);

  // T.4: countdown ticker
  useEffect(() => {
    if (!state) return;
    const tick = () => setSecsUntil(calcSecsUntil(state.updated_at, state.energy, state.max_energy));
    tick();
    if (state.energy >= state.max_energy) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state]);

  if (!state) return null;

  const pct   = Math.min(100, Math.round((state.energy / Math.max(state.max_energy, 1)) * 100));
  const color = pct > 50 ? "#3DC96B" : pct > 20 ? "#E8B84B" : "#E84040";
  const glow  = pct > 50 ? "0 0 6px rgba(61,201,107,0.35)" : pct > 20 ? "0 0 6px rgba(232,184,75,0.35)" : "0 0 6px rgba(232,64,64,0.35)";

  const timerLabel = state.energy < state.max_energy && secsUntil > 0
    ? `+1 en ${Math.floor(secsUntil / 60)}m ${String(secsUntil % 60).padStart(2, "0")}s`
    : null;

  return (
    <div
      title={`Energía: ${state.energy}/${state.max_energy}${timerLabel ? ` · ${timerLabel}` : ""}`}
      style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.35)",
        border:"1px solid rgba(61,201,107,0.2)", borderRadius:8, padding:"3px 8px 3px 7px",
        cursor:"default", userSelect:"none", flexShrink:0 }}
    >
      <span style={{ fontSize:13, lineHeight:1, color, filter:`drop-shadow(${glow})` }}>⚡</span>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2 }}>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700,
          lineHeight:1, color:"#e0e0e0", letterSpacing:"0.02em" }}>
          {state.energy}<span style={{ color:"#555", fontWeight:400 }}>/{state.max_energy}</span>
        </span>
        <div style={{ width:44, height:3, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2,
            boxShadow:glow, transition:"width 0.4s ease, background 0.3s ease" }} />
        </div>
        {timerLabel && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8,
            color:"rgba(255,255,255,0.3)", lineHeight:1, letterSpacing:"0.03em" }}>
            {timerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
