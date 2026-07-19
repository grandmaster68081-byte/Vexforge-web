import { useState, useEffect, useRef } from "react";
import { usePvp } from "../domains/pvp/usePvp";
import type { BattleOpponent, BattleResult, BattleTurn } from "../domains/pvp/repository";
import { getRank, tierProgress } from "../lib/rankUtils";

const RARITY_COLOR:Record<string,string> = {
Common:"#8b8b9e", Uncommon:"#3ddc84", Rare:"#4a9eff",
Epic:"#a855f7", Legendary:"#e8b84b", Mythic:"#ff4444",
};

function HpBar({ hp, max=100, color }: { hp:number; max?:number; color:string }) {
const pct = Math.max(0, Math.min(100, (hp/max)*100));
return (
  <div style={{ background:"#1a1a2e", borderRadius:4, height:10, width:"100%", overflow:"hidden" }}>
    <div style={{
      width:`${pct}%`, height:"100%", borderRadius:4,
      background:`linear-gradient(90deg,${color},${color}99)`,
      transition:"width .4s ease",
    }} />
  </div>
);
}

function TurnCard({ turn, active }: { turn:BattleTurn; active:boolean }) {
return (
  <div style={{
    display:"flex", gap:8, padding:"10px 14px", borderRadius:8,
    background: active ? "#1a1a2e" : "#0f0f1a",
    border:`1px solid ${active ? "#2a2a4a" : "#1a1a2a"}`,
    transition:"all .2s",
  }}>
    <div style={{ color:"#555", fontSize:11, minWidth:40 }}>Turn {turn.turn}</div>
    <div style={{ flex:1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ color:RARITY_COLOR[turn.p_rarity]??"#8b8b9e", fontSize:10 }}>⚡</span>
        <span style={{ color:"#e8e8f0", fontSize:11, fontWeight:600 }}>{turn.p_card}</span>
        <span style={{ color:"#e8b84b", fontSize:10 }}>(P:{turn.p_power})</span>
        <span style={{ color:"#555", fontSize:10, margin:"0 4px" }}>VS</span>
        <span style={{ color:RARITY_COLOR[turn.o_rarity]??"#8b8b9e", fontSize:10 }}>⚡</span>
        <span style={{ color:"#aaa", fontSize:11 }}>{turn.o_card}</span>
        <span style={{ color:"#888", fontSize:10 }}>(P:{turn.o_power})</span>
      </div>
    </div>
    <div style={{ fontSize:10, display:"flex", gap:8, alignItems:"center" }}>
      <span style={{ color: turn.p_hp > 50 ? "#3ddc84" : turn.p_hp > 25 ? "#e8b84b" : "#ff6b6b" }}>
        ❤ {turn.p_hp}
      </span>
      <span style={{ color:"#444" }}>|</span>
      <span style={{ color: turn.o_hp > 50 ? "#3ddc84" : turn.o_hp > 25 ? "#e8b84b" : "#ff6b6b" }}>
        ❤ {turn.o_hp}
      </span>
    </div>
  </div>
);
}

