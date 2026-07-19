import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface EvoPath {
id:string; card_id:string; evolves_to_card_id:string;
cost_json:{vex_ingame:number;copies_required:number};
requirements_json:{level_required:number;pvp_wins:number;description:string};
from_name:string; from_rarity:string; from_faction:string;
to_name:string; to_rarity:string;
}
const RARITY_COLOR:Record<string,string>={Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444"};
const FACTION_COLOR:Record<string,string>={Guerrero:"#E84040",Mago:"#5B8BF5",Paladín:"#3DC96B",Pícaro:"#7B4FD4"};

export function EvolutionRoute() {
const [paths,setPaths] = useState<EvoPath[]>([]);
const [loading,setLoading] = useState(true);
const [filter,setFilter] = useState("all");
const [evolving,setEvolving] = useState<string|null>(null);
const [msg,setMsg] = useState<{ok:boolean;text:string}|null>(null);

useEffect(()=>{
  (async()=>{
    const {data} = await supabase.from("card_evolution_paths")
      .select(`id,card_id,evolves_to_card_id,cost_json,requirements_json,
        from:card_id(name,rarity,faction),
        to:evolves_to_card_id(name,rarity)`)
      .order("card_id");
    const shaped = (data??[]).map((r:any)=>({
      id:r.id, card_id:r.card_id, evolves_to_card_id:r.evolves_to_card_id,
      cost_json:r.cost_json, requirements_json:r.requirements_json,
      from_name:r.from?.name??"?", from_rarity:r.from?.rarity??"Common", from_faction:r.from?.faction??"?",
      to_name:r.to?.name??"?", to_rarity:r.to?.rarity??"Uncommon",
    }));
    setPaths(shaped as EvoPath[]);
    setLoading(false);
  })();
},[]);

const evolve = async (path:EvoPath) => {
  setEvolving(path.id); setMsg(null);
  const {data:{session}} = await supabase.auth.getSession();
  if(!session){setMsg({ok:false,text:"Inicia sesión para evolucionar cartas"});setEvolving(null);return;}
  const {data:pd} = await supabase.from("players").select("id").eq("auth_user_id",session.user.id).maybeSingle();
  if(!pd?.id){setMsg({ok:false,text:"Perfil no encontrado"});setEvolving(null);return;}
  const {data:res} = await supabase.rpc("vexforge_evolve_card",{p_card_id:path.card_id,p_player_id:pd.id});
  if((res as any)?.ok) setMsg({ok:true,text:`✓ ¡${path.from_name} evolucionó a ${path.to_name}!`});
  else setMsg({ok:false,text:(res as any)?.reason??"Error desconocido"});
  setEvolving(null);
};

const factions = ["all","Guerrero","Mago","Paladín","Pícaro"];
const filtered = filter==="all"?paths:paths.filter(p=>p.from_faction===filter);
const grouped: Record<string, EvoPath[]> = {};
filtered.forEach(p => { grouped[p.from_faction] = grouped[p.from_faction]||[]; grouped[p.from_faction].push(p); });

return (
  <main style={{maxWidth:960,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 4px"}}>🧬 Evolución de Cartas</h1>
      <p style={{color:"#888",margin:0,fontSize:12}}>Fusiona copias de una carta para obtener su evolución. Requiere nivel y victorias PvP.</p>
    </div>

    {msg&&<div style={{background:msg.ok?"#1a2a1a":"#2a1a1a",border:`1px solid ${msg.ok?"#3ddc8444":"#ff6b6b44"}`,borderRadius:8,padding:"10px 14px",marginBottom:16,color:msg.ok?"#3ddc84":"#ff6b6b",fontSize:12}}>{msg.text}<button onClick={()=>setMsg(null)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",marginLeft:8}}>✕</button></div>}

    {/* Faction filter */}
    <div style={{display:"flex",gap:6,marginBottom:24}}>
      {factions.map(f=>(
        <button key={f} onClick={()=>setFilter(f)} style={{
          padding:"6px 14px",borderRadius:16,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",
          background:filter===f?(f==="all"?"#e8b84b":(FACTION_COLOR[f]??"#e8b84b")):"#1a1a2e",
          color:filter===f?"#0a0a12":"#888",
        }}>{f==="all"?"TODAS":f.toUpperCase()}</button>
      ))}
    </div>

    {loading&&<p style={{color:"#666"}}>Cargando caminos de evolución…</p>}

    {Object.entries(grouped).map(([faction,fps])=>(
      <div key={faction} style={{marginBottom:32}}>
        <h2 style={{fontFamily:"Cinzel,serif",color:FACTION_COLOR[faction]??"#e8b84b",fontSize:16,marginBottom:12,borderBottom:`1px solid ${FACTION_COLOR[faction]??"#e8b84b"}33`,paddingBottom:6}}>
          {faction} ({fps.length} caminos)
        </h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {fps.map(path=>{
            const fc = FACTION_COLOR[path.from_faction]??"#888";
            const fr = RARITY_COLOR[path.from_rarity]??"#888";
            const tr = RARITY_COLOR[path.to_rarity]??"#888";
            return (
              <div key={path.id} style={{background:"linear-gradient(145deg,#1a1a2e,#12121a)",border:`1px solid ${fc}22`,borderRadius:10,padding:"16px"}}>
                {/* Card evolution chain */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{flex:1,background:"#0f0f1a",borderRadius:7,padding:"8px 10px",border:`1px solid ${fr}33`}}>
                    <div style={{color:fr,fontSize:8,fontWeight:700}}>{path.from_rarity.toUpperCase()}</div>
                    <div style={{color:"#e8e8f0",fontSize:12,fontWeight:700,fontFamily:"Cinzel,serif"}}>{path.from_name}</div>
                  </div>
                  <span style={{color:"#e8b84b",fontSize:18}}>→</span>
                  <div style={{flex:1,background:"#0f0f1a",borderRadius:7,padding:"8px 10px",border:`1px solid ${tr}44`}}>
                    <div style={{color:tr,fontSize:8,fontWeight:700}}>{path.to_rarity.toUpperCase()}</div>
                    <div style={{color:"#e8e8f0",fontSize:12,fontWeight:700,fontFamily:"Cinzel,serif"}}>{path.to_name}</div>
                  </div>
                </div>
                {/* Requirements */}
                <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  <span style={{color:"#555",fontSize:10}}>📋 ×{path.cost_json.copies_required} copias</span>
                  <span style={{color:"#e8b84b",fontSize:10}}>💎 {path.cost_json.vex_ingame} VEX</span>
                  <span style={{color:"#4a9eff",fontSize:10}}>Nv.{path.requirements_json.level_required}</span>
                  <span style={{color:"#a855f7",fontSize:10}}>⚔️ {path.requirements_json.pvp_wins} victorias</span>
                </div>
                <button onClick={()=>evolve(path)} disabled={evolving===path.id} style={{
                  width:"100%",padding:"8px 0",borderRadius:7,border:"none",
                  background:evolving===path.id?"#2a2a3a":`linear-gradient(135deg,${fc},${fc}88)`,
                  color:evolving===path.id?"#555":"#0a0a12",
                  fontWeight:700,fontSize:11,cursor:evolving===path.id?"not-allowed":"pointer",fontFamily:"Cinzel,serif",
                }}>{evolving===path.id?"Evolucionando…":"⚡ Evolucionar"}</button>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </main>
);
}