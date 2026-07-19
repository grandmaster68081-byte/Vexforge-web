import { useDeck } from "../domains/deck/useDeck";
import type { PlayerCardEntry } from "../domains/deck/repository";

const RARITY_COLOR:Record<string,string> = {
Common:"#8b8b9e",Uncommon:"#3ddc84",Rare:"#4a9eff",
Epic:"#a855f7",Legendary:"#e8b84b",Mythic:"#ff4444",
};
const FACTION_COLOR:Record<string,string> = {
Guerrero:"#e85d04",Mago:"#4a9eff","Paladín":"#e8b84b",Pícaro:"#a855f7",
};

const RARITY_ORDER = ["Mythic","Legendary","Epic","Rare","Uncommon","Common"];

function MiniCard({ card, count, selected, onClick }: { card:PlayerCardEntry; count:number; selected:boolean; onClick:()=>void }) {
const rc = RARITY_COLOR[card.rarity]??"#8b8b9e";
return (
  <div onClick={onClick} style={{
    background:selected?`${rc}18`:"#1a1a2e",
    border:`1.5px solid ${selected?rc:rc+"33"}`,
    borderRadius:8, padding:"9px 11px", cursor:"pointer",
    transition:"all .12s ease",
    boxShadow:selected?`0 0 8px ${rc}33`:"none", position:"relative",
  }}>
    {count>0&&<span style={{
      position:"absolute",top:3,right:5,background:rc,color:"#0a0a12",
      borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px",
    }}>×{card.quantity}</span>}
    <div style={{color:rc,fontSize:8,fontWeight:700,letterSpacing:1,marginBottom:2}}>{card.rarity.toUpperCase()}</div>
    <div style={{color:"#e8e8f0",fontFamily:"Cinzel,serif",fontSize:11,fontWeight:700,lineHeight:1.3,marginBottom:2}}>{card.name}</div>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <span style={{color:FACTION_COLOR[card.faction]??"#888",fontSize:9}}>{card.faction}</span>
      <span style={{color:"#e8b84b",fontSize:9}}>⚡{card.power}</span>
    </div>
    {selected&&count>0&&<div style={{
      position:"absolute",top:-5,left:-5,background:rc,color:"#0a0a12",
      borderRadius:"50%",width:14,height:14,fontSize:9,fontWeight:900,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>×{count}</div>}
  </div>
);
}

function DeckStats({ selectedIds, myCards }: { selectedIds:string[]; myCards:PlayerCardEntry[] }) {
const counts:Record<string,number> = {};
const factions:Record<string,number> = {};
selectedIds.forEach(id => {
  const c = myCards.find(x=>x.card_id===id);
  if (!c) return;
  counts[c.rarity] = (counts[c.rarity]??0)+1;
  factions[c.faction] = (factions[c.faction]??0)+1;
});
const total = selectedIds.length;
const factionList = Object.entries(factions).sort((a,b)=>b[1]-a[1]);
const primaryFaction = factionList[0];
const isValid = total>=5 && total<=30 && Object.keys(factions).length<=2;
return (
  <div style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <span style={{color:"#888",fontSize:12}}>Cards</span>
      <span style={{color:isValid?"#3ddc84":"#ff6b6b",fontWeight:700,fontSize:14}}>{total}/30</span>
    </div>
    <div style={{background:"#0f0f1a",borderRadius:4,height:6,marginBottom:10,overflow:"hidden"}}>
      <div style={{width:`${Math.min(100,(total/30)*100)}%`,height:"100%",
        background:isValid?"linear-gradient(90deg,#3ddc84,#4a9eff)":"#ff6b6b",transition:"width .3s"}} />
    </div>
    <div style={{marginBottom:8}}>
      {RARITY_ORDER.filter(r=>counts[r]).map(r=>(
        <div key={r} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{color:RARITY_COLOR[r],fontSize:11}}>{r}</span>
          <span style={{color:"#aaa",fontSize:11}}>×{counts[r]}</span>
        </div>
      ))}
    </div>
    {factionList.length>0&&(
      <div style={{borderTop:"1px solid #1a1a2e",paddingTop:8,marginTop:4}}>
        <div style={{color:"#666",fontSize:10,marginBottom:4}}>Facciones</div>
        {factionList.map(([f,n])=>(
          <div key={f} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{color:FACTION_COLOR[f]??"#888",fontSize:11}}>{f}</span>
            <span style={{color:"#aaa",fontSize:11}}>{n}</span>
          </div>
        ))}
        {primaryFaction&&(
          <div style={{color:"#555",fontSize:10,marginTop:4}}>
            Facción primaria: {primaryFaction[0]} ({primaryFaction[1]} cartas)
          </div>
        )}
      </div>
    )}
  </div>
);
}

