import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePvp } from "../domains/pvp/usePvp";
import type { BattleOpponent } from "../domains/pvp/repository";
import type { RealBattleResult } from "../lib/battleTypes";
import { InteractiveBattleBoard } from "../components/battle/InteractiveBattleBoard";
import { getRank, tierProgress } from "../lib/rankUtils";
import { SeasonRewardsPanel } from "../shared/components/SeasonRewardsPanel";
import { MatchHistoryPanel } from "../shared/components/MatchHistoryPanel";
import { WeeklyTournamentPanel } from "../shared/components/WeeklyTournamentPanel";
import { ClanWarsPanel } from "../shared/components/ClanWarsPanel";
import { simulateAIBattle, loadPlayerBattleUnits, getDailyAIChallenge, hasDailyChallengeAttempted, markDailyChallengeAttempted, hasDailyChallengeBadge, markDailyChallengeBadge, claimDailyAIChallenge, DAILY_CHALLENGE_VEX_REWARD, BATTLE_MODE_META, type BattleMode, type DailyAIChallenge } from "../lib/aiBattleEngine";
    import { supabase } from "../lib/supabase";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_pvp.jpg";


// ─── AI.1: Matchmaking Overlay ────────────────────────────────────────────────
function MatchmakingOverlay({ onCancel }: { onCancel: () => void }) {
  const [dots, setDots] = useState(1);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const d = setInterval(() => setDots(n => n >= 3 ? 1 : n + 1), 500);
    const p = setInterval(() => setPulse(v => !v), 800);
    return () => { clearInterval(d); clearInterval(p); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(5,5,14,0.95)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32,
    }}>
      <style>{`
        @keyframes mmk-spin { to { transform: rotate(360deg); } }
        @keyframes mmk-ping { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes mmk-orbit {
          0%   { transform: rotate(0deg) translateX(54px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
        }
      `}</style>

      {/* Spinning ring + sword center */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#e8b84b", borderRightColor: "#e8b84b44",
          animation: "mmk-spin 1.2s linear infinite",
        }} />
        {/* Inner ring */}
        <div style={{
          position: "absolute", inset: 16, borderRadius: "50%",
          border: "1px solid transparent",
          borderBottomColor: "#4a9eff", borderLeftColor: "#4a9eff44",
          animation: "mmk-spin 0.8s linear infinite reverse",
        }} />
        {/* Orbiting dot */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 8, height: 8, borderRadius: "50%",
          background: "#e8b84b",
          marginTop: -4, marginLeft: -4,
          animation: "mmk-orbit 1.2s linear infinite",
          boxShadow: "0 0 8px #e8b84b",
        }} />
        {/* Center icon */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
          animation: "mmk-ping 1.6s ease-in-out infinite",
        }}>⚔️</div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 style={{
          fontFamily: "Cinzel,serif", color: "#e8b84b",
          fontSize: 22, fontWeight: 900, letterSpacing: "0.06em",
          margin: "0 0 8px",
        }}>
          Buscando Oponentes{".".repeat(dots)}
        </h2>
        <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
          Analizando el servidor · Igualando MMR
        </p>
      </div>

      {/* Scanning bars */}
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 32 }}>
        {[0.4, 0.7, 1.0, 0.7, 0.4, 0.6, 0.9, 0.5, 0.8, 0.3].map((h, i) => (
          <div key={i} style={{
            width: 4, borderRadius: 2,
            background: "#e8b84b",
            height: `${h * 100}%`,
            opacity: pulse ? h : h * 0.4,
            transition: `opacity ${0.2 + i * 0.05}s ease`,
          }} />
        ))}
      </div>

      <button
        onClick={onCancel}
        style={{
          padding: "10px 28px", borderRadius: 8,
          border: "1px solid #2a2a3a",
          background: "rgba(255,255,255,0.04)",
          color: "#666", fontSize: 13, cursor: "pointer",
          fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
          letterSpacing: "0.04em",
          transition: "color 0.2s, border-color 0.2s",
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = "#e3573f"; (e.target as HTMLButtonElement).style.borderColor = "#e3573f44"; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = "#666"; (e.target as HTMLButtonElement).style.borderColor = "#2a2a3a"; }}
      >
        Cancelar búsqueda
      </button>
    </div>
  );
}

