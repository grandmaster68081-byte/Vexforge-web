import { useEffect, useMemo, useState, useCallback } from "react";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { PageLoader } from "../shared/components/PageLoader";
import {
  listRelics, getPlayerRelics, equipRelic, unequipRelic, claimStarterRelics,
} from "../domains/relics/repository";
import type { Relic, PlayerRelic } from "../domains/relics/repository";
import { supabase } from "../lib/supabase";

const RARITY_COLORS: Record<string, string> = {
  Common: "#9ca3af", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ef4444",
};
const RARITY_ORDER: Record<string, number> = {
  Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5,
};
const PANEL = "linear-gradient(145deg,#19152b,#11111a)";
const SLOT_ICON: Record<string, string> = {
  neck: "📿", off_hand: "🛡", main_hand: "⚔️", head: "🪖", chest: "🥋",
  ring: "💍", banner: "🚩", relic: "🔮",
};

function metaStr(r: Relic, key: string): string | null {
  const v = r.metadata?.[key];
  return typeof v === "string" || typeof v === "number" ? String(v) : null;
}
function labelize(v: string | null | undefined): string {
  if (!v) return "Efecto no definido";
  return v.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function getRarity(r: Relic): string { return metaStr(r, "rarity") ?? "Common"; }

// ─── Relic card ───────────────────────────────────────────────────────────────
function RelicCard({
  relic, owned, equipped, equippedCount, onEquip, onUnequip, loading,
}: {
  relic: Relic; owned: boolean; equipped: boolean;
  equippedCount: number; onEquip: () => void; onUnequip: () => void; loading: boolean;
}) {
  const rarity = getRarity(relic);
  const color = RARITY_COLORS[rarity] ?? RARITY_COLORS.Common;
  const slot = metaStr(relic, "slot");
  const slotIcon = slot ? (SLOT_ICON[slot] ?? "◈") : "◈";
  const description = metaStr(relic, "description");
  const isHighRarity = rarity === "Legendary" || rarity === "Mythic" || rarity === "Epic";
  const canEquip = owned && !equipped && equippedCount < 3;

  return (
    <article
      className={isHighRarity ? "relic-glow-v2" : undefined}
      style={{
        background: equipped
          ? `linear-gradient(145deg,#1e1535,#130f22)`
          : PANEL,
        border: equipped
          ? `1.5px solid ${color}99`
          : owned ? `1px solid ${color}55` : "1px solid #ffffff0e",
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: equipped ? `0 0 18px ${color}28, inset 0 1px 0 ${color}20` : `inset 0 1px 0 ${color}10`,
        transition: "transform .2s, border-color .2s",
        opacity: owned ? 1 : 0.52,
        position: "relative",
        ["--relic-glow" as string]: color + "66",
      }}>

      {/* Equipped badge */}
      {equipped && (
        <div style={{
          position: "absolute", top: 10, right: 14,
          background: `linear-gradient(90deg, ${color}22, ${color}44)`,
          border: `1px solid ${color}88`, borderRadius: 999,
          color, fontSize: 9, fontWeight: 900, padding: "3px 9px",
          fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.12em",
        }}>⚡ EQUIPADA</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ color: "#555", fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, letterSpacing: "0.12em", marginBottom: 5 }}>{relic.code}</div>
          <h2 style={{ color: owned ? "#e8e8f0" : "#777", fontFamily: '"Cinzel",serif', fontSize: 16, margin: 0 }}>{relic.name}</h2>
        </div>
        <span style={{ color, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 8px", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>{rarity}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <span style={{ background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 999, color: "#c7c7d4", fontSize: 10, padding: "3px 8px" }}>{labelize(relic.effect_type)}</span>
        {slot && <span style={{ background: "#ffffff06", border: "1px solid #ffffff0e", borderRadius: 999, color: "#888", fontSize: 10, padding: "3px 8px" }}>{slotIcon} {labelize(slot)}</span>}
      </div>

      <p style={{ color: "#aaaabd", fontSize: 12, lineHeight: 1.65, minHeight: 36, margin: 0 }}>
        {description ?? "Efecto registrado en el catálogo canónico."}
      </p>

      {relic.effect_value !== null && relic.effect_value !== undefined && (
        <div style={{ color, fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, fontWeight: 700, marginTop: 12 }}>
          POTENCIA · {relic.effect_value}
        </div>
      )}

      {/* Action button */}
      {owned && (
        <div style={{ marginTop: 14 }}>
          {equipped ? (
            <button
              disabled={loading}
              onClick={onUnequip}
              style={{
                background: "#ffffff0a", border: "1px solid #ffffff20",
                borderRadius: 8, color: "#aaa", cursor: loading ? "default" : "pointer",
                fontSize: 11, fontWeight: 600, padding: "7px 16px", width: "100%",
                transition: "all .2s",
              }}>
              {loading ? "..." : "Desequipar"}
            </button>
          ) : (
            <button
              disabled={!canEquip || loading}
              onClick={onEquip}
              style={{
                background: canEquip ? `linear-gradient(90deg, ${color}22, ${color}33)` : "#ffffff06",
                border: canEquip ? `1px solid ${color}66` : "1px solid #ffffff10",
                borderRadius: 8, color: canEquip ? color : "#555",
                cursor: canEquip && !loading ? "pointer" : "not-allowed",
                fontSize: 11, fontWeight: 700, padding: "7px 16px", width: "100%",
                transition: "all .2s",
              }}>
              {loading ? "..." : canEquip ? "Equipar" : equippedCount >= 3 ? "Máx. 3 equipadas" : "Equipar"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Main route ────────────────────────────────────────────────────────────────
export function RelicsRoute() {
  const [catalogState, setCatalogState] = useState<{ status: "loading" | "ready"; data: Relic[] | null; reason?: string }>({ status: "loading", data: null });
  const [playerRelics, setPlayerRelics] = useState<PlayerRelic[]>([]);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setAuthed(!!s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load catalog
  useEffect(() => {
    let mounted = true;
    setCatalogState({ status: "loading", data: null });
    listRelics().then((result) => {
      if (mounted) setCatalogState({ status: "ready", data: result.data, reason: result.reason });
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  // Load player relics
  useEffect(() => {
    if (!authed) { setPlayerRelics([]); return; }
    getPlayerRelics().then((result) => {
      if (result.data) setPlayerRelics(result.data);
    });
  }, [authed, reloadKey]);

  const catalog = catalogState.data ?? [];
  const ownedIds = useMemo(() => new Set(playerRelics.map(pr => pr.relic_id)), [playerRelics]);
  const equippedIds = useMemo(() => new Set(playerRelics.filter(pr => pr.equipped).map(pr => pr.relic_id)), [playerRelics]);
  const equippedCount = equippedIds.size;

  const rarities = useMemo(() => Array.from(new Set(catalog.map(r => getRarity(r)))).sort((a, b) => (RARITY_ORDER[a] ?? 0) - (RARITY_ORDER[b] ?? 0)), [catalog]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return catalog.filter((r) => {
      const rarity = getRarity(r);
      const hay = [r.code, r.name, r.effect_type, metaStr(r, "slot"), metaStr(r, "description"), rarity].filter(Boolean).join(" ").toLowerCase();
      return (rarityFilter === "all" || rarity === rarityFilter) && (!needle || hay.includes(needle));
    });
  }, [catalog, rarityFilter, search]);

  // Sorted: equipped first, then owned, then rest; within groups by rarity desc
  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => {
    const aEq = equippedIds.has(a.id) ? 2 : ownedIds.has(a.id) ? 1 : 0;
    const bEq = equippedIds.has(b.id) ? 2 : ownedIds.has(b.id) ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return (RARITY_ORDER[getRarity(b)] ?? 0) - (RARITY_ORDER[getRarity(a)] ?? 0);
  }), [filtered, equippedIds, ownedIds]);

  const handleEquip = useCallback(async (relic: Relic) => {
    setActionLoading(relic.id);
    const result = await equipRelic(relic.id);
    if (result.ok) {
      showToast(`${relic.name} equipada`, true);
      setReloadKey(k => k + 1);
    } else {
      showToast(result.error ?? "No se pudo equipar", false);
    }
    setActionLoading(null);
  }, [showToast]);

  const handleUnequip = useCallback(async (relic: Relic) => {
    setActionLoading(relic.id);
    const result = await unequipRelic(relic.id);
    if (result.ok) {
      showToast(`${relic.name} desequipada`, true);
      setReloadKey(k => k + 1);
    } else {
      showToast(result.error ?? "No se pudo desequipar", false);
    }
    setActionLoading(null);
  }, [showToast]);

  const handleClaim = useCallback(async () => {
    setClaimLoading(true);
    const result = await claimStarterRelics();
    if (result.ok) {
      setClaimDone(true);
      showToast("¡Reliquias iniciales reclamadas!", true);
      setReloadKey(k => k + 1);
    } else {
      showToast(result.error ?? "No se pudo reclamar", false);
    }
    setClaimLoading(false);
  }, [showToast]);

  if (catalogState.status === "loading") return <PageLoader message="Consultando las Reliquias..." />;
  if (catalogState.data === null) return <ErrorState message={catalogState.reason ?? "No se pudo cargar el catálogo de Reliquias."} onRetry={() => setReloadKey(k => k + 1)} />;

  const equippedRelics = catalog.filter(r => equippedIds.has(r.id));
  const hasNoOwned = authed && playerRelics.length === 0 && !claimDone;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px", position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "linear-gradient(90deg,#0d2b1a,#0f2e1e)" : "linear-gradient(90deg,#2b0d0d,#2e0f0f)",
          border: `1px solid ${toast.ok ? "#3ddc8466" : "#e8404066"}`,
          borderRadius: 12, color: toast.ok ? "#3ddc84" : "#e84040",
          fontSize: 13, fontWeight: 600, padding: "12px 24px",
          zIndex: 9999, boxShadow: "0 8px 32px #00000088",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#a855f7", fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.16em", margin: "0 0 8px", textTransform: "uppercase" }}>Artefactos de la Forja</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: "#e8e8f0", fontFamily: '"Cinzel",serif', fontSize: 28, margin: "0 0 6px" }}>Reliquias</h1>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 580 }}>Artefactos con poderes reales en combate. Equipa hasta <strong style={{ color: "#a855f7" }}>3</strong> para potenciar tu Campeón.</p>
          </div>
          {authed && (
            <div style={{ background: "#12121f", border: `2px solid ${equippedCount >= 3 ? "#a855f7" : "#2a2a3a"}`, borderRadius: 12, padding: "10px 20px", textAlign: "center" }}>
              <div style={{ color: equippedCount >= 3 ? "#a855f7" : "#4a9eff", fontFamily: '"IBM Plex Mono",monospace', fontSize: 22, fontWeight: 900 }}>{equippedCount}<span style={{ color: "#444", fontSize: 16 }}>/3</span></div>
              <div style={{ color: "#666", fontSize: 10, letterSpacing: "0.1em", marginTop: 2 }}>EQUIPADAS</div>
            </div>
          )}
        </div>
      </header>

      {/* Claim starter relics */}
      {authed && hasNoOwned && (
        <section style={{ background: "linear-gradient(135deg,#1a112b,#110d20)", border: "1px solid #a855f733", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "#a855f7", fontFamily: '"Cinzel",serif', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🎁 Kit inicial de Reliquias</div>
            <div style={{ color: "#888", fontSize: 12 }}>Recibe las 3 reliquias básicas del Forjador para comenzar tu aventura.</div>
          </div>
          <button
            disabled={claimLoading}
            onClick={handleClaim}
            style={{ background: "linear-gradient(90deg,#a855f733,#a855f744)", border: "1px solid #a855f788", borderRadius: 10, color: "#c084fc", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "10px 22px", whiteSpace: "nowrap" }}>
            {claimLoading ? "Reclamando..." : "Reclamar kit inicial"}
          </button>
        </section>
      )}

      {/* Equipped strip */}
      {authed && equippedRelics.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <div style={{ color: "#a855f7", fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>⚡ Reliquias activas en combate</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {equippedRelics.map(r => {
              const col = RARITY_COLORS[getRarity(r)] ?? RARITY_COLORS.Common;
              return (
                <div key={r.id} style={{ background: `linear-gradient(135deg,${col}15,${col}08)`, border: `1px solid ${col}55`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{r.name}</span>
                  <span style={{ color: "#555", fontSize: 10 }}>·</span>
                  <span style={{ color: "#888", fontSize: 10 }}>{labelize(metaStr(r, "slot"))}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters */}
      <section style={{ background: "#12121f", border: "1px solid #2a2a3a", borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reliquia, efecto o ranura..."
            style={{ flex: "1 1 240px", minWidth: 0, background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#e8e8f0", padding: "10px 12px", fontSize: 12, outline: "none" }} />
          <select
            value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}
            style={{ flex: "0 1 180px", background: "#0d0d14", border: "1px solid #2a2a3a", borderRadius: 9, color: "#d8d8e5", padding: "10px 12px", fontSize: 12 }}>
            <option value="all">Todas las rarezas</option>
            {rarities.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ color: "#555", fontSize: 10, marginTop: 10 }}>
          {sortedFiltered.length} de {catalog.length} reliquias · {ownedIds.size} poseídas
        </div>
      </section>

      {/* Grid */}
      {sortedFiltered.length === 0 ? (
        <EmptyState icon="◇" title="No hay reliquias que coincidan" description="Prueba con otra búsqueda o cambia la rareza." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          {sortedFiltered.map(relic => (
            <RelicCard
              key={relic.id}
              relic={relic}
              owned={ownedIds.has(relic.id)}
              equipped={equippedIds.has(relic.id)}
              equippedCount={equippedCount}
              onEquip={() => handleEquip(relic)}
              onUnequip={() => handleUnequip(relic)}
              loading={actionLoading === relic.id}
            />
          ))}
        </div>
      )}

      {!authed && (
        <div style={{ textAlign: "center", marginTop: 32, color: "#555", fontSize: 13 }}>
          Inicia sesión para ver y equipar tus reliquias.
        </div>
      )}
    </main>
  );
}
