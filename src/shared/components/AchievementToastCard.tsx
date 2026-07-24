// AchievementToastCard — T.5 chat91
    // Toast global de logro desbloqueado vía Supabase Realtime
    // Encola múltiples logros, muestra uno a la vez, auto-dismiss en 5.5s
    import { useState, useEffect, useRef, useCallback } from "react";
    import { supabase } from "../../lib/supabase";
    import { AudioEngine } from "../../lib/audioEngine";

    interface AchievementData {
    id: string;
    code: string;
    title: string;
    description: string;
    category: string;
    points: number;
    reward_vex_ingame: number;
    reward_xp: number;
    icon: string;
    }

    function getRarity(points: number): { label: string; color: string; glow: string } {
    if (points >= 500) return { label: "Mítico",     color: "#FF4444", glow: "rgba(255,68,68,0.5)" };
    if (points >= 200) return { label: "Legendario", color: "#E8B84B", glow: "rgba(232,184,75,0.5)" };
    if (points >= 100) return { label: "Épico",      color: "#A855F7", glow: "rgba(168,85,247,0.5)" };
    if (points >= 50)  return { label: "Raro",       color: "#4A9EFF", glow: "rgba(74,158,255,0.5)" };
    if (points >= 25)  return { label: "Infrecuente",color: "#3DC96B", glow: "rgba(61,201,107,0.5)" };
    return               { label: "Común",      color: "#9A9AB0", glow: "rgba(154,154,176,0.4)" };
    }

    export function AchievementToastCard() {
    const [queue,   setQueue]   = useState<AchievementData[]>([]);
    const [current, setCurrent] = useState<AchievementData | null>(null);
    const [exiting, setExiting] = useState(false);
    const channelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Avanzar cola cuando no hay actual
    useEffect(() => {
      if (!current && queue.length > 0) {
        const [next, ...rest] = queue;
        setQueue(rest);
        setExiting(false);
        setCurrent(next);
        try { AudioEngine.sfxNotification(); } catch {}
      }
    }, [queue, current]);

    // Auto-dismiss
    useEffect(() => {
      if (!current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => dismiss(), 5500);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    const dismiss = useCallback(() => {
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setCurrent(null);
        setExiting(false);
      }, 380);
    }, []);

    // Suscripción Realtime a player_achievements INSERT
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
          .channel(`ach_toast:${player.id}`)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "player_achievements",
            filter: `player_id=eq.${player.id}`,
          }, async (payload) => {
            const achievementId = payload.new?.achievement_id as string | undefined;
            if (!achievementId) return;
            const { data: ach } = await supabase
              .from("achievements")
              .select("id,code,title,description,category,points,reward_vex_ingame,reward_xp,icon")
              .eq("id", achievementId)
              .maybeSingle();
            if (ach) setQueue(q => [...q, ach as AchievementData]);
          })
          .subscribe();
      });

      return () => {
        cancelled = true;
        channelRef.current?.unsubscribe();
        if (timerRef.current)     clearTimeout(timerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      };
    }, []);

    if (!current) return null;
    const r = getRarity(current.points);

    return (
      <>
        <style>{`
          @keyframes ach-in {
            0%   { transform: translateX(115%); opacity: 0; }
            65%  { transform: translateX(-8px);  opacity: 1; }
            100% { transform: translateX(0);     opacity: 1; }
          }
          @keyframes ach-out {
            0%   { transform: translateX(0);    opacity: 1; }
            100% { transform: translateX(115%); opacity: 0; }
          }
          @keyframes ach-bar {
            from { width: 100%; }
            to   { width: 0%; }
          }
          @keyframes ach-icon {
            0%,100% { transform: scale(1)    rotate(0deg);  }
            30%     { transform: scale(1.28) rotate(-9deg); }
            60%     { transform: scale(1.12) rotate(6deg);  }
          }
          @keyframes ach-glow {
            0%,100% { box-shadow: 0 0 0 0 transparent, 0 8px 28px rgba(0,0,0,.55); }
            50%     { box-shadow: 0 0 22px 3px ${r.glow}, 0 8px 28px rgba(0,0,0,.55); }
          }
        `}</style>

        <div
          role="alert"
          onClick={dismiss}
          style={{
            position: "fixed", bottom: 84, right: 16, zIndex: 9998,
            width: 320, maxWidth: "calc(100vw - 32px)", cursor: "pointer",
            animation: exiting
              ? "ach-out 0.35s ease-in both"
              : "ach-in 0.48s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <div style={{
            background: "linear-gradient(135deg,#111120,#191929)",
            border: `1.5px solid ${r.color}50`,
            borderRadius: 14, overflow: "hidden",
            animation: "ach-glow 2s ease-in-out infinite",
          }}>
            {/* Header strip */}
            <div style={{
              background: `linear-gradient(90deg,${r.color}20,${r.color}08)`,
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
              borderBottom: `1px solid ${r.color}20`,
            }}>
              <span style={{ fontSize: 10, fontFamily:'"IBM Plex Mono",monospace',
                color: r.color, letterSpacing: ".15em", textTransform: "uppercase" }}>
                🏆 Logro Desbloqueado
              </span>
              <span style={{ marginLeft:"auto", fontSize:9, fontFamily:'"IBM Plex Mono",monospace',
                color: r.color, opacity:.8 }}>
                {r.label}
              </span>
            </div>

            {/* Body */}
            <div style={{ padding:"13px 15px", display:"flex", gap:13, alignItems:"flex-start" }}>
              <div style={{
                fontSize: 36, flexShrink: 0, lineHeight: 1,
                animation: "ach-icon 0.75s ease-in-out 0.2s both",
                display: "inline-block",
              }}>
                {current.icon || "🏅"}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontFamily:'"Cinzel",serif', fontSize:13, fontWeight:700,
                  color:"#e8e8f4", marginBottom:4,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {current.title}
                </div>
                <div style={{
                  fontFamily:'"Rajdhani",sans-serif', fontSize:12,
                  color:"#7a7a9a", marginBottom:9, lineHeight:1.4,
                  display:"-webkit-box", WebkitLineClamp:2,
                  WebkitBoxOrient:"vertical" as const, overflow:"hidden",
                }}>
                  {current.description}
                </div>

                {/* Reward chips */}
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {current.points > 0 && (
                    <span style={{ fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
                      background:`${r.color}18`, border:`1px solid ${r.color}44`,
                      color:r.color, borderRadius:4, padding:"2px 7px" }}>
                      +{current.points}pts
                    </span>
                  )}
                  {current.reward_xp > 0 && (
                    <span style={{ fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
                      background:"rgba(74,158,255,.12)", border:"1px solid rgba(74,158,255,.3)",
                      color:"#4A9EFF", borderRadius:4, padding:"2px 7px" }}>
                      +{current.reward_xp} XP
                    </span>
                  )}
                  {current.reward_vex_ingame > 0 && (
                    <span style={{ fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
                      background:"rgba(61,220,132,.12)", border:"1px solid rgba(61,220,132,.3)",
                      color:"#3DC96B", borderRadius:4, padding:"2px 7px" }}>
                      +{current.reward_vex_ingame} VEX
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:3, background:"rgba(255,255,255,.06)" }}>
              <div style={{
                height:"100%",
                background:`linear-gradient(90deg,${r.color}bb,${r.color})`,
                animation:"ach-bar 5.5s linear both",
              }} />
            </div>
          </div>
        </div>
      </>
    );
    }
    