import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Cosmetic {
id:string; code:string; name:string; cosmetic_type:string;
description:string; rarity:string; obtainable_via:string[]; metadata:Record<string,any>;
}
const RARITY_COLOR:Record<string,string>={Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444"};
const TYPE_ICON:Record<string,string>={card_frame:"🖼️",board_skin:"🎮",avatar:"👤",title:"📛",card_back:"🔄",emote:"😄",clan_banner:"🏳️"};
const TYPE_LABEL:Record<string,string>={card_frame:"Marco de Carta",board_skin:"Tablero",avatar:"Avatar",title:"Título",card_back:"Reverso",emote:"Emote",clan_banner:"Banner de Clan"};

export function CosmeticsRoute() {
const [cosmetics,setCosmetics] = useState<Cosmetic[]>([]);
const [mine,setMine] = useState<Set<string>>(new Set());
const [loading,setLoading] = useState(true);
const [filter,setFilter] = useState("all");

useEffect(()=>{
  (async()=>{
    const [{data:all},{data:{session}}] = await Promise.all([
      supabase.from("cosmetics").select("*").eq("active",true).order("rarity").order("name"),
      supabase.auth.getSession(),
    ]);
    setCosmetics((all??[]) as Cosmetic[]);
    if(session){
      const {data:pd} = await supabase.from("players").select("id").eq("auth_user_id",session.user.id).maybeSingle();
      if(pd?.id){
        const {data:pc} = await supabase.from("player_cosmetics").select("cosmetic_id").eq("player_id",pd.id);
        setMine(new Set((pc??[]).map((x:any)=>x.cosmetic_id)));
      }
    }
    setLoading(false);
  })();
},[]);

const types = ["all",...Array.from(new Set(cosmetics.map(c=>c.cosmetic_type)))];
const filtered = filter==="all"?cosmetics:cosmetics.filter(c=>c.cosmetic_type===filter);

return (
  <main style={{maxWidth:960,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 4px"}}>✨ Cosméticos</h1>
      <p style={{color:"#888",margin:0,fontSize:12}}>Marcos, tableros, avatares y más. Personaliza tu experiencia sin afectar el gameplay.</p>
    </div>
    {/* Type filter */}
    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {types.map(t=>(
        <button key={t} onClick={()=>setFilter(t)} style={{
          padding:"5px 12px",borderRadius:16,border:"none",fontSize:10,fontWeight:700,cursor:"pointer",
          background:filter===t?"#e8b84bcc":"#1a1a2e",color:filter===t?"#0a0a12":"#888",
        }}>{t==="all"?"TODOS":(TYPE_ICON[t]??" ")+" "+(TYPE_LABEL[t]??t).toUpperCase()}</button>
      ))}
    </div>
    {loading&&<p style={{color:"#666"}}>Cargando cosméticos…</p>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
      {filtered.map(c=>{
        const rc=RARITY_COLOR[c.rarity]??"#888";
        const owned=mine.has(c.id);
        return (
          <div key={c.id} style={{background:"linear-gradient(145deg,#1a1a2e,#12121a)",border:`1px solid ${owned?"#3ddc8444":rc+"33"}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:28}}>{TYPE_ICON[c.cosmetic_type]??"✨"}</span>
              <span style={{background:`${rc}22`,color:rc,fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:10}}>{c.rarity.toUpperCase()}</span>
            </div>
            <div style={{color:"#e8e8f0",fontFamily:"Cinzel,serif",fontSize:13,fontWeight:700,marginBottom:4}}>{c.name}</div>
            <div style={{color:"#555",fontSize:11,marginBottom:8,lineHeight:1.4}}>{c.description}</div>
            <div style={{color:"#444",fontSize:10,marginBottom:10}}>
              {(TYPE_LABEL[c.cosmetic_type]??"Cosmético").toUpperCase()}
            </div>
            <div style={{fontSize:10,color:owned?"#3ddc84":"#555",fontWeight:700}}>
              {owned?"✓ En tu colección":"🔒 No obtenido"}
            </div>
            {c.obtainable_via?.length>0&&(
              <div style={{marginTop:6,color:"#333",fontSize:9}}>
                Vía: {c.obtainable_via.join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </main>
);
}