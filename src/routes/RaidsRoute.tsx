import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useRaids } from "../domains/raids/useRaids";
import type { RaidRun } from "../domains/raids/repository";
import { loadPlayerBattleUnits, type AIDifficulty } from "../lib/aiBattleEngine";
import { FormationSelector } from "../components/battle/FormationSelector";
import { ForgeFormationBoard } from "../components/battle/ForgeFormationBoard";
import type { BattleUnit } from "../lib/battleTypes";
import type { FormationState } from "../lib/forgeFormation";
import { PageLoader } from "../shared/components/PageLoader";
import { EmptyState } from "../shared/components/EmptyState";
import { useToast } from "../shared/context/ToastContext";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_bosses.jpg";

const DIFFICULTY_CFG: Record<string, { color: string; label: string; icon: string }> = {
  easy:   { color: "#3ddc84", label: "Fácil",    icon: "🟢" },
  normal: { color: "#4a9eff", label: "Normal",   icon: "🔵" },
  hard:   { color: "#a855f7", label: "Difícil",  icon: "🟣" },
};

const REGION_ICON: Record<string, string> = {
  forge_core:    "🔥",
  iron_veins:    "⚙️",
  warbound_zone: "⚔️",
  shadow_deep:   "🌑",
  crystal_spire: "💎",
};

function getDifficultyConfig(difficulty?: string) {
  return DIFFICULTY_CFG[difficulty ?? "normal"] ?? DIFFICULTY_CFG.normal;
}

function getForgeDifficulty(difficulty?: string): AIDifficulty {
  if (difficulty === "easy") return "easy";
  if (difficulty === "hard") return "expert";
  return "normal";
}

