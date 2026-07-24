import { useState } from "react";
import { Link } from "react-router-dom";
import { useEconomy } from "../domains/economy/useEconomy";
import { usePublicStats } from "../domains/economy/usePublicStats";

// ── Design tokens ────────────────────────────────────────────────────────
const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30", b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#FF4B4B",
  blue:"#4A9EFF", purple:"#A855F7",
  muted:"#7a7a9a", dim:"#4a4a6a", main:"#e8e8f0",
  teal:"#14B8A6",
};

// ── Entry-type styling ───────────────────────────────────────────────────
const ENTRY_META: Record<string,{color:string; icon:string; label:string; sign:1|-1}> = {
  credit:          { color:C.green,  icon:"↑", label:"Crédito",         sign: 1 },
  debit:           { color:C.red,    icon:"↓", label:"Débito",          sign:-1 },
  reward:          { color:C.blue,   icon:"★", label:"Recompensa",      sign: 1 },
  deposit_credit:  { color:"#22c55e",icon:"⬆", label:"Depósito",        sign: 1 },
  pack_purchase:   { color:C.purple, icon:"📦",label:"Pack",            sign:-1 },
  pack_purchase_vex:{color:C.purple, icon:"📦",label:"Pack (VEX)",      sign:-1 },
  fee:             { color:"#f97316",icon:"◈", label:"Comisión",        sign:-1 },
  burn:            { color:"#ef4444",icon:"🔥",label:"Quemado",         sign:-1 },
  mission_reward:  { color:C.blue,   icon:"🎯",label:"Misión",          sign: 1 },
  quest_reward:    { color:C.blue,   icon:"📜",label:"Quest",           sign: 1 },
  daily_reward:    { color:C.gold,   icon:"🌅",label:"Diario",          sign: 1 },
  battle_reward:   { color:C.gold,   icon:"⚔️",label:"Batalla",         sign: 1 },
  adjustment:      { color:C.muted,  icon:"⚙", label:"Ajuste",          sign: 1 },
};
function entryMeta(type:string) {
  return ENTRY_META[type] ?? { color:C.muted, icon:"·", label:type, sign:1 as 1|-1 };
}

const CURRENCY_LABEL: Record<string,string> = {
  vex_ingame:    "VEX In-game",
  vex_tradeable: "VEX Tradeable",
};

function fmt(n:number|null|undefined, decimals=0) {
  if (n==null) return "—";
  return Number(n).toLocaleString("es-MX",{maximumFractionDigits:decimals});
}
function fmtDate(iso:string) {
  return new Date(iso).toLocaleString("es-MX",{
    day:"2-digit",month:"short",year:"numeric",
    hour:"2-digit",minute:"2-digit",
  });
}
function fmtSeasonDate(iso:string|null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX",{ day:"2-digit",month:"short",year:"numeric" });
}

// ── Sub-components ───────────────────────────────────────────────────────
function WalletCard({label,value,sub,color}:{label:string;value:number;sub:string;color:string}) {
  return (
    <div style={{
      padding:"20px 22px", borderRadius:12,
      background:C.bg1, border:`1px solid ${color}28`,
      boxShadow:`0 0 20px ${color}0a`,
    }}>
      <div style={{fontSize:11,letterSpacing:1,color:C.muted,textTransform:"uppercase",marginBottom:8}}>
        {label}
      </div>
      <div style={{fontSize:28,fontWeight:900,color,lineHeight:1,fontFamily:"Cinzel,serif"}}>
        {fmt(value)}
      </div>
      <div style={{fontSize:10,color:C.dim,marginTop:6}}>{sub}</div>
    </div>
  );
}

function StatPill({label,value,color}:{label:string;value:string;color:string}) {
  return (
    <div style={{
      padding:"10px 16px", borderRadius:10,
      background:`${color}10`, border:`1px solid ${color}28`,
      display:"flex", flexDirection:"column", gap:3, minWidth:120,
    }}>
      <div style={{fontSize:9,color:C.dim,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:16,fontWeight:800,color}}>{value}</div>
    </div>
  );
}

// ── U.1: Public metric card ──────────────────────────────────────────────
function MetricCard({icon,label,value,sub,color}:{icon:string;label:string;value:string|number;sub?:string;color:string}) {
  return (
    <div style={{
      padding:"16px 18px", borderRadius:12,
      background:C.bg1, border:`1px solid ${color}20`,
      boxShadow:`0 0 16px ${color}07`,
      display:"flex", flexDirection:"column", gap:3,
      minWidth:130, flex:1,
    }}>
      <div style={{fontSize:20,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:9,letterSpacing:1,color:C.dim,textTransform:"uppercase",marginTop:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:900,color,lineHeight:1,fontFamily:"Cinzel,serif",marginTop:2}}>
        {typeof value === "number" ? fmt(value) : value}
      </div>
      {sub && <div style={{fontSize:9,color:C.muted}}>{sub}</div>}
    </div>
  );
}

