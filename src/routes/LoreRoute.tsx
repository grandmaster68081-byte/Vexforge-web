import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { PageLoader } from "../shared/components/PageLoader";
import { listLoreEntries } from "../domains/lore/repository";
import type { LoreEntry } from "../domains/lore/repository";

const GOLD = "#e8b84b";
const PANEL = "linear-gradient(145deg,#1a1a2e,#11111a)";

function labelize(value: string | null | undefined): string {
  if (!value) return "Sin categoría";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function LoreCard({ entry, expanded, onToggle }: { entry: LoreEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <article style={{ background: PANEL, border: "1px solid #2a2a3a", borderRadius: 14, padding: "18px 20px", transition: "border-color .2s, transform .2s", transform: expanded ? "translateY(-2px)" : "none" }}>
      <button onClick={onToggle} aria-expanded={expanded} style={{ display: "block", width: "100%", textAlign: "left", padding: 0, border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div>
            <div style={{ color: GOLD, fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, letterSpacing: "0.12em", marginBottom: 7 }}>{entry.entry_code ?? "CODEX ENTRY"}</div>
            <h2 style={{ color: "#e8e8f0", fontFamily: '"Cinzel",serif', fontSize: 17, margin: 0 }}>{entry.title ?? "Entrada sin título"}</h2>
          </div>
          <span style={{ color: "#777", fontSize: 18, lineHeight: 1 }}>{expanded ? "−" : "+"}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
          <span style={{ color: "#d8b96a", background: "#e8b84b18", border: "1px solid #e8b84b3d", borderRadius: 999, padding: "4px 9px", fontSize: 10 }}>{labelize(entry.category)}</span>
          {entry.related_entity && <span style={{ color: "#999", background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 999, padding: "4px 9px", fontSize: 10 }}>{entry.related_entity}</span>}
        </div>
      </button>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 15, borderTop: "1px solid #2a2a3a", color: "#b6b6c8", fontSize: 13, lineHeight: 1.75 }}>
          {entry.content ?? "Esta entrada aún no tiene contenido publicado."}
        </div>
      )}
    </article>
  );
}

export function LoreRoute() {
  const [state, setState] = useState<{ status: "loading" | "ready"; data: LoreEntry[] | null; reason?: string }>({ status: "loading", data: null });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState({ status: "loading", data: null });
    listLoreEntries().then((result) => {
      if (mounted) setState({ status: "ready", data: result.data, reason: result.reason });
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  const entries = state.data ?? [];
  const categories = useMemo(() => Array.from(new Set(entries.map((entry) => entry.category).filter((value): value is string => Boolean(value)))), [entries]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory = category === "all" || entry.category === category;
      const haystack = [entry.entry_code, entry.title, entry.content, entry.related_entity, entry.category].filter(Boolean).join(" ").toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [category, entries, search]);

  if (state.status === "loading") return <PageLoader message="Abriendo el Codex..." />;
  if (state.data === null) return <ErrorState message={state.reason ?? "No se pudo cargar el Codex de Lore."} onRetry={() => setReloadKey((value) => value + 1)} />;

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: "32px 16px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: GOLD, fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.16em", margin: "0 0 9px", textTransform: "uppercase" }}>Archivo de VEXFORGE</p>
        <h1 style={{ color: "#e8e8f0", fontFamily: '"Cinzel",serif', fontSize: 28, margin: "0 0 7px" }}>Codex de Lore</h1>
        <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 660 }}>Las entradas canónicas del mundo, la Ruptura y las reglas que sostienen la Forja.</p>
      </header>

      <section style={{ background: "#12121f", border: "1px solid #2a2a3a", borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en el Codex..." aria-label="Buscar en el Codex" style={{ flex: "1 1 240px", minWidth: 0, background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#e8e8f0", padding: "10px 12px", fontSize: 12, outline: "none" }} />
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría" style={{ flex: "0 1 210px", background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#d8d8e5", padding: "10px 12px", fontSize: 12 }}>
            <option value="all">Todas las categorías</option>
            {categories.map((value) => <option key={value} value={value}>{labelize(value)}</option>)}
          </select>
        </div>
        <div style={{ color: "#666", fontSize: 10, marginTop: 10 }}>{filtered.length} de {entries.length} entradas visibles</div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState icon="⌕" title="No hay entradas que coincidan" description="Prueba con otra búsqueda o cambia la categoría seleccionada." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          {filtered.map((entry) => <LoreCard key={entry.id} entry={entry} expanded={expanded === entry.id} onToggle={() => setExpanded((current) => current === entry.id ? null : entry.id)} />)}
        </div>
      )}
    </main>
  );
}
