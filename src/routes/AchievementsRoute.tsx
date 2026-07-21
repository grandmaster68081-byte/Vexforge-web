import { useState } from "react";
import { useAchievements } from "../domains/achievements/useAchievements";
import { SkeletonCardGrid } from "../shared/components/Skeleton";
import { EmptyState }       from "../shared/components/EmptyState";
import { ErrorState }       from "../shared/components/ErrorState";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";

const CAT_LABEL: Record<string, string> = {
  pvp: "PvP", collection: "Colección", fusion: "Fusión", economy: "Economía",
  missions: "Misiones", bosses: "Bosses", packs: "Packs", social: "Social", daily: "Diario", general: "General",
};

export function AchievementsRoute() {
  const [filter, setFilter] = useState("all");
  const { allAchs, myAchs, stats, loading, error, blockedAuth, statsError, reload } = useAchievements();

  const unlockedIds = new Set(myAchs.map(m => m.achievement_id));
  const totalPts    = myAchs.reduce((s, m) => s + (m.achievement?.points ?? 0), 0);
  const categories  = ["all", ...Array.from(new Set(allAchs.map(a => a.category)))];
  const filtered    = filter === "all" ? allAchs : allAchs.filter(a => a.category === filter);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Historial ───</p>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 26, margin: "0 0 4px" }}>🏆 Logros</h1>
        <p style={{ color: "#888", margin: 0, fontSize: 12 }}>
          {loading ? "—" : blockedAuth ? "Inicia sesión para ver tus logros" : `${unlockedIds.size}/${allAchs.length} logros · ${totalPts} puntos`}
        </p>
      </div>

      {/* Stats bar */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 8, height: 70 }} />
          ))}
        </div>
      ) : blockedAuth ? null : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 24 }}>
          {[
            { label: "Victorias PvP",  val: stats.pvp_wins          ?? 0, icon: "⚔️" },
            { label: "Misiones",       val: stats.missions_completed ?? 0, icon: "🗺️" },
            { label: "Cartas únicas",  val: stats.cards_owned        ?? 0, icon: "🃏" },
            { label: "Ventas",         val: stats.market_sales       ?? 0, icon: "💰" },
            { label: "Bosses",         val: stats.boss_kills         ?? 0, icon: "🐉" },
            { label: "Packs abiertos", val: stats.packs_opened       ?? 0, icon: "🎁" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1a1a2e", border: `1px solid ${statsError ? "#e3573f22" : "#2a2a3a"}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: statsError ? "#555" : "#e8b84b", fontWeight: 700, fontSize: 16 }}>{s.val.toLocaleString()}</div>
              <div style={{ color: "#555", fontSize: 9 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
          {statsError && (
            <div style={{ gridColumn: "1/-1", fontSize: 10, color: "#e3573f88", padding: "4px 8px" }}>
              ⚠️ Estadísticas no disponibles — backend pendiente de fix del owner
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonCardGrid count={9} minWidth={260} />}

      {/* Error — failed to load public achievements */}
      {!loading && error && (
        <ErrorState message={error} onRetry={reload} />
      )}

      {/* Blocked auth — show gate after public header */}
      {!loading && !error && blockedAuth && (
        <BlockedAuthState message="Inicia sesión para ver tus logros desbloqueados y tu progreso personal." />
      )}

      {/* Category filter — only when logged in or viewing public list */}
      {!loading && !error && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "5px 12px", borderRadius: 16, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer",
              background: filter === cat ? "#e8b84bcc" : "#1a1a2e",
              color: filter === cat ? "#0a0a12" : "#888",
            }}>
              {cat === "all" ? "TODOS" : (CAT_LABEL[cat] ?? cat).toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="🏆"
          title={filter === "all" ? "Sin logros disponibles" : `Sin logros en "${CAT_LABEL[filter] ?? filter}"`}
          description={filter === "all" ? "Aún no hay logros configurados. ¡Vuelve pronto!" : "No hay logros en esta categoría."}
          action={filter !== "all" ? { label: "Ver todos", onClick: () => setFilter("all") } : undefined}
        />
      )}

      {/* Achievement grid */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
          {filtered.map(ach => {
            const unlocked = unlockedIds.has(ach.id);
            const myAch    = myAchs.find(m => m.achievement_id === ach.id);
            return (
              <div key={ach.id} style={{
                background: unlocked ? "linear-gradient(145deg,#1a2a1a,#12121a)" : "#1a1a2e",
                border: `1px solid ${unlocked ? "#3ddc8444" : "#2a2a3a"}`,
                borderRadius: 10, padding: "14px 16px",
                opacity: unlocked ? 1 : blockedAuth ? 0.5 : 0.6,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{ach.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ color: unlocked ? "#e8e8f0" : "#888", fontWeight: 700, fontSize: 13, fontFamily: "Cinzel,serif" }}>{ach.title}</span>
                      <span style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{ach.points}pts</span>
                    </div>
                    <p style={{ color: "#666", fontSize: 11, margin: "3px 0 6px", lineHeight: 1.4 }}>{ach.description}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "#e8b84b", fontSize: 10 }}>💎{ach.reward_vex_ingame}VEX</span>
                      <span style={{ color: "#4a9eff", fontSize: 10 }}>⭐{ach.reward_xp}XP</span>
                    </div>
                    {!blockedAuth && unlocked && myAch && (
                      <div style={{ color: "#3ddc84", fontSize: 9, marginTop: 4 }}>
                        ✓ Desbloqueado {new Date(myAch.unlocked_at).toLocaleDateString("es-ES")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
