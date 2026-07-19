import { useState, useEffect, useCallback } from "react";
import { getPlayerCollection, type PlayerCard } from "../domains/inventory/repository";
import { supabase } from "../lib/supabase";

const RARITY_COLOR: Record<string,string> = {
Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444",
};
const RARITY_ORDER = ["Mythic","Legendary","Epic","Rare","Uncommon","Common"];

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_fusion.jpg";

interface FusionResult { ok: boolean; reason?: string; new_card_id?: string; new_card_name?: string; new_rarity?: string; }

function CardPicker({ label, selected, onSelect, onClear, cards }:
{ label:string; selected:PlayerCard|null; onSelect:(c:PlayerCard)=>void; onClear:()=>void; cards:PlayerCard[] }) {
const [open, setOpen] = useState(false);
const rc = selected ? (RARITY_COLOR[selected.rarity]??"#888") : "#e8b84b";
if (!selected) return (
  <div style={{flex:1,minWidth:140}}>
    <div style={{color:"#555",fontSize:10,marginBottom:6}}>{label}</div>
    <button onClick={()=>setOpen(o=>!o)} style={{
      width:"100%",padding:"30px 0",borderRadius:10,border:"2px dashed #2a2a3a",
      background:"#1a1a2e",color:"#555",fontSize:12,cursor:"pointer",
    }}>+ Seleccionar carta</button>
    {open && (
      <div style={{position:"absolute",zIndex:100,background:"#1a1a2e",border:"1px solid #2a2a3a",
        borderRadius:10,maxHeight:320,overflowY:"auto",width:280,marginTop:4,padding:10}}>
        {cards.filter(c=>c.fusion_enabled&&c.quantity>0).map(c=>(
          <div key={c.player_card_id} onClick={()=>{onSelect(c);setOpen(false);}} style={{
            padding:"8px 10px",borderRadius:7,cursor:"pointer",marginBottom:4,
            border:`1px solid ${RARITY_COLOR[c.rarity]??"#888"}33`,
            background:"#12121a",
          }}>
            <div style={{color:RARITY_COLOR[c.rarity]??"#888",fontSize:9,fontWeight:700}}>{c.rarity}</div>
            <div style={{color:"#e8e8f0",fontSize:12,fontWeight:700}}>{c.name}</div>
            <div style={{color:"#555",fontSize:10}}>{c.faction} · ⚡{c.power} · ×{c.quantity}</div>
          </div>
        ))}
      </div>
    )}
  </div>
);
return (
  <div style={{flex:1,minWidth:140,position:"relative"}}>
    <div style={{color:"#555",fontSize:10,marginBottom:6}}>{label}</div>
    <div style={{background:`${rc}12`,border:`1.5px solid ${rc}66`,borderRadius:10,padding:16}}>
      <div style={{color:rc,fontSize:9,fontWeight:700,marginBottom:4}}>{selected.rarity.toUpperCase()}</div>
      <div style={{color:"#e8e8f0",fontFamily:"Cinzel,serif",fontSize:13,fontWeight:700,marginBottom:4}}>{selected.name}</div>
      <div style={{color:"#888",fontSize:10,marginBottom:8}}>{selected.faction} · ⚡{selected.power}</div>
      <button onClick={onClear} style={{background:"none",border:"1px solid #2a2a3a",borderRadius:6,
        color:"#555",fontSize:10,padding:"4px 10px",cursor:"pointer",width:"100%"}}>✕ Quitar</button>
    </div>
  </div>
);
}

