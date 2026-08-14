import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useBosses } from "../domains/bosses/useBosses";
import { attackWorldBoss, getCurrentPlayerId } from "../domains/bosses/repository";
import type { WorldBoss, WorldBossAttackResult } from "../domains/bosses/repository";
import { loadPlayerBattleUnits, type AIDifficulty } from "../lib/aiBattleEngine";
import type { BattleUnit } from "../lib/battleTypes";
import { applyRelicEffects, type EquippedRelic, type FormationState } from "../lib/forgeFormation";
import { getEquippedRelics } from "../domains/relics/repository";
import { FormationSelector } from "../components/battle/FormationSelector";
import { ForgeFormationBoard } from "../components/battle/ForgeFormationBoard";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";
import { ForgeIcon, type ForgeIconName } from "../shared/components/ForgeIcon";
import {
  abandonBattleRun,
  clearActiveBattleRunMarker,
  createBattleRunKey,
  recoverStartedBattleRuns,
  resolveBattleRun,
  setActiveBattleRunMarker,
  startBattleRun,
} from "../domains/battleRuns/repository";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_bosses.jpg";

function getTierConfig(tier: string): { label: string; color: string } {
  const t = tier.toLowerCase();
  if (t === "t1")        return { label: "T1",         color: "#8b8b9e" };
  if (t === "t2")        return { label: "T2",         color: "#cd7f32" };
  if (t === "t3")        return { label: "T3",         color: "#f59e0b" };
  if (t === "t4")        return { label: "T4",         color: "#4a9eff" };
  if (t === "t5")        return { label: "T5",         color: "#a855f7" };
  if (t === "t6")        return { label: "T6",         color: "#ff4444" };
  if (t === "rare")      return { label: "Raro",       color: "#4a9eff" };
  if (t === "epic")      return { label: "Épico",      color: "#a855f7" };
  if (t === "legendary") return { label: "Legendario", color: "#f59e0b" };
  return { label: tier, color: "#8b8b9e" };
}

const BOSS_ICONS: Record<string, ForgeIconName> = {
  BOSS_SHADOWREAVER: "lock", BOSS_IRONLORD: "attack", BOSS_FORGEMASTER: "spark",
  BOSS_WARBOUND_TITAN: "shield", BOSS_CINDERDRAKE: "boss",
};
function getBossIcon(boss: WorldBoss): ForgeIconName {
  if (BOSS_ICONS[boss.boss_code]) return BOSS_ICONS[boss.boss_code];
  const t = boss.tier.toLowerCase();
  if (t === "t6") return "crown"; if (t === "t5") return "energy";
  if (t === "t4") return "spark"; if (t === "t3") return "skull";
  if (t === "t2") return "lock";
  return "boss";
}

function getBossDifficulty(tier: string): AIDifficulty {
  const tierNumber = Number(tier.replace(/^t/i, ""));
  if (tierNumber >= 6) return "legend";
  if (tierNumber >= 5) return "expert";
  if (tierNumber >= 3) return "normal";
  return "easy";
}

function getBattleDamage(result: ReturnType<typeof import("../lib/forgeFormation").simulateFormationBattle>): number {
  return (result.turns ?? [])
    .filter(turn => turn.atk_side === "a")
    .reduce((total, turn) => total + Math.max(0, turn.damage ?? 0), 0);
}

