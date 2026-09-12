import { useState, useEffect, useCallback } from "react";
import { useMissions } from "../domains/missions/useMissions";
import { startMissionRun, claimMissionReward, getCurrentPlayerId, type Mission, type ClaimResult } from "../domains/missions/repository";
import { useQuests } from "../domains/quests/useQuests";
import { useProgress } from "../domains/progress/useProgress";
import { SkeletonList } from "../shared/components/Skeleton";
import { useToast } from "../shared/context/ToastContext";
import { supabase } from "../lib/supabase";
import { loadPlayerBattleUnits, type AIDifficulty } from "../lib/aiBattleEngine";
import { FormationSelector } from "../components/battle/FormationSelector";
import { ForgeFormationBoard } from "../components/battle/ForgeFormationBoard";
import type { BattleUnit } from "../lib/battleTypes";
import { applyRelicEffects, type EquippedRelic, type FormationState } from "../lib/forgeFormation";
import { getEquippedRelics } from "../domains/relics/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { ForgeIcon, type ForgeIconName } from "../shared/components/ForgeIcon";
import {
  getMissionEncounter,
  getPhase2Encounter,
  applyRegionalModifier,
  applyInterphaseHeal,
  type MissionEncounterConfig,
} from "../lib/missionEncounterEngine";
import { surfaceBackground } from "../lib/assetManifest";
const BG_URL = surfaceBackground("missions");
const FESTIVAL_END = "2026-10-16T01:53:23";

const MISSION_TYPE_CONFIG: Record<string, { icon: ForgeIconName; color: string }> = {
  Tutorial:   { icon: "missions", color: "#5B8BF5" },
  PvE:        { icon: "attack", color: "#E84040" },
  Dungeon:    { icon: "boss", color: "#A855F7" },
  Event:      { icon: "spark", color: "#E8B84B" },
  Expedition: { icon: "target", color: "#3DC96B" },
  Clan:       { icon: "clans", color: "#C9901F" },
};

const DIFFICULTY_CONFIG: Record<string, { color: string; pct: number; label: string }> = {
  normal:    { color: "#C9901F", pct: 35, label: "Normal"     },
  hard:      { color: "#E84040", pct: 65, label: "Difícil"    },
  epic:      { color: "#A855F7", pct: 82, label: "Épico"      },
  legendary: { color: "#E8B84B", pct: 95, label: "Legendario" },
  easy:      { color: "#3DC96B", pct: 20, label: "Fácil"      },
  fácil:     { color: "#3DC96B", pct: 20, label: "Fácil"      },
};

const QUEST_TYPE_ICON: Record<string, ForgeIconName> = {
  mission_complete: "attack",
  pvp_win:          "trophy",
  pvp_play:         "attack",
  fusion_perform:   "fusion",
  market_sell:      "coin",
  market_buy:       "shop",
  pack_open:        "packs",
  card_collect:     "cards",
};

const REGIONS = ["all", "Event", "Dungeon", "Tutorial", "Expedition", "PvE", "Clan"];

// ─── T3: Battle flow types ────────────────────────────────────────────────────

type BattlePhase =
  | "briefing"          // mission selected, showing narrative + confirm
  | "loading"           // loading player units + relics
  | "formation"         // FormationSelector active (full page)
  | "committing"        // calling execute_mission RPC (deducting energy)
  | "battle"            // ForgeFormationBoard active (full page) — phase 1
  | "phase_transition"  // T4: interstitial between phase 1 and phase 2
  | "battle_phase2"     // T4: ForgeFormationBoard phase 2
  | "win"               // victory screen
  | "defeat";           // defeat / abandon screen

function getMissionAIDifficulty(difficulty: string | null): AIDifficulty {
  switch ((difficulty ?? "").toLowerCase()) {
    case "easy": case "fácil": case "facil": return "easy";
    case "hard": case "difícil": case "dificil": return "normal";
    case "epic": case "épico": case "epico": return "expert";
    case "legendary": case "legendario": return "legend";
    default: return "easy";
  }
}

function getMissionEnemyName(difficulty: string | null): string {
  switch ((difficulty ?? "").toLowerCase()) {
    case "easy": case "fácil": return "Patrulla Básica";
    case "hard": case "difícil": return "Unidad de Élite";
    case "epic": case "épico": return "Comandante con Guardia";
    case "legendary": case "legendario": return "Señor de la Guerra";
    default: return "Escuadra Táctica";
  }
}

function getMissionNarrative(mission: Mission): string {
  const group = mission.mission_group ?? "";
  const type  = mission.mission_type  ?? "";
  const region = mission.region_id    ?? "territorio desconocido";
  if (group === "festival_forja")
    return "El Festival de la Forja convoca a los guerreros más valientes. La batalla determinará tu posición en la temporada.";
  if (group === "telegram_contract")
    return `Contrato de campo en ${region}. Un enfrentamiento táctico contra fuerzas enemigas. Selecciona tu Formación con cuidado — el Campeón no puede caer.`;
  if (type === "Dungeon")
    return "Las profundidades de la mazmorra aguardan. Criaturas antiguas guardan los secretos de la Forja. Solo los más estratégicos sobreviven.";
  if (type === "Expedition")
    return "Expedición a territorio desconocido. Las condiciones del terreno favorecen a quien adapte mejor su Formación.";
  if (type === "Tutorial")
    return "Una prueba de entrenamiento controlada. El sistema evaluará tu comprensión del combate ForgeFormation.";
  if (type === "Event")
    return "Misión de evento especial. Las reglas del combate cambian para probar nuevas estrategias de Formación.";
  return `Misión de combate en ${region}. Tu Campeón debe sobrevivir. Elige bien tu Vanguardia y Centinela.`;
}

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

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error("La operación tardó demasiado. Verifica tu conexión e inténtalo de nuevo."));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
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
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "#E8B84B", textTransform: "uppercase", marginBottom: 6 }}><ForgeIcon name="spark" size={10} style={{ verticalAlign: "middle", marginRight: 5 }} />EVENTO ACTIVO · TEMPORADA 1</div>
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
      <ForgeIcon name="energy" size={14} />
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
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "#3DC96B", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}><ForgeIcon name="check" size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />SESIÓN ACTUAL</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 13, fontWeight: 700, color: "#3DC96B" }}>{count} misión{count !== 1 ? "es" : ""} completada{count !== 1 ? "s" : ""}</span>
        {xp   > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· <ForgeIcon name="spark" size={12} style={{ verticalAlign: "middle" }} /> +{xp} XP</span>}
        {vex  > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· <ForgeIcon name="coin" size={12} style={{ verticalAlign: "middle" }} /> +{vex} VEX</span>}
        {tvex > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>· <ForgeIcon name="market" size={12} style={{ verticalAlign: "middle" }} /> +{tvex} T-VEX</span>}
      </div>
    </div>
  );
}

