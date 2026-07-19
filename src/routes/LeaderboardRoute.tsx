import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface RankEntry {
rank_position:number; player_id:string; display_name:string;
mmr:number; wins:number; losses:number; draws:number; win_rate:number; updated_at:string;
}

const TIER_THRESHOLDS = [
{name:"Mythic",   min:3000, color:"#ff4444", icon:"💎"},
{name:"Legend",   min:2400, color:"#e8b84b", icon:"⭐"},
{name:"Diamond",  min:2000, color:"#4a9eff", icon:"💠"},
{name:"Platinum", min:1600, color:"#a855f7", icon:"🔮"},
{name:"Gold",     min:1200, color:"#f59e0b", icon:"🥇"},
{name:"Silver",   min:800,  color:"#8b8b9e", icon:"🥈"},
{name:"Bronze",   min:0,    color:"#cd7f32", icon:"🥉"},
];
function getRank(mmr:number) {
return TIER_THRESHOLDS.find(t=>mmr>=t.min) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length-1];
}

const MEDAL = ["🥇","🥈","🥉"];

export function LeaderboardRoute() {
const [rows,setRows] = useState<RankEntry[]>([]);
const [loading,setLoading] = useState(true);
const [myId,setMyId] = useState<string|null>(null);

useEffect(()=>{
  (async()=>{
    const [{data:rankData},{data:{session}}] = await Promise.all([
      supabase.rpc("get_leaderboard",{p_limit:100}),
      supabase.auth.getSession(),
    ]);
    setRows((rankData??[]) as RankEntry[]);
    if(session){
      const {data:pd} = await supabase.from("players").select("id").eq("auth_user_id",session.user.id).maybeSingle();
      if(pd?.id) setMyId(pd.id);
    }
    setLoading(false);
  })();
},[]);

const myRow = rows.find(r=>r.player_id===myId);

return (
  <main style={{maxWidth:800,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <p style={{fontSize:11,letterSpacing:"0.14em",color:"#e8b84b",textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:8}}>─── Arena Global ───</p>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8e8f0",fontSize:26,margin:"0 0 4px"}}>⚔️ Clasificación</h1>
      <p style={{color:"#666",margin:0,fontSize:12}}>Los mejores Forjadores del servidor. MMR acumulado por victorias PvP.</p>
    </div>

    {/* Tiers legend */}
    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {TIER_THRESHOLDS.map(t=>(
        <div key={t.name} style={{background:"#1a1a2e",borderRadius:8,padding:"4px 10px",display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:12}}>{t.icon}</span>
          <span style={{color:t.color,fontSize:10,fontWeight:700}}>{t.name}</span>
          <span style={{color:"#444",fontSize:9}}>{t.min}+</span>
        </div>
      ))}
    </div>

    {/* My rank card */}
    {myRow && (
      <div style={{background:"linear-gradient(135deg,#1a2a1a,#12121a)",border:"1px solid #3ddc8444",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
        <p style={{color:"#3ddc84",fontSize:10,fontWeight:700,margin:"0 0 6px"}}>TU POSICIÓN</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{color:"#e8b84b",fontFamily:"Cinzel,serif",fontWeight:800,fontSize:18}}>#{myRow.rank_position}</span>
            <span style={{color:"#e8e8f0",marginLeft:10,fontFamily:"Cinzel,serif"}}>{myRow.display_name}</span>
            <span style={{color:getRank(myRow.mmr).color,marginLeft:8,fontSize:12}}>{getRank(myRow.mmr).icon} {getRank(myRow.mmr).name}</span>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:"#e8b84b",fontWeight:700,fontSize:18}}>{myRow.mmr} MMR</div>
            <div style={{color:"#555",fontSize:10}}>{myRow.wins}W · {myRow.losses}L · {myRow.win_rate}% WR</div>
          </div>
        </div>
      </div>
    )}

    {loading && <div style={{textAlign:"center",padding:40,color:"#666"}}>Cargando clasificación…</div>}

    {!loading && rows.length===0 && (
      <div style={{textAlign:"center",padding:60}}>
        <div style={{fontSize:40,marginBottom:12}}>⚔️</div>
        <p style={{color:"#555"}}>Todavía no hay jugadores clasificados. ¡Sé el primero en jugar PvP!</p>
      </div>
    )}

    {/* Table */}
    <div style={{background:"#12121a",border:"1px solid #2a2a3a",borderRadius:12,overflow:"hidden"}}>
      {rows.map((row,i)=>{
        const tier = getRank(row.mmr);
        const isMe = row.player_id===myId;
        return (
          <div key={row.player_id} style={{
            display:"grid",gridTemplateColumns:"48px 1fr 100px 120px 60px",alignItems:"center",
            padding:"12px 16px",borderBottom:"1px solid #1a1a2e",
            background:isMe?"#1a2a1a00":i%2===0?"transparent":"#0f0f1a22",
            boxShadow:isMe?"inset 0 0 0 1px #3ddc8433":"none",
          }}>
            <div style={{fontFamily:"Cinzel,serif",fontWeight:800,color:i<3?"#e8b84b":"#555",fontSize:i<3?16:13}}>
              {i<3?MEDAL[i]:`#${row.rank_position}`}
            </div>
            <div>
              <span style={{color:isMe?"#3ddc84":"#e8e8f0",fontWeight:700,fontSize:13}}>{row.display_name}</span>
              {isMe&&<span style={{color:"#3ddc84",fontSize:9,marginLeft:6}}>TÚ</span>}
              <div style={{color:tier.color,fontSize:10}}>{tier.icon} {tier.name}</div>
            </div>
            <div style={{color:"#e8b84b",fontWeight:700,fontSize:14,textAlign:"right"}}>{row.mmr}</div>
            <div style={{color:"#555",fontSize:11,textAlign:"center"}}>
              <span style={{color:"#3ddc84"}}>{row.wins}W</span> · <span style={{color:"#ff6b6b"}}>{row.losses}L</span>
            </div>
            <div style={{color:"#888",fontSize:11,textAlign:"right"}}>{row.win_rate}%</div>
          </div>
        );
      })}
    </div>
  </main>
);
}