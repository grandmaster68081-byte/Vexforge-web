import { useState, useEffect } from "react";
    import { getPlayerSeasonData } from "../../domains/pvp/seasonRepository";
    import type { PlayerSeasonData, SeasonRankEntry } from "../../domains/pvp/seasonRepository";
    import { getRank, tierProgress, getNextTier } from "../../lib/rankUtils";
    import { AnimatedProgressBar } from "./AnimatedProgressBar";

    /** Format ms remaining to a readable string */
    function formatTimeLeft(endsAt: string): string {
    const ms = new Date(endsAt).getTime() - Date.now();
    if (ms <= 0) return "Finalizada";
    const days  = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    if (days > 1)  return `${days} días restantes`;
    if (days === 1) return `1 día ${hours}h restantes`;
    return `${hours}h restantes`;
    }

    const REWARD_ICONS: Record<string, string> = {
    "Legendary Pack": "👑", "Epic Pack": "💜", "Rare Pack": "💎",
    "Uncommon Pack": "🌿", "Common Pack": "📦",
    };
    const POSITION_LABELS = ["1°", "2°", "3°"];
    const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

    function RewardTierRow({ position, reward, highlight }: { position: string; reward: string; highlight?: boolean }) {
    const icon = REWARD_ICONS[reward] ?? "🎁";
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 14px", borderRadius: 8,
        background: highlight ? "rgba(232,184,75,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${highlight ? "rgba(232,184,75,0.2)" : "rgba(255,255,255,0.04)"}`,
        marginBottom: 5,
      }}>
        <span style={{ fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', color: highlight ? "#e8b84b" : "#666", minWidth: 28 }}>
          {position}
        </span>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: highlight ? "#e8e8f0" : "#aaa", letterSpacing: "0.04em" }}>
          {reward}
        </span>
      </div>
    );
    }

    function LeaderboardRow({ entry, index }: { entry: SeasonRankEntry; index: number }) {
    const tier = getRank(entry.mmr);
    const isTop3 = index < 3;
    const wl = entry.wins + entry.losses + entry.draws > 0
      ? `${entry.wins}W · ${entry.losses}L` : "Sin partidas";
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px", borderRadius: 8,
        background: entry.is_self
          ? "linear-gradient(90deg,rgba(232,184,75,0.08),rgba(232,184,75,0.04))"
          : index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
        border: entry.is_self ? "1px solid rgba(232,184,75,0.2)" : "1px solid transparent",
      }}>
        {/* Position */}
        <div style={{ minWidth: 28, textAlign: "center", fontSize: isTop3 ? 16 : 11, color: "#555" }}>
          {isTop3 ? MEDAL_ICONS[index] : `${index + 1}`}
        </div>
        {/* Tier icon */}
        <div style={{ fontSize: 14 }}>{tier.icon}</div>
        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 13,
            color: entry.is_self ? "#e8b84b" : "#e8e8f0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.display_name}{entry.is_self ? " (tú)" : ""}
          </div>
          <div style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace' }}>{wl}</div>
        </div>
        {/* MMR */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontFamily: "Cinzel,serif", fontWeight: 800, color: tier.color }}>{entry.mmr}</div>
          <div style={{ fontSize: 8, color: "#333", fontFamily: '"IBM Plex Mono",monospace' }}>MMR</div>
        </div>
      </div>
    );
    }

    /** D.1 — Season Rewards Panel */
    export function SeasonRewardsPanel() {
    const [data,    setData]    = useState<PlayerSeasonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open,    setOpen]    = useState(false);

    useEffect(() => {
      getPlayerSeasonData().then(res => {
        setData(res.data ?? null);
        setLoading(false);
      });
    }, []);

    if (loading || !data) return null;

    const { season, myRanking, leaderboard } = data;
    const top3Rewards: string[] = season.reward_json.top3_rewards ?? ["Legendary Pack", "Epic Pack", "Rare Pack"];
    const xpBonus: number       = season.reward_json.xp_bonus ?? 1.5;
    const timeLeft              = formatTimeLeft(season.ends_at);
    const isEnded               = timeLeft === "Finalizada";

    const myTier     = myRanking ? getRank(myRanking.mmr) : null;
    const myNextTier = myTier ? getNextTier(myTier.name) : null;
    const myProgress = myRanking ? tierProgress(myRanking.mmr) : 0;

    // Which reward does my current position earn?
    const myReward = myRanking
      ? myRanking.rank_position && myRanking.rank_position <= 3
        ? top3Rewards[myRanking.rank_position - 1] ?? null
        : null
      : null;

    return (
      <div style={{
        background: "linear-gradient(135deg,#0a0a16 0%,#0f0f1e 60%,#080812 100%)",
        border: "1px solid rgba(232,184,75,0.15)",
        borderRadius: 16, marginBottom: 24, overflow: "hidden",
      }}>
        {/* ─── Header bar ─────────────────────────────────────────── */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
            textAlign: "left",
          }}
        >
          {/* Season icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#1a1a2e,#0e0e1e)",
            border: "1px solid rgba(232,184,75,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>⚔️</div>

          {/* Season info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 14, fontFamily: "Cinzel,serif", fontWeight: 800,
                color: "#e8e8f0", letterSpacing: "0.05em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {season.name}
              </span>
              <span style={{
                background: isEnded ? "#2a1a1a" : "rgba(61,220,132,0.12)",
                border: `1px solid ${isEnded ? "rgba(255,100,100,0.3)" : "rgba(61,220,132,0.3)"}`,
                borderRadius: 6, padding: "1px 7px",
                fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700,
                color: isEnded ? "#ff6b6b" : "#3ddc84", letterSpacing: "0.1em",
              }}>
                {isEnded ? "FINALIZADA" : "ACTIVA"}
              </span>
            </div>
            <div style={{
              fontSize: 10, color: "#666", fontFamily: '"IBM Plex Mono",monospace', marginTop: 3,
            }}>
              {timeLeft}
              {myTier && (
                <span style={{ marginLeft: 12, color: myTier.color }}>
                  {myTier.icon} {myTier.name}
                  {myRanking?.rank_position ? ` · Pos. ${myRanking.rank_position}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* XP bonus badge */}
          <div style={{
            background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: 8, padding: "5px 10px", flexShrink: 0, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontFamily: "Cinzel,serif", fontWeight: 800, color: "#a855f7" }}>×{xpBonus}</div>
            <div style={{ fontSize: 8, color: "#555", fontFamily: '"IBM Plex Mono",monospace' }}>XP BONUS</div>
          </div>

          {/* Chevron */}
          <div style={{
            color: "#444", fontSize: 12, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}>▼</div>
        </button>

        {/* ─── Expanded content ────────────────────────────────────── */}
        {open && (
          <div style={{ padding: "0 20px 20px" }}>

            {/* My rank card */}
            {myRanking && myTier && (
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "14px 16px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `linear-gradient(135deg,${myTier.color}22,${myTier.color}08)`,
                    border: `1px solid ${myTier.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>
                    {myTier.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 16, color: myTier.color }}>
                        {myTier.name}
                      </span>
                      <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, color: "#555" }}>
                        {myRanking.mmr} MMR
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#444", fontFamily: "Rajdhani,sans-serif", marginTop: 2 }}>
                      Pos. #{myRanking.rank_position ?? "—"} · {myRanking.wins}W {myRanking.losses}L {myRanking.draws}D
                    </div>
                  </div>
                  {myReward && (
                    <div style={{
                      background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.25)",
                      borderRadius: 8, padding: "6px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 16 }}>{REWARD_ICONS[myReward] ?? "🎁"}</div>
                      <div style={{ fontSize: 8, color: "#e8b84b", fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>
                        RECOMPENSA
                      </div>
                    </div>
                  )}
                </div>
                {/* Tier progress */}
                {myNextTier && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace' }}>
                        Progreso hacia {myNextTier.name}
                      </span>
                      <span style={{ fontSize: 9, color: myTier.color, fontFamily: '"IBM Plex Mono",monospace' }}>
                        {myRanking.mmr} / {myNextTier.min}
                      </span>
                    </div>
                    <AnimatedProgressBar current={myProgress} max={100} color={myTier.color} height={4} />
                  </div>
                )}
              </div>
            )}

            {/* Two columns: rewards + leaderboard */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Reward tiers */}
              <div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em", marginBottom: 10 }}>
                  RECOMPENSAS FINALES
                </div>
                {top3Rewards.map((reward, i) => (
                  <RewardTierRow
                    key={i}
                    position={POSITION_LABELS[i]}
                    reward={reward}
                    highlight={myRanking?.rank_position === i + 1}
                  />
                ))}
                {xpBonus > 1 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 14px", borderRadius: 8,
                    background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)",
                    marginTop: 8,
                  }}>
                    <span style={{ fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', color: "#555", minWidth: 28 }}>Top</span>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <span style={{ fontSize: 12, fontFamily: "Rajdhani,sans-serif", fontWeight: 700, color: "#a855f7", letterSpacing: "0.04em" }}>
                      XP Bonus ×{xpBonus} — todos
                    </span>
                  </div>
                )}
              </div>

              {/* Mini leaderboard */}
              <div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em", marginBottom: 10 }}>
                  CLASIFICACIÓN ACTUAL
                </div>
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <LeaderboardRow key={entry.player_id} entry={entry} index={i} />
                ))}
                {leaderboard.length === 0 && (
                  <div style={{ color: "#333", fontSize: 11, fontFamily: "Rajdhani,sans-serif", padding: "12px 0" }}>
                    Sin clasificación todavía
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
    }
    