function BattleScreen({ result, onDismiss }: { result:BattleResult; onDismiss:()=>void }) {
const [visibleTurns, setVisibleTurns] = useState(0);
const turns = result.turns ?? [];
const containerRef = useRef<HTMLDivElement>(null);
const playerHp = turns[visibleTurns-1]?.p_hp ?? (result.player_final_hp ?? 0);
const opponentHp = turns[visibleTurns-1]?.o_hp ?? (result.opponent_final_hp ?? 0);
const showResult = visibleTurns >= turns.length;

useEffect(() => {
  if (visibleTurns < turns.length) {
    const t = setTimeout(() => {
      setVisibleTurns(v => v+1);
      containerRef.current?.scrollTo({ top:9999, behavior:"smooth" });
    }, 600);
    return () => clearTimeout(t);
  }
}, [visibleTurns, turns.length]);

const skip = () => setVisibleTurns(turns.length);

return (
  <div style={{
    position:"fixed", inset:0, background:"#080810", zIndex:1000,
    display:"flex", flexDirection:"column", padding:24, gap:16, overflowY:"auto",
  }}>
    {/* Header */}
    <div style={{ textAlign:"center" }}>
      <h1 style={{ fontFamily:"Cinzel,serif", color:"#e8b84b", fontSize:24, margin:"0 0 4px" }}>
        ⚔️ Battle
      </h1>
      <div style={{ color:"#555", fontSize:12 }}>
        {result.player_name} vs {result.opponent_name}
      </div>
    </div>

    {/* HP bars */}
    <div style={{ display:"flex", gap:16, maxWidth:600, margin:"0 auto", width:"100%" }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ color:"#4a9eff", fontSize:12, fontFamily:"Cinzel,serif" }}>{result.player_name}</span>
          <span style={{ color:"#3ddc84", fontSize:12 }}>❤ {Math.max(0,playerHp)}</span>
        </div>
        <HpBar hp={playerHp} color="#4a9eff" />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ color:"#e85d04", fontSize:12, fontFamily:"Cinzel,serif" }}>{result.opponent_name}</span>
          <span style={{ color:"#ff6b6b", fontSize:12 }}>❤ {Math.max(0,opponentHp)}</span>
        </div>
        <HpBar hp={opponentHp} color="#e85d04" />
      </div>
    </div>

    {/* Turn log */}
    <div ref={containerRef} style={{
      flex:1, overflowY:"auto", maxWidth:600, margin:"0 auto", width:"100%",
      display:"flex", flexDirection:"column", gap:6,
    }}>
      {turns.slice(0, visibleTurns).map((t,i) => (
        <TurnCard key={t.turn} turn={t} active={i===visibleTurns-1} />
      ))}
      {!showResult && (
        <div style={{ color:"#555", fontSize:12, textAlign:"center", padding:8 }}>
          Turn {visibleTurns+1} of {turns.length}…
        </div>
      )}
    </div>

    {/* Result overlay */}
    {showResult && (
      <div style={{ textAlign:"center", padding:20 }}>
        <div style={{
          fontFamily:"Cinzel,serif", fontSize:36, fontWeight:800,
          color: result.you_won ? "#e8b84b" : "#ff6b6b",
          textShadow: result.you_won ? "0 0 40px #e8b84b66" : "0 0 40px #ff6b6b66",
          marginBottom:8,
        }}>
          {result.you_won ? "VICTORIA" : "DERROTA"}
        </div>
        <div style={{ color:"#888", fontSize:13, marginBottom:4 }}>
          {result.total_turns} turns · Final HP: You {result.player_final_hp} — {result.opponent_name} {result.opponent_final_hp}
        </div>
        {result.elo_change !== undefined && (
          <div style={{ color: result.elo_change >= 0 ? "#3ddc84" : "#ff6b6b", fontSize:14, fontWeight:700, marginBottom:16 }}>
            ELO {result.elo_change >= 0 ? "+" : ""}{result.elo_change}
          </div>
        )}
        <button
          onClick={onDismiss}
          style={{
            padding:"12px 36px", borderRadius:8, border:"none",
            background:"linear-gradient(135deg,#e8b84b,#c9901f)",
            color:"#0a0a12", fontWeight:800, fontSize:14, cursor:"pointer",
            fontFamily:"Cinzel,serif", letterSpacing:1,
          }}
        >Return to Arena</button>
      </div>
    )}

    {!showResult && (
      <button onClick={skip} style={{
        alignSelf:"center", padding:"8px 20px", borderRadius:6, border:"1px solid #2a2a3a",
        background:"transparent", color:"#666", fontSize:12, cursor:"pointer",
      }}>Skip to Result</button>
    )}
  </div>
);
}

function OpponentCard({ opp, onChallenge, disabled }: { opp:BattleOpponent; onChallenge:()=>void; disabled:boolean }) {
return (
  <div style={{
    display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
    background:"#1a1a2e", border:"1px solid #2a2a3a", borderRadius:8,
  }}>
    <div style={{
      width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#2a2a4a,#1a1a2e)",
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0,
    }}>⚔️</div>
    <div style={{ flex:1 }}>
      <div style={{ color:"#e8e8f0", fontWeight:600, fontSize:13 }}>{opp.display_name}</div>
      <div style={{ color:"#555", fontSize:11 }}>Lv.{opp.level} · Deck:{opp.deck_size} · Power:{opp.total_power}</div>
    </div>
    <button
      onClick={onChallenge}
      disabled={disabled}
      style={{
        padding:"7px 16px", borderRadius:6, border:"none",
        background:"linear-gradient(135deg,#e85d04,#c9901f)",
        color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
        opacity:disabled?0.5:1,
      }}
    >{disabled ? "…" : "Battle"}</button>
  </div>
);
}

