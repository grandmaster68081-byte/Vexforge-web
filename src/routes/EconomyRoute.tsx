import { useState } from "react";
import { Link } from "react-router-dom";
import { useEconomy } from "../domains/economy/useEconomy";

// ── Design tokens ────────────────────────────────────────────────────────
const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30", b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#FF4B4B",
  blue:"#4A9EFF", purple:"#A855F7",
  muted:"#7a7a9a", dim:"#4a4a6a", main:"#e8e8f0",
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

// ── Main Component ───────────────────────────────────────────────────────
export function EconomyRoute() {
  const {
    wallet, stats, ledger, ledgerTotal,
    loading, loadingMore,
    reason, signedIn,
    reload, loadMore, hasMore,
  } = useEconomy();

  // Ledger filters (client-side over loaded pages)
  const [filterType, setFilterType]         = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  // Filtered ledger
  const filtered = ledger
    .filter(e => filterType==="all" || e.entry_type===filterType)
    .filter(e => filterCurrency==="all" || e.currency===filterCurrency);

  // Entry types present in loaded data
  const typesPresent = Array.from(new Set(ledger.map(e => e.entry_type))).sort();
  const currenciesPresent = Array.from(new Set(ledger.map(e => e.currency))).sort();

  // ── Not signed in ──────────────────────────────────────────────────────
  if (!loading && !signedIn) {
    return (
      <main style={{minHeight:"100vh",background:C.bg0,color:C.main,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:48}}>
          <div style={{fontSize:56,marginBottom:16}}>💰</div>
          <div style={{fontFamily:"Cinzel,serif",fontSize:20,color:C.gold,marginBottom:8}}>
            Iron Treasury
          </div>
          <p style={{color:C.muted,marginBottom:24,fontSize:13}}>
            Inicia sesión para ver tu cartera y historial de transacciones.
          </p>
          <Link to="/account" style={{
            display:"inline-block",padding:"10px 28px",borderRadius:9,
            background:C.gold,color:"#0a0a12",fontWeight:800,textDecoration:"none",fontSize:13,
          }}>Iniciar Sesión</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{minHeight:"100vh",background:C.bg0,color:C.main}}>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg, #0d0d1a 0%, #1a1006 50%, #0d0d1a 100%)`,
        borderBottom:`1px solid ${C.gold}22`,
        padding:"36px 24px 32px", position:"relative", overflow:"hidden",
      }}>
        {/* Grid decoration */}
        <div style={{
          position:"absolute", inset:0, opacity:0.04,
          backgroundImage:"repeating-linear-gradient(45deg,#E8B84B 0,#E8B84B 1px,transparent 0,transparent 50%)",
          backgroundSize:"20px 20px", pointerEvents:"none",
        }}/>
        <div style={{maxWidth:900,margin:"0 auto",position:"relative"}}>
          <div style={{fontSize:10,letterSpacing:2,color:C.gold,marginBottom:8}}>
            ─── IRON TREASURY ───
          </div>
          <h1 style={{
            fontFamily:"Cinzel,serif",fontSize:"clamp(1.8rem,4vw,3rem)",
            fontWeight:900,margin:"0 0 8px",color:C.main,
          }}>Economy</h1>
          <p style={{color:C.muted,fontSize:13,margin:0}}>
            Tu cartera VEX e historial de transacciones. Solo lectura por diseño.
          </p>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px 56px"}}>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && (
          <div style={{textAlign:"center",padding:"60px 0",color:C.muted,fontSize:13}}>
            Cargando datos del tesoro…
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {!loading && reason && !wallet && (
          <div style={{
            padding:"12px 16px",borderRadius:8,marginBottom:20,
            background:`${C.red}12`,border:`1px solid ${C.red}33`,color:C.red,fontSize:13,
          }}>{reason}</div>
        )}

        {!loading && wallet && (<>

          {/* ── Wallet Cards ─────────────────────────────────────────── */}
          <section style={{marginBottom:28}}>
            <div style={{fontSize:9,letterSpacing:2,color:C.dim,marginBottom:12}}>CARTERA</div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",
              gap:10,
            }}>
              <WalletCard
                label="VEX In-Game" color={C.gold}
                value={wallet.vex_ingame}
                sub="Ganado en gameplay"
              />
              <WalletCard
                label="VEX Tradeable" color={C.green}
                value={wallet.vex_tradeable}
                sub="Disponible para intercambiar"
              />
              <WalletCard
                label="Reservado In-Game" color={C.muted}
                value={wallet.reserved_ingame}
                sub="En uso / bloqueado"
              />
              <WalletCard
                label="Reservado Tradeable" color={C.muted}
                value={wallet.reserved_tradeable}
                sub="En uso / bloqueado"
              />
            </div>
          </section>

          {/* ── Economy Stats ────────────────────────────────────────── */}
          {stats && (
            <section style={{marginBottom:28}}>
              <div style={{fontSize:9,letterSpacing:2,color:C.dim,marginBottom:12}}>ESTADÍSTICAS</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                <StatPill label="Total ganado" color={C.green}
                  value={"+" + fmt(stats.total_credited) + " VEX"} />
                <StatPill label="Total gastado" color={C.red}
                  value={"-" + fmt(stats.total_debited) + " VEX"} />
                <StatPill label="Net In-Game" color={stats.net_ingame >= 0 ? C.gold : C.red}
                  value={(stats.net_ingame >= 0 ? "+" : "") + fmt(stats.net_ingame) + " VEX"} />
                <StatPill label="Net Tradeable" color={stats.net_tradeable >= 0 ? C.green : C.red}
                  value={(stats.net_tradeable >= 0 ? "+" : "") + fmt(stats.net_tradeable) + " VEX"} />
                <StatPill label="Mayor ingreso" color={C.blue}
                  value={fmt(stats.largest_credit) + " VEX"} />
                <StatPill label="Transacciones" color={C.muted}
                  value={String(stats.entry_count)} />
              </div>

              {/* Entry-type breakdown chips */}
              {stats.by_type.length > 0 && (
                <div>
                  <div style={{fontSize:9,letterSpacing:1.5,color:C.dim,marginBottom:8}}>
                    DESGLOSE POR TIPO
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {stats.by_type.map(bt => {
                      const m = entryMeta(bt.entry_type);
                      const isPos = Number(bt.total_amount) >= 0;
                      return (
                        <button
                          key={bt.entry_type+bt.currency}
                          onClick={() => setFilterType(
                            filterType===bt.entry_type ? "all" : bt.entry_type
                          )}
                          style={{
                            padding:"5px 10px", borderRadius:16, fontSize:10, cursor:"pointer",
                            border:`1px solid ${m.color}${filterType===bt.entry_type?"":"33"}`,
                            background: filterType===bt.entry_type ? `${m.color}22` : "transparent",
                            color:m.color, fontWeight:700, display:"flex", gap:5, alignItems:"center",
                          }}
                        >
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                          <span style={{opacity:0.7,fontSize:9}}>
                            ×{bt.count} · {isPos?"+":""}{fmt(Number(bt.total_amount))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Ledger ───────────────────────────────────────────────── */}
          <section>
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              marginBottom:12, flexWrap:"wrap", gap:8,
            }}>
              <div style={{fontSize:9,letterSpacing:2,color:C.dim}}>HISTORIAL DE TRANSACCIONES</div>
              <button onClick={reload} style={{
                padding:"5px 12px",borderRadius:7,border:`1px solid ${C.b2}`,
                background:"transparent",color:C.muted,fontSize:10,cursor:"pointer",
              }}>🔄 Actualizar</button>
            </div>

            {/* Filter bar */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {/* Type filter */}
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                <button
                  onClick={() => setFilterType("all")}
                  style={{
                    padding:"4px 10px",borderRadius:14,border:"none",fontSize:9,
                    fontWeight:700,cursor:"pointer",
                    background:filterType==="all"?C.muted+"cc":"#1a1a2e",
                    color:filterType==="all"?"#0a0a12":C.dim,
                  }}
                >TODOS</button>
                {typesPresent.map(t => {
                  const m = entryMeta(t);
                  return (
                    <button key={t} onClick={() => setFilterType(filterType===t?"all":t)} style={{
                      padding:"4px 10px",borderRadius:14,border:"none",fontSize:9,
                      fontWeight:700,cursor:"pointer",
                      background:filterType===t?m.color+"cc":"#1a1a2e",
                      color:filterType===t?"#0a0a12":m.color,
                    }}>{m.label}</button>
                  );
                })}
              </div>

              {currenciesPresent.length > 1 && (
                <div style={{display:"flex",gap:3,marginLeft:6}}>
                  {["all",...currenciesPresent].map(cur => (
                    <button key={cur} onClick={() => setFilterCurrency(filterCurrency===cur?"all":cur)} style={{
                      padding:"4px 10px",borderRadius:14,border:"none",fontSize:9,
                      fontWeight:700,cursor:"pointer",
                      background:filterCurrency===cur?"#4A9EFF33":"#1a1a2e",
                      color:filterCurrency===cur?"#4A9EFF":C.dim,
                    }}>
                      {cur==="all" ? "Todas" : (CURRENCY_LABEL[cur]??cur)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Count */}
            <div style={{fontSize:11,color:C.dim,marginBottom:10}}>
              {filtered.length} entradas cargadas
              {(filterType!=="all"||filterCurrency!=="all") && ` (filtradas de ${ledger.length})`}
              {ledgerTotal > ledger.length && ` · ${ledgerTotal - ledger.length} más en servidor`}
            </div>

            {/* Table */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.b1}`,color:C.dim,fontSize:9,letterSpacing:0.5}}>
                    {["Tipo","Currency","Monto","Balance","Fuente","Fecha"].map(h => (
                      <th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap"}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => {
                    const m   = entryMeta(e.entry_type);
                    const amt = Number(e.amount);
                    const isPos = amt >= 0;
                    return (
                      <tr key={e.id} style={{
                        borderBottom:`1px solid ${C.b1}`,
                        background:i%2===0?"transparent":`${C.bg2}40`,
                      }}>
                        {/* Type */}
                        <td style={{padding:"9px 10px",whiteSpace:"nowrap"}}>
                          <span style={{
                            padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,
                            background:`${m.color}18`,color:m.color,
                            display:"inline-flex",gap:4,alignItems:"center",
                          }}>
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </span>
                        </td>
                        {/* Currency */}
                        <td style={{padding:"9px 10px",color:C.muted,fontSize:10}}>
                          {CURRENCY_LABEL[e.currency] ?? e.currency}
                        </td>
                        {/* Amount */}
                        <td style={{
                          padding:"9px 10px",fontFamily:"monospace",fontWeight:700,
                          textAlign:"right",
                          color: isPos ? C.green : C.red,
                        }}>
                          {isPos?"+":""}{fmt(amt)}
                        </td>
                        {/* Balance after */}
                        <td style={{
                          padding:"9px 10px",fontFamily:"monospace",fontSize:11,
                          color:C.dim,textAlign:"right",
                        }}>
                          {e.balance_after != null ? fmt(Number(e.balance_after)) : "—"}
                        </td>
                        {/* Source */}
                        <td style={{padding:"9px 10px",color:C.dim,fontSize:10,maxWidth:120,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {e.source_table ?? (e.metadata?.type ?? e.metadata?.reason ?? "—")}
                        </td>
                        {/* Date */}
                        <td style={{padding:"9px 10px",color:C.dim,whiteSpace:"nowrap",fontSize:10}}>
                          {fmtDate(e.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty filtered */}
            {filtered.length === 0 && ledger.length > 0 && (
              <div style={{textAlign:"center",padding:"32px 0",color:C.dim,fontSize:13}}>
                Sin entradas para ese filtro.
                <button onClick={() => { setFilterType("all"); setFilterCurrency("all"); }}
                  style={{display:"block",margin:"10px auto 0",padding:"6px 16px",
                    borderRadius:7,border:`1px solid ${C.b2}`,background:"transparent",
                    color:C.muted,fontSize:11,cursor:"pointer"}}>
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Empty ledger */}
            {ledger.length === 0 && !loading && (
              <div style={{textAlign:"center",padding:"40px 0",color:C.dim,fontSize:13}}>
                <div style={{fontSize:40,marginBottom:10}}>📒</div>
                Sin transacciones registradas aún.
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div style={{textAlign:"center",marginTop:20}}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding:"9px 28px",borderRadius:9,
                    border:`1px solid ${C.b2}`,background:"transparent",
                    color:loadingMore?C.dim:C.muted,
                    fontSize:12,cursor:loadingMore?"not-allowed":"pointer",
                  }}
                >
                  {loadingMore
                    ? "Cargando…"
                    : `Cargar más (${ledgerTotal - ledger.length} restantes)`}
                </button>
              </div>
            )}
          </section>

          {/* ── CTA Deposit ──────────────────────────────────────────── */}
          <div style={{
            marginTop:36, padding:"18px 22px", borderRadius:12,
            background:`${C.gold}0a`, border:`1px solid ${C.gold}22`,
            display:"flex", justifyContent:"space-between", alignItems:"center",
            flexWrap:"wrap", gap:12,
          }}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:4}}>
                ¿Quieres más VEX?
              </div>
              <div style={{fontSize:12,color:C.muted}}>
                Deposita USDT y recibe VEX Tradeable al instante.
              </div>
            </div>
            <Link to="/deposit" style={{
              padding:"9px 22px",borderRadius:9,
              background:C.gold,color:"#0a0a12",
              fontWeight:800,textDecoration:"none",fontSize:12,whiteSpace:"nowrap",
            }}>
              💰 Depositar →
            </Link>
          </div>

        </>)}
      </div>
    </main>
  );
}