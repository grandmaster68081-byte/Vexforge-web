import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const LEVEL_TITLES: [number, string][] = [
  [1,"Aprendiz"],[10,"Iniciado"],[20,"Forjador"],[30,"Artesano"],[40,"Maestro"],
  [50,"Gran Maestro"],[60,"Legendario"],[70,"Mítico"],[80,"Eterno"],[90,"Trascendente"],
];
function getLevelTitle(level: number): string {
  return [...LEVEL_TITLES].reverse().find(([l]) => level >= l)?.[1] ?? "Aprendiz";
}

/** Modal global de celebración al subir de nivel — detectado vía Supabase realtime */
export function LevelUpModal() {
  const [show, setShow]     = useState<{ newLevel: number } | null>(null);
  const channelRef          = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || cancelled) return;

      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (!player || cancelled) return;

      channelRef.current = supabase
        .channel(`lvlup:${player.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "player_progress",
          filter: `player_id=eq.${player.id}`,
        }, (payload) => {
          const newLevel = payload.new?.level as number | undefined;
          const oldLevel = payload.old?.level as number | undefined;
          if (newLevel && oldLevel !== undefined && newLevel > oldLevel) {
            setShow({ newLevel });
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setShow(null), 6000);
          }
        })
        .subscribe();
    });

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!show) return null;
  const title = getLevelTitle(show.newLevel);

  return (
    <div
      onClick={() => { setShow(null); if (timerRef.current) clearTimeout(timerRef.current); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9997,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at center, rgba(232,184,75,0.12) 0%, rgba(0,0,0,0.75) 70%)",
        backdropFilter: "blur(6px)",
        cursor: "pointer",
      }}
    >
      <style>{`
        @keyframes lvl-burst {
          0%   { transform: scale(0.4) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
          80%  { transform: scale(0.96) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes lvl-shine {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lvl-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(232,184,75,0.6)); }
          50%       { filter: drop-shadow(0 0 40px rgba(232,184,75,0.9)); }
        }
        @keyframes lvl-star-spin {
          0%   { transform: scale(1) rotate(0deg); }
          50%  { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
      `}</style>

      <div style={{
        textAlign: "center",
        animation: "lvl-burst 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        padding: "0 32px",
        maxWidth: 380,
      }}>
        {/* Star icon */}
        <div style={{
          fontSize: 80, marginBottom: 12,
          animation: "lvl-glow-pulse 2s ease-in-out infinite, lvl-star-spin 4s linear infinite",
          display: "inline-block",
        }}>
          ⭐
        </div>

        {/* Label */}
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10, letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#e8b84b", marginBottom: 10,
        }}>
          ¡Subida de Nivel!
        </div>

        {/* Big level number */}
        <div style={{
          fontFamily: '"Cinzel", serif',
          fontSize: 80, fontWeight: 900, lineHeight: 1,
          background: "linear-gradient(135deg, #f0c04a, #fff8d6, #e8b84b, #fff8d6, #e8b84b)",
          backgroundSize: "300% auto",
          animation: "lvl-shine 2.5s linear infinite",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>
          {show.newLevel}
        </div>

        {/* Level title */}
        <div style={{
          fontFamily: '"Cinzel", serif',
          fontSize: 24, fontWeight: 700,
          color: "#e8e8f4", marginBottom: 28,
          letterSpacing: "0.05em",
        }}>
          {title}
        </div>

        {/* Divider */}
        <div style={{
          height: 1, margin: "0 auto 20px",
          width: 120,
          background: "linear-gradient(90deg, transparent, rgba(232,184,75,0.6), transparent)",
        }} />

        {/* Dismiss hint */}
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10, color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.12em",
        }}>
          Toca para continuar
        </span>
      </div>
    </div>
  );
}
