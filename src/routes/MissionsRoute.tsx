import { useState } from "react";
import { useMissions } from "../domains/missions/useMissions";
import { useProgress } from "../domains/progress/useProgress";
import { SkeletonList } from "../shared/components/Skeleton";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_missions.jpg";

const MISSION_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  Tutorial:   { icon: "📚", color: "#5B8BF5" },
  PvE:        { icon: "⚔️", color: "#E84040" },
  Dungeon:    { icon: "🏰", color: "#A855F7" },
  Event:      { icon: "⭐", color: "#E8B84B" },
  Expedition: { icon: "🗺️", color: "#3DC96B" },
  Clan:       { icon: "🏰", color: "#C9901F" },
};

const DIFFICULTY_CONFIG: Record<string, { color: string; pct: number; label: string }> = {
  normal:    { color: "#C9901F", pct: 35, label: "Normal" },
  hard:      { color: "#E84040", pct: 65, label: "Difícil" },
  epic:      { color: "#A855F7", pct: 82, label: "Épico" },
  legendary: { color: "#E8B84B", pct: 95, label: "Legendario" },
  easy:      { color: "#3DC96B", pct: 20, label: "Fácil" },
  fácil:     { color: "#3DC96B", pct: 20, label: "Fácil" },
};

const REGIONS = ["all", "PvE", "Dungeon", "Tutorial", "Event", "Expedition", "Clan"];

function EnergyBar({ energy, max }: { energy: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (energy / max) * 100) : 0;
  return (
    <div className="energy-bar-wrap">
      <div className="energy-icon">⚡</div>
      <div className="energy-info">
        <div className="energy-label">
          <span>Energía</span>
          <span style={{ color: energy >= max ? "#3DC96B" : "#E8B84B", fontWeight: 700 }}>
            {energy} / {max}
          </span>
        </div>
        <div className="energy-fill-bar">
          <div className="energy-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {energy < max && (
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10, color: "var(--fg-dim)",
        }}>+1/10min</span>
      )}
      {energy >= max && (
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10, color: "#3DC96B", fontWeight: 700,
        }}>LLENA</span>
      )}
    </div>
  );
}

function MissionCard({
  mission, onExecute, executing, isExecuting,
}: {
  mission: any;
  onExecute: (id: string) => void;
  executing: boolean;
  isExecuting: boolean;
}) {
  const typeConf = MISSION_TYPE_CONFIG[mission.mission_type] ?? { icon: "📜", color: "#C9901F" };
  const diffConf = DIFFICULTY_CONFIG[mission.difficulty?.toLowerCase()] ??
                   DIFFICULTY_CONFIG["normal"];

  return (
    <div
      className="mission-card"
      style={{ "--mission-color": typeConf.color } as React.CSSProperties}
    >
      {/* Type badge */}
      <div className="mission-type-badge">
        <span>{typeConf.icon}</span>
        <span>{mission.mission_type}</span>
      </div>

      {/* Name */}
      <div className="mission-name">{mission.name}</div>
      <div className="mission-region">
        📍 {mission.region_id ?? "—"}
      </div>

      {/* Difficulty */}
      <div className="difficulty-bar-wrap">
        <div className="difficulty-label">
          <span style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9, color: "var(--fg-dim)", letterSpacing: "0.1em",
          }}>DIFICULTAD</span>
          <span style={{
            fontFamily: '"Rajdhani", sans-serif',
            fontSize: 11, fontWeight: 700,
            color: diffConf.color,
          }}>{diffConf.label}</span>
        </div>
        <div className="difficulty-bar">
          <div
            className="difficulty-bar-fill"
            style={{
              width: `${diffConf.pct}%`,
              "--diff-color": diffConf.color,
              background: diffConf.color,
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="mission-rewards">
        {(mission.energy_cost ?? 0) > 0 && (
          <div className="reward-chip energy">
            ⚡ {mission.energy_cost}
          </div>
        )}
        {(mission.reward_vex_ingame ?? 0) > 0 && (
          <div className="reward-chip vex">
            💰 {mission.reward_vex_ingame} VEX
          </div>
        )}
        {(mission.reward_xp ?? 0) > 0 && (
          <div className="reward-chip xp">
            ✨ {mission.reward_xp} XP
          </div>
        )}
        {(mission.reward_vex_tradeable ?? 0) > 0 && (
          <div className="reward-chip vex">
            🔄 {mission.reward_vex_tradeable} T-VEX
          </div>
        )}
      </div>

      {/* Execute button */}
      <button
        className="mission-execute-btn"
        onClick={() => onExecute(mission.id)}
        disabled={executing}
      >
        {isExecuting ? "⏳ Ejecutando..." : "⚔️ Iniciar misión"}
      </button>
    </div>
  );
}

