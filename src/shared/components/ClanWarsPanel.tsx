import { useState, useEffect } from "react";
    import { getPlayerClanData } from "../../domains/clans/clanRepository";
    import type { PlayerClanData, ClanWar, Clan } from "../../domains/clans/clanRepository";

    const STATUS_CFG: Record<string, { label: string; color: string }> = {
    active:   { label: "ACTIVA",    color: "#3ddc84" },
    ongoing:  { label: "EN CURSO",  color: "#e8b84b" },
    pending:  { label: "PENDIENTE", color: "#4a9eff" },
    resolved: { label: "FINALIZADA",color: "#555" },
    default:  { label: "GUERRA",    color: "#a855f7" },
    };
    const ROLE_ICON: Record<string, string> = { leader:"👑", officer:"⭐", member:"⚔️" };

    function WarCard({ war }: { war: ClanWar }) {
    const cfg = STATUS_CFG[war.status] ?? STATUS_CFG.default;
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10,
        background:"linear-gradient(90deg,rgba(168,85,247,0.06),transparent)",
        border:"1px solid rgba(168,85,247,0.15)",
      }}>
        <div style={{ fontSize:18 }}>⚔️</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontFamily:"Rajdhani,sans-serif", fontWeight:700, fontSize:13, color:"#e8e8f0",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {war.clan_a_name} vs {war.clan_b_name}
          </div>
          <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', marginTop:2 }}>
            {new Date(war.created_at).toLocaleDateString("es-ES")}
          </div>
        </div>
        <div style={{
          background:`${cfg.color}18`, border:`1px solid ${cfg.color}44`,
          borderRadius:6, padding:"2px 8px",
          fontSize:8, color:cfg.color, fontFamily:'"IBM Plex Mono",monospace',
          fontWeight:700, letterSpacing:"0.08em", flexShrink:0,
        }}>{cfg.label}</div>
      </div>
    );
    }

    function ClanCard({ clan }: { clan: Clan }) {
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10,
        background:"#0d0d18", border:"1px solid #1a1a2a",
      }}>
        <div style={{
          width:36, height:36, borderRadius:8, flexShrink:0,
          background:"linear-gradient(135deg,rgba(232,184,75,0.15),rgba(232,184,75,0.05))",
          border:"1px solid rgba(232,184,75,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
        }}>🛡️</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"Cinzel,serif", fontWeight:800, fontSize:13, color:"#e8e8f0",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {clan.name}
          </div>
          <div style={{ fontSize:9, color:"#555", fontFamily:'"IBM Plex Mono",monospace', marginTop:2 }}>
            Prestigio {clan.prestige} · Contribución {clan.contribution_total.toLocaleString()}
          </div>
        </div>
        <div style={{ fontSize:9, color:"#e8b84b", fontFamily:'"IBM Plex Mono",monospace' }}>
          #{clan.code}
        </div>
      </div>
    );
    }

    /** D.5 — Clan Wars Panel */
    export function ClanWarsPanel() {
    const [data,    setData]    = useState<PlayerClanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open,    setOpen]    = useState(false);

    useEffect(() => {
      getPlayerClanData().then(res => { setData(res.data ?? null); setLoading(false); });
    }, []);

    if (loading) return null;

    const hasClan   = !!data?.myClan;
    const hasWars   = (data?.activeWars?.length ?? 0) > 0;
    const hasClans  = (data?.allClans?.length ?? 0) > 0;
    const memberCount = data?.members?.length ?? 0;
    const bg0 = "#12121f"; const bdim = "#2a2a3a";
    const accentColor = hasClan ? "#a855f7" : "#555";

    return (
      <div style={{
        background:"linear-gradient(135deg,#0a0a16 0%,#0f0f1e 60%,#080812 100%)",
        border:`1px solid rgba(168,85,247,0.12)`, borderRadius:16, marginBottom:24, overflow:"hidden",
      }}>
        {/* Header */}
        <button onClick={()=>setOpen(o=>!o)} style={{
          width:"100%", background:"none", border:"none", cursor:"pointer",
          padding:"16px 20px", display:"flex", alignItems:"center", gap:14, textAlign:"left",
        }}>
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:"linear-gradient(135deg,#1a0a2a,#0f0718)",
            border:"1px solid rgba(168,85,247,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          }}>🛡️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontFamily:"Cinzel,serif", fontWeight:800, color:"#e8e8f0", letterSpacing:"0.05em" }}>
              Clan Wars
            </div>
            <div style={{ fontSize:10, color:"#666", fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>
              {hasClan ? `${data!.myClan!.name} · ${memberCount} miembro${memberCount!==1?"s":""} · ${data!.activeWars.length} guerra${data!.activeWars.length!==1?"s":""}  activa${data!.activeWars.length!==1?"s":""}` : "Sin clan — explora o crea uno"}
            </div>
          </div>
          {hasClan && (
            <div style={{
              background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.25)",
              borderRadius:8, padding:"5px 12px", flexShrink:0, textAlign:"center",
            }}>
              <div style={{ fontSize:10, fontFamily:"Rajdhani,sans-serif", fontWeight:800, color:"#a855f7" }}>
                {data!.myClan!.prestige}
              </div>
              <div style={{ fontSize:7, color:"#555", fontFamily:'"IBM Plex Mono",monospace' }}>PRESTIGIO</div>
            </div>
          )}
          <div style={{ color:"#444", fontSize:12, flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.25s" }}>▼</div>
        </button>

        {open && (
          <div style={{ padding:"0 20px 20px" }}>

            {/* === HAS CLAN === */}
            {hasClan && data?.myClan && (
              <>
                {/* Clan info card */}
                <div style={{ background:bg0, border:`1px solid ${bdim}`, borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div style={{
                      width:48, height:48, borderRadius:12, flexShrink:0,
                      background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(168,85,247,0.05))",
                      border:"1px solid rgba(168,85,247,0.3)",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                    }}>🛡️</div>
                    <div>
                      <div style={{ fontFamily:"Cinzel,serif", fontWeight:800, fontSize:16, color:"#e8e8f0" }}>{data.myClan.name}</div>
                      <div style={{ fontSize:9, color:"#a855f7", fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>#{data.myClan.code} · {data.myMembership?.role ? `Rol: ${data.myMembership.role}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[
                      { label:"PRESTIGIO", val:data.myClan.prestige, color:"#e8b84b" },
                      { label:"CONTRIBUCIÓN", val:data.myClan.contribution_total.toLocaleString(), color:"#a855f7" },
                      { label:"MIEMBROS", val:memberCount, color:"#4a9eff" },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                        <div style={{ fontSize:15, fontFamily:"Cinzel,serif", fontWeight:900, color }}>{val}</div>
                        <div style={{ fontSize:7, color:"#444", fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {/* Members roster */}
                  <div>
                    <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:8 }}>
                      MIEMBROS ({memberCount})
                    </div>
                    {data.members.length === 0 ? (
                      <div style={{ color:"#333", fontSize:11, fontFamily:"Rajdhani,sans-serif" }}>Sin datos</div>
                    ) : data.members.slice(0,6).map(m => (
                      <div key={m.id} style={{
                        display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
                        borderRadius:7, background:"rgba(255,255,255,0.02)", marginBottom:4,
                      }}>
                        <span style={{ fontSize:12 }}>{ROLE_ICON[m.role] ?? "⚔️"}</span>
                        <span style={{ fontFamily:"Rajdhani,sans-serif", fontSize:12, fontWeight:600, color:"#c8c8d8", flex:1,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {m.display_name}
                        </span>
                        <span style={{ fontSize:9, color:"#555", fontFamily:'"IBM Plex Mono",monospace' }}>
                          {m.contribution_accumulated.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Active wars */}
                  <div>
                    <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:8 }}>
                      GUERRAS ({data.activeWars.length})
                    </div>
                    {!hasWars ? (
                      <div style={{
                        background:"rgba(168,85,247,0.04)", border:"1px dashed rgba(168,85,247,0.2)",
                        borderRadius:10, padding:"16px 12px", textAlign:"center",
                      }}>
                        <div style={{ fontSize:22, marginBottom:6 }}>⚔️</div>
                        <div style={{ color:"#444", fontSize:11, fontFamily:"Rajdhani,sans-serif" }}>Sin guerras activas</div>
                      </div>
                    ) : data.activeWars.map(w => <WarCard key={w.id} war={w} />)}
                  </div>
                </div>
              </>
            )}

            {/* === NO CLAN === */}
            {!hasClan && (
              <div>
                {hasClans ? (
                  <>
                    <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:10 }}>
                      CLANES EXISTENTES
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                      {data!.allClans.map(c => <ClanCard key={c.id} clan={c} />)}
                    </div>
                  </>
                ) : (
                  <div style={{
                    background:bg0, border:`1px dashed ${bdim}`, borderRadius:12,
                    padding:"32px 24px", textAlign:"center", marginBottom:16,
                  }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>🛡️</div>
                    <div style={{ fontFamily:"Cinzel,serif", fontWeight:700, fontSize:14, color:"#e8e8f0", marginBottom:6 }}>
                      No hay Clanes todavía
                    </div>
                    <div style={{ color:"#444", fontSize:12, fontFamily:"Rajdhani,sans-serif", marginBottom:20 }}>
                      Sé el primero en forjar tu legado. Crea un Clan, recluta aliados y declara la guerra.
                    </div>
                  </div>
                )}
                {/* CTAs */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{
                    background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.25)",
                    borderRadius:10, padding:"14px 16px", textAlign:"center", cursor:"default",
                    opacity:0.7,
                  }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>⚡</div>
                    <div style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:800, fontSize:12, color:"#a855f7", letterSpacing:"0.08em" }}>
                      Crear Clan
                    </div>
                    <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', marginTop:4 }}>Próximamente</div>
                  </div>
                  <div style={{
                    background:"rgba(74,158,255,0.08)", border:"1px solid rgba(74,158,255,0.2)",
                    borderRadius:10, padding:"14px 16px", textAlign:"center", cursor:"default",
                    opacity:0.7,
                  }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>🔍</div>
                    <div style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:800, fontSize:12, color:"#4a9eff", letterSpacing:"0.08em" }}>
                      Explorar Clanes
                    </div>
                    <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', marginTop:4 }}>Próximamente</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
    }
    