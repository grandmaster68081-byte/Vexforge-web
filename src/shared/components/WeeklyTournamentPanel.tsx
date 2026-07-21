import { useState, useEffect } from "react";
    import { getWeeklyTournamentData } from "../../domains/pvp/tournamentRepository";
    import type { WeeklyTournamentData, TournamentSeed, BracketMatch } from "../../domains/pvp/tournamentRepository";
    import { getRank } from "../../lib/rankUtils";

    const ROUND_LABELS: Record<number, string> = { 1: "CUARTOS", 2: "SEMIFINAL", 3: "FINAL" };
    const ROUND_COLORS: Record<number, string> = { 1: "#4a9eff", 2: "#a855f7", 3: "#e8b84b" };

    function SeedChip({ seed, isFavorite }: { seed: TournamentSeed | null; isFavorite?: boolean }) {
    if (!seed) return (
      <div style={{ padding:"7px 12px", borderRadius:8, fontSize:11, background:"#0d0d14",
        border:"1px dashed #1a1a2a", color:"#333", fontFamily:"Rajdhani,sans-serif" }}>BYE</div>
    );
    const tier = getRank(seed.mmr);
    return (
      <div style={{
        padding:"7px 12px", borderRadius:8,
        background: isFavorite ? `linear-gradient(90deg,${tier.color}16,transparent)` : "#0d0d18",
        border:`1px solid ${isFavorite ? tier.color+"40" : "#1a1a2a"}`,
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:10, color:"#444", minWidth:16, fontFamily:'"IBM Plex Mono",monospace' }}>#{seed.seed}</span>
        <span style={{ fontSize:13 }}>{tier.icon}</span>
        <span style={{ fontFamily:"Rajdhani,sans-serif", fontWeight:isFavorite?800:600, fontSize:12,
          color:isFavorite?"#e8e8f0":"#aaa", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:100 }}>
          {seed.display_name}
        </span>
        <span style={{ marginLeft:"auto", fontSize:9, color:tier.color, fontFamily:'"IBM Plex Mono",monospace', flexShrink:0 }}>
          {seed.mmr}
        </span>
      </div>
    );
    }

    function BracketCard({ match }: { match: BracketMatch }) {
    const col = ROUND_COLORS[match.round] ?? "#e8b84b";
    return (
      <div style={{
        background:"linear-gradient(160deg,#0e0e1c,#0a0a14)",
        border:`1px solid ${col}28`, borderRadius:12, padding:"12px 14px", minWidth:210,
        boxShadow: match.round===3 ? `0 0 20px ${col}20` : "none",
      }}>
        <div style={{ fontSize:8, color:col, fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.14em", marginBottom:10 }}>
          {match.round===3?"🏆 ":""}{ROUND_LABELS[match.round]??(`R${match.round}`)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <SeedChip seed={match.seedA} isFavorite={match.favoriteId===match.seedA?.player_id} />
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ flex:1, height:1, background:"#1a1a2a" }}/>
            <span style={{ fontSize:8, color:"#333", fontFamily:'"IBM Plex Mono",monospace' }}>VS</span>
            <div style={{ flex:1, height:1, background:"#1a1a2a" }}/>
          </div>
          <SeedChip seed={match.seedB} isFavorite={match.favoriteId===match.seedB?.player_id} />
        </div>
      </div>
    );
    }

    /** D.3 — Weekly Tournament Panel (bracket predictivo basado en MMR actual) */
    export function WeeklyTournamentPanel() {
    const [data,    setData]    = useState<WeeklyTournamentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open,    setOpen]    = useState(false);

    useEffect(() => {
      getWeeklyTournamentData().then(res => { setData(res.data ?? null); setLoading(false); });
    }, []);

    if (loading || !data || data.seeds.length === 0) return null;

    const rounds = [1,2,3].filter(r => data.bracket.some(m => m.round === r));
    const finalMatch = data.bracket.find(m => m.round===3);
    const favSeed = finalMatch?.favoriteId ? data.seeds.find(s => s.player_id===finalMatch.favoriteId) : null;

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
            background:"linear-gradient(135deg,#1a1205,#2a1f08)",
            border:"1px solid rgba(232,184,75,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          }}>🏆</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontFamily:"Cinzel,serif", fontWeight:800, color:"#e8e8f0", letterSpacing:"0.05em" }}>
              Torneo Semanal
            </div>
            <div style={{ fontSize:10, color:"#666", fontFamily:'"IBM Plex Mono",monospace', marginTop:3 }}>
              {data.total_players} participantes · bracket predictivo por MMR
            </div>
          </div>
          <div style={{
            background:"rgba(232,184,75,0.1)", border:"1px solid rgba(232,184,75,0.25)",
            borderRadius:8, padding:"5px 12px", flexShrink:0, textAlign:"center",
          }}>
            <div style={{ fontSize:10, fontFamily:"Rajdhani,sans-serif", fontWeight:800, color:"#e8b84b" }}>
              TOP {Math.min(8,data.total_players)}
            </div>
            <div style={{ fontSize:7, color:"#555", fontFamily:'"IBM Plex Mono",monospace' }}>SEEDS</div>
          </div>
          <div style={{ color:"#444", fontSize:12, flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.25s" }}>▼</div>
        </button>

        {open && (
          <div style={{ padding:"0 20px 20px" }}>
            {/* Seeds */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:8 }}>CLASIFICADOS</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {data.seeds.map(s => {
                  const tier = getRank(s.mmr);
                  return (
                    <div key={s.player_id} style={{
                      display:"flex", alignItems:"center", gap:6,
                      background:"#0d0d18", border:"1px solid #1a1a2a", borderRadius:8, padding:"5px 10px",
                    }}>
                      <span style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace' }}>#{s.seed}</span>
                      <span style={{ fontSize:12 }}>{tier.icon}</span>
                      <span style={{ fontSize:11, fontFamily:"Rajdhani,sans-serif", fontWeight:700, color:"#c8c8d8" }}>{s.display_name}</span>
                      <span style={{ fontSize:9, color:tier.color, fontFamily:'"IBM Plex Mono",monospace' }}>{s.mmr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bracket */}
            <div style={{ fontSize:9, color:"#444", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.12em", marginBottom:10 }}>
              BRACKET PREDICTIVO
            </div>
            <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:8 }}>
              {rounds.map(round => (
                <div key={round} style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
                  <div style={{ fontSize:8, color:ROUND_COLORS[round], fontFamily:'"IBM Plex Mono",monospace',
                    letterSpacing:"0.12em", textAlign:"center", marginBottom:2 }}>
                    {ROUND_LABELS[round]}
                  </div>
                  {data.bracket.filter(m => m.round===round).map(m => <BracketCard key={m.matchId} match={m} />)}
                </div>
              ))}
            </div>

            {/* Projected champion */}
            {favSeed && (()=>{
              const tier = getRank(favSeed.mmr);
              return (
                <div style={{
                  marginTop:16, padding:"12px 16px", borderRadius:10,
                  background:"linear-gradient(90deg,rgba(232,184,75,0.08),transparent)",
                  border:"1px solid rgba(232,184,75,0.15)",
                  display:"flex", alignItems:"center", gap:12,
                }}>
                  <span style={{ fontSize:20 }}>🏆</span>
                  <div>
                    <div style={{ fontSize:9, color:"#555", fontFamily:'"IBM Plex Mono",monospace', letterSpacing:"0.1em" }}>FAVORITO PREDICTIVO</div>
                    <div style={{ fontFamily:"Cinzel,serif", fontWeight:800, fontSize:14, color:"#e8b84b",
                      display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                      {tier.icon} {favSeed.display_name}
                      <span style={{ fontSize:9, color:tier.color, fontFamily:'"IBM Plex Mono",monospace', fontWeight:400 }}>
                        {tier.name} · {favSeed.mmr} MMR
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
    }
    