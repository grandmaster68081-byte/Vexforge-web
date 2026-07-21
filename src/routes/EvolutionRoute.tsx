import { useState } from "react";
import { useEvolution } from "../domains/evolution/useEvolution";
import type { EvoPath } from "../domains/evolution/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444"
};
const FACTION_COLOR: Record<string, string> = {
  Guerrero: "#E84040", Mago: "#5B8BF5", "Paladín": "#3DC96B", "Pícaro": "#7B4FD4"
};
const FACTIONS = ["all", "Guerrero", "Mago", "Paladín", "Pícaro"];

function EvoCard({ path, onEvolve, evolving }: {
  path: EvoPath; onEvolve: (p: EvoPath) => void; evolving: boolean;
}) {
  const fromColor = RARITY_COLOR[path.from_rarity] ?? "#8b8b9e";
  const toColor   = RARITY_COLOR[path.to_rarity]   ?? "#8b8b9e";
  const fColor    = FACTION_COLOR[path.from_faction] ?? "#e8b84b";
  const vexCost   = path.cost_json?.vex_ingame ?? 0;
  const copies    = path.cost_json?.copies_required ?? 2;
  const lvlReq    = path.requirements_json?.level_required ?? 1;

  return (
    <div style={{ background: "linear-gradient(145deg,#1a1a2e,#12121a)", border: `1px solid ${fColor}33`, borderRadius: 14, padding: "18px 20px" }}>
      {/* Faction badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ background: `${fColor}22`, border: `1px solid ${fColor}55`, borderRadius: 8, padding: "2px 10px", fontSize: 10, color: fColor, fontWeight: 800 }}>
          {path.from_faction}
        </span>
        <span style={{ color: "#444", fontSize: 10 }}>Nivel {lvlReq}+</span>
      </div>

      {/* From → To */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: `${fromColor}11`, border: `1px solid ${fromColor}33`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ color: fromColor, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 3 }}>{path.from_rarity.toUpperCase()}</div>
          <div style={{ color: "#e8e8f0", fontFamily: "Cinzel,serif", fontSize: 12, fontWeight: 700 }}>{path.from_name}</div>
        </div>
        <div style={{ color: "#e8b84b", fontSize: 18, flexShrink: 0 }}>→</div>
        <div style={{ flex: 1, background: `${toColor}11`, border: `1px solid ${toColor}33`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ color: toColor, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 3 }}>{path.to_rarity.toUpperCase()}</div>
          <div style={{ color: "#e8e8f0", fontFamily: "Cinzel,serif", fontSize: 12, fontWeight: 700 }}>{path.to_name}</div>
        </div>
      </div>

      {/* Cost */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ background: "#12121a", border: "1px solid #2a2a3a", borderRadius: 8, padding: "6px 12px", flex: 1, textAlign: "center" }}>
          <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: 14 }}>{copies}×</div>
          <div style={{ color: "#555", fontSize: 9 }}>COPIAS</div>
        </div>
        {vexCost > 0 && (
          <div style={{ background: "#12121a", border: "1px solid #2a2a3a", borderRadius: 8, padding: "6px 12px", flex: 1, textAlign: "center" }}>
            <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: 14 }}>{vexCost}</div>
            <div style={{ color: "#555", fontSize: 9 }}>VEX</div>
          </div>
        )}
      </div>

      {path.requirements_json?.description && (
        <p style={{ color: "#555", fontSize: 10, marginBottom: 12, lineHeight: 1.5 }}>{path.requirements_json.description}</p>
      )}

      <button
        disabled={evolving}
        onClick={() => onEvolve(path)}
        style={{
          width: "100%", padding: "10px", borderRadius: 10, border: "none",
          cursor: evolving ? "not-allowed" : "pointer",
          background: evolving ? "#1a1a2e" : `linear-gradient(135deg,${fColor},${fColor}88)`,
          color: evolving ? "#555" : "#0a0a12", fontWeight: 800, fontSize: 13,
          opacity: evolving ? 0.7 : 1, transition: "opacity .2s",
        }}
      >
        {evolving ? "Evolucionando…" : "🧬 Evolucionar"}
      </button>
    </div>
  );
}

export function EvolutionRoute() {
  const { paths, authed, evolving, evoMsg, evolve, reload } = useEvolution();
  const [filter, setFilter] = useState("all");
  const { addToast } = useToast();

  // Surface evoMsg as toast when it changes
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  if (evoMsg !== lastMsg) {
    setLastMsg(evoMsg);
    if (evoMsg) {
      const isOk = evoMsg.includes("evolucionada") || evoMsg.includes("exitoso") || evoMsg.toLowerCase().includes("ok");
      addToast(isOk ? "success" : "error", evoMsg);
    }
  }

  const allPaths   = paths.data ?? [];
  const loading    = paths.status === "loading";
  const error      = paths.status === "ready" && !paths.data ? (paths as any).reason ?? "Error al cargar evoluciones" : null;
  const filtered   = filter === "all" ? allPaths : allPaths.filter(p => p.from_faction === filter);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  const factionBtn = (f: string): React.CSSProperties => ({
    padding: "7px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
    background: filter === f ? (FACTION_COLOR[f] ?? "#e8b84b") : "#1a1a2e",
    color: filter === f ? "#0a0a12" : "#666",
  });

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Progresión ───</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>🧬 Evolución de Cartas</h1>
          <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
        </div>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Fusiona copias de una carta para obtener su forma evolucionada. Requiere nivel y victorias PvP.</p>
      </div>

      {!authed && <BlockedAuthState message="Inicia sesión para evolucionar tus cartas. Puedes explorar los caminos disponibles." />}

      {/* Stats + faction filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "8px 16px", marginRight: 8 }}>
          <span style={{ color: "#e8b84b", fontWeight: 800, fontSize: 16 }}>{allPaths.length}</span>
          <span style={{ color: "#555", fontSize: 10, marginLeft: 6 }}>caminos</span>
        </div>
        {FACTIONS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={factionBtn(f)}>
            {f === "all" ? "Todos" : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🧬"
          title="Sin caminos de evolución"
          description={filter === "all" ? "No hay caminos configurados." : `No hay evoluciones de facción ${filter}.`}
          action={filter !== "all" ? { label: "Ver todos", onClick: () => setFilter("all") } : undefined}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {filtered.map(p => (
            <EvoCard key={p.id} path={p} onEvolve={(p) => evolve(p.id)} evolving={evolving} />
          ))}
        </div>
      )}
    </main>
  );
}