export function FusionRoute() {
const [myCards, setMyCards] = useState<PlayerCard[]>([]);
const [loading, setLoading] = useState(true);
const [cardA, setCardA] = useState<PlayerCard|null>(null);
const [cardB, setCardB] = useState<PlayerCard|null>(null);
const [fusing, setFusing] = useState(false);
const [result, setResult] = useState<FusionResult|null>(null);
const [playerId, setPlayerId] = useState<string|null>(null);

const loadCards = useCallback(async () => {
  setLoading(true);
  const res = await getPlayerCollection();
  if (res.data) setMyCards(res.data.filter(c=>c.fusion_enabled));
  setLoading(false);
}, []);

useEffect(() => {
  loadCards();
  supabase.auth.getSession().then(({data:{session}}) => {
    if (!session) return;
    supabase.from("players").select("id").eq("auth_user_id",session.user.id).maybeSingle()
      .then(({data})=>setPlayerId(data?.id??null));
  });
}, [loadCards]);

const canFuse = cardA && cardB && cardA.player_card_id !== cardB.player_card_id && playerId;
const fusionCost = cardA && cardB
  ? (RARITY_ORDER.indexOf(cardA.rarity)+1 + RARITY_ORDER.indexOf(cardB.rarity)+1) * 50
  : 0;

const handleFuse = async () => {
  if (!canFuse) return;
  setFusing(true); setResult(null);
  const { data, error } = await supabase.rpc("vexforge_apply_fusion", {
    p_player_id: playerId,
    p_source_card_id: cardA.card_id,
    p_target_card_id: cardB.card_id,
  });
  if (error) { setResult({ok:false,reason:error.message}); }
  else { setResult(data as FusionResult); if((data as FusionResult).ok){setCardA(null);setCardB(null);loadCards();} }
  setFusing(false);
};

const availableForB = myCards.filter(c => !cardA || c.player_card_id!==cardA.player_card_id);
const availableForA = myCards.filter(c => !cardB || c.player_card_id!==cardB.player_card_id);

return (
  <main style={{
    minHeight:"100vh",background:`linear-gradient(rgba(10,10,18,0.88),rgba(10,10,18,0.97)),url('${BG_URL}') center/cover no-repeat fixed`,
  }}>
    <div style={{maxWidth:700,margin:"0 auto",padding:"40px 16px"}}>
      <div style={{marginBottom:28}}>
        <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 6px"}}>⚗️ Sala de Fusión</h1>
        <p style={{color:"#888",margin:0,fontSize:12}}>Combina dos cartas para crear una más poderosa. Las cartas fusionables tienen el keyword Forge.</p>
      </div>

      {loading && <p style={{color:"#666"}}>Cargando cartas fusionables…</p>}
      {!loading && myCards.length===0 && (
        <div style={{textAlign:"center",padding:50,background:"#1a1a2e",borderRadius:12}}>
          <div style={{fontSize:40,marginBottom:12}}>⚗️</div>
          <p style={{color:"#555"}}>No tienes cartas con Forge activado. Abre packs para obtener cartas fusionables.</p>
        </div>
      )}

      {!loading && myCards.length>0 && (
        <div>
          {/* Card selectors */}
          <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap",position:"relative"}}>
            <CardPicker label="Carta A (fuente)" selected={cardA} onSelect={setCardA} onClear={()=>setCardA(null)} cards={availableForA}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#e8b84b",flexShrink:0,paddingTop:24}}>+</div>
            <CardPicker label="Carta B (material)" selected={cardB} onSelect={setCardB} onClear={()=>setCardB(null)} cards={availableForB}/>
          </div>

          {/* Fusion preview */}
          {cardA && cardB && (
            <div style={{background:"#1a1a2e",border:"1px solid #e8b84b33",borderRadius:12,padding:20,marginBottom:20}}>
              <div style={{color:"#e8b84b",fontSize:12,fontWeight:700,marginBottom:8}}>Fusión prevista</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"#888",fontSize:11}}>Coste estimado</span>
                <span style={{color:"#e8b84b",fontWeight:700,fontSize:13}}>{fusionCost} VEX</span>
              </div>
              <div style={{color:"#555",fontSize:11}}>
                {cardA.name} (⚡{cardA.power}) + {cardB.name} (⚡{cardB.power}) →
                <span style={{color:"#a855f7",fontWeight:700}}> resultado potenciado</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{
              background:result.ok?"#1a2a1a":"#2a1a1a",
              border:`1px solid ${result.ok?"#3ddc8433":"#ff6b6b33"}`,
              borderRadius:10,padding:"14px 18px",marginBottom:16,
            }}>
              {result.ok ? (
                <div>
                  <div style={{color:"#3ddc84",fontWeight:700,fontSize:14,marginBottom:4}}>✓ ¡Fusión exitosa!</div>
                  {result.new_card_name && <p style={{color:"#aaa",fontSize:12,margin:0}}>Obtuviste: <strong style={{color:"#e8b84b"}}>{result.new_card_name}</strong></p>}
                </div>
              ) : (
                <div style={{color:"#ff6b6b"}}>✗ {result.reason ?? "Fusión fallida"}</div>
              )}
            </div>
          )}

          <button onClick={handleFuse} disabled={!canFuse||fusing} style={{
            width:"100%",padding:"14px 0",borderRadius:10,border:"none",
            background:canFuse&&!fusing?"linear-gradient(135deg,#e8b84b,#c9901f)":"#2a2a3a",
            color:canFuse&&!fusing?"#0a0a12":"#555",
            fontWeight:800,fontSize:14,cursor:canFuse&&!fusing?"pointer":"not-allowed",
            fontFamily:"Cinzel,serif",letterSpacing:1,
          }}>{fusing?"Fusionando…":"⚗️ Forjar Fusión"}</button>
        </div>
      )}
    </div>
  </main>
);
}