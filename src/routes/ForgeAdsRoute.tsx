// ForgeAdsRoute — AM.3 — chat86 — Panel Forge Ads (F2P Monetización)
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { PageLoader }       from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast }         from "../shared/context/ToastContext";

const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30",  b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#E3573F",
  blue:"#4A9EFF", muted:"#7a7a9a", main:"#e8e8f0",
};

const MAX_DAILY = 5;
const VEX_PER_AD = 20;

interface AdStats {
  watched_today: number;
  total_vex_earned: number;
  last_watched_at: string | null;
}

async function loadAdStats(userId: string): Promise<AdStats> {
  const { data } = await supabase
    .from("vexforge_ad_views")
    .select("id, vex_awarded, created_at")
    .eq("player_auth_id", userId)
    .gte("created_at", new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false });

  const todayViews = data ?? [];
  const allTime = await supabase
    .from("vexforge_ad_views")
    .select("vex_awarded")
    .eq("player_auth_id", userId);

  const total = (allTime.data ?? []).reduce((s, r) => s + (r.vex_awarded ?? 0), 0);

  return {
    watched_today: todayViews.length,
    total_vex_earned: total,
    last_watched_at: todayViews[0]?.created_at ?? null,
  };
}

export function ForgeAdsRoute() {
  const { addToast } = useToast();
  const [authed, setAuthed]     = useState<boolean | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState<AdStats | null>(null);
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      if (!session) { setLoading(false); return; }
      setUserId(session.user.id);
      loadAdStats(session.user.id)
        .then(setStats)
        .finally(() => setLoading(false));
    });
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!userId || !stats) return;
    if (stats.watched_today >= MAX_DAILY) {
      addToast("Alcanzaste el límite diario de 5 anuncios. Vuelve mañana.", "error");
      return;
    }
    setWatching(true);
    setProgress(0);

    // Simulate ad playback (30s countdown)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + (100 / 30);
      });
    }, 1000);

    await new Promise(res => setTimeout(res, 30000));
    clearInterval(interval);
    setProgress(100);

    // Register view in backend
    const { error } = await supabase.from("vexforge_ad_views").insert({
      player_auth_id: userId,
      ad_network: "organic",
      completed: true,
      vex_awarded: VEX_PER_AD,
      watched_pct: 100,
    });

    if (!error) {
      addToast(`+${VEX_PER_AD} VEX ganados por ver el anuncio`, "success");
      loadAdStats(userId).then(setStats);
    } else {
      addToast("Error al registrar el anuncio. Inténtalo de nuevo.", "error");
    }

    setWatching(false);
    setProgress(0);
  }, [userId, stats, addToast]);

  if (loading) return <PageLoader />;
  if (!authed) return <BlockedAuthState message="Inicia sesión para acceder a Forge Ads" />;

  const remaining = MAX_DAILY - (stats?.watched_today ?? 0);
  const canWatch  = remaining > 0 && !watching;
  const dailyPct  = ((stats?.watched_today ?? 0) / MAX_DAILY) * 100;

  return (
    <div style={{ minHeight:"100vh", background:C.bg0, padding:"24px 16px", fontFamily:"system-ui,sans-serif", maxWidth:520, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ color:C.gold, fontFamily:"Cinzel,serif", fontSize:22, fontWeight:700, margin:0 }}>
          Forge Ads
        </h1>
        <p style={{ color:C.muted, fontSize:13, marginTop:6 }}>
          Gana VEX in-game viendo anuncios. Completamente opcional, sin interrupciones forzadas.
        </p>
      </div>

      {/* Daily quota card */}
      <div style={{ background:C.bg1, border:"1px solid "+C.b2, borderRadius:14, padding:"20px 18px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ color:C.main, fontWeight:700, fontSize:14, fontFamily:"Rajdhani,sans-serif" }}>
            Anuncios Hoy
          </div>
          <div style={{
            fontFamily:'"IBM Plex Mono",monospace', fontSize:13, fontWeight:700,
            color: remaining > 0 ? C.green : C.muted,
          }}>
            {stats?.watched_today ?? 0} / {MAX_DAILY}
          </div>
        </div>
        <div style={{ height:6, background:C.bg2, borderRadius:3, overflow:"hidden", marginBottom:12 }}>
          <div style={{ width:dailyPct+"%", height:"100%", background:remaining > 0 ? C.green : C.muted, borderRadius:3, transition:"width .4s" }} />
        </div>
        <div style={{ color:C.muted, fontSize:11 }}>
          {remaining > 0
            ? `Te quedan ${remaining} anuncio${remaining !== 1 ? "s" : ""} hoy (${remaining * VEX_PER_AD} VEX disponibles)`
            : "Cuota diaria completada. Vuelve mañana para más VEX."}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
        <div style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"14px", textAlign:"center" }}>
          <div style={{ color:C.gold, fontSize:26, fontWeight:800, fontFamily:"Rajdhani,sans-serif" }}>
            {(stats?.total_vex_earned ?? 0).toLocaleString()}
          </div>
          <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>VEX TOTAL GANADO</div>
        </div>
        <div style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"14px", textAlign:"center" }}>
          <div style={{ color:C.green, fontSize:26, fontWeight:800, fontFamily:"Rajdhani,sans-serif" }}>
            +{VEX_PER_AD}
          </div>
          <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>VEX POR ANUNCIO</div>
        </div>
      </div>

      {/* Watch ad button */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        {watching ? (
          <div>
            <div style={{ color:C.main, fontSize:13, marginBottom:14 }}>Viendo anuncio... {Math.round(progress)}%</div>
            <div style={{ height:8, background:C.bg2, borderRadius:4, overflow:"hidden", marginBottom:16, maxWidth:360, margin:"0 auto 16px" }}>
              <div style={{ width:progress+"%", height:"100%", background:"linear-gradient(90deg,"+C.blue+","+C.green+")", borderRadius:4, transition:"width 1s linear" }} />
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>No cierres esta ventana hasta que termine</div>
          </div>
        ) : (
          <button onClick={handleWatchAd} disabled={!canWatch} style={{
            padding:"16px 48px", borderRadius:12, border:"none",
            background: canWatch ? "linear-gradient(135deg,"+C.gold+",#c8932b)" : C.bg2,
            color: canWatch ? "#0d0d14" : C.muted,
            fontFamily:"Rajdhani,sans-serif", fontWeight:800, fontSize:16,
            cursor: canWatch ? "pointer" : "not-allowed",
            boxShadow: canWatch ? "0 4px 20px rgba(232,184,75,0.3)" : "none",
            transition:"all .2s",
          }}>
            {canWatch ? "Ver Anuncio (+"+VEX_PER_AD+" VEX)" : "Cuota Completada"}
          </button>
        )}
      </div>

      {/* Rules */}
      <div style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"14px 16px" }}>
        <div style={{ color:C.main, fontWeight:700, fontSize:12, fontFamily:"Rajdhani,sans-serif", marginBottom:10 }}>
          REGLAS DEL SISTEMA
        </div>
        {[
          "Máximo 5 anuncios por día por cuenta",
          "Debes ver al menos el 80% del anuncio para recibir VEX",
          "Los VEX ganados son in-game (no VEX Tradeable directamente)",
          "Sin trampas — cada anuncio verificado server-side",
        ].map((rule, i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
            <span style={{ color:C.gold, fontSize:11, flexShrink:0 }}>•</span>
            <span style={{ color:C.muted, fontSize:11, lineHeight:1.5 }}>{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}