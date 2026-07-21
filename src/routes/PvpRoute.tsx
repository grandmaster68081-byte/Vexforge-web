import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useState, useEffect, useRef } from "react";
import { usePvp } from "../domains/pvp/usePvp";
import type { BattleOpponent, BattleResult, BattleTurn } from "../domains/pvp/repository";
    import type { RealBattleResult } from "../lib/battleTypes";
    import { BattleCinematicScreen } from "../components/battle/BattleCinematicScreen";
import { getRank, tierProgress } from "../lib/rankUtils";
import { SeasonRewardsPanel } from "../shared/components/SeasonRewardsPanel";
import { MatchHistoryPanel } from "../shared/components/MatchHistoryPanel";
import { WeeklyTournamentPanel } from "../shared/components/WeeklyTournamentPanel";
import { ClanWarsPanel } from "../shared/components/ClanWarsPanel";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_pvp.jpg";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};

function HpBar({ hp, max = 100, color }: { hp: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 4, height: 10, width: "100%", overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: 4,
        background: `linear-gradient(90deg,${color},${color}99)`,
        transition: "width .4s ease",
      }} />
    </div>
  );
}

function TurnCard({ turn, active }: { turn: BattleTurn; active: boolean }) {
  return (
    <div style={{
      display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8,
      background: active ? "#1a1a2e" : "#0f0f1a",
      border: `1px solid ${active ? "#2a2a4a" : "#1a1a2a"}`,
      transition: "all .2s",
    }}>
      <div style={{ color: "#555", fontSize: 11, minWidth: 40 }}>Turn {turn.turn}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: RARITY_COLOR[turn.p_rarity] ?? "#8b8b9e", fontSize: 10 }}>⚡</span>
          <span style={{ color: "#e8e8f0", fontSize: 11, fontWeight: 600 }}>{turn.p_card}</span>
          <span style={{ color: "#e8b84b", fontSize: 10 }}>(P:{turn.p_power})</span>
          <span style={{ color: "#555", fontSize: 10, margin: "0 4px" }}>VS</span>
          <span style={{ color: RARITY_COLOR[turn.o_rarity] ?? "#8b8b9e", fontSize: 10 }}>⚡</span>
          <span style={{ color: "#aaa", fontSize: 11 }}>{turn.o_card}</span>
          <span style={{ color: "#888", fontSize: 10 }}>(P:{turn.o_power})</span>
        </div>
      </div>
      <div style={{ fontSize: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: turn.p_hp > 50 ? "#3ddc84" : turn.p_hp > 25 ? "#e8b84b" : "#ff6b6b" }}>❤ {turn.p_hp}</span>
        <span style={{ color: "#444" }}>|</span>
        <span style={{ color: turn.o_hp > 50 ? "#3ddc84" : turn.o_hp > 25 ? "#e8b84b" : "#ff6b6b" }}>❤ {turn.o_hp}</span>
      </div>
    </div>
  );
}

/**
 * BattleScreen v5.11
 * Handles two modes:
 * - With turns (turn-by-turn replay, 600ms per turn)
 * - Without turns (instant resolve via start_pvp_match): shows suspense animation → reveal
 */
