import { useState, useEffect, useMemo, useCallback } from "react";
import { useCosmetics } from "../domains/cosmetics/useCosmetics";
import type { Cosmetic } from "../domains/cosmetics/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";

// ─── Constants ───────────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};
const RARITY_LABEL: Record<string, string> = {
  Common: "Común", Uncommon: "Poco común", Rare: "Raro",
  Epic: "Épico", Legendary: "Legendario", Mythic: "Mítico",
};
const TYPE_ICON: Record<string, string> = {
  card_frame: "🖼️", board_skin: "🎮", avatar: "👤", title: "📛",
  card_back: "🔄", emote: "😄", clan_banner: "🏳️", charm: "✨", battle_skin: "🎨",
};
const TYPE_LABEL: Record<string, string> = {
  card_frame: "Marco", board_skin: "Tablero", avatar: "Avatar", title: "Título",
  card_back: "Reverso", emote: "Emote", clan_banner: "Banner",
  charm: "Encanto", battle_skin: "Skin de Batalla",
};

// Slot order for the Loadout panel
const LOADOUT_SLOTS = ["avatar", "card_frame", "board_skin", "card_back", "title", "charm", "emote"];

function humanizeSource(raw: string): string {
  const t = raw.toLowerCase();
  const dict: Record<string, string> = {
    default: "Obsequio de bienvenida", packs: "Sobres", missions: "Misiones",
    season_pass: "Pase de temporada", season_pass_premium: "Pase premium",
    founder_pack: "Pack Fundador", forge_pack: "Pack Forja",
    achievement: "Logro", pvp_rank_legend: "Rango PvP: Leyenda",
    pvp_rank_mythic: "Rango PvP: Mítico",
  };
  if (dict[t]) return dict[t];
  if (t.startsWith("achievement:")) {
    const key = t.slice("achievement:".length).replace(/_/g, " ");
    return `Logro: ${key.charAt(0).toUpperCase() + key.slice(1)}`;
  }
  if (t.startsWith("pvp_rank_")) {
    const rank = t.slice("pvp_rank_".length);
    return `Rango PvP: ${rank.charAt(0).toUpperCase() + rank.slice(1)}`;
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── CosmeticPreview ─────────────────────────────────────────────────────────
function CosmeticPreview({
  cosmetic, rarityColor, size = "card",
}: {
  cosmetic: Pick<Cosmetic, "name" | "cosmetic_type" | "preview_url" | "metadata">;
  rarityColor: string;
  size?: "card" | "slot" | "detail";
}) {
  const md = cosmetic.metadata ?? {};
  const baseColor: string = md.preview_color ?? rarityColor;
  const animated = md.animated === true;
  const glow = md.glow === true;
  const icon = TYPE_ICON[cosmetic.cosmetic_type] ?? "✨";

  const iconSize = size === "detail" ? 64 : size === "slot" ? 22 : 44;
  const borderR = size === "slot" ? 8 : 10;

  if (cosmetic.preview_url) {
    return (
      <div style={{
        position: "relative", width: "100%", aspectRatio: "1 / 1",
        borderRadius: borderR, overflow: "hidden",
        border: `1px solid ${rarityColor}55`,
        boxShadow: glow ? `0 0 24px ${rarityColor}66` : "none",
      }}>
        <img src={cosmetic.preview_url} alt={cosmetic.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy" />
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "1 / 1",
      borderRadius: borderR,
      background: `radial-gradient(circle at 35% 30%, ${baseColor}dd 0%, ${baseColor}88 45%, #0a0a12 100%)`,
      border: `1px solid ${rarityColor}66`,
      boxShadow: glow ? `0 0 24px ${rarityColor}55, inset 0 0 24px ${baseColor}44` : `inset 0 0 18px ${baseColor}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {animated && (
        <div style={{
          position: "absolute", inset: -2, borderRadius: borderR + 2,
          background: `conic-gradient(from 0deg, transparent, ${rarityColor}, transparent 40%)`,
          animation: "vex-spin 3.5s linear infinite",
          opacity: 0.55, pointerEvents: "none",
        }} />
      )}
      <div style={{
        position: "absolute", inset: 6, borderRadius: borderR - 2,
        background: `radial-gradient(circle, ${baseColor}55 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <span style={{
        fontSize: iconSize, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
        position: "relative", zIndex: 1,
      }}>{icon}</span>
      <style>{`@keyframes vex-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── LoadoutPanel ─────────────────────────────────────────────────────────────
function LoadoutPanel({
  cosmetics, equippedIds, equippedMap, onSlotClick, pendingUnequip, onUnequip,
}: {
  cosmetics: Cosmetic[];
  equippedIds: Set<string>;
  equippedMap: Map<string, Cosmetic>;  // slot → cosmetic
  onSlotClick: (slot: string) => void;
  pendingUnequip: string | null;
  onUnequip: (id: string) => void;
}) {
  const hasAny = equippedMap.size > 0;

  return (
    <div style={{
      background: "linear-gradient(135deg,#12121f,#0e0e1a)",
      border: "1px solid rgba(232,184,75,0.2)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 28,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: hasAny ? 14 : 6,
      }}>
        <div>
          <p style={{
            fontSize: 10, letterSpacing: "0.14em", color: "#e8b84b",
            textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif",
            fontWeight: 700, margin: "0 0 2px",
          }}>Tu Loadout Actual</p>
          {!hasAny && (
            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
              Ningún cosmético equipado. Selecciona uno del catálogo.
            </p>
          )}
        </div>
        {hasAny && (
          <span style={{
            background: "rgba(232,184,75,0.1)", border: "1px solid rgba(232,184,75,0.3)",
            borderRadius: 20, padding: "2px 10px", fontSize: 10, color: "#e8b84b", fontWeight: 700,
          }}>
            {equippedMap.size} equipado{equippedMap.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {LOADOUT_SLOTS.map(slot => {
          const equipped = equippedMap.get(slot);
          const rc = equipped ? (RARITY_COLOR[equipped.rarity] ?? "#888") : "#2a2a3a";
          const isPendingUnequip = equipped && pendingUnequip === equipped.id;

          return (
            <div
              key={slot}
              onClick={() => onSlotClick(slot)}
              title={TYPE_LABEL[slot] ?? slot}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 6, cursor: "pointer",
                opacity: isPendingUnequip ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* Slot preview */}
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                border: equipped ? `2px solid ${rc}88` : "2px dashed #2a2a3a",
                background: equipped ? `radial-gradient(circle,${rc}22,#0e0e1a)` : "#0e0e1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: equipped ? `0 0 12px ${rc}33` : "none",
                transition: "all 0.2s ease",
              }}>
                {equipped ? (
                  <>
                    {equipped.preview_url ? (
                      <img
                        src={equipped.preview_url}
                        alt={equipped.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : (
                      <span style={{ fontSize: 22 }}>{TYPE_ICON[slot] ?? "✨"}</span>
                    )}
                    {/* Unequip button on hover via title */}
                    <button
                      onClick={e => { e.stopPropagation(); onUnequip(equipped.id); }}
                      disabled={isPendingUnequip ?? false}
                      title="Desequipar"
                      style={{
                        position: "absolute", top: -6, right: -6,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#e3573f", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "#fff", fontWeight: 900, lineHeight: 1,
                        zIndex: 2,
                      }}
                    >✕</button>
                  </>
                ) : (
                  <span style={{ fontSize: 18, opacity: 0.3 }}>{TYPE_ICON[slot] ?? "✨"}</span>
                )}
              </div>
              {/* Slot label */}
              <span style={{ fontSize: 9, color: equipped ? rc : "#444",
                textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                {TYPE_LABEL[slot] ?? slot}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CosmeticCard ─────────────────────────────────────────────────────────────
function CosmeticCard({
  c, owned, isEquipped, isPending, equipping, selected,
  onClick, onEquipToggle,
}: {
  c: Cosmetic;
  owned: boolean;
  isEquipped: boolean;
  isPending: boolean;  // optimistic pending state
  equipping: boolean;
  selected: boolean;
  onClick: () => void;
  onEquipToggle: (e: React.MouseEvent) => void;
}) {
  const rc = RARITY_COLOR[c.rarity] ?? "#888";
  const sources = c.obtainable_via ?? [];
  const isDefault = c.metadata?.default === true;
  const busy = equipping && isPending;

  return (
    <div
      onClick={onClick}
      style={{
        background: isEquipped
          ? "linear-gradient(145deg,#1a2a1a,#121a12)"
          : owned
          ? "linear-gradient(145deg,#1a1a2e,#12121a)"
          : "#0e0e1a",
        border: selected
          ? `2px solid ${rc}`
          : isEquipped
          ? `1px solid #e8b84b88`
          : owned
          ? `1px solid #3ddc8444`
          : `1px solid ${rc}22`,
        borderRadius: 12, padding: "14px 14px 16px",
        position: "relative", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 10,
        opacity: owned ? 1 : 0.72,
        transform: selected ? "scale(1.02)" : "scale(1)",
        transition: "transform 0.15s ease, border 0.15s ease, box-shadow 0.15s ease",
        boxShadow: selected
          ? `0 0 20px ${rc}44, 0 4px 16px rgba(0,0,0,0.4)`
          : isEquipped
          ? `0 0 12px #e8b84b22`
          : "none",
      }}
    >
      {/* Badges */}
      {isEquipped && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#e8b84b", borderRadius: 6, padding: "2px 8px",
          fontSize: 9, fontWeight: 800, color: "#0a0a12", zIndex: 2,
        }}>EQUIPADO</div>
      )}
      {owned && !isEquipped && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#3ddc8422", border: "1px solid #3ddc8444",
          borderRadius: 6, padding: "2px 8px",
          fontSize: 9, fontWeight: 700, color: "#3ddc84", zIndex: 2,
        }}>TUYO</div>
      )}

      <CosmeticPreview cosmetic={c} rarityColor={rc} size="card" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{
          fontFamily: "Cinzel,serif", color: "#e8e8f0",
          fontSize: 13, fontWeight: 700, lineHeight: 1.25,
        }}>{c.name}</div>
        <span style={{ color: rc, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap", marginTop: 2 }}>
          {(RARITY_LABEL[c.rarity] ?? c.rarity).toUpperCase()}
        </span>
      </div>

      <div style={{ color: "#666", fontSize: 10.5, lineHeight: 1.45, minHeight: 28 }}>
        {c.description}
      </div>

      {/* Source tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {isDefault && (
          <span style={{
            background: "#e8b84b22", border: "1px solid #e8b84b55",
            color: "#e8b84b", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
          }}>Obsequio inicial</span>
        )}
        {sources.length === 0 && !isDefault && (
          <span style={{ color: "#555", fontSize: 10, fontStyle: "italic" }}>No disponible actualmente</span>
        )}
        {sources.map(s => (
          <span key={s} style={{
            background: owned ? "#1a2a1a" : "#151525",
            border: `1px solid ${owned ? "#3ddc8433" : rc + "22"}`,
            color: owned ? "#3ddc84" : "#a8a8c0",
            fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
          }}>{humanizeSource(s)}</span>
        ))}
      </div>

      {/* Equip button — only for owned */}
      {owned && (
        <button
          disabled={busy}
          onClick={onEquipToggle}
          style={{
            width: "100%", padding: "9px", borderRadius: 8,
            border: isEquipped ? "1px solid #e3573f44" : "none",
            cursor: busy ? "not-allowed" : "pointer",
            background: busy
              ? "rgba(255,255,255,0.05)"
              : isEquipped
              ? "rgba(227,87,63,0.12)"
              : `linear-gradient(135deg,${rc}dd,${rc}99)`,
            color: isEquipped ? "#e3573f" : "#0a0a12",
            fontSize: 11, fontWeight: 800,
            opacity: busy ? 0.6 : 1,
            transition: "all 0.2s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {busy ? (
            <>
              <span style={{
                display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                border: "2px solid #888", borderTopColor: "#e8b84b",
                animation: "vex-spin 0.7s linear infinite",
              }} />
              Aplicando…
            </>
          ) : isEquipped ? (
            "✕ Desequipar"
          ) : (
            "✓ Equipar"
          )}
        </button>
      )}

      {/* Not owned CTA */}
      {!owned && (
        <div style={{
          borderTop: "1px solid #1a1a2a", paddingTop: 10, marginTop: 2,
          fontSize: 11, color: "#555", textAlign: "center",
        }}>
          {sources.length > 0 ? `Obtén en: ${humanizeSource(sources[0])}` : "No disponible aún"}
        </div>
      )}
    </div>
  );
}

// ─── Expanded Detail Drawer ───────────────────────────────────────────────────
function DetailDrawer({
  c, owned, isEquipped, isPending, equipping, onEquipToggle, onClose,
}: {
  c: Cosmetic;
  owned: boolean;
  isEquipped: boolean;
  isPending: boolean;
  equipping: boolean;
  onEquipToggle: () => void;
  onClose: () => void;
}) {
  const rc = RARITY_COLOR[c.rarity] ?? "#888";
  const sources = c.obtainable_via ?? [];
  const isDefault = c.metadata?.default === true;
  const busy = equipping && isPending;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "linear-gradient(180deg,#0e0e1a 0%,#12121f 100%)",
      border: "1px solid rgba(232,184,75,0.2)",
      borderBottom: "none",
      borderRadius: "20px 20px 0 0",
      padding: "20px 24px 48px",
      boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
      animation: "slideUp 0.25s ease",
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Drag handle + close */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ width: 40, height: 4, background: "#2a2a3a", borderRadius: 2, margin: "0 auto" }} />
        <button onClick={onClose} style={{
          position: "absolute", right: 20, top: 16,
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid #2a2a3a", background: "#12121f",
          color: "#666", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", maxWidth: 600, margin: "0 auto" }}>
        {/* Preview */}
        <div style={{ width: 100, flexShrink: 0 }}>
          <CosmeticPreview cosmetic={c} rarityColor={rc} size="detail" />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 18, fontWeight: 700,
            }}>{c.name}</span>
            {isEquipped && (
              <span style={{
                background: "#e8b84b", borderRadius: 6, padding: "2px 8px",
                fontSize: 9, fontWeight: 800, color: "#0a0a12",
              }}>EQUIPADO</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <span style={{
              color: rc, fontSize: 10, fontWeight: 800,
              background: rc + "22", borderRadius: 8, padding: "2px 8px",
            }}>{(RARITY_LABEL[c.rarity] ?? c.rarity).toUpperCase()}</span>
            <span style={{
              color: "#888", fontSize: 10, fontWeight: 700,
              background: "#1a1a2a", borderRadius: 8, padding: "2px 8px",
            }}>{TYPE_ICON[c.cosmetic_type]} {TYPE_LABEL[c.cosmetic_type] ?? c.cosmetic_type}</span>
          </div>

          <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            {c.description}
          </p>

          {/* Sources */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 6, fontWeight: 700 }}>
              Cómo obtener
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {isDefault && (
                <span style={{
                  background: "#e8b84b22", border: "1px solid #e8b84b55",
                  color: "#e8b84b", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10,
                }}>Obsequio inicial</span>
              )}
              {sources.map(s => (
                <span key={s} style={{
                  background: "#1a1a2a", border: `1px solid ${rc}33`,
                  color: "#c8c8d0", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 10,
                }}>{humanizeSource(s)}</span>
              ))}
              {sources.length === 0 && !isDefault && (
                <span style={{ color: "#555", fontSize: 10 }}>No disponible actualmente</span>
              )}
            </div>
          </div>

          {/* CTA */}
          {owned ? (
            <button
              disabled={busy}
              onClick={onEquipToggle}
              style={{
                padding: "12px 32px", borderRadius: 10,
                border: isEquipped ? "1px solid #e3573f44" : "none",
                cursor: busy ? "not-allowed" : "pointer",
                background: busy
                  ? "rgba(255,255,255,0.05)"
                  : isEquipped
                  ? "rgba(227,87,63,0.15)"
                  : `linear-gradient(135deg,${rc},${rc}aa)`,
                color: isEquipped ? "#e3573f" : "#0a0a12",
                fontSize: 14, fontWeight: 800,
                fontFamily: "Cinzel,serif",
                opacity: busy ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {busy ? (
                <>
                  <span style={{
                    display: "inline-block", width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid #888", borderTopColor: "#e8b84b",
                    animation: "vex-spin 0.7s linear infinite",
                  }} />
                  Aplicando…
                </>
              ) : isEquipped ? "✕ Desequipar" : "✓ Equipar"}
            </button>
          ) : (
            <div style={{
              background: "#1a1a2a", borderRadius: 10, padding: "12px 16px",
              color: "#666", fontSize: 13, textAlign: "center",
            }}>
              No disponible en tu colección aún
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export function CosmeticsRoute() {
  const { catalog, myCosmetics, equipping, equipMsg, equip, unequip, reload } = useCosmetics();
  const [typeFilter, setTypeFilter] = useState("all");
  const [tabFilter, setTabFilter]   = useState<"catalog" | "mine">("catalog");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId]   = useState<string | null>(null);  // Z.1: optimistic pending
  const { addToast } = useToast();

  // Show toast on equip result
  useEffect(() => {
    if (!equipMsg) return;
    if (equipMsg.includes("equipado") || equipMsg.includes("desequipado"))
      addToast("success", equipMsg);
    else
      addToast("error", "Error de cosmético", equipMsg);
    setPendingId(null);
  }, [equipMsg]); // eslint-disable-line

  const cosmetics   = catalog.data ?? [];
  const myCosm      = myCosmetics.data ?? [];
  const mine        = useMemo(() => new Set(myCosm.map(c => c.cosmetic_id)), [myCosm]);
  const equippedSet = useMemo(() => new Set(myCosm.filter(c => c.equipped).map(c => c.cosmetic_id)), [myCosm]);

  // Build slot → Cosmetic map for LoadoutPanel
  const equippedMap = useMemo(() => {
    const m = new Map<string, Cosmetic>();
    for (const pc of myCosm.filter(c => c.equipped)) {
      const full = cosmetics.find(c => c.id === pc.cosmetic_id);
      if (full) m.set(full.cosmetic_type, full);
    }
    return m;
  }, [myCosm, cosmetics]);

  const loading = catalog.status === "loading";
  const blocked = myCosmetics.status === "blocked_auth";
  const error   = catalog.status === "ready" && !catalog.data
    ? (catalog as any).reason ?? "Error al cargar cosméticos"
    : null;

  // Filter pipeline
  const types = ["all", ...Array.from(new Set(cosmetics.map(c => c.cosmetic_type))).sort()];

  const filtered = useMemo(() => {
    let list = cosmetics;
    if (tabFilter === "mine") list = list.filter(c => mine.has(c.id));
    if (typeFilter !== "all") list = list.filter(c => c.cosmetic_type === typeFilter);
    // Sort: equipped first → owned → unowned; then by rarity weight
    const rarityWeight: Record<string, number> = {
      Mythic: 5, Legendary: 4, Epic: 3, Rare: 2, Uncommon: 1, Common: 0,
    };
    return [...list].sort((a, b) => {
      const ae = equippedSet.has(a.id) ? 2 : mine.has(a.id) ? 1 : 0;
      const be = equippedSet.has(b.id) ? 2 : mine.has(b.id) ? 1 : 0;
      if (ae !== be) return be - ae;
      return (rarityWeight[b.rarity] ?? 0) - (rarityWeight[a.rarity] ?? 0);
    });
  }, [cosmetics, tabFilter, typeFilter, mine, equippedSet]);

  const selectedCosmetic = selectedId ? cosmetics.find(c => c.id === selectedId) ?? null : null;

  // Z.1: optimistic equip toggle — marks pending immediately, server confirms via reload
  const handleEquipToggle = useCallback(async (c: Cosmetic) => {
    setPendingId(c.id);
    if (equippedSet.has(c.id)) await unequip(c.id);
    else await equip(c.id, c.cosmetic_type);
  }, [equippedSet, equip, unequip]);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px", paddingBottom: 120 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.14em", color: "#e8b84b",
            textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif",
            fontWeight: 700, marginBottom: 8,
          }}>─── Personalización ───</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>
              ✨ Cosméticos
            </h1>
            <button onClick={reload} style={{
              padding: "7px 18px", borderRadius: 8,
              border: "1px solid #2a2a3a", background: "transparent",
              color: "#888", fontSize: 11, cursor: "pointer",
            }}>↻ Actualizar</button>
          </div>
          <p style={{ color: "#666", margin: 0, fontSize: 12 }}>
            Marcos, tableros, avatares y más. Personaliza tu experiencia sin afectar el gameplay.
          </p>
        </div>

        {blocked && <BlockedAuthState message="Inicia sesión para ver tu colección de cosméticos." />}

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: cosmetics.length, color: "#e8e8f0" },
            { label: "Mi Colección", value: mine.size, color: "#3ddc84" },
            { label: "Equipados", value: equippedSet.size, color: "#e8b84b" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#12121a", border: "1px solid #2a2a3e",
              borderRadius: 10, padding: "10px 18px",
            }}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: 18 }}>{s.value}</div>
              <div style={{ color: "#555", fontSize: 10 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* ── Z.1: Loadout Panel ── */}
        {!blocked && (
          <LoadoutPanel
            cosmetics={cosmetics}
            equippedIds={equippedSet}
            equippedMap={equippedMap}
            onSlotClick={slot => { setTypeFilter(slot); setTabFilter("mine"); }}
            pendingUnequip={pendingId}
            onUnequip={id => {
              const c = cosmetics.find(x => x.id === id);
              if (c) handleEquipToggle(c);
            }}
          />
        )}

        {/* ── Z.1: Tab filter ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {([
            { key: "catalog", label: `Catálogo (${cosmetics.length})` },
            { key: "mine",    label: `Mi Colección (${mine.size})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTabFilter(t.key)} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "Rajdhani,sans-serif",
              border: tabFilter === t.key ? "1px solid #e8b84b" : "1px solid #2a2a3a",
              background: tabFilter === t.key ? "rgba(232,184,75,0.12)" : "transparent",
              color: tabFilter === t.key ? "#e8b84b" : "#666",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Type filter pills ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: "5px 14px", borderRadius: 16, border: "none",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: typeFilter === t ? "#e8b84b" : "#1a1a2e",
              color: typeFilter === t ? "#0a0a12" : "#666",
              transition: "all 0.15s",
            }}>
              {t === "all" ? "Todos" : `${TYPE_ICON[t] ?? "✨"} ${TYPE_LABEL[t] ?? t}`}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={tabFilter === "mine" ? "🎒" : "✨"}
            title={tabFilter === "mine" ? "Sin cosméticos en tu colección" : "Sin cosméticos"}
            description={
              tabFilter === "mine"
                ? "Obtén cosméticos abriendo packs, completando misiones o subiendo de rango."
                : typeFilter === "all"
                ? "No hay cosméticos disponibles."
                : `No hay cosméticos de tipo ${TYPE_LABEL[typeFilter] ?? typeFilter}.`
            }
            action={
              tabFilter === "mine"
                ? { label: "Ver catálogo completo", onClick: () => setTabFilter("catalog") }
                : typeFilter !== "all"
                ? { label: "Ver todos", onClick: () => setTypeFilter("all") }
                : undefined
            }
          />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 14,
          }}>
            {filtered.map(c => (
              <CosmeticCard
                key={c.id}
                c={c}
                owned={mine.has(c.id)}
                isEquipped={equippedSet.has(c.id)}
                isPending={pendingId === c.id}
                equipping={equipping}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                onEquipToggle={e => { e.stopPropagation(); handleEquipToggle(c); }}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Z.1: Detail Drawer (bottom sheet) ── */}
      {selectedCosmetic && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedId(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 199,
              background: "rgba(0,0,0,0.55)",
            }}
          />
          <DetailDrawer
            c={selectedCosmetic}
            owned={mine.has(selectedCosmetic.id)}
            isEquipped={equippedSet.has(selectedCosmetic.id)}
            isPending={pendingId === selectedCosmetic.id}
            equipping={equipping}
            onEquipToggle={() => handleEquipToggle(selectedCosmetic)}
            onClose={() => setSelectedId(null)}
          />
        </>
      )}
    </>
  );
}
