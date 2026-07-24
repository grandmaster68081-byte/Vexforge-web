import { useState, useEffect } from "react";
import { useAchievements } from "../domains/achievements/useAchievements";
import { checkMyAchievements } from "../domains/achievements/repository";
import { SkeletonList } from "../shared/components/Skeleton";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_achievements.jpg";

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  all:        { label: "Todos",        icon: "🏅", color: "#C9901F" },
  missions:   { label: "Misiones",     icon: "⚔️", color: "#E84040" },
  collection: { label: "Colección",    icon: "📦", color: "#5B8BF5" },
  bosses:     { label: "World Bosses", icon: "🐉", color: "#A855F7" },
  pvp:        { label: "PvP",          icon: "🏆", color: "#C9901F" },
  economy:    { label: "Economía",     icon: "💰", color: "#3DC96B" },
  fusion:     { label: "Forja",        icon: "🔮", color: "#E8B84B" },
  daily:      { label: "Diarios",      icon: "📅", color: "#5B8BF5" },
  packs:      { label: "Packs",        icon: "📦", color: "#E84040" },
  progression:{ label: "Progresión",   icon: "⭐", color: "#E8B84B" },
  social:     { label: "Social",       icon: "👥", color: "#3DC96B" },
};

function getRarityBadge(points: number): { label: string; color: string } {
  if (points >= 200) return { label: "LEGENDARIO", color: "#E8B84B" };
  if (points >= 75)  return { label: "ÉPICO",      color: "#A855F7" };
  if (points >= 30)  return { label: "RARO",        color: "#5B8BF5" };
  return               { label: "NORMAL",      color: "#8a9ba8" };
}

function AchievementCard({
  ach, unlocked, unlockedAt,
}: {
  ach: { id: string; code: string; title: string; description: string; category: string; points: number; reward_vex_ingame: number; reward_xp: number; icon: string; hidden: boolean };
  unlocked: boolean;
  unlockedAt?: string;
}) {
  const badge = getRarityBadge(ach.points);
  const date = unlockedAt ? new Date(unlockedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : null;
  return (
    <div style={{
      position: "relative",
      background: unlocked
        ? "linear-gradient(135deg, #1a1200 0%, #251900 60%, #1a1200 100%)"
        : "linear-gradient(135deg, #0e1218 0%, #121820 100%)",
      border: unlocked ? "1px solid rgba(201,144,31,0.55)" : "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "18px 20px",
      display: "flex", gap: 16, alignItems: "flex-start",
      transition: "transform 0.15s, box-shadow 0.15s",
      opacity: unlocked ? 1 : 0.72,
    }}
    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = "translateY(-2px)"; d.style.boxShadow = unlocked ? "0 8px 32px rgba(201,144,31,0.18)" : "0 4px 16px rgba(0,0,0,0.3)"; }}
    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ""; d.style.boxShadow = ""; }}
    >
      {unlocked && <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "linear-gradient(135deg, rgba(201,144,31,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />}
      <div style={{
        flexShrink: 0, width: 52, height: 52, borderRadius: 10,
        background: unlocked ? "rgba(201,144,31,0.18)" : "rgba(255,255,255,0.05)",
        border: unlocked ? "1px solid rgba(201,144,31,0.35)" : "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        filter: unlocked ? "none" : "grayscale(0.8) opacity(0.5)",
      }}>{unlocked ? ach.icon : "🔒"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: 13, fontWeight: 700, color: unlocked ? "#C9901F" : "#8a9ba8", letterSpacing: "0.03em" }}>{ach.title}</span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.18em", color: badge.color, background: badge.color + "18", border: "1px solid " + badge.color + "33", borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" as const }}>{badge.label}</span>
          {unlocked && <span style={{ marginLeft: "auto", color: "#C9901F", fontSize: 16 }}>✓</span>}
        </div>
        <p style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 13, color: unlocked ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.38)", margin: "0 0 10px", lineHeight: 1.4 }}>{ach.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#C9901F" }}>{ach.points} pts</span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#3DC96B" }}>+{ach.reward_vex_ingame} VEX</span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#5B8BF5" }}>+{ach.reward_xp} XP</span>
          {date && <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>{date}</span>}
        </div>
      </div>
    </div>
  );
}

