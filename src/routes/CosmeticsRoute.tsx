import { useState, useEffect } from "react";
import { useCosmetics } from "../domains/cosmetics/useCosmetics";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444"
};
const TYPE_ICON: Record<string, string> = {
  card_frame: "🖼️", board_skin: "🎮", avatar: "👤", title: "📛",
  card_back: "🔄", emote: "😄", clan_banner: "🏳️"
};
const TYPE_LABEL: Record<string, string> = {
  card_frame: "Marco", board_skin: "Tablero", avatar: "Avatar", title: "Título",
  card_back: "Reverso", emote: "Emote", clan_banner: "Banner"
};

export function CosmeticsRoute() {
  const { catalog, myCosmetics, equipping, equipMsg, equip, unequip, reload } = useCosmetics();
  const [filter, setFilter] = useState("all");
  const { addToast } = useToast();

  // Surface equipMsg as toast
  useEffect(() => {
    if (!equipMsg) return;
    if (equipMsg.includes("equipado") || equipMsg.includes("desequipado")) addToast("success", equipMsg);
    else addToast("error", "Error de cosmético", equipMsg);
  }, [equipMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  const cosmetics  = catalog.data ?? [];
  const myCosm     = myCosmetics.data ?? [];
  const mine       = new Set(myCosm.map(c => c.cosmetic_id));
  const equippedSet = new Set(myCosm.filter(c => c.equipped).map(c => c.cosmetic_id));

  const loading  = catalog.status === "loading";
  const blocked  = myCosmetics.status === "blocked_auth";
  const error    = catalog.status === "ready" && !catalog.data ? (catalog as any).reason ?? "Error al cargar cosméticos" : null;

  const types    = ["all", ...Array.from(new Set(cosmetics.map(c => c.cosmetic_type))).sort()];
  const filtered = filter === "all" ? cosmetics : cosmetics.filter(c => c.cosmetic_type === filter);

  const handleEquipToggle = async (c: typeof cosmetics[0]) => {
    if (equippedSet.has(c.id)) await unequip(c.id);
    else                        await equip(c.id, c.cosmetic_type);
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Personalización ───</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>✨ Cosméticos</h1>
          <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
        </div>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Marcos, tableros, avatares y más. Personaliza tu experiencia sin afectar el gameplay.</p>
      </div>

      {blocked && <BlockedAuthState message="Inicia sesión para ver tu colección de cosméticos." />}

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
          <div style={{ color: "#e8e8f0", fontWeight: 800, fontSize: 18 }}>{cosmetics.length}</div>
          <div style={{ color: "#555", fontSize: 10 }}>TOTAL</div>
        </div>
        <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "10px 18px" }}>
          <div style={{ color: "#3ddc84", fontWeight: 800, fontSize: 18 }}>{mine.size}</div>
          <div style={{ color: "#555", fontSize: 10 }}>EN MI COLECCIÓN</div>
        </div>
        {equippedSet.size > 0 && (
          <div style={{ background: "#12121a", border: "1px solid #e8b84b33", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: 18 }}>{equippedSet.size}</div>
            <div style={{ color: "#555", fontSize: 10 }}>EQUIPADOS</div>
          </div>
        )}
      </div>

      {/* Type filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "6px 14px", borderRadius: 16, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
            background: filter === t ? "#e8b84b" : "#1a1a2e",
            color: filter === t ? "#0a0a12" : "#666",
          }}>
            {t === "all" ? "Todos" : `${TYPE_ICON[t] ?? "✨"} ${TYPE_LABEL[t] ?? t}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Sin cosméticos"
          description={filter === "all" ? "No hay cosméticos disponibles." : `No hay cosméticos de tipo ${TYPE_LABEL[filter] ?? filter}.`}
          action={filter !== "all" ? { label: "Ver todos", onClick: () => setFilter("all") } : undefined}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {filtered.map(c => {
            const rc       = RARITY_COLOR[c.rarity] ?? "#888";
            const owned    = mine.has(c.id);
            const isEquipped = equippedSet.has(c.id);
            return (
              <div key={c.id} style={{
                background: isEquipped ? "linear-gradient(145deg,#1a2a1a,#121a12)" : owned ? "linear-gradient(145deg,#1a1a2e,#12121a)" : "#0e0e1a",
                border: `1px solid ${isEquipped ? "#e8b84b88" : owned ? "#3ddc8444" : rc + "22"}`,
                borderRadius: 12, padding: "16px 18px", position: "relative",
                opacity: owned ? 1 : 0.6,
              }}>
                {isEquipped && <div style={{ position: "absolute", top: 8, right: 8, background: "#e8b84b", borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#0a0a12" }}>EQUIPADO</div>}
                {owned && !isEquipped && <div style={{ position: "absolute", top: 8, right: 8, background: "#3ddc8422", border: "1px solid #3ddc8444", borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "#3ddc84" }}>TUYO</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 30 }}>{TYPE_ICON[c.cosmetic_type] ?? "✨"}</span>
                  <span style={{ color: rc, fontSize: 9, fontWeight: 800 }}>{c.rarity.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                <div style={{ color: "#555", fontSize: 10, marginBottom: 12, lineHeight: 1.4 }}>{c.description}</div>
                {owned && (
                  <button
                    disabled={equipping}
                    onClick={() => handleEquipToggle(c)}
                    style={{
                      width: "100%", padding: "7px", borderRadius: 8, border: "none", cursor: equipping ? "not-allowed" : "pointer",
                      background: isEquipped ? "#2a1a1a" : "linear-gradient(135deg,#e8b84b,#c9901f)",
                      color: isEquipped ? "#e3573f" : "#0a0a12", fontSize: 11, fontWeight: 800,
                      opacity: equipping ? 0.6 : 1,
                    }}
                  >
                    {isEquipped ? "Desequipar" : "Equipar"}
                  </button>
                )}
                {!owned && (
                  <div style={{ textAlign: "center", color: "#444", fontSize: 10 }}>
                    {(c.obtainable_via ?? []).join(", ") || "No disponible"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
