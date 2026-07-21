import { useEffect } from "react";
import { useBosses } from "../domains/bosses/useBosses";
import type { WorldBoss } from "../domains/bosses/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";

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

const BOSS_ICONS: Record<string, string> = {
  BOSS_SHADOWREAVER: "🌑", BOSS_IRONLORD: "⚔️", BOSS_FORGEMASTER: "🔥",
  BOSS_WARBOUND_TITAN: "🗿", BOSS_CINDERDRAKE: "🐉",
};
function getBossIcon(boss: WorldBoss): string {
  if (BOSS_ICONS[boss.boss_code]) return BOSS_ICONS[boss.boss_code];
  const t = boss.tier.toLowerCase();
  if (t === "t6") return "👑"; if (t === "t5") return "⚡";
  if (t === "t4") return "🔮"; if (t === "t3") return "💀";
  if (t === "t2") return "🌫️";
  return "🐉";
}

function BossCard({ boss, onAttack, canAttack, attacking }: {
  boss: WorldBoss; onAttack: (id: string) => void; canAttack: boolean; attacking: boolean;
}) {
  const { color, label } = getTierConfig(boss.tier);
  const vex      = (boss.reward_pool as any)?.vex_ingame ?? 0;
  const shards   = (boss.reward_pool as any)?.shards ?? 0;
  const cardRarity = (boss.reward_pool as any)?.card_rarity;
  return (
    <div style={{ background: "linear-gradient(180deg,#1a1a2e,#12121a)", border: `1px solid ${color}44`, borderRadius: 14, overflow: "hidden", position: "relative" }}>
      {boss.image_url
        ? <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
            <img src={boss.image_url} alt={boss.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        : <div style={{ width: "100%", height: 110, background: `linear-gradient(135deg,${color}22,#0a0a12)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
            {getBossIcon(boss)}
          </div>
      }
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ position: "absolute", top: 10, right: 12, background: color + "22", border: `1px solid ${color}66`, borderRadius: 8, padding: "2px 9px", fontSize: 11, color, fontWeight: 800 }}>{label}</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 18 }}>{getBossIcon(boss)}</span>
            <h3 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 14, margin: 0 }}>{boss.name}</h3>
          </div>
          <div style={{ color: "#555", fontSize: 11 }}>Poder: <span style={{ color }}>{boss.power_level.toLocaleString()}</span></div>
          {(boss.metadata as any)?.lore && (
            <p style={{ color: "#555", fontSize: 10, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{(boss.metadata as any).lore}</p>
          )}
        </div>

        {/* Rewards */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {vex > 0 && <span style={{ background: "#e8b84b22", border: "1px solid #e8b84b44", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#e8b84b", fontWeight: 700 }}>💰 {vex} VEX</span>}
          {shards > 0 && <span style={{ background: "#4a9eff22", border: "1px solid #4a9eff44", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#4a9eff", fontWeight: 700 }}>💎 {shards} frags</span>}
          {cardRarity && <span style={{ background: "#a855f722", border: "1px solid #a855f744", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>🃏 Carta {cardRarity}</span>}
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
          {attacking ? "Atacando…" : canAttack ? "⚔️ Atacar" : "🔒 Inicia sesión"}
        </button>
      </div>
    </div>
  );
}

export function WorldBossesRoute() {
  const { bosses, encounters, authed, attacking, attackMsg, attack, reload } = useBosses();
  const { addToast } = useToast();

  const bossData      = bosses.data ?? [];
  const encounterData = encounters.data ?? [];
  const loading       = bosses.status === "loading";
  const error         = bosses.status === "ready" && !bosses.data ? "Error al cargar jefes mundiales" : null;

  useEffect(() => {
    if (!attackMsg) return;
    if (attackMsg.includes("exitoso") || attackMsg.includes("Ataque")) addToast("success", attackMsg);
    else addToast("error", "Error en el ataque", attackMsg);
  }, [attackMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="route-wrapper" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div style={{ background: "rgba(5,5,13,0.88)", minHeight: "100vh" }}>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── PvE ───</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: 0 }}>🐉 Jefes Mundiales</h1>
              <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
            </div>
            <p style={{ color: "#666", margin: "4px 0 0", fontSize: 12 }}>Ataca jefes poderosos para ganar VEX, fragmentos y cartas raras.</p>
          </div>

          {!authed && <BlockedAuthState message="Inicia sesión para atacar jefes y ganar recompensas." />}

          {/* Stats */}
          {encounterData.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
                <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: 18 }}>{encounterData.length}</div>
                <div style={{ color: "#555", fontSize: 10 }}>ATAQUES TOTALES</div>
              </div>
              <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
                <div style={{ color: "#3ddc84", fontWeight: 800, fontSize: 18 }}>
                  {encounterData.filter(e => e.status === "completed").length}
                </div>
                <div style={{ color: "#555", fontSize: 10 }}>COMPLETADOS</div>
              </div>
            </div>
          )}

          {/* Boss grid */}
          {bossData.length === 0 ? (
            <EmptyState icon="🐉" title="Sin jefes activos" description="No hay jefes activos en este momento. Vuelve más tarde." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 32 }}>
              {bossData.map(boss => (
                <BossCard
                  key={boss.id}
                  boss={boss}
                  onAttack={attack}
                  canAttack={authed}
                  attacking={attacking}
                />
              ))}
            </div>
          )}

          {/* Recent encounters */}
          {encounterData.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, marginBottom: 14 }}>📜 Mis Ataques Recientes</h2>
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
                        <div style={{ color: "#555", fontSize: 10 }}>{new Date(enc.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {reward?.vex_ingame && <span style={{ color: "#e8b84b", fontSize: 11, fontWeight: 700 }}>+{reward.vex_ingame} VEX</span>}
                        <span style={{ color: enc.status === "completed" ? "#3ddc84" : "#888", fontSize: 10, fontWeight: 700 }}>
                          {enc.status === "completed" ? "✓" : enc.status}
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