function RaidCard({
  raid, onJoin, joining, inMyRaids, onContribute, contributing
}: {
  raid: RaidRun;
  onJoin: (id: string) => void;
  joining: boolean;
  inMyRaids: boolean;
  onContribute: (raid: RaidRun) => void;
  contributing: boolean;
}) {
  const diff = getDifficultyConfig(raid.metadata?.difficulty);
  const regionIcon = REGION_ICON[raid.region_id] ?? "🗺️";
  const maxParts = raid.metadata?.max_participants ?? "∞";
  const multiplier = raid.metadata?.reward_multiplier ?? 1;

  return (
    <div style={{
      background: "#13131f", border: "1px solid #2a2a3a",
      borderRadius: 14, overflow: "hidden", position: "relative",
    }}>
      {/* Difficulty accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: diff.color }} />

      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{regionIcon}</span>
              <h3 style={{ color: "#e8e8f0", fontFamily: "Cinzel,serif", fontSize: 15, fontWeight: 700, margin: 0 }}>
                {raid.metadata?.name ?? raid.raid_code}
              </h3>
            </div>
            <div style={{ color: "#7a7a9a", fontSize: 11, letterSpacing: "0.08em" }}>{raid.region_id.replace(/_/g, " ").toUpperCase()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              padding: "3px 10px", borderRadius: 20,
              background: diff.color + "18", border: "1px solid " + diff.color + "44",
              color: diff.color, fontSize: 11, fontWeight: 700,
            }}>{diff.icon} {diff.label}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ color: "#888", fontSize: 12 }}>
            👥 <span style={{ color: "#e8e8f0" }}>Máx. {maxParts}</span>
          </div>
          <div style={{ color: "#888", fontSize: 12 }}>
            ✨ <span style={{ color: "#e8b84b" }}>×{multiplier} recompensas</span>
          </div>
          <div style={{ color: "#888", fontSize: 12 }}>
            📋 <span style={{ color: "#8b8b9e", textTransform: "capitalize" }}>{raid.status}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!inMyRaids && (
            <button
              onClick={() => onJoin(raid.id)}
              disabled={joining}
              style={{
                padding: "9px 22px", borderRadius: 9, border: "none",
                background: joining ? "#2a2a3a" : "linear-gradient(135deg,#e8b84b,#c9901f)",
                color: joining ? "#555" : "#0a0a12",
                fontWeight: 700, fontSize: 13, cursor: joining ? "not-allowed" : "pointer",
                fontFamily: "Cinzel,serif",
              }}>
              {joining ? "Uniéndose…" : "⚔️ Unirse al Raid"}
            </button>
          )}
          {inMyRaids && raid.status !== "completed" && (
            <button
              onClick={() => onContribute(raid)}
              disabled={contributing}
              style={{
                padding: "9px 22px", borderRadius: 9, border: "none",
                background: contributing ? "#2a2a3a" : "linear-gradient(135deg,#4a9eff,#2563eb)",
                color: contributing ? "#555" : "#fff",
                fontWeight: 700, fontSize: 13, cursor: contributing ? "not-allowed" : "pointer",
              }}>
              {contributing ? "Atacando…" : "⚔️ Atacar"}
            </button>
          )}
          {inMyRaids && (
            <div style={{
              padding: "9px 16px", borderRadius: 9,
              background: "#3ddc8418", border: "1px solid #3ddc8444",
              color: "#3ddc84", fontSize: 12, fontWeight: 700,
            }}>✓ Participando</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RaidsRoute() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab]       = useState<"available" | "my_raids">("available");
  const [raidUnits, setRaidUnits] = useState<BattleUnit[] | null>(null);
  const [raidFormation, setRaidFormation] = useState<FormationState | null>(null);
  const [selectedRaid, setSelectedRaid] = useState<RaidRun | null>(null);
  const [raidBattleLoading, setRaidBattleLoading] = useState(false);
  const [raidBattleError, setRaidBattleError] = useState<string | null>(null);
  const [raidDifficulty, setRaidDifficulty] = useState<AIDifficulty>("normal");
  const { addToast } = useToast();

  const { activeRaids, myRaids, loading, joining, contributing, join, contribute, reload } = useRaids();

  // Auth check only — data managed by useRaids hook
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authed === null || loading) return <PageLoader />;

  const myRaidIds = new Set(myRaids.map(r => r.id));

  async function handleJoin(raidId: string) {
    if (!authed) { addToast("error", "Inicia sesión", "Debes estar autenticado para unirte a un raid."); return; }
    const res = await join(raidId);
    if (res.ok) addToast("success", "¡Raid unido!", "Ahora formas parte de este raid.");
    else addToast("error", "Error", res.reason ?? "No se pudo unir al raid.");
  }

  const handleContribute = useCallback(async (raid: RaidRun) => {
    if (!authed) {
      addToast("error", "Inicia sesión", "Debes estar autenticado para atacar un raid.");
      return;
    }

    setRaidBattleLoading(true);
    setRaidBattleError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData.session?.user.id;
      if (!authUserId) {
        addToast("error", "Inicia sesión", "Tu sesión ya no está activa.");
        return;
      }

      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();
      if (playerError || !player?.id) {
        const reason = playerError?.message ?? "No se encontró el jugador activo.";
        setRaidBattleError(reason);
        addToast("error", "No se pudo preparar el combate", reason);
        return;
      }

      const units = await loadPlayerBattleUnits(supabase, player.id);
      setSelectedRaid(raid);
      setRaidDifficulty(getForgeDifficulty(raid.metadata?.difficulty));
      setRaidUnits(units);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "No se pudo cargar tu formación.";
      setRaidBattleError(reason);
      addToast("error", "No se pudo preparar el combate", reason);
    } finally {
      setRaidBattleLoading(false);
    }
  }, [addToast, authed]);

  const handleRaidFormationConfirm = useCallback((formation: FormationState) => {
    setRaidUnits(null);
    setRaidFormation(formation);
  }, []);

  const handleRaidBattleComplete = useCallback(async (won: boolean) => {
    const raid = selectedRaid;
    setRaidFormation(null);
    setSelectedRaid(null);
    if (!raid) return;

    if (!won) {
      addToast("error", "Raid no superado", "La contribución solo se registra después de ganar el combate.");
      return;
    }

    const res = await contribute(raid.id);
    if (res.ok) {
      addToast("success", "¡Ataque exitoso!", "Contribución registrada en el raid.");
    } else {
      addToast("error", "Contribución no registrada", res.reason ?? "No se pudo actualizar el progreso del raid.");
    }
  }, [addToast, contribute, selectedRaid]);

  const dismissRaidBattle = useCallback(() => {
    setRaidUnits(null);
    setRaidFormation(null);
    setSelectedRaid(null);
    setRaidBattleError(null);
  }, []);

  const tabStyle = (t: string) => ({
    padding: "8px 22px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
    cursor: "pointer",
    background: tab === t ? "linear-gradient(135deg,#e8b84b,#c9901f)" : "#1a1a2e",
    color: tab === t ? "#0a0a12" : "#888",
  });

  const displayList = tab === "available" ? activeRaids : myRaids;

  if (raidBattleLoading) return <PageLoader />;

  if (raidUnits && !raidFormation && selectedRaid) {
    return (
      <FormationSelector
        playerUnits={raidUnits}
        onConfirm={handleRaidFormationConfirm}
        onCancel={dismissRaidBattle}
        difficulty={raidDifficulty}
      />
    );
  }

  if (raidFormation && selectedRaid) {
    return (
      <ForgeFormationBoard
        initialFormation={raidFormation}
        playerName="Tú"
        opponentName={selectedRaid.metadata?.name ?? selectedRaid.raid_code}
        difficulty={raidDifficulty}
        onComplete={handleRaidBattleComplete}
        onDismiss={dismissRaidBattle}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a12",
      backgroundImage: `url(${BG_URL})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      <div style={{ minHeight: "100vh", background: "rgba(10,10,18,0.85)", padding: "28px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 26, margin: "0 0 6px" }}>
              ⚔️ Raids Cooperativos
            </h1>
            <p style={{ color: "#7a7a9a", fontSize: 13, margin: 0 }}>
              Únete a otros guerreros para derrotar mazmorras de alto riesgo. Recompensas escaladas por dificultad.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button style={tabStyle("available")} onClick={() => setTab("available")}>
              Disponibles ({activeRaids.length})
            </button>
            <button style={tabStyle("my_raids")} onClick={() => setTab("my_raids")}>
              Mis Raids ({myRaids.length})
            </button>
            <button
              onClick={reload}
              style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#7a7a9a", fontSize: 12, cursor: "pointer" }}>
              ↺ Actualizar
            </button>
          </div>

          {raidBattleError && (
            <div style={{
              marginBottom: 16, padding: "12px 16px", borderRadius: 10,
              background: "#3a151522", border: "1px solid #e8404066",
              color: "#ff8d8d", fontSize: 12,
            }}>
              {raidBattleError}
            </div>
          )}

          {/* List */}
          {displayList.length === 0 ? (
            <EmptyState
              icon="⚔️"
              title={tab === "available" ? "Sin raids disponibles" : "No estás en ningún raid"}
              description={tab === "available"
                ? "No hay raids activos en este momento. Vuelve más tarde."
                : "Únete a un raid disponible para empezar a participar."}
              action={tab === "my_raids" ? { label: "Ver raids disponibles", onClick: () => setTab("available") } : undefined}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {displayList.map(raid => (
                <RaidCard
                  key={raid.id}
                  raid={raid}
                  onJoin={handleJoin}
                  joining={joining === raid.id}
                  inMyRaids={myRaidIds.has(raid.id)}
                  onContribute={handleContribute}
                  contributing={contributing === raid.id}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 40, padding: "16px 20px", background: "#13131f", borderRadius: 12, border: "1px solid #1a1a2a" }}>
            <div style={{ color: "#7a7a9a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Guía de Dificultad
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {Object.entries(DIFFICULTY_CFG).map(([key, cfg]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color }} />
                  <span style={{ color: "#888", fontSize: 12 }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}