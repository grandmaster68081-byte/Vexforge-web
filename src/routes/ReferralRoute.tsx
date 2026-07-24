// ReferralRoute — AN — chat86 — Sistema de Referidos VEXFORGE
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

interface Referral {
  id: string;
  referred_display_name: string | null;
  status: string;
  reward_granted: boolean;
  created_at: string;
}

interface ReferralStats {
  referral_code: string | null;
  total_referrals: number;
  pending: number;
  completed: number;
  vex_earned: number;
}

async function loadReferralData(): Promise<{ stats: ReferralStats; referrals: Referral[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NOT_AUTHED");

  const { data: player } = await supabase
    .from("players")
    .select("referral_code")
    .eq("auth_user_id", session.user.id)
    .single();

  const { data: refs } = await supabase
    .from("vexforge_referrals")
    .select("id, referred_display_name, status, reward_granted, created_at")
    .eq("referrer_auth_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const referrals: Referral[] = refs ?? [];
  const completed = referrals.filter(r => r.status === "completed").length;
  const pending   = referrals.filter(r => r.status === "pending").length;
  const vex_earned = completed * 100;

  return {
    stats: {
      referral_code: player?.referral_code ?? null,
      total_referrals: referrals.length,
      pending,
      completed,
      vex_earned,
    },
    referrals,
  };
}

export function ReferralRoute() {
  const { addToast } = useToast();
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      if (!session) { setLoading(false); return; }
      loadReferralData()
        .then(d => { setStats(d.stats); setReferrals(d.referrals); })
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  const handleCopy = useCallback(() => {
    if (!stats?.referral_code) return;
    const url = `${window.location.origin}?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      addToast("¡Link de referido copiado!", "success");
      setTimeout(() => setCopied(false), 2500);
    });
  }, [stats, addToast]);

  if (loading) return <PageLoader />;
  if (!authed) return <BlockedAuthState message="Inicia sesión para acceder a tu sistema de referidos" />;

  const refUrl = stats?.referral_code ? `${window.location.origin}?ref=${stats.referral_code}` : null;

  return (
    <div style={{ minHeight:"100vh", background:C.bg0, padding:"24px 16px", fontFamily:"system-ui,sans-serif", maxWidth:640, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ color:C.gold, fontFamily:"Cinzel,serif", fontSize:22, fontWeight:700, margin:0 }}>Red de Referidos</h1>
        <p style={{ color:C.muted, fontSize:13, marginTop:6 }}>
          Invita jugadores y gana VEX. Tú recibes <span style={{color:C.green}}>100 VEX</span> por referido completado.
          Ellos reciben <span style={{color:C.green}}>50 VEX</span> al registrarse.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Total Referidos", value: stats?.total_referrals ?? 0, color: C.blue },
          { label:"Completados",    value: stats?.completed ?? 0,         color: C.green },
          { label:"VEX Ganados",    value: (stats?.vex_earned ?? 0).toLocaleString(), color: C.gold },
        ].map(card => (
          <div key={card.label} style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ color:card.color, fontSize:24, fontWeight:800, fontFamily:"Rajdhani,sans-serif" }}>{card.value}</div>
            <div style={{ color:C.muted, fontSize:10, marginTop:3, fontFamily:'"IBM Plex Mono",monospace' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div style={{ background:C.bg1, border:"1px solid "+C.b2, borderRadius:12, padding:"18px 16px", marginBottom:24 }}>
        <div style={{ color:C.main, fontWeight:700, fontSize:13, fontFamily:"Rajdhani,sans-serif", marginBottom:10 }}>
          TU LINK DE REFERIDO
        </div>
        {refUrl ? (
          <>
            <div style={{
              background:C.bg0, border:"1px solid "+C.b1, borderRadius:8, padding:"10px 14px",
              fontFamily:'"IBM Plex Mono",monospace', fontSize:11, color:C.blue,
              wordBreak:"break-all", marginBottom:10,
            }}>
              {refUrl}
            </div>
            <button onClick={handleCopy} style={{
              width:"100%", padding:"11px", borderRadius:8,
              background:copied ? C.green+"33" : C.gold+"22",
              color:copied ? C.green : C.gold,
              fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:14,
              cursor:"pointer", border:`1px solid ${copied ? C.green : C.gold}44`,
              transition:"all .2s",
            }}>
              {copied ? "COPIADO" : "COPIAR LINK"}
            </button>
          </>
        ) : (
          <div style={{ color:C.muted, fontSize:12 }}>Generando tu código único...</div>
        )}
      </div>

      {/* How it works */}
      <div style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:12, padding:"16px", marginBottom:24 }}>
        <div style={{ color:C.main, fontWeight:700, fontSize:12, fontFamily:"Rajdhani,sans-serif", marginBottom:12, letterSpacing:"0.05em" }}>
          CÓMO FUNCIONA
        </div>
        {[
          { step:"1", text:"Comparte tu link único con amigos" },
          { step:"2", text:"Ellos se registran usando tu link (+50 VEX para ellos)" },
          { step:"3", text:"Recibes 100 VEX in-game al completarse el registro" },
          { step:"4", text:"Recibes 5% del primer pack que compren (en VEX in-game)" },
        ].map(s => (
          <div key={s.step} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:C.gold+"22", border:"1px solid "+C.gold+"44",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              color:C.gold, fontSize:10, fontWeight:700, fontFamily:'"IBM Plex Mono",monospace', }}>
              {s.step}
            </div>
            <div style={{ color:C.main, fontSize:12, lineHeight:1.5 }}>{s.text}</div>
          </div>
        ))}
        <div style={{ color:C.muted, fontSize:10, marginTop:10, borderTop:"1px solid "+C.b1, paddingTop:10 }}>
          Máximo 50 referidos por jugador. Las recompensas son VEX in-game, no VEX Tradeable.
        </div>
      </div>

      {/* Referrals list */}
      <div>
        <div style={{ color:C.main, fontWeight:700, fontSize:13, fontFamily:"Rajdhani,sans-serif", marginBottom:12 }}>
          HISTORIAL ({referrals.length})
        </div>
        {referrals.length === 0 ? (
          <div style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"24px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
            <div style={{ color:C.muted, fontSize:12 }}>Aún no has referido a nadie.</div>
            <div style={{ color:C.muted, fontSize:11, marginTop:4 }}>Comparte tu link para empezar.</div>
          </div>
        ) : referrals.map(ref => (
          <div key={ref.id} style={{
            background:C.bg1, border:"1px solid "+C.b1, borderRadius:10, padding:"12px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8,
          }}>
            <div>
              <div style={{ color:C.main, fontWeight:700, fontSize:13, fontFamily:"Rajdhani,sans-serif" }}>
                {ref.referred_display_name ?? "Jugador"}
              </div>
              <div style={{ color:C.muted, fontSize:10, marginTop:2 }}>
                {new Date(ref.created_at).toLocaleDateString("es-MX")}
              </div>
            </div>
            <div style={{
              padding:"4px 12px", borderRadius:99, fontSize:10, fontWeight:700,
              background:ref.status === "completed" ? C.green+"18" : C.gold+"18",
              color:ref.status === "completed" ? C.green : C.gold,
              border:`1px solid ${ref.status === "completed" ? C.green : C.gold}44`,
              fontFamily:'"IBM Plex Mono",monospace',
            }}>
              {ref.status === "completed" ? "Completado +100 VEX" : "Pendiente"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}