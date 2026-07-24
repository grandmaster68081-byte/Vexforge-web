import { useState, useEffect } from "react";
import { useMissions } from "../domains/missions/useMissions";
import { useQuests } from "../domains/quests/useQuests";
import { useProgress } from "../domains/progress/useProgress";
import { SkeletonList } from "../shared/components/Skeleton";
import { useToast } from "../shared/context/ToastContext";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_missions.jpg";
const FESTIVAL_END = "2026-10-16T01:53:23";

const MISSION_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  Tutorial:   { icon: "📚", color: "#5B8BF5" },
  PvE:        { icon: "⚔️", color: "#E84040" },
  Dungeon:    { icon: "🏰", color: "#A855F7" },
  Event:      { icon: "⭐", color: "#E8B84B" },
  Expedition: { icon: "🗺️", color: "#3DC96B" },
  Clan:       { icon: "🏰", color: "#C9901F" },
};

const DIFFICULTY_CONFIG: Record<string, { color: string; pct: number; label: string }> = {
  normal:    { color: "#C9901F", pct: 35, label: "Normal"     },
  hard:      { color: "#E84040", pct: 65, label: "Difícil"    },
  epic:      { color: "#A855F7", pct: 82, label: "Épico"      },
  legendary: { color: "#E8B84B", pct: 95, label: "Legendario" },
  easy:      { color: "#3DC96B", pct: 20, label: "Fácil"      },
  fácil:     { color: "#3DC96B", pct: 20, label: "Fácil"      },
};

const QUEST_TYPE_ICON: Record<string, string> = {
  mission_complete: "⚔️",
  pvp_win:          "🏆",
  pvp_play:         "⚔️",
  fusion_perform:   "🔮",
  market_sell:      "💰",
  market_buy:       "🛒",
  pack_open:        "📦",
  card_collect:     "🃏",
};

const REGIONS = ["all", "Event", "Dungeon", "Tutorial", "Expedition", "PvE", "Clan"];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCooldown(secs: number): string {
  if (secs <= 0) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
  return `${s}s`;
}

function formatResetTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FestivalCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setLeft("Finalizado"); return; }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
      setLeft(`${d}d ${h}h ${m}m`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span>{left}</span>;
}

function FestivalBanner() {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 24, background: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)", border: "1px solid rgba(232,184,75,0.4)", padding: "20px 24px" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(45deg, #E8B84B 0, #E8B84B 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "#E8B84B", textTransform: "uppercase", marginBottom: 6 }}>🔥 EVENTO ACTIVO · TEMPORADA 1</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 700, color: "#F5C842", lineHeight: 1.2 }}>Festival de la Forja</div>
            <div style={{ color: "rgba(245,200,66,0.65)", fontSize: 12, marginTop: 4 }}>Completa misiones del Festival para ganar recompensas exclusivas</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "rgba(245,200,66,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Termina en</div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 22, fontWeight: 700, color: "#E8B84B" }}><FestivalCountdown endsAt={FESTIVAL_END} /></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {[{ label: "Fácil ×1", color: "#3DC96B" }, { label: "Normal ×2", color: "#C9901F" }, { label: "Épico ×3", color: "#A855F7" }, { label: "Legendario ×1", color: "#E8B84B" }].map(tier => (
            <div key={tier.label} style={{ borderRadius: 20, padding: "3px 10px", fontSize: 10, background: `${tier.color}18`, border: `1px solid ${tier.color}55`, color: tier.color, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.06em" }}>{tier.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnergyBar({ energy, max, energyUpdatedAt }: { energy: number; max: number; energyUpdatedAt?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((energy / max) * 100)) : 0;
  const [secsUntil, setSecsUntil] = useState(0);
  useEffect(() => {
    if (!energyUpdatedAt || energy >= max) { setSecsUntil(0); return; }
    const calc = () => {
      const since = (Date.now() - new Date(energyUpdatedAt).getTime()) / 1000;
      setSecsUntil(Math.max(0, Math.round(600 - (since % 600))));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [energyUpdatedAt, energy, max]);

  const timerLabel = energy < max && secsUntil > 0
    ? `en ${Math.floor(secsUntil / 60)}m ${String(secsUntil % 60).padStart(2, "0")}s`
    : "+1/10min";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 14 }}>
      <span style={{ fontSize: 14 }}>⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--fg-dim)", letterSpacing: "0.1em" }}>ENERGÍA</span>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 11, fontWeight: 700, color: "var(--fg-secondary)" }}>{energy} / {max}</span>
        </div>
        <div className="energy-fill-bar"><div className="energy-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      {energy < max  && <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "var(--fg-dim)" }}>{timerLabel}</span>}
      {energy >= max && <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#3DC96B", fontWeight: 700 }}>LLENA</span>}
    </div>
  );
}

