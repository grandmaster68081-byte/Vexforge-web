import { useProgress } from "../domains/progress/useProgress";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { ErrorState } from "../shared/components/ErrorState";
import { Link } from "react-router-dom";
import { AnimatedProgressBar } from "../shared/components/AnimatedProgressBar";

// Shim: ForgeBar ahora usa AnimatedProgressBar (C.3)
function ForgeBar({ label, value, max, color = "#e8b84b", icon = "⚡" }: {
  label: string; value: number; max: number; color?: string; icon?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <AnimatedProgressBar
        current={value} max={max}
        color={color} height={10}
        showText label={label} icon={icon}
      />
    </div>
  );
}

function StatPill({ label, value, icon, color = "#e8e8f0" }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontWeight: 800, fontSize: 18, fontFamily: "Cinzel,serif" }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const LEVEL_TITLES: [number, string][] = [
  [1,"Aprendiz"],[10,"Iniciado"],[20,"Forjador"],[30,"Artesano"],[40,"Maestro"],
  [50,"Gran Maestro"],[60,"Legendario"],[70,"Mítico"],[80,"Eterno"],[90,"Trascendente"]
];
function getLevelTitle(level: number): string {
  return [...LEVEL_TITLES].reverse().find(([l]) => level >= l)?.[1] ?? "Aprendiz";
}

export function ProgressRoute() {
  const { progress, status, loading, signedIn } = useProgress();

  if (loading)              return <PageLoader />;
  if (!signedIn)            return <BlockedAuthState message="Inicia sesión para ver tu progreso de Forjador." />;
  if (status === "error")   return <ErrorState message="No se pudo cargar el progreso." />;

  if (!progress) return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚒️</div>
        <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>Tu perfil de progreso aún no está configurado.</p>
        <Link to="/account" style={{ color: "#e8b84b", textDecoration: "none", fontWeight: 700 }}>Ir a Mi Cuenta →</Link>
      </div>
    </main>
  );

  const title      = getLevelTitle(progress.level);
  const energyPct  = progress.max_energy > 0 ? Math.round((progress.energy / progress.max_energy) * 100) : 0;
  const energyColor = energyPct > 50 ? "#3ddc84" : energyPct > 20 ? "#e8b84b" : "#e3573f";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Forjador ───</p>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>⚒️ Mi Progreso</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Tu evolución como Forjador. Nivel, XP, energía y pasos completados.</p>
      </div>

      {/* Level identity card */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#12121a)", border: "1px solid #e8b84b44", borderRadius: 16, padding: "24px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle,#e8b84b08,transparent)", borderRadius: "0 0 0 100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#e8b84b", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>NIVEL</div>
            <div style={{ fontFamily: "Cinzel,serif", fontSize: 52, fontWeight: 900, color: "#e8e8f0", lineHeight: 1 }}>{progress.level}</div>
            <div style={{ color: "#e8b84b", fontSize: 13, fontWeight: 700, marginTop: 4 }}>{title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#555", fontSize: 10 }}>ENERGÍA</div>
            <div style={{ color: energyColor, fontSize: 18, fontWeight: 800 }}>{progress.energy}/{progress.max_energy}</div>
            <div style={{ color: "#555", fontSize: 10 }}>{energyPct}% disponible</div>
          </div>
        </div>
        <ForgeBar label="Experiencia" value={progress.xp} max={progress.xp + progress.xp_to_next} color="#e8b84b" icon="⭐" />
        <ForgeBar label="Energía" value={progress.energy} max={progress.max_energy} color={energyColor} icon="⚡" />
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 24 }}>
        <StatPill icon="⭐" label="XP Total" value={progress.xp} color="#e8b84b" />
        <StatPill icon="⚡" label="Energía" value={`${progress.energy}/${progress.max_energy}`} color="#4a9eff" />
        <StatPill icon="📖" label="XP p/siguiente" value={progress.xp_to_next} color="#a855f7" />
        <StatPill icon="🎓" label="Tutorial" value={`Paso ${progress.tutorial_step}`} color="#3ddc84" />
      </div>

      {progress.tutorial_step < 10 && (
        <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 12, padding: "18px 20px" }}>
          <p style={{ color: "#888", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 12px" }}>TUTORIAL</p>
          <ForgeBar label="Pasos completados" value={progress.tutorial_step} max={10} color="#3ddc84" icon="📖" />
          <p style={{ color: "#555", fontSize: 11, margin: "8px 0 0" }}>Completa el tutorial para desbloquear todas las funciones del juego.</p>
        </div>
      )}
    </main>
  );
}
