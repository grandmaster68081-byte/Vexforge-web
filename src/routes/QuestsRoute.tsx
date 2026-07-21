import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useDailyQuests } from "../domains/daily/useDailyQuests";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast } from "../shared/context/ToastContext";

    function QuestCard({ pq, onClaim, claiming }: { pq:any; onClaim:(id:string)=>void; claiming:boolean }) {
    const quest = pq.quest ?? pq;
    const pct = quest.target_count>0?Math.min(100,(pq.progress/quest.target_count)*100):0;
    const isComplete = pq.status==="completed";
    const isClaimed = pq.status==="claimed";
    return (
      <div style={{
        background:"#1a1a2e",border:`1px solid ${isComplete?"#e8b84b33":isClaimed?"#2a2a3a":"#2a2a3a"}`,
        borderRadius:10,padding:"16px 18px",opacity:isClaimed?0.6:1,
      }}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{color:"#e8e8f0",fontWeight:700,fontSize:13,fontFamily:"Cinzel,serif"}}>{quest.title}</div>
            <div style={{color:"#666",fontSize:11,marginTop:2}}>{quest.description}</div>
          </div>
          <span style={{
            padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,flexShrink:0,marginLeft:8,
            background:isClaimed?"#2a2a2a":isComplete?"#2a3a1a":"#1a1a2e",
            color:isClaimed?"#555":isComplete?"#3ddc84":"#888",
          }}>{isClaimed?"RECLAMADO":isComplete?"COMPLETO":"ACTIVO"}</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <span style={{color:"#e8b84b",fontSize:11}}>💎 {quest.reward_vex_ingame} VEX</span>
          <span style={{color:"#4a9eff",fontSize:11}}>⭐ {quest.reward_xp} XP</span>
        </div>
        <div style={{marginBottom:isComplete&&!isClaimed?12:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:"#555",fontSize:10}}>Progreso</span>
            <span style={{color:"#888",fontSize:10}}>{pq.progress}/{quest.target_count}</span>
          </div>
          <div style={{background:"#0f0f1a",borderRadius:4,height:6,overflow:"hidden"}}>
            <div style={{
              width:`${pct}%`,height:"100%",borderRadius:4,
              background:"linear-gradient(90deg,#e8b84b,#c9901f)",transition:"width .3s",
            }}/>
          </div>
        </div>
        {isComplete&&!isClaimed&&(
          <button onClick={()=>onClaim(pq.id)} disabled={claiming} style={{
            marginTop:10,width:"100%",padding:"9px 0",borderRadius:7,border:"none",
            background:"linear-gradient(135deg,#e8b84b,#c9901f)",
            color:"#0a0a12",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"Cinzel,serif",
          }}>{claiming?"Reclamando…":"¡Reclamar Recompensa!"}</button>
        )}
      </div>
    );
    }

    export function QuestsRoute() {
    const { quests, loading, error, claiming, claimMsg, claim } = useDailyQuests();
    const { addToast } = useToast();
    const [authed, setAuthed] = useState<boolean | null>(null);
    const today = new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
    const completed = quests.filter(q=>q.status==="completed"||q.status==="claimed").length;

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    }, []);

    // Show toast when claim succeeds or fails
    useEffect(() => {
      if (!claimMsg) return;
      const ok = claimMsg.includes("!") || claimMsg.includes("VEX") || claimMsg.includes("XP");
      addToast(ok ? "success" : "error", ok ? "¡Recompensa reclamada!" : "Error al reclamar", claimMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimMsg]);

    if (authed === null || loading) return <PageLoader />;
    if (!authed) return <BlockedAuthState message="Inicia sesión para ver tus misiones diarias." />;

    return (
      <main style={{maxWidth:640,margin:"0 auto",padding:"32px 16px"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:24,margin:"0 0 4px"}}>📜 Misiones Diarias</h1>
          <p style={{color:"#888",margin:0,fontSize:12}}>{today.charAt(0).toUpperCase()+today.slice(1)}</p>
        </div>
        {quests.length>0&&(
          <div style={{background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:"#888",fontSize:12}}>Progreso del día</span>
              <span style={{color:"#e8b84b",fontWeight:700,fontSize:12}}>{completed}/{quests.length}</span>
            </div>
            <div style={{background:"#0f0f1a",borderRadius:4,height:8,overflow:"hidden"}}>
              <div style={{
                width:`${quests.length>0?(completed/quests.length)*100:0}%`,
                height:"100%",background:"linear-gradient(90deg,#e8b84b,#c9901f)",transition:"width .3s",
              }}/>
            </div>
          </div>
        )}
        {error&&<p style={{color:"#ff6b6b",fontSize:13}}>{error}</p>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {quests.map(pq=>(
            <QuestCard key={pq.id} pq={pq}
              onClaim={claim}
              claiming={claiming===pq.id}
            />
          ))}
        </div>
        {!loading&&quests.length===0&&(
          <div style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:32,marginBottom:10}}>📜</div>
            <p style={{color:"#555"}}>No hay misiones diarias disponibles por el momento.</p>
          </div>
        )}
      </main>
    );
    }