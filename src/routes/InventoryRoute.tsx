import { useState, useEffect, useCallback } from "react";
import { getPlayerCollection, type PlayerCard } from "../domains/inventory/repository";

const RARITY_COLOR: Record<string,string> = {
Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444",
};
const FACTION_COLOR: Record<string,string> = {
Guerrero:"#e85d04",Mago:"#4a9eff","Paladín":"#e8b84b",Pícaro:"#a855f7",
};
const RARITY_ORDER = ["Mythic","Legendary","Epic","Rare","Uncommon","Common"];

function CollectionCard({ card }: { card: PlayerCard }) {
const rc = RARITY_COLOR[card.rarity] ?? "#8b8b9e";
const fc = FACTION_COLOR[card.faction] ?? "#888";
const keywords: string[] = card.synergy_json?.keywords ?? [];
return (
  <div style={{
    background:"linear-gradient(160deg,#1a1a2e,#12121a)",
    border:`1.5px solid ${rc}44`,borderRadius:10,overflow:"hidden",
    boxShadow:`0 0 10px ${rc}18`,position:"relative",
  }}>
    {card.image_url ? (
      <img src={card.image_url} alt={card.name}
        style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}
        onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
    ) : (
      <div style={{width:"100%",aspectRatio:"3/4",background:`${rc}18`,display:"flex",
        alignItems:"center",justifyContent:"center",fontSize:32}}>
        {card.faction==="Guerrero"?"⚔️":card.faction==="Mago"?"🔮":card.faction==="Paladín"?"🛡️":"🗡️"}
      </div>
    )}
    {card.quantity > 1 && (
      <span style={{position:"absolute",top:6,right:6,background:rc,color:"#0a0a12",
        borderRadius:10,fontSize:9,fontWeight:800,padding:"2px 6px"}}>×{card.quantity}</span>
    )}
    <div style={{padding:"8px 10px"}}>
      <div style={{color:rc,fontSize:8,fontWeight:700,letterSpacing:1,marginBottom:2}}>{card.rarity.toUpperCase()}</div>
      <div style={{color:"#e8e8f0",fontFamily:"Cinzel,serif",fontSize:11,fontWeight:700,marginBottom:3,
        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.name}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{color:fc,fontSize:9}}>{card.faction}</span>
        <span style={{color:"#e8b84b",fontSize:9}}>⚡{card.power}</span>
      </div>
      {keywords.length>0 && (
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {keywords.slice(0,3).map(k=>(
            <span key={k} style={{background:`${rc}22`,color:rc,fontSize:7,padding:"1px 4px",
              borderRadius:4,fontWeight:700}}>{k}</span>
          ))}
        </div>
      )}
    </div>
  </div>
);
}

export function InventoryRoute() {
const [cards, setCards] = useState<PlayerCard[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string|null>(null);
const [faction, setFaction] = useState("all");
const [rarity, setRarity] = useState("all");
const [search, setSearch] = useState("");

const load = useCallback(async () => {
  setLoading(true);
  const res = await getPlayerCollection();
  if (res.data) setCards(res.data);
  setError(res.reason ?? null);
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

const factions = ["all", "Guerrero", "Mago", "Paladín", "Pícaro"];

const filtered = cards
  .filter(c => faction==="all" || c.faction===faction)
  .filter(c => rarity==="all" || c.rarity===rarity)
  .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  .sort((a,b) => {
    const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return ri !== 0 ? ri : b.power - a.power;
  });

const totalUnique = cards.length;
const totalCards = cards.reduce((s,c) => s+c.quantity, 0);

return (
  <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 4px"}}>🃏 Mi Colección</h1>
      <p style={{color:"#888",margin:0,fontSize:12}}>{totalUnique} cartas únicas · {totalCards} cartas totales</p>
    </div>

    {error && <div style={{background:"#2a1a1a",border:"1px solid #ff6b6b33",borderRadius:8,padding:"10px 14px",color:"#ff6b6b",marginBottom:16}}>{error}</div>}

    {/* Filters */}
    <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar carta…"
        style={{background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:7,padding:"7px 12px",
          color:"#e8e8f0",fontSize:12,outline:"none",width:160}}/>
      <div style={{display:"flex",gap:4}}>
        {factions.map(f=>(
          <button key={f} onClick={()=>setFaction(f)} style={{
            padding:"5px 10px",borderRadius:16,border:"none",fontSize:10,fontWeight:700,cursor:"pointer",
            background:faction===f?(FACTION_COLOR[f]??"#e8b84b")+"cc":"#1a1a2e",
            color:faction===f?"#0a0a12":"#888",
          }}>{f==="all"?"TODOS":f.toUpperCase()}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:4}}>
        {["all","Mythic","Legendary","Epic","Rare"].map(r=>(
          <button key={r} onClick={()=>setRarity(r)} style={{
            padding:"5px 10px",borderRadius:16,border:"none",fontSize:10,fontWeight:700,cursor:"pointer",
            background:rarity===r?(RARITY_COLOR[r]??"#e8b84b")+"cc":"#1a1a2e",
            color:rarity===r?"#0a0a12":"#888",
          }}>{r==="all"?"TODA":r.toUpperCase()}</button>
        ))}
      </div>
    </div>

    {loading && <p style={{color:"#666",textAlign:"center",padding:40}}>Cargando colección…</p>}

    {!loading && cards.length===0 && (
      <div style={{textAlign:"center",padding:60,background:"#1a1a2e",borderRadius:12}}>
        <div style={{fontSize:48,marginBottom:12}}>📦</div>
        <p style={{color:"#555",margin:0}}>Tu colección está vacía. Abre packs para obtener tus primeras cartas.</p>
      </div>
    )}

    {!loading && filtered.length===0 && cards.length>0 && (
      <p style={{color:"#555",textAlign:"center"}}>No se encontraron cartas con ese filtro.</p>
    )}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
      {filtered.map(c => <CollectionCard key={c.player_card_id} card={c}/>)}
    </div>
  </main>
);
}