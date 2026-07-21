import { useState, useEffect } from "react";
    import { getDeckStats } from "../../domains/collection/deckStatsRepository";
    import type { DeckStats } from "../../domains/collection/deckStatsRepository";
    import { AnimatedProgressBar } from "./AnimatedProgressBar";

    const RARITY_COLOR: Record<string, string> = {
    Common:"#9ca3af", Uncommon:"#22c55e", Rare:"#60a5fa",
    Epic:"#a78bfa", Legendary:"#f59e0b", Mythic:"#ef4444",
    };
    const RARITY_ORDER = ["Mythic","Legendary","Epic","Rare","Uncommon","Common"];

    const FACTION_COLOR: Record<string, string> = {
    Fuego:"#ef4444", Agua:"#60a5fa", Tierra:"#a78bfa", Aire:"#22c55e",
    Luz:"#f59e0b", Sombra:"#9333ea", default:"#6b7280",
    };

    /** D.4 — Deck Stats Meta Panel */
    export function DeckStatsPanel() {
    const [stats,   setStats]   = useState<DeckStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [open,    setOpen]    = useState(false);

    useEffect(() => {
      getDeckStats().then(res => { setStats(res.data ?? null); setLoading(false); });
    }, []);

    if (loading || !stats) return null;

    const bg0 = "#12121f"; const bdim = "#2a2a3a";
    const factions  = Object.entries(stats.faction_counts).sort((a,b) => b[1]-a[1]);
    const rarities  = RARITY_ORDER.filter(r => stats.rarity_counts[r] > 0)
                        .map(r => ({ r, count: stats.rarity_counts[r] }));
    const totalRarity = rarities.reduce((s, item) => s + item.count, 0) || 1;
    const totalFaction = factions.reduce((s,[,n]) => s+n, 0) || 1;

    return (
      <div style={{
        background:"linear-gradient(135deg,#0a0a16 0%,#0f0f1e 60%,#080812 100%)",
        border:"1px solid rgba(232,184,75,0.12)", borderRadius:16, marginBottom:24, overflow:"hidden",
      }}>
        <button onClick={()=>setOpen(o=>!o)} style={{
          width:"100%", background:"none", border:"none", cursor:"pointer",
          padding:"16px 20px", display:"flex", alignItems:"center", gap:14, textAlign:"left",
        }}>
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:"linear-gradient(135deg,#0a1a2a,#071220)",
            border:"1px solid rgba(74,158,255,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          }}>📊</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontFamily:"Cinzel,serif", fontWeight:800, color:"#e8e8f0", letterSpacing:"0.05em" }}>
              Estadísticas de Colección
            </div>
            <div style={{ fontSize:10, color:"#666", fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>
              {stats.unique_cards} cartas únicas · {stats.completion_pct}% completado · poder total {stats.total_power.toLocaleString()}
            </div>
          </div>
          <div style={{
            background:"rgba(74,158,255,0.1)", border:"1px solid rgba(74,158,255,0.25)",
            borderRadius:8, padding:"5px 12px", flexShrink:0, textAlign:"center",
          }}>
            <div style={{ fontSize:13, fontFamily:"Cinzel,serif", fontWeight:800, color:"#4a9eff" }}>{stats.completion_pct}%</div>
            <div style={{ fontSize:7, color:"#555", fontFamily:'"IBM Plex Mono",monospace' }}>COMPLETO</div>
          </div>
          <div style={{ color:"#444", fontSize:12, flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.25s" }}>▼</div>
        </button>

        {open && (
          <div style={{ padding:"0 20px 20px" }}>
            {/* Summary row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { label:"CARTAS ÚNICAS", value:stats.unique_cards, color:"#e8e8f0" },
                { label:"TOTAL CARTAS",  value:stats.total_cards,  color:"#e8b84b" },
                { label:"PODER TOTAL",   value:stats.total_power.toLocaleString(), color:"#4a9eff" },
                { label:"PODER MEDIO",   value:stats.avg_power,    color:"#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:bg0, border:`1px solid ${bdim}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontFamily:"Cinzel,serif", fontWeight:900, color }}>{value}</div>
                  <div style={{ fontSize:8, color:"#444", fontFamily:'"IBM Plex Mono",monospace', marginTop:4, letterSpacing:"0.08em" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
              {/* Rarity distribution */}
              <div>
                <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:10 }}>POR RAREZA</div>
                {rarities.map(({ r, count }) => {
                  const col = RARITY_COLOR[r] ?? "#6b7280";
                  const pct = Math.round((count / totalRarity) * 100);
                  return (
                    <div key={r} style={{ marginBottom:7 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:10, color:col, fontFamily:"Rajdhani,sans-serif", fontWeight:700 }}>{r}</span>
                        <span style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace' }}>{count} ({pct}%)</span>
                      </div>
                      <AnimatedProgressBar current={count} max={totalRarity} color={col} height={3} />
                    </div>
                  );
                })}
              </div>
              {/* Faction distribution */}
              <div>
                <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:10 }}>POR FACCIÓN</div>
                {factions.length === 0 ? (
                  <div style={{ color:"#333", fontSize:11, fontFamily:"Rajdhani,sans-serif" }}>Sin datos de facción</div>
                ) : factions.map(([faction, count]) => {
                  const col = FACTION_COLOR[faction] ?? FACTION_COLOR.default;
                  const pct = Math.round((count / totalFaction) * 100);
                  return (
                    <div key={faction} style={{ marginBottom:7 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:10, color:col, fontFamily:"Rajdhani,sans-serif", fontWeight:700 }}>{faction}</span>
                        <span style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace' }}>{count} ({pct}%)</span>
                      </div>
                      <AnimatedProgressBar current={count} max={totalFaction} color={col} height={3} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top power cards */}
            {stats.top_power_cards.length > 0 && (
              <div>
                <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:10 }}>TOP 5 — MAYOR PODER</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {stats.top_power_cards.map((card, i) => {
                    const col = RARITY_COLOR[card.rarity] ?? "#6b7280";
                    return (
                      <div key={i} style={{
                        display:"flex", alignItems:"center", gap:12, padding:"8px 12px",
                        background:`linear-gradient(90deg,${col}0a,transparent)`,
                        border:`1px solid ${col}20`, borderRadius:8,
                      }}>
                        <span style={{ fontSize:10, color:"#444", minWidth:16, fontFamily:'"IBM Plex Mono",monospace' }}>{i+1}</span>
                        <div style={{ width:3, height:28, borderRadius:2, background:col, flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"Cinzel,serif", fontSize:12, color:"#e8e8f0", fontWeight:700 }}>{card.name}</div>
                          <div style={{ fontSize:9, color:col, fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>
                            {card.rarity}{card.faction ? ` · ${card.faction}` : ""}
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:14, fontFamily:"Cinzel,serif", fontWeight:900, color:col }}>{card.power}</div>
                          <div style={{ fontSize:7, color:"#444", fontFamily:'"IBM Plex Mono",monospace' }}>POW</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
    }
    