export function DeckBuilderRoute() {
const { myCards, selectedIds, loading, saving, error, saveMsg, validation, toggleCard, validate, save } = useDeck();

// Count copies of each card in deck
const deckCounts:Record<string,number> = {};
selectedIds.forEach(id => { deckCounts[id]=(deckCounts[id]??0)+1; });

const sorted = [...myCards].sort((a,b)=>{
  const ri = RARITY_ORDER.indexOf(a.rarity)-RARITY_ORDER.indexOf(b.rarity);
  return ri!==0?ri:b.power-a.power;
});

// Card can still be added if < 2 copies in deck (or < 1 for Legendary/Mythic)
const canAdd = (card:PlayerCardEntry) => {
  const inDeck = deckCounts[card.card_id]??0;
  const limit = ["Legendary","Mythic"].includes(card.rarity)?1:2;
  return inDeck < limit && selectedIds.length < 30;
};

return (
  <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:24,margin:"0 0 4px"}}>⚔️ Deck Builder</h1>
      <p style={{color:"#888",margin:0,fontSize:12}}>
        Formato Estándar: 5–30 cartas · Máx. 2 copias por carta · Máx. 1 Legendary/Mythic copy · Máx. 2 facciones
      </p>
    </div>

    {error&&<div style={{background:"#2a1a1a",border:"1px solid #ff6b6b33",borderRadius:8,padding:"10px 14px",color:"#ff6b6b",marginBottom:16}}>{error}</div>}

    <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
      {/* Card Collection */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#888",fontSize:12,marginBottom:10}}>
          Tu Colección ({myCards.length} cartas únicas)
        </div>
        {loading&&<p style={{color:"#666"}}>Cargando tus cartas…</p>}
        {!loading&&myCards.length===0&&(
          <div style={{background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:10,padding:24,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📦</div>
            <p style={{color:"#555",margin:0}}>Abre packs para obtener cartas y construir tu mazo.</p>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          {sorted.map(card=>{
            const inDeck = deckCounts[card.card_id]??0;
            const addable = canAdd(card);
            return (
              <div key={card.card_id} style={{opacity:!addable&&inDeck===0?0.4:1}}>
                <MiniCard
                  card={card} count={inDeck}
                  selected={inDeck>0}
                  onClick={()=>toggleCard(card.card_id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Deck Panel */}
      <div style={{width:220,flexShrink:0,position:"sticky",top:16}}>
        <div style={{background:"#12121a",border:"1px solid #2a2a3a",borderRadius:12,padding:18}}>
          <div style={{fontFamily:"Cinzel,serif",color:"#e8e8f0",fontSize:14,fontWeight:700,marginBottom:14}}>Mi Mazo</div>

          <DeckStats selectedIds={selectedIds} myCards={myCards} />

          {validation&&!validation.valid&&(
            <div style={{marginBottom:10}}>
              {validation.errors.map((e,i)=>(
                <p key={i} style={{color:"#ff6b6b",fontSize:10,margin:"2px 0"}}>⚠ {e}</p>
              ))}
            </div>
          )}
          {validation?.valid&&<p style={{color:"#3ddc84",fontSize:11,margin:"0 0 10px"}}>✓ Mazo válido</p>}
          {saveMsg&&<p style={{color:saveMsg.includes("aved")||saveMsg.includes("ardado")?"#3ddc84":"#ff6b6b",fontSize:11,margin:"0 0 10px"}}>{saveMsg}</p>}

          <button onClick={save} disabled={saving||selectedIds.length<5} style={{
            width:"100%",padding:"10px 0",borderRadius:8,border:"none",
            background:selectedIds.length>=5?"linear-gradient(135deg,#e8b84b,#c9901f)":"#2a2a3a",
            color:selectedIds.length>=5?"#0a0a12":"#555",
            fontWeight:800,fontSize:12,cursor:selectedIds.length>=5?"pointer":"not-allowed",
            fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:6,
          }}>{saving?"Guardando…":"Guardar Mazo"}</button>

          <button onClick={validate} style={{
            width:"100%",padding:"8px 0",borderRadius:7,
            border:"1px solid #2a2a3a",background:"transparent",
            color:"#888",fontSize:11,cursor:"pointer",marginBottom:12,
          }}>Validar</button>

          {/* Selected cards list */}
          {selectedIds.length>0&&(
            <div style={{borderTop:"1px solid #1a1a2e",paddingTop:10}}>
              <div style={{color:"#555",fontSize:10,marginBottom:6}}>Cartas seleccionadas</div>
              <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
                {Object.entries(deckCounts).map(([id,cnt])=>{
                  const card = myCards.find(c=>c.card_id===id);
                  if(!card) return null;
                  return (
                    <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:RARITY_COLOR[card.rarity]??"#888",fontSize:10,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {card.name.length>16?card.name.substring(0,15)+"…":card.name}
                        {cnt>1?<span style={{color:"#e8b84b",fontSize:9}}> ×{cnt}</span>:null}
                      </span>
                      <button onClick={()=>toggleCard(id)} style={{
                        background:"none",border:"none",color:"#ff4444",
                        cursor:"pointer",fontSize:12,padding:"0 2px",flexShrink:0,
                      }}>×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </main>
);
}