export function MissionsRoute() {
  const { missions, loading, execute, executing, lastReward, executeError, dismissReward } = useMissions();
  const { progress } = useProgress();
  const [activeType, setActiveType] = useState("all");

  const energy = progress?.energy ?? 100;
  const maxEnergy = progress?.max_energy ?? 100;

  const filtered = missions.filter((m: any) =>
    activeType === "all" || m.mission_type === activeType
  );

  const typeCounts: Record<string, number> = { all: missions.length };
  REGIONS.slice(1).forEach(t => {
    typeCounts[t] = missions.filter((m: any) => m.mission_type === t).length;
  });

  return (
    <div>
      {/* Hero */}
      <div className="missions-hero">
        <div
          className="missions-hero-bg"
          style={{ backgroundImage: `url('${BG_URL}')` }}
        />
        <div className="missions-hero-overlay" />
        <div className="missions-hero-content">
          <div style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10, letterSpacing: "0.3em",
            color: "var(--ember-gold)", textTransform: "uppercase", marginBottom: 8,
          }}>— Tablero de misiones —</div>
          <h1 style={{
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900,
            color: "var(--fg-primary)", marginBottom: 4,
          }}>Misiones</h1>
          <p style={{ color: "rgba(237,240,247,0.55)", fontSize: 14 }}>
            {missions.length} misiones activas · Completa y gana VEX + XP
          </p>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 0 }}>
        {/* Energy bar */}
        <EnergyBar energy={energy} max={maxEnergy} />

        {/* Reward toast */}
        {lastReward && (
          <div
            className="forge-toast success"
            style={{ cursor: "pointer" }}
            onClick={dismissReward}
          >
            <div className="forge-toast-title">⚔️ Misión completada!</div>
            <div className="forge-toast-body">
              {(lastReward.data.ingame_reward ?? 0) > 0 && `+${lastReward.data.ingame_reward} VEX `}
              {(lastReward.data.xp_reward ?? 0) > 0 && `+${lastReward.data.xp_reward} XP`}
            </div>
          </div>
        )}

        {executeError && (
          <div className="forge-toast error" style={{ cursor: "pointer" }}>
            <div className="forge-toast-title">❌ Error</div>
            <div className="forge-toast-body">{executeError}</div>
          </div>
        )}

        {/* Type filters */}
        <div className="region-filters">
          {REGIONS.map(t => (
            <button
              key={t}
              className={`region-btn ${activeType === t ? "active" : ""}`}
              onClick={() => setActiveType(t)}
            >
              {t === "all" ? "🗺️ Todas" : `${MISSION_TYPE_CONFIG[t]?.icon ?? "📜"} ${t}`}
              {typeCounts[t] > 0 && (
                <span style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: "1px 6px",
                  fontSize: 10, color: "var(--fg-dim)",
                }}>
                  {typeCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mission grid */}
        {loading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">Sin misiones</div>
            <div className="empty-state-desc">No hay misiones activas para este filtro.</div>
          </div>
        ) : (
          <div className="mission-grid">
            {filtered.map((m: any) => (
              <MissionCard
                key={m.id}
                mission={m}
                onExecute={(id: string) => { const found = missions.find((x: any) => x.id === id); if (found) execute(found as any); }}
                executing={executing !== null}
                isExecuting={m.id === executing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}