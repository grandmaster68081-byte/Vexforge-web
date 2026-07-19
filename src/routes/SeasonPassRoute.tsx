import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Tier { tier:number; xp_required:number; is_premium:boolean; reward:Record<string,any>; unlocked:boolean; }
interface SeasonData {
ok:boolean; season_name?:string; season_number?:number; end_at?:string;
player_xp?:number; current_tier?:number; is_premium?:boolean; tiers?:Tier[];
}

const RARITY_COLOR:Record<string,string>={Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444"};

export function SeasonPassRoute() {
const [data,setData] = useState<SeasonData|null>(null);
const [loading,setLoading] = useState(true);
const [tab,setTab] = useState<"free"|"premium">("free");

useEffect(()=>{
  (async()=>{
    const {data:{session}} = await supabase.auth.getSession();
    if(!session){setLoading(false);return;}
    const {data:pd} = await supabase.from("players").select("id").eq("auth_user_id",session.user.id).maybeSingle();
    if(!pd?.id){setLoading(false);return;}
    const {data:res} = await supabase.rpc("get_season_progress",{p_player_id:pd.id});
    setData(res as SeasonData);
    setLoading(false);
  })();
},[]);

if(loading) return <main style={{maxWidth:800,margin:"0 auto",padding:"40px 16px"}}><p style={{color:"#666"}}>Cargando Season Pass…</p></main>;
if(!data?.ok) return (
  <main style={{maxWidth:800,margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>🔒</div>
    <h2 style={{fontFamily:"Cinzel,serif",color:"#e8b84b"}}>Season Pass</h2>
    <p style={{color:"#666"}}>Inicia sesión para ver tu progreso de temporada.</p>
  </main>
);

const tiers = (data.tiers??[]).filter(t=>t.is_premium===( tab==="premium"));
const xp = data.player_xp??0;
const maxXp = 50*1000;
const pct = Math.min(100,(xp/maxXp)*100);
const daysLeft = data.end_at ? Math.max(0,Math.floor((new Date(data.end_at).getTime()-Date.now())/(1000*3600*24))) : 0;

return (
  <main style={{maxWidth:800,margin:"0 auto",padding:"32px 16px"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1a1a2e,#0a0a12)",border:"1px solid #e8b84b44",borderRadius:16,padding:28,marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <p style={{color:"#e8b84b",fontSize:10,letterSpacing:2,margin:"0 0 4px",fontFamily:"Rajdhani,sans-serif"}}>TEMPORADA {data.season_number}</p>
          <h1 style={{fontFamily:"Cinzel,serif",color:"#e8e8f0",fontSize:22,margin:0}}>{data.season_name}</h1>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"#555",fontSize:11}}>Termina en</div>
          <div style={{color:"#e8b84b",fontWeight:700,fontSize:16}}>{daysLeft} días</div>
        </div>
      </div>
      {/* XP bar */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{color:"#888",fontSize:11}}>XP de Temporada</span>
          <span style={{color:"#e8b84b",fontWeight:700,fontSize:11}}>{(xp??0).toLocaleString()} / {maxXp.toLocaleString()}</span>
        </div>
        <div style={{background:"#0f0f1a",borderRadius:6,height:12,overflow:"hidden",border:"1px solid #1a1a2e"}}>
          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#e8b84b,#c9901f)",transition:"width .5s"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:12}}>
        <span style={{color:"#888",fontSize:12}}>Tier actual: <strong style={{color:"#e8b84b"}}>{data.current_tier??0}</strong></span>
        <span style={{color:data.is_premium?"#a855f7":"#555",fontSize:12}}>
          {data.is_premium?"💜 Premium":"🆓 Gratis — Activa Premium para más recompensas"}
        </span>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      {(["free","premium"] as const).map(t=>(
        <button key={t} onClick={()=>setTab(t)} style={{
          padding:"8px 20px",borderRadius:8,border:"none",fontWeight:700,fontSize:12,cursor:"pointer",
          background:tab===t?(t==="premium"?"#a855f7":"#e8b84b"):"#1a1a2e",
          color:tab===t?"#0a0a12":"#888",
        }}>{t==="free"?"🆓 Gratis":"💜 Premium"}</button>
      ))}
    </div>

    {/* Tier grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
      {tiers.map(tier=>{
        const unlocked = tier.unlocked;
        const reward = tier.reward;
        const rc = reward.card_rarity ? (RARITY_COLOR[reward.card_rarity]??"#888") : "#e8b84b";
        return (
          <div key={tier.tier} style={{
            background:unlocked?"linear-gradient(145deg,#1a2a1a,#12121a)":"#1a1a2e",
            border:`1px solid ${unlocked?"#3ddc8444":"#2a2a3a"}`,
            borderRadius:8,padding:"12px 10px",textAlign:"center",
            opacity:unlocked?1:0.7,
          }}>
            <div style={{color:unlocked?"#3ddc84":"#555",fontSize:9,fontWeight:700,marginBottom:4}}>TIER {tier.tier}</div>
            <div style={{fontSize:20,marginBottom:4}}>
              {reward.type==="card"?"🃏":reward.type==="cosmetic"?"✨":"💎"}
            </div>
            {reward.vex_ingame&&<div style={{color:"#e8b84b",fontSize:10,fontWeight:700}}>{reward.vex_ingame} VEX</div>}
            {reward.card_rarity&&<div style={{color:rc,fontSize:9}}>{reward.card_rarity}</div>}
            {reward.type==="cosmetic"&&<div style={{color:"#a855f7",fontSize:9}}>Marco Exc.</div>}
            {unlocked&&<div style={{color:"#3ddc84",fontSize:8,marginTop:4}}>✓</div>}
          </div>
        );
      })}
    </div>
  </main>
);
}