// ── U.1: Top-3 podium ───────────────────────────────────────────────────
function Top3Row({top3}:{top3:{display_name:string;mmr:number;rank:number;wins:number}[]}) {
  const MEDAL = ["🥇","🥈","🥉"];
  const MEDAL_COLOR = [C.gold,"#9ca3af","#cd7f32"];
  if (!top3.length) return null;
  return (
    <div style={{marginTop:16}}>
      <div style={{fontSize:9,letterSpacing:1,color:C.dim,textTransform:"uppercase",marginBottom:10}}>
        Top Forjadores — Temporada
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {top3.map((p,i)=>(
          <div key={p.rank} style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"10px 14px",borderRadius:10,
            background:i===0?`${C.gold}0a`:C.bg2,
            border:`1px solid ${i===0?C.gold+"22":C.b1}`,
          }}>
            <span style={{fontSize:18}}>{MEDAL[i]}</span>
            <span style={{flex:1,fontSize:13,fontWeight:700,color:MEDAL_COLOR[i],fontFamily:"Rajdhani,sans-serif"}}>
              {p.display_name}
            </span>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:800,color:MEDAL_COLOR[i]}}>{fmt(p.mmr)} MMR</div>
              <div style={{fontSize:10,color:C.muted}}>{p.wins} vic.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── U.1: Public dashboard ──────────────────────────────────────────────
function PublicDashboard() {
  const { stats, loading } = usePublicStats();
  return (
    <section style={{
      marginBottom:32,
      padding:"24px 24px 20px",
      borderRadius:16,
      background:`linear-gradient(135deg, ${C.bg1} 0%, #0f0f1e 100%)`,
      border:`1px solid ${C.gold}18`,
      boxShadow:`0 0 40px ${C.gold}06`,
    }}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,paddingBottom:14,borderBottom:`1px solid ${C.b1}`}}>
        <div style={{
          width:36,height:36,borderRadius:10,
          background:`${C.gold}18`,border:`1px solid ${C.gold}28`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
        }}>⚖️</div>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:C.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.06em"}}>
            Iron Treasury
          </div>
          <div style={{fontSize:10,color:C.muted}}>Métricas públicas del universo VEXFORGE</div>
        </div>
        {stats && (
          <div style={{
            marginLeft:"auto",padding:"4px 12px",borderRadius:20,
            background:`${C.green}18`,border:`1px solid ${C.green}28`,
            fontSize:10,fontWeight:700,color:C.green,letterSpacing:1,textTransform:"uppercase",
          }}>
            ● En vivo
          </div>
        )}
      </div>

      {/* Season banner */}
      {stats?.season_name && (
        <div style={{
          marginBottom:18,padding:"10px 16px",borderRadius:10,
          background:`${C.purple}12`,border:`1px solid ${C.purple}28`,
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
        }}>
          <span style={{fontSize:14}}>🏆</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.purple}}>{stats.season_name}</div>
            {stats.season_ends_at && (
              <div style={{fontSize:10,color:C.muted}}>Termina el {fmtSeasonDate(stats.season_ends_at)}</div>
            )}
          </div>
          {stats.active_event_name && (
            <div style={{
              marginLeft:"auto",padding:"4px 12px",borderRadius:20,
              background:`${C.gold}18`,border:`1px solid ${C.gold}28`,
              fontSize:10,fontWeight:700,color:C.gold,
            }}>
              ⚡ {stats.active_event_name}
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      {loading ? (
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{height:90,flex:1,minWidth:130,borderRadius:12,background:C.b1,opacity:0.5}}/>
          ))}
        </div>
      ) : stats ? (
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          <MetricCard icon="🧑‍💻" label="Forjadores" value={stats.active_players} sub="jugadores activos" color={C.blue}/>
          <MetricCard icon="🃏" label="Cartas" value={stats.total_cards} sub="en el universo" color={C.purple}/>
          <MetricCard icon="⚔️" label="Batallas" value={stats.total_battles} sub="totales completadas" color={C.red}/>
          <MetricCard icon="📦" label="Packs" value={stats.packs_opened} sub="abiertos" color={C.green}/>
          <MetricCard icon="🐉" label="Jefes" value={stats.active_bosses} sub="world bosses activos" color="#f97316"/>
          <MetricCard icon="🎯" label="Misiones" value={stats.total_missions} sub="disponibles" color={C.teal}/>
        </div>
      ) : (
        <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>
          No se pudieron cargar las métricas del universo.
        </div>
      )}

      {stats && <Top3Row top3={stats.top3}/>}
    </section>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function EconomyRoute() {
  const {
    wallet, stats, ledger, ledgerTotal,
    loading, loadingMore,
    reason, signedIn,
    reload, loadMore, hasMore,
  } = useEconomy();

  const [filterType, setFilterType]         = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  const filtered = ledger
    .filter(e => filterType     === "all" || e.entry_type === filterType)
    .filter(e => filterCurrency === "all" || e.currency   === filterCurrency);

  const entryTypes = Array.from(new Set(ledger.map(e => e.entry_type)));

  return (
    <main style={{ background:C.bg0, minHeight:"100vh", padding:"24px 16px 60px" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        <div style={{marginBottom:24}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:900,color:C.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>
            Tesorería
          </h1>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>
            Economía del universo VEXFORGE
          </div>
        </div>

        {/* U.1 — Public dashboard (always visible) */}
        <PublicDashboard />

        {/* Auth gate */}
        {!signedIn ? (
          <div style={{textAlign:"center",padding:"40px 20px",background:C.bg1,borderRadius:16,border:`1px solid ${C.b2}`}}>
            <div style={{fontSize:36,marginBottom:14}}>🔒</div>
            <div style={{fontSize:15,fontWeight:700,color:C.main,marginBottom:8}}>Tu cartera personal</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>
              Inicia sesión para ver tu balance de VEX, movimientos y estadísticas personales.
            </div>
            <Link to="/account" style={{
              padding:"10px 28px",borderRadius:10,
              background:C.gold,color:"#0a0a12",
              fontWeight:800,textDecoration:"none",fontSize:13,
            }}>
              Iniciar sesión →
            </Link>
          </div>
        ) : loading ? (
          <div style={{color:C.muted,textAlign:"center",padding:"40px 0",fontSize:13}}>Cargando tu cartera…</div>
        ) : (<>

          {reason && !wallet && (
            <div style={{
              padding:"14px 18px",borderRadius:10,marginBottom:18,
              background:`${C.red}10`,border:`1px solid ${C.red}28`,
              fontSize:12,color:"#fca5a5",
            }}>
              {reason}
            </div>
          )}

          {wallet && (
            <section style={{marginBottom:24}}>
              <div style={{fontSize:10,letterSpacing:1,color:C.dim,textTransform:"uppercase",marginBottom:12}}>
                Tu Cartera
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <WalletCard label="VEX In-game"          value={wallet.vex_ingame}          sub="moneda de juego"       color={C.gold}/>
                <WalletCard label="VEX Tradeable"        value={wallet.vex_tradeable}        sub="intercambiable"        color={C.green}/>
                <WalletCard label="Reservado In-game"    value={wallet.reserved_ingame}      sub="en órdenes activas"    color={C.muted}/>
                <WalletCard label="Reservado Tradeable"  value={wallet.reserved_tradeable}   sub="en órdenes activas"    color={C.muted}/>
              </div>
            </section>
          )}

          {stats?.ok && (
            <section style={{marginBottom:28}}>
              <div style={{fontSize:10,letterSpacing:1,color:C.dim,textTransform:"uppercase",marginBottom:12}}>
                Mis Estadísticas
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <StatPill label="Movimientos"   value={fmt(stats.entry_count)}    color={C.blue}  />
                <StatPill label="Total acred."  value={fmt(stats.total_credited)} color={C.green} />
                <StatPill label="Total débito"  value={fmt(stats.total_debited)}  color={C.red}   />
                <StatPill label="Net in-game"   value={fmt(stats.net_ingame)}     color={C.gold}  />
                <StatPill label="Net tradeable" value={fmt(stats.net_tradeable)}  color={C.purple}/>
              </div>
            </section>
          )}

          <section>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:10,letterSpacing:1,color:C.dim,textTransform:"uppercase"}}>
                Movimientos ({ledgerTotal})
              </div>
              <button onClick={reload} style={{
                padding:"5px 14px",borderRadius:8,
                border:`1px solid ${C.b2}`,background:"transparent",
                color:C.muted,fontSize:11,cursor:"pointer",
              }}>
                ↻ Actualizar
              </button>
            </div>

            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {["all",...entryTypes].map(t=>(
                <button key={t} onClick={()=>setFilterType(t)} style={{
                  padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",
                  background: filterType===t?`${C.blue}22`:"transparent",
                  border:`1px solid ${filterType===t?C.blue+"44":C.b2}`,
                  color:filterType===t?C.blue:C.muted,
                  transition:"all 0.15s",
                }}>
                  {t==="all"?"Todo":entryMeta(t).label}
                </button>
              ))}
            </div>

            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {["all","vex_ingame","vex_tradeable"].map(c=>(
                <button key={c} onClick={()=>setFilterCurrency(c)} style={{
                  padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",
                  background: filterCurrency===c?`${C.gold}18`:"transparent",
                  border:`1px solid ${filterCurrency===c?C.gold+"44":C.b2}`,
                  color:filterCurrency===c?C.gold:C.muted,
                  transition:"all 0.15s",
                }}>
                  {c==="all"?"Todas":CURRENCY_LABEL[c]??c}
                </button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.length===0 ? (
                <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Sin movimientos</div>
              ) : filtered.map(entry=>{
                const meta = entryMeta(entry.entry_type);
                const signed = entry.amount * meta.sign;
                return (
                  <div key={entry.id} style={{
                    padding:"12px 14px",borderRadius:10,
                    background:C.bg1,border:`1px solid ${C.b1}`,
                    display:"grid",gridTemplateColumns:"32px 1fr auto",
                    gap:"0 10px",alignItems:"start",
                  }}>
                    <div style={{
                      width:32,height:32,borderRadius:8,
                      background:`${meta.color}14`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:15,color:meta.color,gridRow:"1/3",
                    }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:C.main}}>
                        {meta.label}
                        {entry.source_table && (
                          <span style={{fontSize:10,color:C.dim,marginLeft:6}}>· {entry.source_table}</span>
                        )}
                      </div>
                      <div style={{fontSize:10,color:C.dim}}>{fmtDate(entry.created_at)}</div>
                    </div>
                    <div style={{textAlign:"right",gridRow:"1/3"}}>
                      <div style={{fontSize:14,fontWeight:900,color:signed>=0?C.green:C.red}}>
                        {signed>=0?"+":""}{fmt(signed)}
                      </div>
                      <div style={{fontSize:10,color:C.dim}}>{CURRENCY_LABEL[entry.currency]??entry.currency}</div>
                      {entry.balance_after!=null && (
                        <div style={{fontSize:9,color:C.dim,marginTop:2}}>Saldo: {fmt(entry.balance_after)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div style={{textAlign:"center",marginTop:20}}>
                <button onClick={loadMore} disabled={loadingMore} style={{
                  padding:"9px 28px",borderRadius:9,
                  border:`1px solid ${C.b2}`,background:"transparent",
                  color:loadingMore?C.dim:C.muted,
                  fontSize:12,cursor:loadingMore?"not-allowed":"pointer",
                }}>
                  {loadingMore?"Cargando…":`Cargar más (${ledgerTotal-ledger.length} restantes)`}
                </button>
              </div>
            )}
          </section>

          <div style={{ marginTop:36, display:"flex", flexDirection:"column", gap:12 }}>

            {/* ── CTA Depositar ─────────────────────────────────────── */}
            <div style={{
              padding:"18px 22px",borderRadius:12,
              background:`${C.gold}0a`,border:`1px solid ${C.gold}22`,
              display:"flex",justifyContent:"space-between",alignItems:"center",
              flexWrap:"wrap",gap:12,
            }}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:4}}>¿Quieres más VEX?</div>
                <div style={{fontSize:12,color:C.muted}}>Deposita USDT y recibe VEX Tradeable al instante.</div>
              </div>
              <Link to="/deposit" style={{
                padding:"9px 22px",borderRadius:9,
                background:C.gold,color:"#0a0a12",
                fontWeight:800,textDecoration:"none",fontSize:12,whiteSpace:"nowrap",
              }}>
                💰 Depositar →
              </Link>
            </div>

            {/* ── CTA Retirar — BRECHA-6 resuelto ──────────────────── */}
            <div style={{
              padding:"18px 22px",borderRadius:12,
              background:`${C.green}08`,border:`1px solid ${C.green}22`,
              display:"flex",justifyContent:"space-between",alignItems:"center",
              flexWrap:"wrap",gap:12,
            }}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:4}}>¿Quieres retirar VEX Tradeable?</div>
                <div style={{fontSize:12,color:C.muted}}>
                  Convierte VEX Tradeable a USDT. Mínimo 500 VEX · Fee 8% · Aprobación manual.
                </div>
              </div>
              <Link to="/withdrawal" style={{
                padding:"9px 22px",borderRadius:9,
                background:C.green,color:"#0a0a12",
                fontWeight:800,textDecoration:"none",fontSize:12,whiteSpace:"nowrap",
              }}>
                💸 Retirar →
              </Link>
            </div>

          </div>
        </>)}
      </div>
    </main>
  );
}