function BossCard({ boss, onAttack, canAttack, attacking }: {
  boss: WorldBoss; onAttack: (id: string) => void; canAttack: boolean; attacking: boolean;
}) {
  const { color, label } = getTierConfig(boss.tier);
  // Flash animation when this boss is being actively attacked
  const cardClass = attacking ? 'boss-hurt-flash' : undefined;
  const vex      = (boss.reward_pool as any)?.vex_ingame ?? 0;
  const shards   = (boss.reward_pool as any)?.shards ?? 0;
  const cardRarity = (boss.reward_pool as any)?.card_rarity;
  return (
    <div className={cardClass} style={{ background: "linear-gradient(180deg,#1a1a2e,#12121a)", border: `1px solid ${color}44`, borderRadius: 14, overflow: "hidden", position: "relative" }}>
      {boss.image_url
        ? <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
            <img src={boss.image_url} alt={boss.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        : <div style={{ width: "100%", height: 110, background: `linear-gradient(135deg,${color}22,#0a0a12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ForgeIcon name={getBossIcon(boss)} size={52} />
          </div>
      }
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ position: "absolute", top: 10, right: 12, background: color + "22", border: `1px solid ${color}66`, borderRadius: 8, padding: "2px 9px", fontSize: 11, color, fontWeight: 800 }}>{label}</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <ForgeIcon name={getBossIcon(boss)} size={18} />
            <h3 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 14, margin: 0 }}>{boss.name}</h3>
          </div>
          <div style={{ color: "#7a7a9a", fontSize: 11, marginBottom: 8 }}>
            Poder: <span style={{ color }}>{boss.power_level.toLocaleString()}</span>
          </div>
          {/* Boss power bar — visual threat indicator */}
          {(() => {
            const TIER_MAX: Record<string, number> = { t1: 1000, t2: 3000, t3: 8000, t4: 18000, t5: 40000, t6: 100000 };
            const tierKey = boss.tier.toLowerCase();
            const tierMax  = TIER_MAX[tierKey] ?? 100000;
            const pct      = Math.min(100, Math.round((boss.power_level / tierMax) * 100));
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "#5a5a7a", textTransform: "uppercase" }}>AMENAZA</span>
                  <span style={{ fontSize: 9, color, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div
                    className={pct >= 80 ? "boss-hp-bar boss-hp-drain" : "boss-hp-bar"}
                    style={{
                      height: "100%", width: `${pct}%`, borderRadius: 4,
                      background: pct >= 80
                        ? `linear-gradient(90deg, ${color}88, ${color}, #fff4, ${color})`
                        : `linear-gradient(90deg, ${color}88, ${color})`,
                      transition: "width 1s cubic-bezier(.22,1,.36,1)",
                      ["--hp-from" as string]: `${Math.min(100, pct + 10)}%`,
                      ["--hp-to" as string]: `${pct}%`,
                    }}
                  />
                </div>
              </div>
            );
          })()}
          {(boss.metadata as any)?.lore && (
            <p style={{ color: "#7a7a9a", fontSize: 10, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{(boss.metadata as any).lore}</p>
          )}
        </div>

        {/* Rewards */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {vex > 0 && <span style={{ background: "#e8b84b22", border: "1px solid #e8b84b44", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#e8b84b", fontWeight: 700 }}><ForgeIcon name="coin" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{vex} VEX</span>}
          {shards > 0 && <span style={{ background: "#4a9eff22", border: "1px solid #4a9eff44", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#4a9eff", fontWeight: 700 }}><ForgeIcon name="assets" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{shards} frags</span>}
          {cardRarity && <span style={{ background: "#a855f722", border: "1px solid #a855f744", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}><ForgeIcon name="cards" size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />Carta {cardRarity}</span>}
        </div>

        <button
          disabled={!canAttack || attacking}
          onClick={() => onAttack(boss.id)}
          style={{
            width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: canAttack && !attacking ? "pointer" : "not-allowed",
            background: canAttack ? `linear-gradient(135deg,${color},${color}88)` : "#1a1a2e",
            color: canAttack ? "#0a0a12" : "#555", fontWeight: 800, fontSize: 13,
            opacity: attacking ? 0.6 : 1, transition: "opacity .2s",
          }}
        >
          {attacking ? "Atacando…" : canAttack ? <><ForgeIcon name="attack" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Atacar</> : <><ForgeIcon name="lock" size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Inicia sesión</>}
        </button>
      </div>
    </div>
  );
}

export function WorldBossesRoute() {
  const { bosses, encounters, authed, reload } = useBosses();
  const { addToast } = useToast();
  const [bossUnits, setBossUnits] = useState<BattleUnit[] | null>(null);
  const [bossFormation, setBossFormation] = useState<FormationState | null>(null);
  const [equippedRelics, setEquippedRelics] = useState<EquippedRelic[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<WorldBoss | null>(null);
  const [battleDifficulty, setBattleDifficulty] = useState<AIDifficulty>("normal");
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleRunId, setBattleRunId] = useState<string | null>(null);
  const battleRunIdRef = useRef<string | null>(null);
  const battleStartKeyRef = useRef<string | null>(null);
  const battleAttemptRef = useRef(0);
  const battleStartInFlightRef = useRef(false);
  const terminalActionRef = useRef<"idle" | "resolving" | "abandoning">("idle");
  const battleRecoveryInFlightRef = useRef(false);
  const [attackingBossId, setAttackingBossId] = useState<string | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);

  const bossData      = bosses.data ?? [];
  const encounterData = encounters.data ?? [];
  const loading       = bosses.status === "loading";
  const error         = bosses.status === "ready" && !bosses.data ? "Error al cargar jefes mundiales" : null;

  const handleAttack = useCallback(async (bossId: string) => {
    if (!authed) {
      addToast("error", "Inicia sesión", "Debes estar autenticado para atacar jefes.");
      return;
    }
    const boss = bossData.find(item => item.id === bossId);
    if (!boss) return;

    setBattleLoading(true);
    setBattleError(null);
    try {
      const playerId = await getCurrentPlayerId();
      if (!playerId) {
        addToast("error", "Sesión expirada", "Vuelve a iniciar sesión para preparar el combate.");
        return;
      }
      const units = await loadPlayerBattleUnits(supabase, playerId);
      setSelectedBoss(boss);
      setBattleDifficulty(getBossDifficulty(boss.tier));
      setBossUnits(units);
      setAttackingBossId(boss.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "No se pudo preparar el combate.";
      setBattleError(reason);
      addToast("error", "No se pudo preparar el combate", reason);
    } finally {
      setBattleLoading(false);
    }
  }, [addToast, authed, bossData]);

  // P4: Load equipped relics when authed
  useEffect(() => {
    if (!authed) { setEquippedRelics([]); return; }
    getEquippedRelics().then(setEquippedRelics).catch(() => {});
  }, [authed]);

  // Refresh/reconnect recovery: close only stale owner-scoped runs. The
  // current tab's run remains untouched while it is still authoritative.
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;

    const recover = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (battleRunIdRef.current) return;
      if (battleRecoveryInFlightRef.current) return;
      battleRecoveryInFlightRef.current = true;
      try {
        const recovered = await recoverStartedBattleRuns(battleRunIdRef.current ?? undefined);
        if (!cancelled && recovered > 0) {
          addToast(
            "info",
            "Combate recuperado",
            `${recovered} Battle Run pendiente se cerró como abandono.`,
          );
        }
      } catch (error) {
        if (!cancelled) {
          addToast(
            "warning",
            "Revisión de combate pendiente",
            error instanceof Error ? error.message : "No se pudo reconciliar el Battle Run.",
          );
        }
      } finally {
        battleRecoveryInFlightRef.current = false;
      }
    };

    const onOnline = () => { void recover(); };
    void recover();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [addToast, authed]);

  const handleFormationConfirm = useCallback(async (formation: FormationState) => {
    const boss = selectedBoss;
    if (!boss) return;
    if (
      battleStartInFlightRef.current ||
      battleRunIdRef.current ||
      battleRecoveryInFlightRef.current ||
      terminalActionRef.current !== "idle"
    ) return;

    const attempt = battleAttemptRef.current;
    battleStartInFlightRef.current = true;
    setBattleLoading(true);
    setBattleError(null);
    const preparedFormation = applyRelicEffects(formation, equippedRelics);
    const runKey = battleStartKeyRef.current ?? createBattleRunKey("boss", boss.id);
    battleStartKeyRef.current = runKey;
    setActiveBattleRunMarker({ mode: "boss", targetId: boss.id, idempotencyKey: runKey });

    try {
      const run = await startBattleRun("boss", boss.id, preparedFormation, runKey);
      const runId = run.data?.battle_run_id;

      // If the selection was cancelled while the request was in flight, close
      // the late-created run instead of allowing an orphaned started run.
      if (attempt !== battleAttemptRef.current) {
        if (runId) {
          const abandoned = await abandonBattleRun(runId, { engine: "forge_formation_t5" });
          if (abandoned.data) clearActiveBattleRunMarker(runId);
        }
        return;
      }

      if (!run.data || !runId) {
        clearActiveBattleRunMarker();
        battleStartKeyRef.current = null;
        setBattleError(run.reason ?? "No se pudo registrar el Battle Run.");
        return;
      }

      battleRunIdRef.current = runId;
      setActiveBattleRunMarker({
        mode: "boss",
        targetId: boss.id,
        idempotencyKey: runKey,
        battleRunId: runId,
      });
      setBossUnits(null);
      setBattleRunId(runId);
      setBossFormation(preparedFormation);
    } catch (error) {
      if (attempt === battleAttemptRef.current) {
        battleStartKeyRef.current = null;
        setBattleError(error instanceof Error ? error.message : "No se pudo registrar el Battle Run.");
      }
    } finally {
      battleStartInFlightRef.current = false;
      if (attempt === battleAttemptRef.current) setBattleLoading(false);
    }
  }, [equippedRelics, selectedBoss]);

  const dismissBattle = useCallback(async () => {
    if (terminalActionRef.current !== "idle") return;
    battleAttemptRef.current += 1;
    battleStartKeyRef.current = null;
    terminalActionRef.current = "abandoning";
    const activeBattleRunId = battleRunIdRef.current ?? battleRunId;
    let abandonedSuccessfully = !activeBattleRunId;
    try {
      if (activeBattleRunId) {
        const abandoned = await abandonBattleRun(activeBattleRunId, { engine: "forge_formation_t5" });
        if (!abandoned.data) {
          addToast("error", "Combate no cerrado", abandoned.reason ?? "No se pudo registrar el abandono.");
        } else {
          abandonedSuccessfully = true;
        }
      }
    } finally {
      if (abandonedSuccessfully) clearActiveBattleRunMarker(activeBattleRunId ?? undefined);
      battleRunIdRef.current = null;
      setBossUnits(null);
      setBossFormation(null);
      setBattleRunId(null);
      setSelectedBoss(null);
      setAttackingBossId(null);
      setBattleError(null);
      setBattleLoading(false);
      terminalActionRef.current = "idle";
    }
  }, [addToast, battleRunId]);

  const handleBattleComplete = useCallback(async (
    won: boolean,
    _championDied: boolean,
    result: ReturnType<typeof import("../lib/forgeFormation").simulateFormationBattle>,
  ) => {
    const boss = selectedBoss;
    const damage = getBattleDamage(result);
    const activeBattleRunId = battleRunIdRef.current ?? battleRunId;
    if (terminalActionRef.current !== "idle") return;
    if (!boss || !activeBattleRunId) {
      addToast("error", "Battle Run incompleto", "No se encontró la ejecución autoritativa del combate.");
      return;
    }

    terminalActionRef.current = "resolving";
    try {
      const resolved = await resolveBattleRun(activeBattleRunId, won, {
        outcome: won ? "completed" : "defeated",
        champion_died: _championDied,
        damage_dealt: damage,
        total_turns: result.total_turns,
        engine: result.engine,
      });
      if (!resolved.data) {
        terminalActionRef.current = "idle";
        addToast("error", "Resultado no registrado", resolved.reason ?? "No se pudo cerrar el Battle Run.");
        return;
      }

      // Keep the authoritative id until the RPC confirms the terminal state.
      battleRunIdRef.current = null;
      battleStartKeyRef.current = null;
      clearActiveBattleRunMarker(activeBattleRunId);
      setBossFormation(null);
      setSelectedBoss(null);
      setAttackingBossId(null);
      setBattleRunId(null);
      terminalActionRef.current = "idle";

      if (!won) {
        addToast("error", "Combate perdido", "El daño del combate no se registra hasta derrotar al rival.");
        return;
      }
      const response = await attackWorldBoss(boss.id, damage);
      const attackResult = response.data as WorldBossAttackResult | null;
      if (response.status === "blocked_auth") {
        addToast("error", "Inicia sesión", response.reason ?? "Tu sesión ya no está activa.");
      } else if (attackResult?.ok) {
        addToast(
          "success",
          `¡Daño aplicado a ${attackResult.boss_name ?? boss.name}!`,
          `${attackResult.damage_dealt?.toLocaleString() ?? damage.toLocaleString()} de daño · ${attackResult.remaining_hp?.toLocaleString() ?? "?"} HP restantes`,
        );
        reload();
      } else {
        addToast("error", "Daño no registrado", response.reason ?? attackResult?.reason ?? "No se pudo actualizar el jefe.");
      }
    } catch (error) {
      terminalActionRef.current = "idle";
      addToast(
        "error",
        "Resultado no registrado",
        error instanceof Error ? error.message : "No se pudo cerrar el Battle Run.",
      );
    }
  }, [addToast, battleRunId, reload, selectedBoss]);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;
  if (battleLoading) return <PageLoader />;
  if (battleError) {
    return <ErrorState message={battleError} onRetry={() => { setBattleError(null); }} />;
  }
  if (bossUnits && !bossFormation && selectedBoss) {
    return (
      <FormationSelector
        playerUnits={bossUnits}
        onConfirm={handleFormationConfirm}
        onCancel={dismissBattle}
        difficulty={battleDifficulty}
      />
    );
  }
  if (bossFormation && selectedBoss) {
    return (
      <ForgeFormationBoard
        initialFormation={bossFormation}
        playerName="Tú"
        opponentName={selectedBoss.name}
        difficulty={battleDifficulty}
        equippedRelics={equippedRelics}
        onComplete={handleBattleComplete}
        onDismiss={dismissBattle}
      />
    );
  }

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div style={{ background: "rgba(5,5,13,0.88)", minHeight: "100vh" }}>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── PvE ───</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: 0 }}><ForgeIcon name="boss" size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />Jefes Mundiales</h1>
              <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}><ForgeIcon name="refresh" size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />Actualizar</button>
            </div>
            <p style={{ color: "#666", margin: "4px 0 0", fontSize: 12 }}>Ataca jefes poderosos para ganar VEX, fragmentos y cartas raras.</p>
          </div>

          {!authed && <BlockedAuthState message="Inicia sesión para atacar jefes y ganar recompensas." />}

          {/* Stats */}
          {encounterData.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
                <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: 18 }}>{encounterData.length}</div>
                <div style={{ color: "#7a7a9a", fontSize: 10 }}>ATAQUES TOTALES</div>
              </div>
              <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
                <div style={{ color: "#3ddc84", fontWeight: 800, fontSize: 18 }}>
                  {encounterData.filter(e => e.status === "completed").length}
                </div>
                <div style={{ color: "#7a7a9a", fontSize: 10 }}>COMPLETADOS</div>
              </div>
            </div>
          )}

          {/* Boss grid */}
          {bossData.length === 0 ? (
            <EmptyState icon={<ForgeIcon name="boss" size={36} />} title="Sin jefes activos" description="No hay jefes activos en este momento. Vuelve más tarde." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 32 }}>
              {bossData.map(boss => (
                <BossCard
                  key={boss.id}
                  boss={boss}
                  onAttack={handleAttack}
                  canAttack={authed}
                  attacking={attackingBossId === boss.id}
                />
              ))}
            </div>
          )}

          {/* Recent encounters */}
          {encounterData.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, marginBottom: 14 }}><ForgeIcon name="missions" size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Mis Ataques Recientes</h2>
              <div style={{ background: "#12121a", border: "1px solid #2a2a3a", borderRadius: 12, overflow: "hidden" }}>
                {encounterData.slice(0, 10).map((enc, i) => {
                  const boss = bossData.find(b => b.id === enc.world_boss_id);
                  const reward = enc.reward_json as any;
                  return (
                    <div key={enc.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 16px", borderBottom: i < Math.min(encounterData.length, 10) - 1 ? "1px solid #1a1a2e" : "none",
                    }}>
                      <div>
                        <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 12 }}>{boss?.name ?? "Jefe desconocido"}</div>
                        <div style={{ color: "#7a7a9a", fontSize: 10 }}>{new Date(enc.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {reward?.vex_ingame && <span style={{ color: "#e8b84b", fontSize: 11, fontWeight: 700 }}>+{reward.vex_ingame} VEX</span>}
                        <span style={{ color: enc.status === "completed" ? "#3ddc84" : "#888", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {enc.status === "completed" ? <><ForgeIcon name="check" size={12} />Completado</> : enc.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