// ─── AI.1: Pre-Battle Confirmation Modal ──────────────────────────────────────
function PreBattleModal({
  opponent, myMmr, onConfirm, onCancel, battling,
}: {
  opponent: BattleOpponent;
  myMmr: number;
  onConfirm: () => void;
  onCancel: () => void;
  battling: boolean;
}) {
  const myTier  = getRank(myMmr);
  const oppTier = getRank(opponent.total_power);
  const mmrDiff = opponent.total_power - myMmr;
  const advantage = mmrDiff < -100 ? "favorable" : mmrDiff > 100 ? "desventaja" : "equilibrado";
  const advColor  = advantage === "favorable" ? "#3ddc84" : advantage === "desventaja" ? "#ff6b6b" : "#e8b84b";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onCancel} style={{
        position: "fixed", inset: 0, zIndex: 298,
        background: "rgba(0,0,0,0.7)",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 299,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: "linear-gradient(145deg,#0e0e1a,#12121f)",
          border: "1px solid rgba(232,184,75,0.25)",
          borderRadius: 18, padding: "28px 32px",
          maxWidth: 480, width: "100%",
          boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
          animation: "prebattle-in 0.2s ease",
        }}>
          <style>{`@keyframes prebattle-in { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

          <p style={{
            fontSize: 10, letterSpacing: "0.14em", color: "#e8b84b",
            textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif",
            fontWeight: 700, margin: "0 0 16px", textAlign: "center",
          }}>─── Confirmar Batalla ───</p>

          {/* VS panel */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {/* Me */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 8px",
                background: `linear-gradient(135deg,${myTier.color}22,#0e0e1a)`,
                border: `2px solid ${myTier.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>{myTier.icon}</div>
              <div style={{ fontFamily: "Cinzel,serif", color: "#4a9eff", fontSize: 13, fontWeight: 700 }}>Tú</div>
              <div style={{ color: myTier.color, fontSize: 11, fontWeight: 700 }}>{myTier.name}</div>
              <div style={{ color: "#555", fontSize: 10, fontFamily: "IBM Plex Mono,monospace" }}>{myMmr} MMR</div>
            </div>

            {/* VS */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{
                fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 900,
                color: "#e8b84b", textShadow: "0 0 20px #e8b84b66",
              }}>VS</div>
              <div style={{
                fontSize: 10, fontWeight: 700, marginTop: 4,
                color: advColor,
              }}>
                {advantage === "favorable" && "▲ Favorito"}
                {advantage === "desventaja" && "▼ Difícil"}
                {advantage === "equilibrado" && "◆ Equilibrado"}
              </div>
            </div>

            {/* Opponent */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 8px",
                background: `linear-gradient(135deg,${oppTier.color}22,#0e0e1a)`,
                border: `2px solid ${oppTier.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>{oppTier.icon}</div>
              <div style={{
                fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 13, fontWeight: 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{opponent.display_name}</div>
              <div style={{ color: oppTier.color, fontSize: 11, fontWeight: 700 }}>{oppTier.name}</div>
              <div style={{ color: "#555", fontSize: 10, fontFamily: "IBM Plex Mono,monospace" }}>{opponent.total_power} MMR</div>
            </div>
          </div>

          {/* MMR diff banner */}
          <div style={{
            background: `${advColor}11`,
            border: `1px solid ${advColor}33`,
            borderRadius: 10, padding: "10px 16px",
            textAlign: "center", marginBottom: 24,
          }}>
            <span style={{ color: advColor, fontSize: 13, fontWeight: 700 }}>
              {mmrDiff > 0 ? `+${mmrDiff}` : mmrDiff} MMR diferencia
            </span>
            <span style={{ color: "#555", fontSize: 11, marginLeft: 8 }}>
              {advantage === "favorable"
                ? "· Ganarás menos MMR si vences"
                : advantage === "desventaja"
                ? "· Ganarás más MMR si vences"
                : "· Batalla equilibrada"}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onCancel}
              disabled={battling}
              style={{
                flex: 1, padding: "12px", borderRadius: 10,
                border: "1px solid #2a2a3a", background: "transparent",
                color: "#666", cursor: "pointer",
                fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 14,
              }}
            >Cancelar</button>
            <button
              onClick={onConfirm}
              disabled={battling}
              style={{
                flex: 2, padding: "12px", borderRadius: 10,
                border: "none",
                background: battling
                  ? "rgba(232,184,75,0.15)"
                  : "linear-gradient(135deg,#e8b84b,#c9901f)",
                color: battling ? "#e8b84b" : "#0a0a12",
                cursor: battling ? "not-allowed" : "pointer",
                fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 14,
                letterSpacing: "0.04em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {battling ? (
                <>
                  <span style={{
                    display: "inline-block", width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid #e8b84b44", borderTopColor: "#e8b84b",
                    animation: "mmk-spin 0.7s linear infinite",
                  }} />
                  Calculando…
                </>
              ) : "⚔️ ¡Batallar!"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── OpponentCard v2 (AI.1) ───────────────────────────────────────────────────
function OpponentCard({
  opp, myMmr, onChallenge, disabled,
}: {
  opp: BattleOpponent; myMmr: number; onChallenge: () => void; disabled: boolean;
}) {
  const tier    = getRank(opp.total_power);
  const diff    = opp.total_power - myMmr;
  const diffColor = diff < -100 ? "#3ddc84" : diff > 100 ? "#ff6b6b" : "#e8b84b";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: "linear-gradient(90deg,#12121e,#0e0e1a)",
      border: "1px solid #1e1e2e", borderRadius: 10,
      transition: "border-color 0.2s, background 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#2a2a3e")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e2e")}
    >
      {/* Rank icon */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg,${tier.color}22,#0e0e1a)`,
        border: `1px solid ${tier.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{tier.icon}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: "#e8e8f0", fontWeight: 700, fontSize: 14,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "Rajdhani,sans-serif",
        }}>{opp.display_name}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 2, alignItems: "center" }}>
          <span style={{ color: tier.color, fontSize: 10, fontWeight: 700 }}>{tier.name}</span>
          <span style={{ color: "#444", fontSize: 10, fontFamily: "IBM Plex Mono,monospace" }}>{opp.total_power} MMR</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: diffColor,
            fontFamily: "IBM Plex Mono,monospace",
          }}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        </div>
      </div>

      {/* Challenge button */}
      <button
        onClick={onChallenge}
        disabled={disabled}
        style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: disabled ? "#1a1a2a" : `linear-gradient(135deg,${tier.color}cc,${tier.color}88)`,
          color: disabled ? "#444" : "#0a0a12",
          fontWeight: 800, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.04em",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        {disabled ? "…" : "Desafiar"}
      </button>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────


// ─── IA.2: Daily AI Challenger card ──────────────────────────────────────────
function DailyChallengeCard({ challenge, attempted, badgeEarned, dailyLoading, onStart }: { challenge: DailyAIChallenge; attempted: boolean; badgeEarned: boolean; dailyLoading: boolean; onStart: () => void; }) {
  const meta = BATTLE_MODE_META['ai_' + challenge.difficulty as BattleMode];
  return (
    <section style={{
      marginBottom: 24, position: 'relative', overflow: 'hidden',
      borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(20,12,0,0.98) 0%, rgba(40,24,0,0.96) 50%, rgba(15,10,30,0.98) 100%)',
      border: '1px solid rgba(232,184,75,0.45)',
      boxShadow: '0 0 40px rgba(232,184,75,0.12), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Shimmer diagonal stripe */}
      <div style={{
        position: 'absolute', top: 0, left: '-40%', right: 0, bottom: 0,
        background: 'linear-gradient(105deg, transparent 40%, rgba(232,184,75,0.06) 50%, transparent 60%)',
        animation: 'card-shimmer 3s ease-in-out infinite',
        pointerEvents: 'none', backgroundSize: '200% 100%',
      }} />
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #e8b84b, #a56d18, #e8b84b, transparent)' }} />
      <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>⚔️</span>
            <span style={{ color: '#e8b84b', fontSize: 10, letterSpacing: '0.2em', fontWeight: 800, fontFamily: 'Cinzel,serif' }}>DESAFÍO DEL DÍA</span>
            {attempted && !badgeEarned && <span style={{ background: '#3dc96b22', border: '1px solid #3dc96b44', color: '#3dc96b', borderRadius: 999, padding: '2px 8px', fontSize: 9, letterSpacing: '0.1em' }}>COMPLETADO</span>}
            {badgeEarned && <span style={{ background: '#e8b84b22', border: '1px solid #e8b84b66', color: '#e8b84b', borderRadius: 999, padding: '2px 8px', fontSize: 9, letterSpacing: '0.1em' }}>🏅 BADGE GANADO</span>}
          </div>
          <h2 style={{ margin: '0 0 6px', color: '#f5e8b0', fontFamily: 'Cinzel,serif', fontSize: 20, fontWeight: 700, textShadow: '0 0 20px rgba(232,184,75,0.4)' }}>{challenge.title}</h2>
          <p style={{ margin: 0, color: '#9488b0', fontSize: 12, lineHeight: 1.5 }}>{challenge.subtitle}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <span style={{ color: '#e8b84b', background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.3)', borderRadius: 999, padding: '4px 10px', fontSize: 10, fontFamily: 'Cinzel,serif' }}>{meta.label}</span>
            <span style={{ color: '#c084fc', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 999, padding: '4px 10px', fontSize: 10 }}>{challenge.rewardLabel}</span>
          </div>
        </div>
        <button
          onClick={onStart}
          disabled={attempted || dailyLoading}
          style={{
            alignSelf: 'center', minWidth: 160, padding: '13px 20px', borderRadius: 10,
            border: `1px solid ${attempted ? '#1e1e30' : 'rgba(232,184,75,0.6)'}`,
            background: attempted
              ? '#111120'
              : dailyLoading
                ? 'linear-gradient(135deg,#5a4010,#3a2a08)'
                : 'linear-gradient(135deg,#e8b84b 0%,#c9901f 60%,#a56d18 100%)',
            color: attempted ? '#444' : '#0a0a12',
            cursor: attempted || dailyLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'Cinzel,serif', fontWeight: 800, fontSize: 12,
            letterSpacing: '0.05em',
            boxShadow: attempted ? 'none' : '0 4px 20px rgba(232,184,75,0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          {dailyLoading ? '⏳ PREPARANDO…' : attempted ? '✓ INTENTO UTILIZADO' : '⚔ ACEPTAR DESAFÍO'}
        </button>
      </div>
    </section>
  );
}

    
export function PvpRoute() {
  const {
    seasons, rankings, opponents, loading, opponentsLoading,
    battling, battleResult, error, playerId,
    loadOpponents, battle, dismissBattle,
  } = usePvp();

  // AI.1: matchmaking overlay + pre-battle confirmation
  const [matchmaking, setMatchmaking]       = useState(false);
  const [selectedOpp, setSelectedOpp]       = useState<BattleOpponent | null>(null);
  const [dailyResult, setDailyResult]       = useState<RealBattleResult | null>(null);
  const [dailyLoading, setDailyLoading]     = useState(false);
  const [dailyAttempted, setDailyAttempted] = useState(false);
  const [dailyBadgeEarned, setDailyBadgeEarned] = useState(false);
  const [dailyVexEarned, setDailyVexEarned]     = useState<number | null>(null);
  const [dailyError, setDailyError]             = useState<string | null>(null);
  const dailyChallenge = getDailyAIChallenge();
  const cancelRef = useRef(false);

  // Trigger animated search
  const startMatchmaking = useCallback(async () => {
    cancelRef.current = false;
    setMatchmaking(true);
    await loadOpponents();
    if (!cancelRef.current) setMatchmaking(false);
  }, [loadOpponents]);

  const cancelMatchmaking = useCallback(() => {
    cancelRef.current = true;
    setMatchmaking(false);
  }, []);

  const handleConfirmBattle = useCallback(async () => {
    if (!selectedOpp) return;
    setSelectedOpp(null);
    await battle(selectedOpp.player_id);
  }, [selectedOpp, battle]);

  useEffect(() => { if (!playerId) return; setDailyAttempted(hasDailyChallengeAttempted(playerId, dailyChallenge.dateKey)); setDailyBadgeEarned(hasDailyChallengeBadge(playerId, dailyChallenge.dateKey)); }, [playerId, dailyChallenge.dateKey]);

  const startDailyChallenge = useCallback(async () => {
    if (!playerId || dailyAttempted || dailyLoading) return;
    setDailyLoading(true);
    setDailyError(null);
    try {
      const playerUnits = await loadPlayerBattleUnits(supabase, playerId);
      const result = simulateAIBattle(playerUnits, dailyChallenge.difficulty, dailyChallenge.deck);
      // Mark attempt AFTER simulation succeeds — prevents consuming the attempt on network failure
      markDailyChallengeAttempted(playerId, dailyChallenge.dateKey);
      setDailyAttempted(true);
      if (result.you_won) {
        markDailyChallengeBadge(playerId, dailyChallenge.dateKey);
        setDailyBadgeEarned(true);
        try {
          const claim = await claimDailyAIChallenge(supabase, dailyChallenge.dateKey, dailyChallenge.difficulty);
          if (claim.claimed) setDailyVexEarned(claim.vex_awarded ?? DAILY_CHALLENGE_VEX_REWARD[dailyChallenge.difficulty]);
        } catch { /* VEX claim RPC — badge ya otorgado localmente, VEX se sincronizará */ }
      }
      setDailyResult({ ...result, opponent_name: dailyChallenge.title, engine: 'client_ai_daily_v1' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setDailyError(`No se pudo cargar el desafío: ${msg}. Verifica tu conexión e intenta de nuevo.`);
    } finally {
      setDailyLoading(false);
    }
  }, [playerId, dailyAttempted, dailyLoading, dailyChallenge]);

  if (loading) return <PageLoader />;
  if (!loading && !playerId) return (
    <BlockedAuthState message="Inicia sesión para competir en el Arena PvP y ganar MMR." />
  );

  const season     = seasons[0] ?? null;
  const playerRank = playerId ? (rankings.find(r => r.player_id === playerId) ?? null) : null;
  const myMmr      = playerRank?.mmr ?? 1000;

  // IA.2: Daily challenge reuses the interactive board and never touches pvp_matches.
  if (dailyResult) return (<div style={{ minHeight: '100vh', background: '#080811', paddingTop: 12 }}><div style={{ maxWidth: 920, margin: '0 auto 10px', padding: '10px 16px', color: '#e8b84b', textAlign: 'center' }}>DESAFÍO DEL DÍA · {dailyChallenge.title} · {dailyResult.you_won ? (dailyBadgeEarned ? ('BADGE GANADO' + (dailyVexEarned ? ' · +' + dailyVexEarned + ' VEX' : '')) : 'VICTORIA') : 'INTENTO CONSUMIDO'}</div><InteractiveBattleBoard result={dailyResult} playerName="Tú" opponentName={dailyChallenge.title} onDismiss={() => setDailyResult(null)} /></div>);

  // Battle is active — hand off to battle board
  if (battleResult) return (
    <InteractiveBattleBoard
      result={battleResult as unknown as RealBattleResult}
      playerName="Tú"
      opponentName="Oponente"
      onDismiss={dismissBattle}
    />
  );

  const played  = (playerRank?.wins ?? 0) + (playerRank?.losses ?? 0) + (playerRank?.draws ?? 0);
  const winRate = played > 0 ? Math.round(((playerRank?.wins ?? 0) / played) * 100) : 0;

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      {/* AI.1 overlays */}
      {matchmaking && <MatchmakingOverlay onCancel={cancelMatchmaking} />}
      {selectedOpp && (
        <PreBattleModal
          opponent={selectedOpp}
          myMmr={myMmr}
          onConfirm={handleConfirmBattle}
          onCancel={() => setSelectedOpp(null)}
          battling={battling}
        />
      )}

      <SeasonRewardsPanel />
      <WeeklyTournamentPanel />
      <ClanWarsPanel />

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 26, margin: "0 0 6px" }}>
            ⚔️ Arena PvP
          </h1>
          <p style={{ color: "#888", margin: 0, fontSize: 13 }}>
            Desafía a otros Forjadores. El poder de tu mazo determina la victoria.
          </p>
        </div>

        <DailyChallengeCard challenge={dailyChallenge} attempted={dailyAttempted} badgeEarned={dailyBadgeEarned} dailyLoading={dailyLoading} onStart={startDailyChallenge} />

        {dailyError && (
          <div style={{
            background: "#2a1a1a", border: "1px solid #ff6b6b55",
            borderRadius: 8, padding: "12px 16px",
            color: "#ff8888", marginBottom: 20, fontSize: 13,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠️</span>
            <span>{dailyError}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: "#2a1a1a", border: "1px solid #ff6b6b33",
            borderRadius: 8, padding: "12px 16px",
            color: "#ff6b6b", marginBottom: 20, fontSize: 13,
          }}>{error}</div>
        )}

        {/* My Rank Banner */}
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
                      <span style={{ color: "#3ddc84" }}>{playerRank.wins}V</span>
                      <span style={{ color: "#ff6b6b" }}>{playerRank.losses}D</span>
                      {playerRank.draws > 0 && <span style={{ color: "#888" }}>{playerRank.draws}E</span>}
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

        <div className="pvp-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 28 }}>
          {/* LEFT: Arena */}
          <div style={{ minWidth: 0 }}>
            {/* AI.1: Search panel */}
            <div style={{
              background: "linear-gradient(135deg,#12121e,#0e0e1a)",
              border: "1px solid #1e1e2e",
              borderRadius: 12, padding: "16px 18px", marginBottom: 16,
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 10,
              }}>
                <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, margin: 0 }}>
                  Oponentes
                </h2>
                <button
                  onClick={startMatchmaking}
                  disabled={opponentsLoading || battling || matchmaking}
                  style={{
                    padding: "8px 18px", borderRadius: 8,
                    border: "1px solid rgba(232,184,75,0.3)",
                    background: (opponentsLoading || matchmaking)
                      ? "transparent"
                      : "rgba(232,184,75,0.1)",
                    color: (opponentsLoading || matchmaking) ? "#555" : "#e8b84b",
                    fontSize: 12, cursor: "pointer",
                    fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
                    letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  {opponentsLoading ? "Buscando…" : "🔍 Buscar oponentes"}
                </button>
              </div>

              {/* AI.1: quick tip */}
              <p style={{ color: "#444", fontSize: 11, margin: 0, fontFamily: "Rajdhani,sans-serif" }}>
                El sistema empareja jugadores por MMR cercano.
                Desafía a alguien para empezar la batalla.
              </p>
            </div>

            {/* Opponent list */}
            {opponents.length === 0 && !opponentsLoading && !matchmaking && (
              <div style={{
                background: "#12121e", border: "1px dashed #2a2a3a",
                borderRadius: 10, padding: 28, textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>⚔️</div>
                <p style={{ color: "#555", margin: 0, fontSize: 13 }}>
                  Pulsa <strong style={{ color: "#e8b84b" }}>Buscar oponentes</strong> para
                  encontrar rivales en el servidor.
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {opponents.map(opp => (
                <OpponentCard
                  key={opp.player_id}
                  opp={opp}
                  myMmr={myMmr}
                  disabled={battling}
                  onChallenge={() => setSelectedOpp(opp)}
                />
              ))}
            </div>

            {battling && (
              <div style={{
                marginTop: 12, padding: "10px 16px", borderRadius: 8,
                background: "rgba(232,184,75,0.06)", border: "1px solid rgba(232,184,75,0.2)",
                color: "#e8b84b", fontSize: 13, textAlign: "center",
                fontFamily: "Cinzel,serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <span style={{
                  display: "inline-block", width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid #e8b84b44", borderTopColor: "#e8b84b",
                  animation: "mmk-spin 0.8s linear infinite",
                }} />
                Calculando batalla…
                <style>{`@keyframes mmk-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

          {/* RIGHT: History + Rankings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <MatchHistoryPanel />

            {season && (
              <div>
                <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, margin: "0 0 12px" }}>
                  🏆 {season.name}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {rankings.slice(0, 10).map((r, i) => {
                    const tier = getRank(r.mmr);
                    const isMe = r.player_id === playerId;
                    return (
                      <div key={r.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px",
                        background: isMe ? `${tier.color}11` : "#1a1a2e",
                        border: `1px solid ${isMe ? tier.color + "44" : "#2a2a3a"}`,
                        borderRadius: 6,
                      }}>
                        <span style={{
                          color: ["#e8702a", "#8a8a9e", "#e8b339"][i] ?? "#555",
                          fontSize: 12, minWidth: 20, fontWeight: 700,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 14 }}>{tier.icon}</span>
                        <span style={{
                          color: isMe ? "#e8e8f0" : "#ccc",
                          fontSize: 12, flex: 1, fontWeight: isMe ? 700 : 400,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {r.display_name ?? r.player_id.substring(0, 8)}
                          {isMe && <span style={{ color: tier.color, fontSize: 9, marginLeft: 6 }}>TÚ</span>}
                        </span>
                        <span style={{ color: "#e8b84b", fontSize: 11 }}>{r.mmr}</span>
                        <span style={{ color: "#3ddc84", fontSize: 10 }}>{r.wins}V</span>
                        <span style={{ color: "#ff6b6b", fontSize: 10 }}>{r.losses}D</span>
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