function BattleScreen({ result, onDismiss }: { result: BattleResult; onDismiss: () => void }) {
  const turns = result.turns ?? [];
  const hasNoTurns = turns.length === 0;

  // No-turns mode: suspense → reveal
  const [revealed, setRevealed] = useState(false);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!hasNoTurns) return;
    const p = setInterval(() => setPulse(n => n + 1), 300);
    const t = setTimeout(() => { setRevealed(true); clearInterval(p); }, 1600);
    return () => { clearInterval(p); clearTimeout(t); };
  }, [hasNoTurns]);

  // Turn-replay mode
  const [visibleTurns, setVisibleTurns] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const showResult = hasNoTurns ? revealed : visibleTurns >= turns.length;
  const playerHp = turns[visibleTurns - 1]?.p_hp ?? (result.player_final_hp ?? 0);
  const opponentHp = turns[visibleTurns - 1]?.o_hp ?? (result.opponent_final_hp ?? 0);

  useEffect(() => {
    if (hasNoTurns || visibleTurns >= turns.length) return;
    const t = setTimeout(() => {
      setVisibleTurns(v => v + 1);
      containerRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
    }, 600);
    return () => clearTimeout(t);
  }, [visibleTurns, turns.length, hasNoTurns]);

  const skip = () => { if (!hasNoTurns) setVisibleTurns(turns.length); else setRevealed(true); };
  const won = result.you_won ?? false;

  // No-turns: show suspense screen
  if (hasNoTurns && !revealed) {
    const dots = ".".repeat((pulse % 3) + 1);
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#080810", zIndex: 1000,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
      }}>
        <div style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 28, fontWeight: 800 }}>⚔️ Batalla</div>
        <div style={{ color: "#e8e8f0", fontSize: 16 }}>{result.player_name} <span style={{ color: "#555" }}>vs</span> {result.opponent_name}</div>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: `3px solid ${won ? "#e8b84b" : "#2a2a3a"}`,
          borderTopColor: "#e8b84b",
          animation: "spin 0.8s linear infinite",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
        }}>⚔️</div>
        <div style={{ color: "#555", fontSize: 14 }}>Calculando resultado{dots}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <button onClick={skip} style={{
          marginTop: 8, padding: "8px 22px", borderRadius: 6, border: "1px solid #2a2a3a",
          background: "transparent", color: "#555", fontSize: 12, cursor: "pointer",
        }}>Ver resultado</button>
      </div>
    );
  }

  // Result reveal (both modes)
  if (showResult) {
    const eloChange = result.elo_change ?? 0;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#080810", zIndex: 1000,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 20, padding: 32,
      }}>
        <div style={{
          fontFamily: "Cinzel,serif",
          fontSize: 48, fontWeight: 900,
          color: won ? "#e8b84b" : "#ff6b6b",
          textShadow: won ? "0 0 60px #e8b84b88" : "0 0 60px #ff6b6b88",
          letterSpacing: 4,
        }}>
          {won ? "VICTORIA" : "DERROTA"}
        </div>
        <div style={{ color: "#e8e8f0", fontSize: 15, textAlign: "center" }}>
          {result.player_name} <span style={{ color: won ? "#e8b84b" : "#ff6b6b" }}>{won ? "venció a" : "perdió ante"}</span> {result.opponent_name}
        </div>
        {eloChange !== 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: eloChange > 0 ? "#1a3a1a" : "#3a1a1a",
            border: `1px solid ${eloChange > 0 ? "#3ddc8444" : "#ff6b6b44"}`,
            borderRadius: 10, padding: "10px 24px",
          }}>
            <span style={{ color: "#888", fontSize: 12 }}>MMR</span>
            <span style={{
              color: eloChange >= 0 ? "#3ddc84" : "#ff6b6b",
              fontSize: 22, fontWeight: 800,
            }}>{eloChange >= 0 ? "+" : ""}{eloChange}</span>
          </div>
        )}
        {result.match_id && (
          <div style={{ color: "#333", fontSize: 10 }}>ID: {result.match_id.substring(0, 16)}…</div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={onDismiss} style={{
            padding: "12px 36px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#e8b84b,#c9901f)",
            color: "#0a0a12", fontWeight: 800, fontSize: 14, cursor: "pointer",
            fontFamily: "Cinzel,serif", letterSpacing: 1,
          }}>Volver a la Arena</button>
        </div>
      </div>
    );
  }

  // Turn-replay mode (in-progress)
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#080810", zIndex: 1000,
      display: "flex", flexDirection: "column", padding: 24, gap: 16, overflowY: "auto",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 24, margin: "0 0 4px" }}>⚔️ Battle</h1>
        <div style={{ color: "#555", fontSize: 12 }}>{result.player_name} vs {result.opponent_name}</div>
      </div>
      <div style={{ display: "flex", gap: 16, maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#4a9eff", fontSize: 12, fontFamily: "Cinzel,serif" }}>{result.player_name}</span>
            <span style={{ color: "#3ddc84", fontSize: 12 }}>❤ {Math.max(0, playerHp)}</span>
          </div>
          <HpBar hp={playerHp} color="#4a9eff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#e85d04", fontSize: 12, fontFamily: "Cinzel,serif" }}>{result.opponent_name}</span>
            <span style={{ color: "#ff6b6b", fontSize: 12 }}>❤ {Math.max(0, opponentHp)}</span>
          </div>
          <HpBar hp={opponentHp} color="#e85d04" />
        </div>
      </div>
      <div ref={containerRef} style={{
        flex: 1, overflowY: "auto", maxWidth: 600, margin: "0 auto", width: "100%",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {turns.slice(0, visibleTurns).map((t, i) => (
          <TurnCard key={t.turn} turn={t} active={i === visibleTurns - 1} />
        ))}
        {visibleTurns < turns.length && (
          <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 8 }}>
            Turn {visibleTurns + 1} of {turns.length}…
          </div>
        )}
      </div>
      <button onClick={skip} style={{
        alignSelf: "center", padding: "8px 20px", borderRadius: 6, border: "1px solid #2a2a3a",
        background: "transparent", color: "#666", fontSize: 12, cursor: "pointer",
      }}>Skip to Result</button>
    </div>
  );
}