export function PvpRoute() {
const { seasons, rankings, matches, opponents, loading, opponentsLoading,
  battling, battleResult, error, playerId,
  loadOpponents, battle, dismissBattle } = usePvp();

const season = seasons[0] ?? null;
const playerRank = playerId ? (rankings.find(r => r.player_id === playerId) ?? null) : null;
const rankChange = null as { promoted: boolean; demoted: boolean; mmrDelta: number } | null;

if (battleResult) return <BattleScreen result={battleResult} onDismiss={dismissBattle} />;

return (
  <main style={{ maxWidth:920, margin:"0 auto", padding:"32px 16px" }}>
    <div style={{ marginBottom:28 }}>
      <h1 style={{ fontFamily:"Cinzel,serif", color:"#e8b84b", fontSize:26, margin:"0 0 6px" }}>⚔️ Arena</h1>
      <p style={{ color:"#888", margin:0, fontSize:13 }}>Challenge opponents to turn-by-turn card battles.</p>
    </div>

    {error && <div style={{ background:"#2a1a1a", border:"1px solid #ff6b6b33", borderRadius:8, padding:"12px 16px", color:"#ff6b6b", marginBottom:20 }}>{error}</div>}

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
      {/* Left: Find Opponents */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <h2 style={{ fontFamily:"Cinzel,serif", color:"#e8e8f0", fontSize:17, margin:0 }}>Find Opponents</h2>
          <button
            onClick={loadOpponents}
            disabled={opponentsLoading}
            style={{
              padding:"6px 14px", borderRadius:6, border:"1px solid #2a2a3a",
              background:"transparent", color:"#aaa", fontSize:12, cursor:"pointer",
            }}
          >{opponentsLoading ? "Searching…" : "🔍 Search"}</button>
        </div>
        {opponents.length === 0 && !opponentsLoading && (
          <div style={{ background:"#1a1a2e", border:"1px solid #2a2a3a", borderRadius:10, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
            <p style={{ color:"#555", margin:0, fontSize:13 }}>Click Search to find opponents ready to battle.</p>
          </div>
        )}
        {/* ── Rank Badge Panel ── */}
          {playerRank && (() => {
            const tier = getRank(playerRank.mmr);
            const prog = tierProgress(playerRank.mmr);
            return (
              <div style={{background:"#0e0e1a",border:`1px solid ${tier.color}55`,borderRadius:12,
                padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
                <div style={{textAlign:"center",minWidth:52}}>
                  <div style={{fontSize:34,lineHeight:1}}>{tier.icon}</div>
                  <div style={{color:tier.color,fontWeight:800,fontSize:10,letterSpacing:"0.08em",marginTop:3}}>
                    {tier.name.toUpperCase()}
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{color:"#e8e8f0",fontWeight:700,fontSize:13}}>{playerRank.mmr} MMR</span>
                    <span style={{color:"#555",fontSize:10}}>{playerRank.wins}W · {playerRank.losses}L</span>
                  </div>
                  <div style={{background:"#1a1a2e",borderRadius:20,height:5,overflow:"hidden"}}>
                    <div style={{width:`${prog}%`,height:"100%",background:`linear-gradient(90deg,${tier.color}88,${tier.color})`,transition:"width 0.6s"}}/>
                  </div>
                  {((playerRank as any).shields ?? 0) > 0 && (
                    <div style={{marginTop:5,display:"flex",gap:3,alignItems:"center"}}>
                      {Array.from({length:(playerRank as any).shields ?? 0}).map((_,i)=><span key={i} style={{fontSize:11}}>🛡️</span>)}
                      <span style={{color:"#a855f7",fontSize:8,fontWeight:700,letterSpacing:"0.05em"}}>SHIELDS</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {rankChange && (
            <div style={{padding:"9px 14px",borderRadius:8,marginBottom:10,textAlign:"center",fontWeight:700,fontSize:12,
              background:rankChange.promoted?"#1a3a1a":rankChange.demoted?"#3a1a1a":"#1a1a2e",
              color:rankChange.promoted?"#3ddc84":rankChange.demoted?"#ff6b6b":"#a855f7",
              border:`1px solid ${rankChange.promoted?"#3ddc84":rankChange.demoted?"#ff6b6b":"#a855f7"}44`}}>
              {rankChange.promoted?"🎉 ¡ASCENSO DE RANGO!":rankChange.demoted?"📉 Descenso de rango":"🛡️ Escudo consumido · rango protegido"}
              {" "}({rankChange.mmrDelta >= 0 ? "+" : ""}{rankChange.mmrDelta} MMR)
            </div>
          )}
          {opponentsLoading && <p style={{ color:"#555" }}>Searching arena…</p>}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {opponents.filter(o => o.player_id !== playerId).slice(0,10).map(opp => (
            <OpponentCard
              key={opp.player_id} opp={opp}
              onChallenge={() => battle(opp.player_id)}
              disabled={battling}
            />
          ))}
        </div>
        {battling && (
          <div style={{ marginTop:16, padding:"16px 0", textAlign:"center" }}>
            <div style={{ color:"#e8b84b", fontFamily:"Cinzel,serif", fontSize:14, marginBottom:6 }}>
              ⚔️ Battle in progress…
            </div>
            <div style={{ color:"#555", fontSize:12 }}>Calculating turns…</div>
          </div>
        )}
      </div>

      {/* Right: Recent Matches + Leaderboard */}
      <div>
        <h2 style={{ fontFamily:"Cinzel,serif", color:"#e8e8f0", fontSize:17, margin:"0 0 12px" }}>Recent Battles</h2>
        {loading && <p style={{ color:"#666" }}>Loading…</p>}
        {!loading && matches.length === 0 && (
          <p style={{ color:"#555", fontSize:13 }}>No battles yet. Challenge an opponent!</p>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:24 }}>
          {matches.slice(0,8).map(m => {
            const youAre = m.player_a === playerId ? "a" : "b";
            const won = m.winner === playerId;
            const isDraw = !m.winner;
            const eloChange = youAre==="a" ? m.elo_change_a : m.elo_change_b;
            return (
              <div key={m.id} style={{
                display:"flex", alignItems:"center", gap:10, padding:"9px 14px",
                background:"#1a1a2e", border:"1px solid #2a2a3a", borderRadius:7,
              }}>
                <span style={{
                  padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700,
                  background: won ? "#1a3a1a" : isDraw ? "#2a2a2a" : "#3a1a1a",
                  color: won ? "#3ddc84" : isDraw ? "#888" : "#ff6b6b",
                }}>
                  {isDraw ? "DRAW" : won ? "WIN" : "LOSS"}
                </span>
                <span style={{ color:"#888", fontSize:11, flex:1 }}>
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
                {eloChange != null && (
                  <span style={{ color:eloChange>=0?"#3ddc84":"#ff6b6b", fontSize:11, fontWeight:700 }}>
                    {eloChange>=0?"+":""}{eloChange} ELO
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Season info */}
        {season && (
          <div>
            <h2 style={{ fontFamily:"Cinzel,serif", color:"#e8e8f0", fontSize:17, margin:"0 0 12px" }}>
              🏆 {season.name}
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {rankings.slice(0,10).map((r,i) => (
                <div key={r.id} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  background:"#1a1a2e", borderRadius:6,
                }}>
                  <span style={{ color:["#e8702a","#8a8a9e","#e8b339"][i]??"#555", fontSize:12, minWidth:20, fontWeight:700 }}>
                    {i+1}
                  </span>
                  <span style={{ color:"#e8e8f0", fontSize:12, flex:1 }}>{r.player_id.substring(0,8)}</span>
                  <span style={{ color:"#e8b84b", fontSize:11 }}>{r.mmr} MMR</span>
                  <span style={{ color:"#3ddc84", fontSize:10 }}>{r.wins}W</span>
                  <span style={{ color:"#ff6b6b", fontSize:10 }}>{r.losses}L</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </main>
);
}