// ─── Daily Quests Section ──────────────────────────────────────────────────────

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
  const qIcon   = QUEST_TYPE_ICON[def.quest_type] ?? "quests";
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ForgeIcon name={qIcon} size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--fg-primary)", fontWeight: 700, fontSize: 13 }}>{def.title}</div>
          <div style={{ color: "var(--fg-dim)", fontSize: 11, marginTop: 1 }}>{def.description}</div>
        </div>
        {isClaimed && (
          <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(61,201,107,0.12)", border: "1px solid rgba(61,201,107,0.35)", color: "#3DC96B", fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.1em", fontWeight: 700 }}>
            <ForgeIcon name="check" size={9} style={{ verticalAlign: "middle", marginRight: 4 }} />RECLAMADA
          </span>
        )}
      </div>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {def.reward_xp > 0 && (
            <div style={{ background: "rgba(91,139,245,0.1)", border: "1px solid rgba(91,139,245,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#7ca8f8", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>
              <ForgeIcon name="spark" size={11} style={{ verticalAlign: "middle" }} /> {def.reward_xp} XP
            </div>
          )}
          {def.reward_vex_ingame > 0 && (
            <div style={{ background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#E8B84B", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>
              <ForgeIcon name="coin" size={11} style={{ verticalAlign: "middle" }} /> {def.reward_vex_ingame} VEX
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
            {isClaiming ? "Reclamando…" : <><ForgeIcon name="trophy" size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />RECLAMAR</>}
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

  useEffect(() => {
    const id = setInterval(() => setResetSecs(secondsUntilReset()), 60000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 16, fontWeight: 700, color: "var(--fg-primary)" }}>
            <ForgeIcon name="missions" size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Misiones Diarias
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
          <ForgeIcon name="refresh" size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />Reinicia en {formatResetTime(resetSecs)}
        </div>
      </div>

      {lastClaim?.result.claimed && (
        <div
          onClick={dismissClaim}
          style={{ cursor: "pointer", borderRadius: 10, padding: "12px 16px", marginBottom: 14, background: "rgba(61,201,107,0.08)", border: "1px solid rgba(61,201,107,0.35)", display: "flex", alignItems: "center", gap: 12 }}
        >
          <ForgeIcon name="trophy" size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#3DC96B", fontWeight: 700, fontSize: 13, fontFamily: '"Cinzel",serif' }}>¡Recompensa reclamada!</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              {lastClaim.result.xp_applied  && lastClaim.result.xp_applied > 0  && <span style={{ color: "#7ca8f8", fontSize: 11 }}><ForgeIcon name="spark" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />+{lastClaim.result.xp_applied} XP</span>}
              {lastClaim.result.vex_applied && lastClaim.result.vex_applied > 0 && <span style={{ color: "#E8B84B", fontSize: 11 }}><ForgeIcon name="coin" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />+{lastClaim.result.vex_applied} VEX</span>}
            </div>
          </div>
          <span style={{ color: "var(--fg-dim)", fontSize: 10 }}>Tap para cerrar</span>
        </div>
      )}

      {error && (
        <div style={{ borderRadius: 8, padding: "10px 14px", marginBottom: 12, background: "rgba(232,64,64,0.07)", border: "1px solid rgba(232,64,64,0.25)", color: "#E84040", fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonList rows={3} />
      ) : quests.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}><ForgeIcon name="missions" size={28} /></div>
          <div style={{ color: "var(--fg-dim)", fontSize: 13 }}>No se pudieron cargar las misiones diarias. Inicia sesión para verlas.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quests.map(q => (
            <DailyQuestCard key={q.id} quest={q} onClaim={claim} isClaiming={claiming === q.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mission Card ──────────────────────────────────────────────────────────────

function MissionCard({ mission, onExecute, executing, isExecuting, isCompleted, isActive, cooldownSecs, currentEnergy }: {
  mission: any; onExecute: (m: Mission) => void; executing: boolean;
  isExecuting: boolean; isCompleted: boolean; isActive: boolean;
  cooldownSecs: number; currentEnergy: number;
}) {
  const typeConf   = MISSION_TYPE_CONFIG[mission.mission_type] ?? { icon: "missions" as ForgeIconName, color: "#C9901F" };
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
      {isFestival && !isCompleted && !isActive && !isOnCooldown && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #C9901F, #E8B84B)", borderRadius: "0 0 6px 6px", padding: "2px 8px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#0a0a14", fontWeight: 700 }}><ForgeIcon name="spark" size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />FESTIVAL</div>
      )}
      {isCompleted && (
        <div className="mission-complete-badge" style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #1a5c30, #3DC96B)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#0a1a0f", fontWeight: 700 }}><ForgeIcon name="check" size={9} style={{ verticalAlign: "middle", marginRight: 4 }} />COMPLETADA</div>
      )}
            {isActive && (
              <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #1a2a5c, #5B8BF5)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.15em", color: "#fff", fontWeight: 700 }}><ForgeIcon name="energy" size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />EJECUTANDO</div>
      )}
      {isOnCooldown && !isActive && !isCompleted && (
        <div style={{ position: "absolute", top: -1, right: 8, background: "linear-gradient(135deg, #3b1a6e, #A855F7)", borderRadius: "0 0 6px 6px", padding: "2px 10px", fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.12em", color: "#f0e0ff", fontWeight: 700 }}>
          <ForgeIcon name="hourglass" size={9} style={{ verticalAlign: "middle", marginRight: 4 }} />{formatCooldown(cooldownSecs)}
        </div>
      )}
      {(hasVex || hasTVex) && (
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
          {hasVex  && <div style={{ background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.4)",  borderRadius: 6, padding: "2px 7px", fontSize: 10, fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, color: "#E8B84B" }}><ForgeIcon name="coin" size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{mission.reward_vex_ingame} VEX</div>}
          {hasTVex && <div style={{ background: "rgba(91,139,245,0.12)",  border: "1px solid rgba(91,139,245,0.35)", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, color: "#7ca8f8" }}><ForgeIcon name="market" size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{mission.reward_vex_tradeable} T-VEX</div>}
        </div>
      )}
      <div className="mission-type-badge" style={{ marginTop: (hasVex || hasTVex) ? 22 : 0 }}><ForgeIcon name={typeConf.icon} size={13} /><span>{mission.mission_type}</span></div>
      <div className="mission-name">{mission.name}</div>
      <div className="mission-region"><ForgeIcon name="target" size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{mission.region_id ?? "—"}</div>
      <div className="difficulty-bar-wrap">
        <div className="difficulty-label">
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--fg-dim)", letterSpacing: "0.1em" }}>DIFICULTAD</span>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 11, fontWeight: 700, color: diffConf.color }}>{diffConf.label}</span>
        </div>
        <div className="difficulty-bar"><div className="difficulty-bar-fill quest-progress-fill" style={{ width: `${diffConf.pct}%`, background: diffConf.color, '--quest-pct': `${diffConf.pct}%` } as React.CSSProperties} /></div>
      </div>
      <div className="mission-rewards">
        {(mission.energy_cost ?? 0) > 0 && <div className="reward-chip energy"><ForgeIcon name="energy" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{mission.energy_cost}</div>}
        {(mission.reward_xp   ?? 0) > 0 && <div className="reward-chip xp"><ForgeIcon name="spark" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{mission.reward_xp} XP</div>}
      </div>
      {!canAfford && !isCompleted && !isOnCooldown && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, background: "rgba(232,64,64,0.08)", border: "1px solid rgba(232,64,64,0.25)", fontSize: 10, color: "#E84040", fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.05em", marginBottom: 6 }}>
          <ForgeIcon name="energy" size={12} />
          <span>Energía insuficiente — necesitas {energyCost}, tienes {currentEnergy}</span>
        </div>
      )}
      <button
        className="mission-execute-btn"
        onClick={() => onExecute(mission as Mission)}
        disabled={executing || isCompleted || isOnCooldown || !canAfford}
        style={(isCompleted || isOnCooldown || !canAfford) ? { opacity: 0.5, cursor: "default" } : {}}
      >
        {isExecuting       ? "Preparando..."
         : isCompleted     ? <><ForgeIcon name="check" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Completada</>
         : isOnCooldown    ? <><ForgeIcon name="hourglass" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{formatCooldown(cooldownSecs)}</>
         : !canAfford      ? <><ForgeIcon name="energy" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{energyCost} energía</>
         : <><ForgeIcon name="attack" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Iniciar Batalla</>}
      </button>
    </div>
  );
}

// ─── T3: Battle flow screens ───────────────────────────────────────────────────

function MissionBriefing({
  mission,
  currentEnergy,
  onConfirm,
  onCancel,
  error,
  encounterConfig,
}: {
  mission: Mission;
  currentEnergy: number;
  onConfirm: () => void;
  onCancel: () => void;
  error: string | null;
  encounterConfig?: import("../lib/missionEncounterEngine").MissionEncounterConfig;
}) {
  const diffConf   = DIFFICULTY_CONFIG[(mission.difficulty ?? "").toLowerCase()] ?? DIFFICULTY_CONFIG["normal"];
  const typeConf   = MISSION_TYPE_CONFIG[mission.mission_type ?? ""] ?? { icon: "attack" as ForgeIconName, color: "#E84040" };
  const energyCost = mission.energy_cost ?? 0;
  const canAfford  = energyCost === 0 || currentEnergy >= energyCost;
  // T4: use encounter data when available, fall back to legacy helpers
  const enemyName  = encounterConfig?.opponentName ?? getMissionEnemyName(mission.difficulty);
  const narrative  = encounterConfig?.briefingNarrative ?? getMissionNarrative(mission);
  const regionMod  = encounterConfig?.regionModifier;
  const totalPhases = encounterConfig?.phaseConfig?.totalPhases ?? 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(5,5,15,0.96)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        @keyframes briefingSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .briefing-panel { animation: briefingSlide 0.35s ease forwards; }
        @keyframes scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .briefing-scan::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(232,184,75,0.04) 50%, transparent 100%);
          animation: scanLine 3s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="briefing-panel" style={{
        maxWidth: 480, width: "100%",
        background: "linear-gradient(160deg, #0d0d20 0%, #10101e 100%)",
        border: `1px solid ${diffConf.color}55`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: `0 0 60px ${diffConf.color}20, 0 20px 60px rgba(0,0,0,0.8)`,
      }}>

        {/* Header bar */}
        <div style={{
          padding: "16px 24px",
          background: `linear-gradient(135deg, ${diffConf.color}18, transparent)`,
          borderBottom: `1px solid ${diffConf.color}30`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ForgeIcon name={typeConf.icon} size={22} />
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: `${diffConf.color}bb`, textTransform: "uppercase" }}>{mission.mission_type} · {mission.region_id}</div>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: 20, fontWeight: 700, color: "var(--fg-primary)", lineHeight: 1.2 }}>{mission.name}</div>
            </div>
          </div>
          <div style={{
            padding: "4px 12px", borderRadius: 20,
            background: `${diffConf.color}20`,
            border: `1px solid ${diffConf.color}60`,
            color: diffConf.color,
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fontWeight: 700,
          }}>
            {diffConf.label.toUpperCase()}
          </div>
        </div>

        {/* Narrative */}
        <div className="briefing-scan" style={{ position: "relative", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "var(--fg-dim)", textTransform: "uppercase", marginBottom: 10 }}>BRIEFING OPERATIVO</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7, fontStyle: "italic" }}>
            "{narrative}"
          </div>
          {/* T4: phase indicator */}
          {totalPhases > 1 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {[1, 2].map(p => (
                <div key={p} style={{
                  padding: "2px 10px", borderRadius: 6,
                  background: p === 1 ? `${diffConf.color}25` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${p === 1 ? diffConf.color + "60" : "rgba(255,255,255,0.1)"}`,
                  fontSize: 10, fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace',
                  color: p === 1 ? diffConf.color : "rgba(255,255,255,0.3)",
                }}>
                  FASE {p}
                </div>
              ))}
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>— misión de 2 fases</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ padding: "18px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Enemy — T4: shows encounter archetype name + description */}
          <div style={{ background: "rgba(232,64,64,0.07)", border: "1px solid rgba(232,64,64,0.2)", borderRadius: 10, padding: "12px 14px", gridColumn: encounterConfig?.enemyDescription ? "span 2" : undefined }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: "rgba(232,64,64,0.7)", textTransform: "uppercase", marginBottom: 6 }}>ENEMIGO</div>
            <div style={{ color: "var(--fg-primary)", fontWeight: 700, fontSize: 13 }}><ForgeIcon name="attack" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{enemyName}</div>
            {encounterConfig?.enemyDescription
              ? <div style={{ color: "var(--fg-dim)", fontSize: 10, marginTop: 4, lineHeight: 1.5 }}>{encounterConfig.enemyDescription}</div>
              : <div style={{ color: "var(--fg-dim)", fontSize: 10, marginTop: 4 }}>ForgeFormation IA · {diffConf.label}</div>
            }
            {/* Keywords */}
            {encounterConfig && encounterConfig.enemyKeywords.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {encounterConfig.enemyKeywords.map(kw => (
                  <span key={kw} style={{
                    padding: "2px 8px", borderRadius: 4,
                    background: "rgba(232,64,64,0.12)", border: "1px solid rgba(232,64,64,0.3)",
                    fontSize: 9, fontFamily: '"IBM Plex Mono", monospace',
                    color: "#E84040", fontWeight: 700, letterSpacing: "0.08em",
                  }}>{kw}</span>
                ))}
              </div>
            )}
          </div>

          {/* Energy cost */}
          <div style={{
            background: canAfford ? "rgba(61,201,107,0.07)" : "rgba(232,64,64,0.07)",
            border: `1px solid ${canAfford ? "rgba(61,201,107,0.2)" : "rgba(232,64,64,0.3)"}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: canAfford ? "rgba(61,201,107,0.7)" : "rgba(232,64,64,0.7)", textTransform: "uppercase", marginBottom: 6 }}>ENERGÍA</div>
            <div style={{ color: canAfford ? "#3DC96B" : "#E84040", fontWeight: 700, fontSize: 13 }}>
              <ForgeIcon name="energy" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{energyCost > 0 ? `−${energyCost}` : "Gratis"}
            </div>
            <div style={{ color: "var(--fg-dim)", fontSize: 10, marginTop: 4 }}>
              {energyCost > 0 ? `${currentEnergy} disponible` : "Sin coste"}
            </div>
          </div>

          {/* T4: Regional modifier */}
          {regionMod && regionMod.type !== "neutral" && (
            <div style={{
              background: `${regionMod.color}10`, border: `1px solid ${regionMod.color}35`,
              borderRadius: 10, padding: "12px 14px",
            }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: `${regionMod.color}90`, textTransform: "uppercase", marginBottom: 6 }}>
                <ForgeIcon name={regionMod.type === "buff" ? "check" : "warning"} size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{regionMod.type === "buff" ? "VENTAJA REGIONAL" : "PENALIZACIÓN REGIONAL"}
              </div>
              <div style={{ color: regionMod.color, fontWeight: 700, fontSize: 12 }}><ForgeIcon name={regionMod.icon} size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{regionMod.name}</div>
              <div style={{ color: "var(--fg-dim)", fontSize: 10, marginTop: 3 }}>{regionMod.description}</div>
            </div>
          )}

          {/* Energy cost */}
          <div style={{
            background: canAfford ? "rgba(61,201,107,0.07)" : "rgba(232,64,64,0.07)",
            border: `1px solid ${canAfford ? "rgba(61,201,107,0.2)" : "rgba(232,64,64,0.3)"}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: canAfford ? "rgba(61,201,107,0.7)" : "rgba(232,64,64,0.7)", textTransform: "uppercase", marginBottom: 6 }}>ENERGÍA</div>
            <div style={{ color: canAfford ? "#3DC96B" : "#E84040", fontWeight: 700, fontSize: 13 }}>
              <ForgeIcon name="energy" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{energyCost > 0 ? `−${energyCost}` : "Gratis"}
            </div>
            <div style={{ color: "var(--fg-dim)", fontSize: 10, marginTop: 4 }}>
              {energyCost > 0 ? `${currentEnergy} disponible` : "Sin coste"}
            </div>
          </div>

          {/* XP reward */}
          {(mission.reward_xp ?? 0) > 0 && (
            <div style={{ background: "rgba(91,139,245,0.07)", border: "1px solid rgba(91,139,245,0.2)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: "rgba(91,139,245,0.7)", textTransform: "uppercase", marginBottom: 6 }}>XP VICTORIA</div>
              <div style={{ color: "#7ca8f8", fontWeight: 700, fontSize: 13 }}><ForgeIcon name="spark" size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />+{mission.reward_xp} XP</div>
            </div>
          )}

          {/* VEX reward */}
          {(mission.reward_vex_ingame ?? 0) > 0 && (
            <div style={{ background: "rgba(232,184,75,0.07)", border: "1px solid rgba(232,184,75,0.2)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: "rgba(232,184,75,0.7)", textTransform: "uppercase", marginBottom: 6 }}>VEX VICTORIA</div>
              <div style={{ color: "#E8B84B", fontWeight: 700, fontSize: 13 }}><ForgeIcon name="coin" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />+{mission.reward_vex_ingame} VEX</div>
            </div>
          )}
        </div>

        {/* ForgeFormation reminder */}
        <div style={{ padding: "14px 24px", background: "rgba(232,184,75,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <ForgeIcon name="shield" size={16} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Selecciona tu <strong style={{ color: "rgba(232,184,75,0.9)" }}>Campeón</strong>, <strong style={{ color: "rgba(232,184,75,0.9)" }}>Vanguardia</strong> y <strong style={{ color: "rgba(232,184,75,0.9)" }}>Centinela</strong>. El Campeón no puede caer — si muere, la misión termina. La energía se descuenta al confirmar la formación.
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: 8, background: "rgba(232,64,64,0.08)", border: "1px solid rgba(232,64,64,0.3)", color: "#E84040", fontSize: 12 }}>
            {error === "insufficient_energy"
              ? <><ForgeIcon name="energy" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Energía insuficiente — necesitas {energyCost}, tienes {currentEnergy}</>
              : error}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "20px 24px", display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "var(--fg-dim)", fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
              transition: "all .2s",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            style={{
              flex: 2, padding: "12px", borderRadius: 10, border: "none",
              background: canAfford
                ? `linear-gradient(135deg, ${diffConf.color}cc, ${diffConf.color})`
                : "rgba(255,255,255,0.06)",
              color: canAfford ? "#fff" : "var(--fg-dim)",
              fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
              cursor: canAfford ? "pointer" : "default",
              fontFamily: '"Rajdhani", sans-serif',
              opacity: canAfford ? 1 : 0.5,
              transition: "all .2s",
              boxShadow: canAfford ? `0 4px 20px ${diffConf.color}40` : "none",
            }}
          >
            <ForgeIcon name="attack" size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />SELECCIONAR FORMACIÓN
          </button>
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({
  mission,
  rewards,
  rewardError,
  claimingReward,
  onRetryClaim,
  onPlayAgain,
  onExit,
}: {
  mission: Mission;
  rewards: ClaimResult | null;
  rewardError: string | null;
  claimingReward: boolean;
  onRetryClaim: () => void;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9500,
      background: "radial-gradient(ellipse at center, rgba(0,40,15,0.98) 0%, rgba(5,5,15,0.99) 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        @keyframes victoryPulse {
          0%,100% { box-shadow: 0 0 40px rgba(61,201,107,0.3), 0 0 80px rgba(61,201,107,0.1); }
          50% { box-shadow: 0 0 60px rgba(61,201,107,0.5), 0 0 120px rgba(61,201,107,0.2); }
        }
        @keyframes victoryEntry {
          from { opacity: 0; transform: scale(0.9) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rewardFloat {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .reward-item:nth-child(1) { animation: rewardFloat 0.4s 0.3s both; }
        .reward-item:nth-child(2) { animation: rewardFloat 0.4s 0.5s both; }
        .reward-item:nth-child(3) { animation: rewardFloat 0.4s 0.7s both; }
      `}</style>
      <div style={{
        maxWidth: 420, width: "100%",
        background: "linear-gradient(160deg, #061a0e 0%, #0a1a12 100%)",
        border: "1px solid rgba(61,201,107,0.5)",
        borderRadius: 24, overflow: "hidden",
        animation: "victoryEntry 0.5s ease forwards",
      }}>
        {/* Trophy header */}
        <div style={{
          padding: "32px 24px 24px",
          background: "linear-gradient(135deg, rgba(61,201,107,0.12), rgba(61,201,107,0.04))",
          textAlign: "center", borderBottom: "1px solid rgba(61,201,107,0.2)",
          animation: "victoryPulse 2.5s ease-in-out infinite",
        }}>
          <div style={{ marginBottom: 12, lineHeight: 1 }}><ForgeIcon name="trophy" size={56} /></div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 28, fontWeight: 700, color: "#3DC96B", letterSpacing: "0.06em", marginBottom: 6 }}>¡VICTORIA!</div>
          <div style={{ color: "rgba(61,201,107,0.7)", fontSize: 13 }}>{mission.name} — Completada</div>
        </div>

        {/* Rewards */}
        {rewards && (
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "var(--fg-dim)", textTransform: "uppercase", marginBottom: 14 }}>RECOMPENSAS OBTENIDAS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(rewards.xp_applied ?? 0) > 0 && (
                <div className="reward-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(91,139,245,0.08)", border: "1px solid rgba(91,139,245,0.25)" }}>
                  <span style={{ color: "#7ca8f8", fontSize: 14 }}><ForgeIcon name="spark" size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Experiencia</span>
                  <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 800, fontSize: 18, color: "#7ca8f8" }}>+{rewards.xp_applied} XP</span>
                </div>
              )}
              {(rewards.ingame_applied ?? 0) > 0 && (
                <div className="reward-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(232,184,75,0.08)", border: "1px solid rgba(232,184,75,0.25)" }}>
                  <span style={{ color: "#E8B84B", fontSize: 14 }}><ForgeIcon name="coin" size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />VEX Ingame</span>
                  <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 800, fontSize: 18, color: "#E8B84B" }}>+{rewards.ingame_applied} VEX</span>
                </div>
              )}
              {(rewards.tradeable_applied ?? 0) > 0 && (
                <div className="reward-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(91,139,245,0.08)", border: "1px solid rgba(91,139,245,0.25)" }}>
                  <span style={{ color: "#7ca8f8", fontSize: 14 }}><ForgeIcon name="market" size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />VEX Tradeable</span>
                  <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 800, fontSize: 18, color: "#7ca8f8" }}>+{rewards.tradeable_applied} T-VEX</span>
                </div>
              )}
              {!(rewards.xp_applied ?? 0) && !(rewards.ingame_applied ?? 0) && !(rewards.tradeable_applied ?? 0) && (
                <div style={{ color: "var(--fg-dim)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>
                  Misión completada — recompensas aplicadas
                </div>
              )}
            </div>
          </div>
        )}

        {rewardError && (
          <div style={{
            margin: "0 24px 16px", padding: "12px 14px", borderRadius: 10,
            background: "rgba(232,64,64,0.08)", border: "1px solid rgba(232,64,64,0.35)",
            color: "#ff9b9b", fontSize: 12, lineHeight: 1.45,
          }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>La victoria está guardada, pero la recompensa aún no se aplicó.</div>
            <div>{rewardError}</div>
            <button
              type="button"
              onClick={onRetryClaim}
              disabled={claimingReward}
              style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8,
                border: "1px solid rgba(232,184,75,0.45)",
                background: claimingReward ? "rgba(255,255,255,0.06)" : "rgba(232,184,75,0.12)",
                color: claimingReward ? "var(--fg-dim)" : "#e8b84b",
                cursor: claimingReward ? "wait" : "pointer", fontWeight: 800,
              }}
            >
              {claimingReward ? "REINTENTANDO…" : "REINTENTAR RECOMPENSA"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "20px 24px", display: "flex", gap: 12 }}>
          <button
            onClick={onExit}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "var(--fg-dim)", fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
            }}
          >
            Volver
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 2, padding: "12px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #1a7a3a, #3DC96B)",
              color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
              cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
              boxShadow: "0 4px 20px rgba(61,201,107,0.4)",
            }}
          >
            <ForgeIcon name="refresh" size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />REPETIR MISIÓN
          </button>
        </div>
      </div>
    </div>
  );
}