/** v5.11: OpponentCard shows rank tier icon + MMR (total_power = mmr from leaderboard fix) */
function OpponentCard({ opp, onChallenge, disabled }: { opp: BattleOpponent; onChallenge: () => void; disabled: boolean }) {
  const tier = getRank(opp.total_power);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 8,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: `linear-gradient(135deg,${tier.color}22,#1a1a2e)`,
        border: `1px solid ${tier.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
      }}>{tier.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{opp.display_name}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ color: tier.color, fontSize: 10, fontWeight: 700 }}>{tier.name}</span>
          <span style={{ color: "#555", fontSize: 10 }}>{opp.total_power} MMR</span>
        </div>
      </div>
      <button
        onClick={onChallenge}
        disabled={disabled}
        style={{
          padding: "7px 16px", borderRadius: 6, border: "none",
          background: "linear-gradient(135deg,#e85d04,#c9901f)",
          color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >{disabled ? "…" : "⚔️ Battle"}</button>
    </div>
  );
}

export function PvpRoute() {
  const { seasons, rankings, matches, opponents, loading, opponentsLoading,
    battling, battleResult, error, playerId,
    loadOpponents, battle, dismissBattle } = usePvp();

  if (loading) return <PageLoader />;
  if (!loading && !playerId) return <BlockedAuthState message="Inicia sesión para competir en el Arena PvP y ganar MMR." />;

  const season = seasons[0] ?? null;
  const playerRank = playerId ? (rankings.find(r => r.player_id === playerId) ?? null) : null;

  if (battleResult) return <BattleCinematicScreen result={battleResult as unknown as RealBattleResult} opponentName="Oponente" onDismiss={dismissBattle} />;

  const played = (playerRank?.wins ?? 0) + (playerRank?.losses ?? 0) + (playerRank?.draws ?? 0);
  const winRate = played > 0 ? Math.round(((playerRank?.wins ?? 0) / played) * 100) : 0;

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      <SeasonRewardsPanel />
      <WeeklyTournamentPanel />
      <ClanWarsPanel />
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 26, margin: "0 0 6px" }}>⚔️ Arena PvP</h1>
        <p style={{ color: "#888", margin: 0, fontSize: 13 }}>Desafía a otros Forjadores. El poder de tu mazo determina la victoria.</p>
      </div>

      {error && (
        <div style={{ background: "#2a1a1a", border: "1px solid #ff6b6b33", borderRadius: 8, padding: "12px 16px", color: "#ff6b6b", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* My Rank Banner — appears when player has ranking data */}
      {playerRank && (() => {
        const tier = getRank(playerRank.mmr);
        const prog = tierProgress(playerRank.mmr);
        return (
          <div style={{
            background: `linear-gradient(135deg,${tier.color}11,#0e0e1a)`,
            border: `1px solid ${tier.color}44`,
            borderRadius: 14, padding: "18px 22px", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ textAlign: "center", minWidth: 52 }}>
                <div style={{ fontSize: 38, lineHeight: 1 }}>{tier.icon}</div>
                <div style={{ color: tier.color, fontWeight: 800, fontSize: 10, letterSpacing: "0.08em", marginTop: 3 }}>
                  {tier.name.toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 15 }}>{playerRank.mmr} MMR</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: "#3ddc84" }}>{playerRank.wins}W</span>
                    <span style={{ color: "#ff6b6b" }}>{playerRank.losses}L</span>
                    {playerRank.draws > 0 && <span style={{ color: "#888" }}>{playerRank.draws}D</span>}
                    {played > 0 && <span style={{ color: "#e8b84b", fontWeight: 700 }}>{winRate}% WR</span>}
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 20, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: `${prog}%`, height: "100%",
                    background: `linear-gradient(90deg,${tier.color}88,${tier.color})`,
                    transition: "width 0.6s",
                  }} />
                </div>
                {playerRank.rank_position && (
                  <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
                    Posición global: #{playerRank.rank_position}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* LEFT: Arena */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 17, margin: 0 }}>Oponentes</h2>
            <button
              onClick={loadOpponents}
              disabled={opponentsLoading || battling}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid #2a2a3a",
                background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer",
              }}
            >{opponentsLoading ? "Buscando…" : "🔍 Buscar"}</button>
          </div>

          {opponents.length === 0 && !opponentsLoading && (
            <div style={{
              background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10,
              padding: 24, textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <p style={{ color: "#555", margin: 0, fontSize: 13 }}>Pulsa "Buscar" para encontrar oponentes del servidor.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {opponents.map(opp => (
              <OpponentCard
                key={opp.player_id}
                opp={opp}
                disabled={battling}
                onChallenge={() => battle(opp.player_id)}
              />
            ))}
          </div>

          {battling && (
            <div style={{
              marginTop: 12, padding: "10px 16px", borderRadius: 8,
              background: "#1a1a2e", color: "#e8b84b", fontSize: 13,
              textAlign: "center", fontFamily: "Cinzel,serif",
            }}>⚔️ Calculando batalla…</div>
          )}
        </div>

        {/* RIGHT: History + Rankings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Match History */}
          <MatchHistoryPanel />

          {/* Season Rankings */}
          {season && (
            <div>
              <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 17, margin: "0 0 12px" }}>
                🏆 {season.name}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {rankings.slice(0, 10).map((r, i) => {
                  const tier = getRank(r.mmr);
                  const isMe = r.player_id === playerId;
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: isMe ? `${tier.color}11` : "#1a1a2e",
                      border: `1px solid ${isMe ? tier.color + "44" : "#2a2a3a"}`,
                      borderRadius: 6,
                    }}>
                      <span style={{ color: ["#e8702a", "#8a8a9e", "#e8b339"][i] ?? "#555", fontSize: 12, minWidth: 20, fontWeight: 700 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 14 }}>{tier.icon}</span>
                      <span style={{ color: isMe ? "#e8e8f0" : "#ccc", fontSize: 12, flex: 1, fontWeight: isMe ? 700 : 400 }}>
                        {r.display_name ?? r.player_id.substring(0, 8)}
                        {isMe && <span style={{ color: tier.color, fontSize: 9, marginLeft: 6 }}>TÚ</span>}
                      </span>
                      <span style={{ color: "#e8b84b", fontSize: 11 }}>{r.mmr} MMR</span>
                      <span style={{ color: "#3ddc84", fontSize: 10 }}>{r.wins}W</span>
                      <span style={{ color: "#ff6b6b", fontSize: 10 }}>{r.losses}L</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
