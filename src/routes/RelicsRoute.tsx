import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { PageLoader } from "../shared/components/PageLoader";
import { listRelics } from "../domains/relics/repository";
import type { Relic } from "../domains/relics/repository";

const RARITY_COLORS: Record<string, string> = { Common: "#9ca3af", Uncommon: "#3ddc84", Rare: "#4a9eff", Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ef4444" };
const PANEL = "linear-gradient(145deg,#19152b,#11111a)";

function metadataText(relic: Relic, key: string): string | null {
  const value = relic.metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function labelize(value: string | null | undefined): string {
  if (!value) return "Efecto no definido";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RelicCard({ relic }: { relic: Relic }) {
  const rarity = metadataText(relic, "rarity") ?? "Common";
  const color = RARITY_COLORS[rarity] ?? RARITY_COLORS.Common;
  const slot = metadataText(relic, "slot");
  const description = metadataText(relic, "description");
  return (
    <article style={{ background: PANEL, border: `1px solid ${color}38`, borderRadius: 14, padding: "18px 20px", boxShadow: `inset 0 1px 0 ${color}14`, transition: "transform .2s, border-color .2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ color: "#777", fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, letterSpacing: "0.12em", marginBottom: 7 }}>{relic.code}</div>
          <h2 style={{ color: "#e8e8f0", fontFamily: '"Cinzel",serif', fontSize: 17, margin: 0 }}>{relic.name}</h2>
        </div>
        <span style={{ color, border: `1px solid ${color}66`, borderRadius: 999, padding: "4px 8px", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>{rarity}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, margin: "15px 0 13px" }}>
        <span style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 999, color: "#c7c7d4", fontSize: 10, padding: "4px 9px" }}>{labelize(relic.effect_type)}</span>
        {slot && <span style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 999, color: "#999", fontSize: 10, padding: "4px 9px" }}>Ranura: {labelize(slot)}</span>}
      </div>
      <p style={{ color: "#aaaabd", fontSize: 12, lineHeight: 1.65, minHeight: 40, margin: 0 }}>{description ?? "Efecto registrado en el catálogo canónico."}</p>
      {relic.effect_value !== null && relic.effect_value !== undefined && <div style={{ color, fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, fontWeight: 700, marginTop: 14 }}>VALOR DEL EFECTO · {relic.effect_value}</div>}
    </article>
  );
}

export function RelicsRoute() {
  const [state, setState] = useState<{ status: "loading" | "ready"; data: Relic[] | null; reason?: string }>({ status: "loading", data: null });
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState({ status: "loading", data: null });
    listRelics().then((result) => {
      if (mounted) setState({ status: "ready", data: result.data, reason: result.reason });
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  const relics = state.data ?? [];
  const rarities = useMemo(() => Array.from(new Set(relics.map((relic) => metadataText(relic, "rarity") ?? "Common"))).sort(), [relics]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return relics.filter((relic) => {
      const relicRarity = metadataText(relic, "rarity") ?? "Common";
      const haystack = [relic.code, relic.name, relic.effect_type, metadataText(relic, "slot"), metadataText(relic, "description"), relicRarity].filter(Boolean).join(" ").toLowerCase();
      return (rarity === "all" || relicRarity === rarity) && (!needle || haystack.includes(needle));
    });
  }, [rarity, relics, search]);

  if (state.status === "loading") return <PageLoader message="Consultando las Reliquias..." />;
  if (state.data === null) return <ErrorState message={state.reason ?? "No se pudo cargar el catálogo de Reliquias."} onRetry={() => setReloadKey((value) => value + 1)} />;

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: "32px 16px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#a855f7", fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.16em", margin: "0 0 9px", textTransform: "uppercase" }}>Artefactos de la Forja</p>
        <h1 style={{ color: "#e8e8f0", fontFamily: '"Cinzel",serif', fontSize: 28, margin: "0 0 7px" }}>Reliquias</h1>
        <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 660 }}>Un archivo de artefactos con efectos, rarezas y ranuras definidos por el mundo de VEXFORGE.</p>
      </header>

      <section style={{ background: "#12121f", border: "1px solid #2a2a3a", borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar reliquia, efecto o ranura..." aria-label="Buscar Reliquias" style={{ flex: "1 1 240px", minWidth: 0, background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#e8e8f0", padding: "10px 12px", fontSize: 12, outline: "none" }} />
          <select value={rarity} onChange={(event) => setRarity(event.target.value)} aria-label="Filtrar por rareza" style={{ flex: "0 1 180px", background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#d8d8e5", padding: "10px 12px", fontSize: 12 }}>
            <option value="all">Todas las rarezas</option>
            {rarities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div style={{ color: "#666", fontSize: 10, marginTop: 10 }}>{filtered.length} de {relics.length} reliquias visibles</div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState icon="◇" title="No hay reliquias que coincidan" description="Prueba con otra búsqueda o cambia la rareza seleccionada." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          {filtered.map((relic) => <RelicCard key={relic.id} relic={relic} />)}
        </div>
      )}
    </main>
  );
}
