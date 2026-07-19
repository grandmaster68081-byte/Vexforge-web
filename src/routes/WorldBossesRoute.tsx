import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface WorldBoss {
id: string; boss_code: string; name: string;
region_id: string | null; tier: string; power_level: number;
hp: number; reward_pool: Record<string,any>; active: boolean; metadata: Record<string,any>;
}

const TIER_COLOR:Record<string,string> = {
T1:"#8b8b9e",T2:"#3ddc84",T3:"#4a9eff",T4:"#a855f7",T5:"#e8b84b",T6:"#ff4444"
};

function BossCard({ boss }: { boss:WorldBoss }) {
const tc = TIER_COLOR[boss.tier]??"#8b8b9e";
const hpFormatted = boss.hp >= 1000000
  ? (boss.hp/1000000).toFixed(1)+"M"
  : boss.hp >= 1000 ? (boss.hp/1000).toFixed(0)+"K" : boss.hp.toString();
return (
  <div style={{
    background:"linear-gradient(145deg,#1a1a2e,#12121a)",
    border:`1px solid ${tc}33`,borderRadius:12,padding:20,
    boxShadow:`0 0 16px ${tc}22`,
  }}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
      <span style={{background:`${tc}22`,color:tc,padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700}}>
        {boss.tier}
      </span>
      <span style={{color:"#555",fontSize:10}}>{boss.region_id?.replace(/_/g," ").toUpperCase()}</span>
    </div>
    <h3 style={{fontFamily:"Cinzel,serif",color:"#e8e8f0",fontSize:16,margin:"0 0 6px"}}>{boss.name}</h3>
    <p style={{color:"#666",fontSize:12,margin:"0 0 12px",lineHeight:1.4}}>
      {boss.metadata?.lore ?? "Un enemigo formidable aguarda en las sombras."}
    </p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      <div style={{background:"#0f0f1a",borderRadius:7,padding:"8px 12px"}}>
        <div style={{color:"#555",fontSize:10,marginBottom:2}}>PODER</div>
        <div style={{color:tc,fontSize:16,fontWeight:700}}>{boss.power_level.toLocaleString()}</div>
      </div>
      <div style={{background:"#0f0f1a",borderRadius:7,padding:"8px 12px"}}>
        <div style={{color:"#555",fontSize:10,marginBottom:2}}>HP</div>
        <div style={{color:"#ff6b6b",fontSize:16,fontWeight:700}}>{hpFormatted}</div>
      </div>
    </div>
    <div style={{background:"#0f0f1a",borderRadius:7,padding:"10px 12px",marginBottom:12}}>
      <div style={{color:"#555",fontSize:10,marginBottom:4}}>RECOMPENSAS</div>
      <div style={{color:"#e8b84b",fontSize:12}}>💎 {boss.reward_pool?.vex_ingame ?? 0} VEX</div>
      {boss.reward_pool?.card_rarity&&(
        <div style={{color:"#aaa",fontSize:11,marginTop:2}}>🃏 Carta {boss.reward_pool.card_rarity} aleatoria</div>
      )}
      {boss.reward_pool?.bonus&&(
        <div style={{color:"#a855f7",fontSize:11,marginTop:2}}>✦ {boss.reward_pool.bonus}</div>
      )}
    </div>
    <button style={{
      width:"100%",padding:"10px 0",borderRadius:8,border:"none",
      background:`linear-gradient(135deg,${tc}cc,${tc}88)`,
      color:"#0a0a12",fontWeight:800,fontSize:12,cursor:"pointer",
      fontFamily:"Cinzel,serif",letterSpacing:1,
      opacity:0.9,
    }}>⚔️ Desafiar Boss</button>
  </div>
);
}

export function WorldBossesRoute() {
const [bosses,setBosses] = useState<WorldBoss[]>([]);
const [loading,setLoading] = useState(true);
const [filter,setFilter] = useState("all");

useEffect(()=>{
  supabase.from("world_bosses").select("*").eq("active",true).order("power_level").then(({data})=>{
    setBosses((data??[]) as WorldBoss[]);
    setLoading(false);
  });
},[]);

const tiers = ["all","T1","T2","T3","T4","T5","T6"];
const filtered = filter==="all"?bosses:bosses.filter(b=>b.tier===filter);

return (
  <main style={{maxWidth:960,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:28}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 6px"}}>🐉 World Bosses</h1>
      <p style={{color:"#888",margin:0,fontSize:13}}>Desafía a los titanes del mundo. Las recompensas escalan con la dificultad.</p>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
      {tiers.map(t=>(
        <button key={t} onClick={()=>setFilter(t)} style={{
          padding:"6px 14px",borderRadius:20,border:"none",
          background:filter===t?(TIER_COLOR[t]??"#e8b84b")+"cc":"#1a1a2e",
          color:filter===t?"#0a0a12":"#888",fontWeight:700,fontSize:11,cursor:"pointer",
        }}>{t==="all"?"TODOS":t}</button>
      ))}
    </div>
    {loading&&<p style={{color:"#666"}}>Cargando bosses…</p>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
      {filtered.map(b=><BossCard key={b.id} boss={b}/>)}
    </div>
  </main>
);
}