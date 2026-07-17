import { useState } from "react";
import { useMissions } from "../domains/missions/useMissions";
import { SkeletonList } from "../shared/components/Skeleton";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_missions.jpg";

const REGIONS = [
{ id: "forge_core",      label: "Forge Core",      color: "#e8702a", icon: "\uD83D\uDD25" },
{ id: "iron_veins",      label: "Iron Veins",      color: "#8a8a9e", icon: "\u26CF" },
{ id: "shadow_fracture", label: "Shadow Fracture", color: "#a855f7", icon: "\uD83C\uDF11" },
{ id: "cinders_realm",   label: "Cinders Realm",   color: "#e3573f", icon: "\uD83C\uDF0B" },
{ id: "warbound_zone",   label: "Warbound Zone",   color: "#3ddc84", icon: "\u2694" },
];

const DIFF_COLOR: Record<string, string> = {
easy: "#3ddc84", medium: "#e8b339", hard: "#e8702a", elite: "#e3573f",
};

export function MissionsRoute() {
const { missions, loading, error } = useMissions();
const [activeRegion, setActiveRegion] = useState<string | null>(null);

const filtered = activeRegion
  ? missions.filter((m) => m.region_id === activeRegion)
  : missions;

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Missions</h1>
      </div>
    </div>

    <h2 style={{ marginBottom: 12 }}>Regions</h2>
    <div className="region-grid">
      {REGIONS.map((r) => (
        <button
          key={r.id}
          className={`region-card ${activeRegion === r.id ? "active" : ""}`}
          onClick={() => setActiveRegion(activeRegion === r.id ? null : r.id)}
          style={activeRegion === r.id ? { borderColor: r.color, background: r.color + "14" } : {}}
        >
          <span className="region-icon">{r.icon}</span>
          <span className="region-label" style={activeRegion === r.id ? { color: r.color } : {}}>{r.label}</span>
        </button>
      ))}
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 12px" }}>
      <h2>{activeRegion ? REGIONS.find((r) => r.id === activeRegion)?.label ?? activeRegion : "All Active Missions"}</h2>
      {activeRegion && (
        <button className="btn-small" onClick={() => setActiveRegion(null)}>Clear filter ×</button>
      )}
    </div>

    {loading && <SkeletonList rows={5} />}
    {error && <p className="error">{error}</p>}
    {!loading && filtered.length === 0 && (
      <div className="empty-state"><p>No active missions{activeRegion ? " in this region" : ""} right now.</p></div>
    )}

    <ul className="mission-list">
      {filtered.map((m) => {
        const reg = REGIONS.find((r) => r.id === m.region_id);
        const diffKey = m.difficulty?.toLowerCase() ?? "";
        const diffColor = DIFF_COLOR[diffKey] ?? "#e8e8e8";
        return (
          <li key={m.id} className="mission-item">
            <div className="mission-region-stripe" style={{ background: reg?.color ?? "#ffffff14" }} />
            <div className="mission-meta">
              <strong style={{ fontSize: 14 }}>{m.name}</strong>
              <span className="mission-tags">
                {reg && (
                  <span className="mission-tag" style={{ color: reg.color, borderColor: reg.color + "44" }}>
                    {reg.icon} {reg.label}
                  </span>
                )}
                <span className="mission-tag" style={{ color: diffColor, borderColor: diffColor + "44" }}>{m.difficulty}</span>
                <span className="mission-tag">{m.energy_cost} ⚡</span>
                <span className="mission-tag" style={{ color: "#e8702a", borderColor: "#e8702a44" }}>+{m.reward_xp} XP</span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  </section>
);
}