export function AchievementsRoute() {
  const { allAchs, myAchs, loading, error, blockedAuth } = useAchievements();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    checkMyAchievements().catch(() => {});
  }, []);

  const unlockedMap = new Map(myAchs.map(m => [m.achievement_id, m.unlocked_at]));
  const totalPoints  = allAchs.reduce((s, a) => s + a.points, 0);
  const earnedPoints = myAchs.reduce((s, m) => s + (m.achievement?.points ?? 0), 0);
  const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const categories = ["all", ...Array.from(new Set(allAchs.map(a => a.category))).sort()];
  const filtered = activeCategory === "all" ? allAchs : allAchs.filter(a => a.category === activeCategory);

  if (loading) return <div style={{ padding: "40px 24px" }}><SkeletonList count={8} /></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--layer-1, #0a0e14)" }}>
      <div style={{ position: "relative", overflow: "hidden", minHeight: 220, display: "flex", alignItems: "flex-end", backgroundImage: BG_URL ? "url(" + BG_URL + ")" : undefined, backgroundSize: "cover", backgroundPosition: "center top" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,14,20,0.2) 0%, rgba(10,14,20,0.92) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 32px 28px", width: "100%" }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, letterSpacing: "0.25em", color: "#C9901F", textTransform: "uppercase" as const, marginBottom: 8 }}>🏅 LOGROS — VEXFORGE</div>
          <h1 style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: "clamp(22px,4vw,36px)", color: "#fff", margin: "0 0 6px", letterSpacing: "0.04em" }}>Sala de la Gloria</h1>
          <p style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0 }}>Cada hazaña forjada queda grabada para siempre</p>
        </div>
      </div>

      <div style={{ padding: "0 24px 60px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 24, marginBottom: 16 }}>
          {[
            { label: "Desbloqueados", value: myAchs.length + " / " + allAchs.length, icon: "🏆", color: "#C9901F" },
            { label: "Puntos",        value: earnedPoints + " / " + totalPoints,    icon: "⭐", color: "#E8B84B" },
            { label: "Progreso",      value: pct + "%",                              icon: "📊", color: "#3DC96B" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 6 }}>{stat.icon} {stat.label}</div>
              <div style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: 18, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, #C9901F, #E8B84B)", borderRadius: 4, transition: "width 0.8s ease" }} />
        </div>

        {error && <div style={{ background: "rgba(232,64,64,0.12)", border: "1px solid rgba(232,64,64,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#E84040" }}>Error: {error}</div>}

        {blockedAuth && (
          <div style={{ background: "linear-gradient(135deg,#0e1218,#121820)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", textAlign: "center" as const, marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: 16, color: "#C9901F", marginBottom: 8 }}>Inicia sesión para ver tus logros</div>
            <p style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Inicia sesión para rastrear tu progreso real.</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {categories.map(cat => {
            const cfg = CATEGORY_LABELS[cat] ?? { label: cat, icon: "📌", color: "#8a9ba8" };
            const isActive = activeCategory === cat;
            const catAchs = cat === "all" ? allAchs : allAchs.filter(a => a.category === cat);
            const catUnlocked = catAchs.filter(a => unlockedMap.has(a.id)).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: isActive ? "1px solid " + cfg.color + "88" : "1px solid rgba(255,255,255,0.1)", background: isActive ? cfg.color + "18" : "transparent", color: isActive ? cfg.color : "rgba(255,255,255,0.5)", fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase" as const }}>
                <span>{cfg.icon}</span><span>{cfg.label}</span>
                <span style={{ background: isActive ? cfg.color + "30" : "rgba(255,255,255,0.08)", borderRadius: 10, padding: "0 6px", fontSize: 9 }}>{catUnlocked}/{catAchs.length}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: "center" as const, padding: "60px 24px", color: "rgba(255,255,255,0.3)", fontFamily: '"Rajdhani", sans-serif', fontSize: 15 }}>No hay logros en esta categoría</div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {filtered
                .sort((a, b) => { const aU = unlockedMap.has(a.id) ? 0 : 1; const bU = unlockedMap.has(b.id) ? 0 : 1; return aU !== bU ? aU - bU : a.points - b.points; })
                .map(ach => <AchievementCard key={ach.id} ach={ach} unlocked={unlockedMap.has(ach.id)} unlockedAt={unlockedMap.get(ach.id)} />)}
            </div>
        }
      </div>
    </div>
  );
}