function SessionStatsBanner({ count, xp, vex, tvex }: { count: number; xp: number; vex: number; tvex: number }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderRadius: 10, padding: "12px 16px", marginBottom: 16, background: "rgba(61,201,107,0.07)", border: "1px solid rgba(61,201,107,0.25)" }}>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "#3DC96B", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}>✓ SESIÓN ACTUAL</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 13, fontWeight: 700, color: "#3DC96B" }}>{count} misión{count !== 1 ? "es" : ""} completada{count !== 1 ? "s" : ""}</span>
        {xp   > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· ✨ +{xp} XP</span>}
        {vex  > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· 💰 +{vex} VEX</span>}
        {tvex > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· 🔄 +{tvex} T-VEX</span>}
      </div>
    </div>
  );
}

// ─── Daily Quests Section (NEW in v5.12) ──────────────────────────────────────

function DailyQuestCard({
  quest, onClaim, isClaiming,
}: {
  quest: import("../domains/quests/repository").PlayerDailyQuest;
  onClaim: (id: string) => void;
  isClaiming: boolean;
}) {
  const def     = quest.quest;
  if (!def) return null;
  const pct     = Math.min(100, Math.round((quest.progress / def.target_count) * 100));
  const qIcon   = QUEST_TYPE_ICON[def.quest_type] ?? "📋";
  const isActive    = quest.status === "active";
  const isCompleted = quest.status === "completed";
  const isClaimed   = quest.status === "claimed";

  return (
    <div style={{
      borderRadius: 10, padding: "14px 16px",
      background: isClaimed
        ? "rgba(0,30,15,0.55)"
        : isCompleted
          ? "rgba(20,50,20,0.65)"
          : "rgba(255,255,255,0.03)",
      border: `1px solid ${isClaimed ? "rgba(61,201,107,0.2)" : isCompleted ? "rgba(61,201,107,0.5)" : "rgba(255,255,255,0.08)"}`,
      display: "flex", flexDirection: "column", gap: 10,
      opacity: isClaimed ? 0.65 : 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{qIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--fg-primary)", fontWeight: 700, fontSize: 13 }}>{def.title}</div>
          <div style={{ color: "var(--fg-dim)", fontSize: 11, marginTop: 1 }}>{def.description}</div>
        </div>
        {isClaimed && (
          <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(61,201,107,0.12)", border: "1px solid rgba(61,201,107,0.35)", color: "#3DC96B", fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.1em", fontWeight: 700 }}>
            ✓ RECLAMADA
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.08em" }}>PROGRESO</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: isCompleted || isClaimed ? "#3DC96B" : "var(--fg-secondary)" }}>
            {quest.progress} / {def.target_count}
          </span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 20, height: 6, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: 20,
            background: isClaimed
              ? "rgba(61,201,107,0.4)"
              : isCompleted
                ? "linear-gradient(90deg,#2a9c50,#3DC96B)"
                : "linear-gradient(90deg,#4a6ef5,#5B8BF5)",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Rewards + Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {def.reward_xp > 0 && (
            <div style={{ background: "rgba(91,139,245,0.1)", border: "1px solid rgba(91,139,245,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#7ca8f8", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>
              ✨ {def.reward_xp} XP
            </div>
          )}
          {def.reward_vex_ingame > 0 && (
            <div style={{ background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#E8B84B", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>
              💰 {def.reward_vex_ingame} VEX
            </div>
          )}
        </div>
        {isCompleted && !isClaimed && (
          <button
            onClick={() => onClaim(quest.id)}
            disabled={isClaiming}
            style={{
              padding: "6px 16px", borderRadius: 6, border: "none",
              background: isClaiming
                ? "rgba(61,201,107,0.3)"
                : "linear-gradient(135deg,#2a9c50,#3DC96B)",
              color: "#0a1a0f", fontWeight: 800, fontSize: 11,
              cursor: isClaiming ? "default" : "pointer",
              fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.05em",
              transition: "all .2s",
            }}
          >
            {isClaiming ? "Reclamando…" : "⭐ RECLAMAR"}
          </button>
        )}
        {isActive && (
          <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: '"IBM Plex Mono",monospace' }}>
            {pct}% completada
          </span>
        )}
      </div>
    </div>
  );
}

function DailyQuestsSection() {
  const { quests, loading, error, claiming, lastClaim, claim, dismissClaim, claimedCount, totalQuests, secondsUntilReset } = useQuests();
  const { addToast } = useToast();

  useEffect(() => {
    if (!lastClaim) return;
    const r = lastClaim.result;
    if (r.claimed) {
      const msg = r.xp_applied ? `+${r.xp_applied} XP · +${r.vex_applied ?? 0} VEX` : "Recompensa aplicada";
      addToast("success", "¡Quest completada!", msg);
    } else {
      addToast("error", "No se pudo reclamar", r.reason ?? "Error desconocido");
    }
    dismissClaim();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClaim]);
  const [resetSecs, setResetSecs] = useState(secondsUntilReset());

  // Update reset countdown every minute
  useEffect(() => {
    const id = setInterval(() => setResetSecs(secondsUntilReset()), 60000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 16, fontWeight: 700, color: "var(--fg-primary)" }}>
            🗓️ Misiones Diarias
          </div>
          {totalQuests > 0 && (
            <div style={{
              background: claimedCount === totalQuests ? "rgba(61,201,107,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${claimedCount === totalQuests ? "rgba(61,201,107,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 20, padding: "1px 10px",
              fontSize: 10, color: claimedCount === totalQuests ? "#3DC96B" : "var(--fg-dim)",
              fontFamily: '"IBM Plex Mono",monospace',
            }}>
              {claimedCount}/{totalQuests}
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.06em" }}>
          ↺ Reinicia en {formatResetTime(resetSecs)}
        </div>
      </div>

      {/* Claim toast */}
      {lastClaim?.result.claimed && (
        <div
          onClick={dismissClaim}
          style={{ cursor: "pointer", borderRadius: 10, padding: "12px 16px", marginBottom: 14, background: "rgba(61,201,107,0.08)", border: "1px solid rgba(61,201,107,0.35)", display: "flex", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: 20 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#3DC96B", fontWeight: 700, fontSize: 13, fontFamily: '"Cinzel",serif' }}>¡Recompensa reclamada!</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              {lastClaim.result.xp_applied  && lastClaim.result.xp_applied > 0  && <span style={{ color: "#7ca8f8", fontSize: 11 }}>✨ +{lastClaim.result.xp_applied} XP</span>}
              {lastClaim.result.vex_applied && lastClaim.result.vex_applied > 0 && <span style={{ color: "#E8B84B", fontSize: 11 }}>💰 +{lastClaim.result.vex_applied} VEX</span>}
            </div>
          </div>
          <span style={{ color: "var(--fg-dim)", fontSize: 10 }}>Tap para cerrar</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ borderRadius: 8, padding: "10px 14px", marginBottom: 12, background: "rgba(232,64,64,0.07)", border: "1px solid rgba(232,64,64,0.25)", color: "#E84040", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Quest cards */}
      {loading ? (
        <SkeletonList rows={3} />
      ) : quests.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗓️</div>
          <div style={{ color: "var(--fg-dim)", fontSize: 13 }}>No se pudieron cargar las misiones diarias. Inicia sesión para verlas.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quests.map(q => (
            <DailyQuestCard
              key={q.id}
              quest={q}
              onClaim={claim}
              isClaiming={claiming === q.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mission Card (v5.12: adds cooldown display) ──────────────────────────────

function MissionCard({ mission, onExecute, executing, isExecuting, isCompleted, isActive, cooldownSecs, currentEnergy }: {
  mission: any; onExecute: (id: string) => void; executing: boolean;
  isExecuting: boolean; isCompleted: boolean; isActive: boolean;
  cooldownSecs: number; currentEnergy: number;
}) {
  const typeConf   = MISSION_TYPE_CONFIG[mission.mission_type] ?? { icon: "📜", color: "#C9901F" };
  const diffConf   = DIFFICULTY_CONFIG[(mission.difficulty ?? "").toLowerCase()] ?? DIFFICULTY_CONFIG["normal"];
  const isFestival = mission.mission_group === "festival_forja";
  const isOnCooldown = cooldownSecs > 0;
  const hasVex     = (mission.reward_vex_ingame    ?? 0) > 0;
  const hasTVex    = (mission.reward_vex_tradeable ?? 0) > 0;
  const energyCost = mission.energy_cost ?? 0;
  const canAfford  = energyCost === 0 || currentEnergy >= energyCost;
  const borderColor = isActive     ? "rgba(91,139,245,0.7)"
                    : isCompleted  ? "rgba(61,201,107,0.4)"
                    : isOnCooldown ? "rgba(168,85,247,0.35)"
                    : isFestival   ? "rgba(232,184,75,0.35)"
                    : undefined;
  const bgOverride  = isActive     ? "rgba(15,25,55,0.7)"
                    : isCompleted  ? "rgba(0,30,15,0.55)"
                    : isOnCooldown ? "rgba(28,15,45,0.6)"
                    : isFestival   ? "rgba(40,28,0,0.6)"
                    : undefined;
  return (
    <div className="mission-card" style={{
      "--mission-color": isFestival ? "#E8B84B" : typeConf.color, position: "relative",
      ...(borderColor ? { borderColor } : {}), ...(bgOverride ? { background: bgOverride } : {}),
      ...(isActive    ? { boxShadow: "0 0 20px rgba(91,139,245,0.25)" } : {}),
    } as React.CSSProperties}>
      {/* Status badges */}
      {isFestival && !isCompleted && !isActive && !isOnCooldown && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #C9901F, #E8B84B)", borderRadius: "0 0 6px 6px", padding: "2px 8px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#0a0a14", fontWeight: 700 }}>🔥 FESTIVAL</div>
      )}
      {isCompleted && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #1a5c30, #3DC96B)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#0a1a0f", fontWeight: 700 }}>✓ COMPLETADA</div>
      )}
      {isActive && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #1a2a5c, #5B8BF5)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#fff", fontWeight: 700 }}>⚡ EJECUTANDO</div>
      )}
      {isOnCooldown && !isActive && !isCompleted && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #3b1a6e, #A855F7)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.12em", color: "#f0e0ff", fontWeight: 700 }}>
          ⏳ {formatCooldown(cooldownSecs)}
        </div>
      )}

      {/* VEX reward chips */}
      {(hasVex || hasTVex) && (
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
          {hasVex  && <div style={{ background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.4)",  borderRadius: 6, padding: "2px 7px", fontSize: 10, fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, color: "#E8B84B" }}>💰 {mission.reward_vex_ingame} VEX</div>}
          {hasTVex && <div style={{ background: "rgba(91,139,245,0.12)",  border: "1px solid rgba(91,139,245,0.35)", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, color: "#7ca8f8" }}>🔄 {mission.reward_vex_tradeable} T-VEX</div>}
        </div>
      )}

      <div className="mission-type-badge" style={{ marginTop: (hasVex || hasTVex) ? 22 : 0 }}><span>{typeConf.icon}</span><span>{mission.mission_type}</span></div>
      <div className="mission-name">{mission.name}</div>
      <div className="mission-region">📍 {mission.region_id ?? "—"}</div>
      <div className="difficulty-bar-wrap">
        <div className="difficulty-label">
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--fg-dim)", letterSpacing: "0.1em" }}>DIFICULTAD</span>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 11, fontWeight: 700, color: diffConf.color }}>{diffConf.label}</span>
        </div>
        <div className="difficulty-bar"><div className="difficulty-bar-fill" style={{ width: `${diffConf.pct}%`, background: diffConf.color } as React.CSSProperties} /></div>
      </div>
      <div className="mission-rewards">
        {(mission.energy_cost ?? 0) > 0 && <div className="reward-chip energy">⚡ {mission.energy_cost}</div>}
        {(mission.reward_xp   ?? 0) > 0 && <div className="reward-chip xp">✨ {mission.reward_xp} XP</div>}
      </div>

      {/* Execute button — shows cooldown or energy block when blocked */}
      {!canAfford && !isCompleted && !isOnCooldown && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, background: "rgba(232,64,64,0.08)", border: "1px solid rgba(232,64,64,0.25)", fontSize: 10, color: "#E84040", fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.05em", marginBottom: 6 }}>
          <span>⚡</span>
          <span>Energía insuficiente — necesitas {energyCost}, tienes {currentEnergy}</span>
        </div>
      )}
      <button
        className="mission-execute-btn"
        onClick={() => onExecute(mission.id)}
        disabled={executing || isCompleted || isOnCooldown || !canAfford}
        style={(isCompleted || isOnCooldown || !canAfford) ? { opacity: 0.5, cursor: "default" } : {}}
      >
        {isExecuting       ? "Ejecutando..."
         : isCompleted     ? "✓ Completada"
         : isOnCooldown    ? `⏳ ${formatCooldown(cooldownSecs)}`
         : !canAfford      ? `⚡ ${energyCost} energía`
         : "⚔️ Ejecutar"}
      </button>
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export function MissionsRoute() {
  const { progress } = useProgress();
  const energy    = progress?.energy    ?? 0;
  const maxEnergy = progress?.max_energy ?? 100;
  const energyUpdatedAt = progress?.updated_at;

  const {
    missions, loading, execute, executing, lastReward, cooldownRemaining,
    executeError, dismissReward, dismissError, tick,
    completedThisSession, sessionStats,
  } = useMissions();

  const [activeType, setActiveType] = useState("all");

  const typeCounts = REGIONS.reduce((acc, t) => {
    acc[t] = t === "all" ? missions.length : missions.filter((m: any) => m.mission_type === t).length;
    return acc;
  }, {} as Record<string, number>);

  const sortedFiltered = missions
    .filter((m: any) => activeType === "all" || m.mission_type === activeType)
    .sort((a: any, b: any) => {
      const aAct = a.id === executing ? 0 : 1, bAct = b.id === executing ? 0 : 1;
      const aCmp = completedThisSession.has(a.id) ? 1 : 0, bCmp = completedThisSession.has(b.id) ? 1 : 0;
      const aFst = a.mission_group === "festival_forja" ? 0 : 1, bFst = b.mission_group === "festival_forja" ? 0 : 1;
      if (aAct !== bAct) return aAct - bAct;
      if (aCmp !== bCmp) return aCmp - bCmp;
      if (aFst !== bFst) return aFst - bFst;
      return (a.mission_order ?? 999) - (b.mission_order ?? 999);
    });

  void tick; // keep tick reactive so cooldown timers refresh

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="route-header">
        <div className="route-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>⚔️</div>
            <div>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 700, color: "var(--fg-primary)" }}>Misiones</div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "var(--fg-dim)", letterSpacing: "0.1em" }}>{missions.length} ACTIVAS · TEMPORADA 1</div>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <EnergyBar energy={energy} max={maxEnergy} energyUpdatedAt={energyUpdatedAt} />
        <SessionStatsBanner count={sessionStats.count} xp={sessionStats.xp} vex={sessionStats.vex} tvex={sessionStats.tvex} />

        {/* ── Daily Quests (NEW v5.12) ── */}
        <DailyQuestsSection />

        {/* ── Execute reward / error toasts ── */}
        {lastReward && (
          <div className="forge-toast success" onClick={dismissReward} style={{ cursor: "pointer", marginBottom: 16 }}>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>⚔️ {lastReward.mission.name} — Completada</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
              {lastReward.data.xp_reward       ? <span>✨ +{lastReward.data.xp_reward} XP</span>           : null}
              {lastReward.data.ingame_reward    ? <span>💰 +{lastReward.data.ingame_reward} VEX</span>      : null}
              {lastReward.data.tradeable_reward ? <span>🔄 +{lastReward.data.tradeable_reward} T-VEX</span> : null}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>Tap para cerrar</div>
          </div>
        )}
        {/* R.3: Energía insuficiente — fullscreen modal when energy check fails */}
        {executeError === "insufficient_energy" && (
          <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"linear-gradient(135deg,#1a0800,#2d1200)",border:"2px solid rgba(232,64,64,0.5)",borderRadius:16,padding:"32px 28px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(232,64,64,0.2)"}}>
              <div style={{fontSize:44,marginBottom:12}}>{"\u26a1"}</div>
              <div style={{fontFamily:'"Cinzel",serif',fontSize:20,fontWeight:700,color:"#E84040",marginBottom:8}}>Energía Insuficiente</div>
              <div style={{color:"#b0a0a0",fontSize:13,lineHeight:1.65,marginBottom:24}}>
                No tienes suficiente energía para esta misión.<br/>La energía se regenera con el tiempo.
              </div>
              <button onClick={dismissError} style={{padding:"10px 32px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#c0392b,#E84040)",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:'"Rajdhani",sans-serif',letterSpacing:"0.08em"}}>
                ENTENDIDO
              </button>
            </div>
          </div>
        )}
        {executeError && executeError !== "insufficient_energy" && (
          <div className="forge-toast error" onClick={dismissError} style={{cursor:"pointer",marginBottom:16}}>
            <div style={{fontFamily:'"Cinzel", serif',fontSize:13,fontWeight:700}}>Error al ejecutar misión</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:4}}>{executeError}</div>
          </div>
        )}

        {/* ── Region filter tabs ── */}
        {(activeType === "all" || activeType === "Event") && <FestivalBanner />}
        <div className="region-filters">
          {REGIONS.map(t => {
            const cnt = typeCounts[t] ?? 0;
            return (
              <button key={t} className={`region-btn ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>
                {t === "all" ? "🗺️ Todas" : `${MISSION_TYPE_CONFIG[t]?.icon ?? "📜"} ${t}`}
                {cnt > 0 && <span style={{ background: activeType === t ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 6px", fontSize: 10, color: "var(--fg-dim)", marginLeft: 4 }}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Mission grid ── */}
        {loading ? (
          <SkeletonList rows={6} />
        ) : sortedFiltered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">Sin misiones</div>
            <div className="empty-state-desc">
              {activeType === "all" ? "No hay misiones activas en este momento." : `No hay misiones de tipo ${activeType} disponibles aún.`}
            </div>
          </div>
        ) : (
          <>
          {/* R.5: Execution animation — pulsing overlay while mission runs (3-5s) */}
          {executing && (
            <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
              <style>{".vxPulse{animation:vxP 1.5s ease-in-out infinite} @keyframes vxP{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.18);opacity:1}}"}</style>
              <div style={{position:"relative",width:90,height:90,marginBottom:8}}>
                <div className="vxPulse" style={{position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(232,184,75,0.25)"}}/>
                <div className="vxPulse" style={{position:"absolute",inset:8,borderRadius:"50%",border:"2px solid rgba(232,184,75,0.5)",animationDelay:"0.4s"}}/>
                <div className="vxPulse" style={{position:"absolute",inset:16,borderRadius:"50%",background:"rgba(232,184,75,0.1)",border:"2px solid rgba(232,184,75,0.8)",animationDelay:"0.8s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:26}}>{"\u2694\ufe0f"}</span>
                </div>
              </div>
              <div style={{fontFamily:'"Cinzel",serif',fontSize:16,fontWeight:700,color:"#E8B84B",letterSpacing:"0.05em"}}>Ejecutando misión...</div>
              <div style={{color:"#888",fontSize:12,fontFamily:'"IBM Plex Mono",monospace'}}>
                {(missions as any[]).find((m: any) => m.id === executing)?.name ?? ""}
              </div>
            </div>
          )}
          <div className="mission-grid">
            {sortedFiltered.map((m: any) => (
              <MissionCard
                key={m.id}
                mission={m}
                onExecute={(id) => { const found = missions.find((x: any) => x.id === id); if (found) execute(found as any); }}
                executing={executing !== null}
                isExecuting={m.id === executing}
                isCompleted={completedThisSession.has(m.id)}
                isActive={m.id === executing}
                cooldownSecs={cooldownRemaining(m.id)}
                currentEnergy={progress?.energy ?? 999}
              />
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
