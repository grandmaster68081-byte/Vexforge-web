import { useState, useEffect, useCallback } from "react";
import { listClans, getMyClan, joinClan, leaveClan, type Clan, type ClanMember } from "../domains/clans/repository";

const ROLE_BADGE: Record<string,string> = { leader:"👑 Líder", officer:"⚔️ Oficial", member:"🛡️ Miembro" };

function ClanCard({ clan, onJoin, joining }: { clan:Clan; onJoin:(id:string)=>void; joining:boolean }) {
return (
  <div style={{background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:10,padding:"16px 18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <div>
        <div style={{color:"#e8e8f0",fontFamily:"Cinzel,serif",fontSize:14,fontWeight:700}}>{clan.name}</div>
        <div style={{color:"#555",fontSize:10,marginTop:2}}>{clan.code}</div>
      </div>
      <span style={{color:"#e8b84b",fontWeight:700,fontSize:13}}>{clan.prestige.toLocaleString()} ✦</span>
    </div>
    {clan.metadata?.description && (
      <p style={{color:"#666",fontSize:11,margin:"0 0 10px",lineHeight:1.4}}>{clan.metadata.description}</p>
    )}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"#555",fontSize:10}}>Contribución: {clan.contribution_total.toLocaleString()} VEX</span>
      <button onClick={()=>onJoin(clan.id)} disabled={joining} style={{
        padding:"6px 14px",borderRadius:7,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",
        background:"linear-gradient(135deg,#e8b84b,#c9901f)",color:"#0a0a12",
        opacity:joining?0.6:1,
      }}>{joining?"Uniéndose…":"Unirse"}</button>
    </div>
  </div>
);
}

export function ClansRoute() {
const [clans, setClans] = useState<Clan[]>([]);
const [myClan, setMyClan] = useState<{clan:Clan;members:ClanMember[];my_role:string}|null>(null);
const [loading, setLoading] = useState(true);
const [joining, setJoining] = useState<string|null>(null);
const [msg, setMsg] = useState<string|null>(null);
const [tab, setTab] = useState<"mi_clan"|"directorio">("mi_clan");

const load = useCallback(async () => {
  setLoading(true);
  const [all, mine] = await Promise.all([listClans(), getMyClan()]);
  if (all.data) setClans(all.data);
  if (mine.data !== undefined) setMyClan(mine.data);
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

const handleJoin = async (clanId: string) => {
  setJoining(clanId); setMsg(null);
  const res = await joinClan(clanId);
  if (res.data?.ok) { setMsg("¡Te has unido al clan!"); await load(); }
  else setMsg(res.data?.reason ?? res.reason ?? "Error al unirse");
  setJoining(null);
};

const handleLeave = async () => {
  const res = await leaveClan();
  if (res.data?.ok) { setMsg("Has salido del clan."); setMyClan(null); await load(); }
  else setMsg(res.reason ?? "Error");
};

return (
  <main style={{maxWidth:800,margin:"0 auto",padding:"32px 16px"}}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 4px"}}>🏰 Clanes</h1>
      <p style={{color:"#888",margin:0,fontSize:12}}>Únete a un clan, contribuye y conquista.</p>
    </div>

    {msg && <div style={{background:msg.includes("!")?"#1a2a1a":"#2a1a1a",border:`1px solid ${msg.includes("!")?"#3ddc8433":"#ff6b6b33"}`,borderRadius:8,padding:"10px 14px",color:msg.includes("!")?"#3ddc84":"#ff6b6b",marginBottom:16}}>{msg}</div>}

    <div style={{display:"flex",gap:8,marginBottom:20}}>
      {(["mi_clan","directorio"] as const).map(t => (
        <button key={t} onClick={()=>setTab(t)} style={{
          padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",
          background:tab===t?"#e8b84b":"#1a1a2e",color:tab===t?"#0a0a12":"#888",
        }}>{t==="mi_clan"?"Mi Clan":"Directorio"}</button>
      ))}
    </div>

    {loading && <p style={{color:"#666"}}>Cargando…</p>}

    {!loading && tab==="mi_clan" && (
      myClan ? (
        <div>
          <div style={{background:"linear-gradient(145deg,#1a2a1a,#12121a)",border:"1px solid #3ddc8433",borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:18,fontWeight:700}}>{myClan.clan.name}</div>
                <div style={{color:"#555",fontSize:11,marginTop:2}}>{myClan.clan.code}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#e8b84b",fontWeight:700}}>{myClan.clan.prestige.toLocaleString()} ✦</div>
                <div style={{color:"#555",fontSize:10}}>{ROLE_BADGE[myClan.my_role]}</div>
              </div>
            </div>
            <div style={{borderTop:"1px solid #2a2a3a",paddingTop:12}}>
              <div style={{color:"#888",fontSize:11,marginBottom:8}}>Miembros ({myClan.members.length})</div>
              {myClan.members.slice(0,10).map(m => (
                <div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
                  <span style={{color:m.role==="leader"?"#e8b84b":"#aaa",fontSize:12}}>
                    {ROLE_BADGE[m.role]??m.role} {m.player_name ?? m.player_id.substring(0,8)}…
                  </span>
                  <span style={{color:"#555",fontSize:11}}>{m.contribution_accumulated.toLocaleString()} VEX</span>
                </div>
              ))}
            </div>
            {myClan.my_role !== "leader" && (
              <button onClick={handleLeave} style={{
                marginTop:14,padding:"7px 16px",borderRadius:7,border:"1px solid #ff6b6b44",
                background:"transparent",color:"#ff6b6b",fontSize:11,cursor:"pointer",
              }}>Salir del clan</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{textAlign:"center",padding:40,background:"#1a1a2e",borderRadius:12}}>
          <div style={{fontSize:40,marginBottom:12}}>🏰</div>
          <p style={{color:"#555",margin:"0 0 16px"}}>No perteneces a ningún clan. Únete desde el Directorio.</p>
          <button onClick={()=>setTab("directorio")} style={{
            padding:"8px 20px",borderRadius:8,border:"none",
            background:"linear-gradient(135deg,#e8b84b,#c9901f)",color:"#0a0a12",
            fontWeight:700,fontSize:13,cursor:"pointer",
          }}>Ver Directorio</button>
        </div>
      )
    )}

    {!loading && tab==="directorio" && (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {clans.length===0 && <p style={{color:"#555",textAlign:"center"}}>No hay clanes activos aún.</p>}
        {clans.map(c => (
          <ClanCard key={c.id} clan={c}
            onJoin={handleJoin} joining={joining===c.id}/>
        ))}
      </div>
    )}
  </main>
);
}