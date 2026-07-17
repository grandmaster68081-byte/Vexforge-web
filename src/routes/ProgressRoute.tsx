import { useProgress } from "../domains/progress/useProgress";
import { SkeletonStatGrid } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_progress.jpg";

function ProgressBar({ value, max, color = "#e8702a", label }: { value: number; max: number; color?: string; label: string }) {
const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
return (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a8a9e" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#8a8a9e" }}>{value.toLocaleString()} / {max.toLocaleString()}</span>
    </div>
    <div style={{ height: 8, background: "#ffffff10", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  </div>
);
}

export function ProgressRoute() {
const { progress, loading, reason, signedIn } = useProgress();

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Progress</h1>
      </div>
    </div>

    {loading && <SkeletonStatGrid count={3} />}

    {!loading && !signedIn && (
      <div className="empty-state">
        <p>You are not signed in.</p>
        <p className="muted"><Link to="/account">Go to Account</Link> to sign in.</p>
      </div>
    )}

    {!loading && signedIn && !progress && reason && (
      <div className="empty-state"><p className="muted">{reason}</p></div>
    )}

    {!loading && progress && (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div className="dashboard-grid" style={{ marginBottom: 8 }}>
          <div className="stat-card">
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Level</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#e8702a", lineHeight: 1 }}>{progress.level}</p>
          </div>
          <div className="stat-card">
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Total XP</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#4a9eff" }}>{progress.xp.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Energy</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#3ddc84" }}>
              {progress.energy} <span style={{ fontSize: 14, color: "#8a8a9e" }}>/ {progress.max_energy}</span>
            </p>
          </div>
        </div>

        <ProgressBar value={progress.xp} max={progress.xp_to_next} color="#e8702a" label="XP to Next Level" />
        <ProgressBar value={progress.energy} max={progress.max_energy} color="#3ddc84" label="Energy" />

        {progress.starter_region && (
          <div>
            <h2 style={{ marginBottom: 10 }}>Starting Region</h2>
            <div className="stat-card" style={{ display: "inline-block", padding: "12px 20px" }}>
              <span style={{ color: "#e8702a", fontWeight: 600 }}>{progress.starter_region}</span>
            </div>
          </div>
        )}

        <div>
          <h2 style={{ marginBottom: 10 }}>Tutorial</h2>
          <div className="stat-card" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
            <span className="muted" style={{ fontSize: 12 }}>Step completed</span>
            <span style={{ fontWeight: 700, color: "#4a9eff", fontSize: 18 }}>{progress.tutorial_step}</span>
          </div>
        </div>
      </div>
    )}
  </section>
);
}