function DefeatScreen({
  mission,
  championDied,
  onPlayAgain,
  onExit,
}: {
  mission: Mission;
  championDied: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9500,
      background: "radial-gradient(ellipse at center, rgba(40,5,5,0.98) 0%, rgba(5,5,15,0.99) 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        @keyframes defeatEntry {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div style={{
        maxWidth: 420, width: "100%",
        background: "linear-gradient(160deg, #1a0505 0%, #0f0a0a 100%)",
        border: "1px solid rgba(232,64,64,0.4)",
        borderRadius: 24, overflow: "hidden",
        animation: "defeatEntry 0.4s ease forwards",
        boxShadow: "0 0 60px rgba(232,64,64,0.15)",
      }}>
        {/* Defeat header */}
        <div style={{
          padding: "32px 24px 24px",
          background: "linear-gradient(135deg, rgba(232,64,64,0.12), rgba(232,64,64,0.04))",
          textAlign: "center", borderBottom: "1px solid rgba(232,64,64,0.2)",
        }}>
          <div style={{ marginBottom: 12, lineHeight: 1 }}><ForgeIcon name={championDied ? "skull" : "shield"} size={56} /></div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 26, fontWeight: 700, color: "#E84040", letterSpacing: "0.06em", marginBottom: 6 }}>
            {championDied ? "EL CAMPEÓN HA CAÍDO" : "DERROTA"}
          </div>
          <div style={{ color: "rgba(232,64,64,0.6)", fontSize: 13 }}>{mission.name}</div>
        </div>

        {/* Message */}
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7, textAlign: "center" }}>
            {championDied
              ? "Tu Campeón fue derrotado. La Formación ha colapsado. Analiza tu estrategia y vuelve más fuerte."
              : "La misión no fue completada. La energía ha sido consumida. Reagrupa tu Formación e inténtalo de nuevo."}
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "var(--fg-dim)", textAlign: "center" }}>
            <ForgeIcon name="energy" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />La energía se ha descontado. Espera a que se regenere o planifica mejor tu próxima Formación.
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "20px 24px", display: "flex", gap: 12 }}>
          <button
            onClick={onExit}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "var(--fg-dim)", fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
            }}
          >
            Volver
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 2, padding: "12px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #8a1515, #E84040)",
              color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
              cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
            }}
          >
            <ForgeIcon name="refresh" size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />INTENTAR DE NUEVO
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export function MissionsRoute() {
  const { progress } = useProgress();
  const energy      = progress?.energy    ?? 0;
  const maxEnergy   = progress?.max_energy ?? 100;
  const energyUpdatedAt = progress?.energy_last_regen ?? undefined;

  const {
    missions, loading, execute, executing, lastReward, cooldownRemaining,
    executeError, dismissReward, dismissError, tick,
    completedThisSession, sessionStats, recordBattleComplete,
  } = useMissions();

  const [activeType, setActiveType] = useState("all");
  const { addToast } = useToast();

  // ── T3: Battle flow state ──────────────────────────────────────────────────
  const [battlePhase,    setBattlePhase]    = useState<BattlePhase | null>(null);
  const [battleMission,  setBattleMission]  = useState<Mission | null>(null);
  const [playerUnits,    setPlayerUnits]    = useState<BattleUnit[] | null>(null);
  const [equippedRelics, setEquippedRelics] = useState<EquippedRelic[]>([]);
  const [battleFormation, setBattleFormation] = useState<FormationState | null>(null);
  const [runId,          setRunId]          = useState<string | null>(null);
  const [runPlayerId,    setRunPlayerId]    = useState<string | null>(null);
  const [championDied,   setChampionDied]   = useState(false);
  const [winRewards,     setWinRewards]     = useState<ClaimResult | null>(null);
  const [rewardError,    setRewardError]    = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [battleError,    setBattleError]    = useState<string | null>(null);

  // ── T4: Encounter engine state ─────────────────────────────────────────────
  const [encounterConfig,  setEncounterConfig]  = useState<MissionEncounterConfig | null>(null);
  const [currentPhase,     setCurrentPhase]     = useState<1 | 2>(1);
  const [phase2Formation,  setPhase2Formation]  = useState<FormationState | null>(null);

  // ── Load equipped relics once ──────────────────────────────────────────────
  useEffect(() => {
    getEquippedRelics().then(setEquippedRelics).catch(() => {});
  }, []);

  // ── T3: Battle flow handlers ───────────────────────────────────────────────

  const handleStartBattle = useCallback((mission: Mission) => {
    setBattleMission(mission);
    setBattleError(null);
    // T4: pre-compute encounter config synchronously so briefing can display it
    const encounter = getMissionEncounter(mission);
    setEncounterConfig(encounter);
    setCurrentPhase(1);
    setPhase2Formation(null);
    setBattlePhase("briefing");
  }, []);

  const handleBriefingConfirm = useCallback(async () => {
    if (!battleMission) return;
    setBattlePhase("loading");
    setBattleError(null);
    try {
      const playerId = await withTimeout(getCurrentPlayerId(), 10000);
      if (!playerId) {
        setBattleError("Debes iniciar sesión para jugar.");
        setBattlePhase("briefing");
        return;
      }
      const units = await withTimeout(loadPlayerBattleUnits(supabase, playerId), 10000);
      if (!units || units.length === 0) {
        setBattleError("No se encontraron cartas en tu mazo. Ve al Deck Builder primero.");
        setBattlePhase("briefing");
        return;
      }
      setPlayerUnits(units);
      setBattlePhase("formation");
    } catch (err) {
      setBattleError(err instanceof Error ? err.message : "No se pudo cargar tu formación.");
      setBattlePhase("briefing");
    }
  }, [battleMission]);

  const handleFormationConfirm = useCallback(async (formation: FormationState) => {
    if (!battleMission) return;
    let formationWithRelics = applyRelicEffects(formation, equippedRelics);
    // T4: apply regional modifier to player formation
    if (encounterConfig) {
      formationWithRelics = applyRegionalModifier(formationWithRelics, encounterConfig.regionModifier);
    }
    setBattleFormation(formationWithRelics);
    setPlayerUnits(null);
    setBattlePhase("committing");

    const controller = new AbortController();
    try {
      const result = await withTimeout(
        startMissionRun(battleMission.id, controller.signal),
        12000,
        () => controller.abort(),
      );
      if (!result.data) {
        setBattleError(result.reason ?? "No se pudo iniciar la misión.");
        setBattleFormation(null);
        setBattlePhase("briefing");
        return;
      }
      setRunId(result.data.run_id ?? null);
      setRunPlayerId(result.data.player_id ?? null);
      setBattlePhase("battle");
    } catch (err) {
      setBattleError(err instanceof Error ? err.message : "No se pudo iniciar la misión.");
      setBattleFormation(null);
      setBattlePhase("briefing");
    }
  }, [battleMission, equippedRelics, encounterConfig]);

  const claimBattleReward = useCallback(async (missionRunId: string, playerId: string) => {
    setClaimingReward(true);
    setRewardError(null);
    const controller = new AbortController();
    try {
      const claim = await withTimeout(
        claimMissionReward(missionRunId, playerId, `mission:${missionRunId}`, controller.signal),
        12000,
        () => controller.abort(),
      );
      if (!claim.data?.success) {
        setWinRewards(null);
        setRewardError(claim.reason ?? "No se pudo aplicar la recompensa.");
        return false;
      }

      setWinRewards(claim.data);
      if (battleMission) {
        recordBattleComplete(
          battleMission,
          claim.data.xp_applied       ?? 0,
          claim.data.ingame_applied   ?? 0,
          claim.data.tradeable_applied ?? 0,
        );
      }
      return true;
    } catch (err) {
      setWinRewards(null);
      setRewardError(err instanceof Error ? err.message : "No se pudo aplicar la recompensa.");
      return false;
    } finally {
      setClaimingReward(false);
    }
  }, [battleMission, recordBattleComplete]);

  const retryClaimBattleReward = useCallback(() => {
    if (!runId || !runPlayerId || claimingReward) return;
    void claimBattleReward(runId, runPlayerId);
  }, [runId, runPlayerId, claimingReward, claimBattleReward]);

  const handleBattleComplete = useCallback(async (won: boolean, didChampionDie: boolean) => {
    setChampionDied(didChampionDie);
    // Energy was already spent (execute_mission deducted it)
    window.dispatchEvent(new CustomEvent("vexforge:energy-updated"));

    if (!won) {
      setBattlePhase("defeat");
      return;
    }

    // T4: check if mission has a phase 2
    const totalPhases = encounterConfig?.phaseConfig?.totalPhases ?? 1;
    if (currentPhase === 1 && totalPhases > 1 && battleFormation) {
      // Heal champion partially between phases
      const champHealPct = encounterConfig?.phaseConfig?.champHealPct ?? 0;
      const healed = applyInterphaseHeal(battleFormation, champHealPct);
      setPhase2Formation(healed);
      setBattlePhase("phase_transition");
      return;
    }

    // Final win — claim rewards
    if (runId && runPlayerId) {
      setWinRewards(null);
      setRewardError(null);
      setBattlePhase("win");
      await claimBattleReward(runId, runPlayerId);
    } else {
      setBattlePhase("win");
    }
  }, [runId, runPlayerId, claimBattleReward, encounterConfig, currentPhase, battleFormation]);

  // T4: phase 2 battle complete
  const handlePhase2Complete = useCallback(async (won: boolean, didChampionDie: boolean) => {
    setChampionDied(didChampionDie);
    if (!won) {
      setBattlePhase("defeat");
      return;
    }
    // Claim rewards after winning both phases
    if (runId && runPlayerId) {
      setWinRewards(null);
      setRewardError(null);
      setBattlePhase("win");
      await claimBattleReward(runId, runPlayerId);
    } else {
      setBattlePhase("win");
    }
  }, [runId, runPlayerId, claimBattleReward]);

  // T4: proceed to phase 2 from transition screen
  const handlePhaseTransitionConfirm = useCallback(() => {
    setCurrentPhase(2);
    setBattlePhase("battle_phase2");
  }, []);

  const handleBattleDismiss = useCallback(() => {
    // Treat dismiss as defeat/abandon — energy already spent
    window.dispatchEvent(new CustomEvent("vexforge:energy-updated"));
    setChampionDied(false);
    setBattlePhase("defeat");
  }, []);

  const exitBattle = useCallback(() => {
    setBattlePhase(null);
    setBattleMission(null);
    setPlayerUnits(null);
    setBattleFormation(null);
    setRunId(null);
    setRunPlayerId(null);
    setChampionDied(false);
    setWinRewards(null);
    setRewardError(null);
    setClaimingReward(false);
    setBattleError(null);
    // T4 state reset
    setEncounterConfig(null);
    setCurrentPhase(1);
    setPhase2Formation(null);
  }, []);

  const retryBattle = useCallback(() => {
    // Restart briefing for the same mission
    setBattleFormation(null);
    setRunId(null);
    setRunPlayerId(null);
    setChampionDied(false);
    setWinRewards(null);
    setRewardError(null);
    setClaimingReward(false);
    setBattleError(null);
    setBattlePhase("briefing");
  }, []);

  // ── T3: Render battle flow phases ─────────────────────────────────────────

  if (battlePhase === "loading" || battlePhase === "committing") {
    return <PageLoader />;
  }

  if (battlePhase === "briefing" && battleMission) {
    return (
      <>
        {/* Keep the route wrapper in background for visual context */}
        <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})`, filter: "blur(2px)", pointerEvents: "none" }} />
        <MissionBriefing
          mission={battleMission}
          currentEnergy={energy}
          onConfirm={handleBriefingConfirm}
          onCancel={exitBattle}
          error={battleError}
          encounterConfig={encounterConfig ?? undefined}
        />
      </>
    );
  }

  if (battlePhase === "formation" && playerUnits && battleMission) {
    return (
      <FormationSelector
        playerUnits={playerUnits}
        onConfirm={handleFormationConfirm}
        onCancel={exitBattle}
        difficulty={getMissionAIDifficulty(battleMission.difficulty)}
      />
    );
  }

  if (battlePhase === "battle" && battleFormation && battleMission) {
    const p1OpponentName = encounterConfig?.opponentName ?? getMissionEnemyName(battleMission.difficulty);
    const p1Difficulty   = encounterConfig?.difficulty   ?? getMissionAIDifficulty(battleMission.difficulty);
    const phaseTotal     = encounterConfig?.phaseConfig?.totalPhases ?? 1;
    return (
      <ForgeFormationBoard
        initialFormation={battleFormation}
        playerName="Tú"
        opponentName={phaseTotal > 1 ? `FASE 1 · ${p1OpponentName}` : p1OpponentName}
        difficulty={p1Difficulty}
        equippedRelics={equippedRelics}
        onComplete={handleBattleComplete}
        onDismiss={handleBattleDismiss}
        presentationSurface="pve"
      />
    );
  }

  // ── T4: Phase transition screen ─────────────────────────────────────────────
  if (battlePhase === "phase_transition" && battleMission && encounterConfig) {
    const { phaseConfig, regionModifier } = encounterConfig;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, rgba(5,5,15,0.98) 70%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}>
        <style>{`
          @keyframes phaseGlow {
            0%,100% { box-shadow: 0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(168,85,247,0.1); }
            50% { box-shadow: 0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(168,85,247,0.2); }
          }
          @keyframes phaseEntry {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div style={{
          maxWidth: 460, width: "100%",
          background: "linear-gradient(160deg, #150a28 0%, #0d0d20 100%)",
          border: "1px solid rgba(168,85,247,0.5)",
          borderRadius: 24, overflow: "hidden",
          animation: "phaseEntry 0.45s ease forwards",
          animationIterationCount: "1",
        }}>
          {/* Phase header */}
          <div style={{
            padding: "28px 24px 22px",
            background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
            textAlign: "center", borderBottom: "1px solid rgba(168,85,247,0.25)",
            animation: "phaseGlow 2.5s ease-in-out infinite",
          }}>
            <div style={{ marginBottom: 10, lineHeight: 1 }}><ForgeIcon name="attack" size={48} /></div>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.25em", color: "rgba(168,85,247,0.8)", textTransform: "uppercase", marginBottom: 8 }}>
              <ForgeIcon name="check" size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />FASE 1 SUPERADA
            </div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 24, fontWeight: 700, color: "#c084fc", letterSpacing: "0.05em", marginBottom: 6 }}>
              {phaseConfig.phaseLabel(2)}
            </div>
            <div style={{ color: "rgba(192,132,252,0.6)", fontSize: 12 }}>{battleMission.name}</div>
          </div>

          {/* Phase 2 narrative */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "rgba(168,85,247,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
              BRIEFING FASE 2
            </div>
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7, fontStyle: "italic" }}>
              "{phaseConfig.phase2Narrative}"
            </div>
          </div>

          {/* Status */}
          <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: "rgba(168,85,247,0.7)", textTransform: "uppercase", marginBottom: 5 }}>ENEMIGO FASE 2</div>
              <div style={{ color: "#c084fc", fontWeight: 700, fontSize: 12 }}><ForgeIcon name="attack" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{phaseConfig.phase2OpponentName}</div>
            </div>
            <div style={{ background: "rgba(61,201,107,0.08)", border: "1px solid rgba(61,201,107,0.25)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: "rgba(61,201,107,0.7)", textTransform: "uppercase", marginBottom: 5 }}>CURACIÓN CAMPEÓN</div>
              <div style={{ color: "#3DC96B", fontWeight: 700, fontSize: 12 }}><ForgeIcon name="heart" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />+{phaseConfig.champHealPct}% HP perdido</div>
            </div>
            <div style={{ background: `${regionModifier.color}12`, border: `1px solid ${regionModifier.color}35`, borderRadius: 10, padding: "10px 12px", gridColumn: "span 2" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.15em", color: `${regionModifier.color}90`, textTransform: "uppercase", marginBottom: 5 }}>MODIFICADOR REGIONAL</div>
              <div style={{ color: regionModifier.color, fontWeight: 700, fontSize: 12 }}><ForgeIcon name={regionModifier.icon} size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{regionModifier.name} · {regionModifier.description}</div>
            </div>
          </div>

          {/* Warning */}
          <div style={{ padding: "12px 24px", background: "rgba(232,184,75,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              <ForgeIcon name="shield" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Tu formación actual continúa en la Fase 2. Las unidades caídas no se recuperan — solo el Campeón recibe curación parcial. Si el Campeón cae en cualquier fase, la misión termina.
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "18px 24px", display: "flex", gap: 12 }}>
            <button
              onClick={exitBattle}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent", color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
              }}
            >
              Abandonar
            </button>
            <button
              onClick={handlePhaseTransitionConfirm}
              style={{
                flex: 2, padding: "12px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
                cursor: "pointer", fontFamily: '"Rajdhani", sans-serif',
                boxShadow: "0 4px 20px rgba(168,85,247,0.4)",
              }}
            >
              <ForgeIcon name="play" size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />INICIAR FASE 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── T4: Phase 2 battle ──────────────────────────────────────────────────────
  if (battlePhase === "battle_phase2" && phase2Formation && battleMission && encounterConfig) {
    const p2Data = getPhase2Encounter(encounterConfig.phaseConfig, battleMission.id);
    return (
      <ForgeFormationBoard
        initialFormation={phase2Formation}
        playerName="Tú"
        opponentName={`FASE 2 · ${p2Data.opponentName}`}
        difficulty={p2Data.difficulty}
        equippedRelics={equippedRelics}
        onComplete={handlePhase2Complete}
        onDismiss={handleBattleDismiss}
      />
    );
  }

  if (battlePhase === "win" && battleMission) {
    return (
      <>
        <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})`, filter: "blur(2px)", pointerEvents: "none" }} />
        <VictoryScreen
          mission={battleMission}
          rewards={winRewards}
          rewardError={rewardError}
          claimingReward={claimingReward}
          onRetryClaim={retryClaimBattleReward}
          onPlayAgain={retryBattle}
          onExit={exitBattle}
        />
      </>
    );
  }

  if (battlePhase === "defeat" && battleMission) {
    return (
      <>
        <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})`, filter: "blur(2px)", pointerEvents: "none" }} />
        <DefeatScreen
          mission={battleMission}
          championDied={championDied}
          onPlayAgain={retryBattle}
          onExit={exitBattle}
        />
      </>
    );
  }

  // ── Normal mission list ────────────────────────────────────────────────────

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
  void execute; // kept for potential legacy usage

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="route-header">
        <div className="route-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div><ForgeIcon name="attack" size={28} /></div>
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

        <DailyQuestsSection />

        {/* Legacy reward toast (from direct execute — kept for backward compat) */}
        {lastReward && (
          <div className="forge-toast success" onClick={dismissReward} style={{ cursor: "pointer", marginBottom: 16 }}>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 700, marginBottom: 6 }}><ForgeIcon name="attack" size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />{lastReward.mission.name} — Completada</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
              {lastReward.data.xp_reward       ? <span><ForgeIcon name="spark" size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />+{lastReward.data.xp_reward} XP</span>           : null}
              {lastReward.data.ingame_reward    ? <span><ForgeIcon name="coin" size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />+{lastReward.data.ingame_reward} VEX</span>      : null}
              {lastReward.data.tradeable_reward ? <span><ForgeIcon name="market" size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />+{lastReward.data.tradeable_reward} T-VEX</span> : null}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>Tap para cerrar</div>
          </div>
        )}

        {/* Legacy error modal */}
        {executeError === "insufficient_energy" && (
          <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"linear-gradient(135deg,#1a0800,#2d1200)",border:"2px solid rgba(232,64,64,0.5)",borderRadius:16,padding:"32px 28px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(232,64,64,0.2)"}}>
              <div style={{marginBottom:12}}><ForgeIcon name="energy" size={44} /></div>
              <div style={{fontFamily:'"Cinzel",serif',fontSize:20,fontWeight:700,color:"#E84040",marginBottom:8}}>Energía Insuficiente</div>
              <div style={{color:"#b0a0a0",fontSize:13,lineHeight:1.65,marginBottom:24}}>No tienes suficiente energía para esta misión.<br/>La energía se regenera con el tiempo.</div>
              <button onClick={dismissError} style={{padding:"10px 32px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#c0392b,#E84040)",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:'"Rajdhani",sans-serif',letterSpacing:"0.08em"}}>ENTENDIDO</button>
            </div>
          </div>
        )}
        {executeError && executeError !== "insufficient_energy" && (
          <div className="forge-toast error" onClick={dismissError} style={{cursor:"pointer",marginBottom:16}}>
            <div style={{fontFamily:'"Cinzel", serif',fontSize:13,fontWeight:700}}>Error al ejecutar misión</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:4}}>{executeError}</div>
          </div>
        )}

        {/* Region filter tabs */}
        {(activeType === "all" || activeType === "Event") && <FestivalBanner />}
        <div className="region-filters">
          {REGIONS.map(t => {
            const cnt = typeCounts[t] ?? 0;
            return (
              <button key={t} className={`region-btn ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>
                {t === "all" ? <><ForgeIcon name="target" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Todas</> : <><ForgeIcon name={MISSION_TYPE_CONFIG[t]?.icon ?? "missions"} size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{t}</>}
                {cnt > 0 && <span style={{ background: activeType === t ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 6px", fontSize: 10, color: "var(--fg-dim)", marginLeft: 4 }}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* Mission grid */}
        {loading ? (
          <SkeletonList rows={6} />
        ) : sortedFiltered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ForgeIcon name="missions" size={36} /></div>
            <div className="empty-state-title">Sin misiones</div>
            <div className="empty-state-desc">
              {activeType === "all" ? "No hay misiones activas en este momento." : `No hay misiones de tipo ${activeType} disponibles aún.`}
            </div>
          </div>
        ) : (
          <div className="mission-grid">
            {sortedFiltered.map((m: any) => (
              <MissionCard
                key={m.id}
                mission={m}
                onExecute={handleStartBattle}
                executing={battlePhase !== null}
                isExecuting={false}
                isCompleted={completedThisSession.has(m.id)}
                isActive={false}
                cooldownSecs={cooldownRemaining(m.id)}
                currentEnergy={progress?.energy ?? 999}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
