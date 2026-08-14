// PacksRoute v4.0 — chat91 AP.3: grantShardsForDuplicate integrado post-apertura
// Base: v3.0 chat72 P.2 (catalog from vexforge_pack_catalog)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePacks } from "../domains/packs/usePacks";
import type { CatalogPack } from "../domains/packs/repository";
import { PackOpenSequence, type PackVisualData } from "../components/PackOpenSequence";
import { PageLoader } from "../shared/components/PageLoader";
import { ForgeIcon, type ForgeIconName } from "../shared/components/ForgeIcon";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import {
  grantShardsForDuplicate,
  getOwnedCardIds,
  SHARD_VALUES,
} from "../domains/packs/shardsRepository";
import { getCurrentPlayerId } from "../domains/cosmetics/repository";
import { AudioEngine } from "../lib/audioEngine";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_packs.jpg";

// ─── Visual mapping ───────────────────────────────────────────────────────────
const VISUAL_BY_KEY: Record<string, PackVisualData> = {
  seed_pack: {
    icon: "progress" as ForgeIconName, name: "Seed Pack",
    color: "#3ddc84",
    glow: "rgba(61,220,132,0.45)",
    gradient: "linear-gradient(135deg,#1a3d28,#0f1f16)",
  },
  scout_pack: {
    icon: "target" as ForgeIconName, name: "Scout Pack",
    color: "#4dabf7",
    glow: "rgba(77,171,247,0.45)",
    gradient: "linear-gradient(135deg,#132a3d,#0c1720)",
  },
  expedition_pack: {
    icon: "missions" as ForgeIconName, name: "Expedition Pack",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.5)",
    gradient: "linear-gradient(135deg,#2a1640,#160c28)",
  },
  forge_pack: {
    icon: "fusion" as ForgeIconName, name: "Forge Pack",
    color: "#e8b84b",
    glow: "rgba(232,184,75,0.55)",
    gradient: "linear-gradient(135deg,#3a2a08,#1e1504)",
  },
  founder_pack: {
    icon: "crown" as ForgeIconName, name: "Founder Pack",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.6)",
    gradient: "linear-gradient(135deg,#3a0f1a,#1e070d)",
  },
};

const FALLBACK_TIERS: PackVisualData[] = [
  { icon: "packs" as ForgeIconName, name: "Pack", color: "#3ddc84", glow: "rgba(61,220,132,0.45)", gradient: "linear-gradient(135deg,#1a3d28,#0f1f16)" },
  { icon: "cards" as ForgeIconName, name: "Pack", color: "#4dabf7", glow: "rgba(77,171,247,0.45)", gradient: "linear-gradient(135deg,#132a3d,#0c1720)" },
  { icon: "relics" as ForgeIconName, name: "Pack", color: "#a855f7", glow: "rgba(168,85,247,0.5)",  gradient: "linear-gradient(135deg,#2a1640,#160c28)" },
  { icon: "energy" as ForgeIconName, name: "Pack", color: "#e8b84b", glow: "rgba(232,184,75,0.55)", gradient: "linear-gradient(135deg,#3a2a08,#1e1504)" },
  { icon: "crown" as ForgeIconName, name: "Pack", color: "#f43f5e", glow: "rgba(244,63,94,0.6)",   gradient: "linear-gradient(135deg,#3a0f1a,#1e070d)" },
];

function visualFor(pack: CatalogPack): PackVisualData {
  const known = VISUAL_BY_KEY[pack.pack_key];
  if (known) return { ...known, name: pack.pack_name };
  const price = pack.price_vex;
  const idx = price < 300 ? 0 : price < 750 ? 1 : price < 1500 ? 2 : price < 3500 ? 3 : 4;
  return { ...FALLBACK_TIERS[idx], name: pack.pack_name };
}

// ─── Pack Card ────────────────────────────────────────────────────────────────
function PackCard({
  pack, visual, vexBalance, onBuy, buying,
}: {
  pack: CatalogPack; visual: PackVisualData;
  vexBalance: number; onBuy: (key: string) => void; buying: boolean;
}) {
  const canAfford = vexBalance >= pack.price_vex;
  const c = visual.color;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: visual.gradient, borderRadius: 16,
        border: `1.5px solid ${hovered ? c + "88" : c + "44"}`,
        padding: "28px 24px",
        display: "flex", flexDirection: "column", gap: 14, position: "relative",
        overflow: "hidden",
        boxShadow: hovered
          ? `0 0 48px ${visual.glow}, 0 0 80px ${visual.glow.replace("0.45","0.2").replace("0.5","0.2").replace("0.55","0.2").replace("0.6","0.2")}, 0 8px 32px rgba(0,0,0,0.7)`
          : `0 0 32px ${visual.glow}, 0 4px 24px rgba(0,0,0,0.6)`,
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        cursor: "default",
      }}>
      {/* Shimmer highlight on hover */}
      <div style={{
        position: "absolute", top: 0, left: "-60%", right: 0, bottom: 0, zIndex: 0,
        background: `linear-gradient(105deg, transparent 40%, ${c}10 50%, transparent 60%)`,
        transition: "opacity 0.3s",
        opacity: hovered ? 1 : 0,
        pointerEvents: "none",
        backgroundSize: "200% 100%",
      }} />
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
        opacity: hovered ? 1 : 0.4,
        transition: "opacity 0.3s",
      }} />

      <div style={{ fontSize: hovered ? 56 : 48, textAlign: "center", position: "relative", zIndex: 1,
        transition: "font-size 0.25s ease",
        filter: hovered ? `drop-shadow(0 0 16px ${c})` : "none",
      }}>{visual.icon}</div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <h3 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", margin: "0 0 4px", fontSize: 16 }}>
          {visual.name}
        </h3>
        <p style={{ color: "#888", fontSize: 11, margin: "0 0 8px" }}>
          {pack.card_count} cartas por pack
        </p>
        {pack.notes && (
          <p style={{ color: c, fontSize: 10, margin: 0, fontFamily: "Rajdhani,sans-serif" }}>
            {pack.notes}
          </p>
        )}
      </div>

      {/* Rarity weights */}
      {pack.rarity_weights && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
          {Object.entries(pack.rarity_weights).map(([rarity, pct]) => (
            <span key={rarity} style={{
              fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
              background: "rgba(255,255,255,.06)", borderRadius: 4, padding: "2px 7px",
              color: "#9a9ab0", textTransform: "uppercase",
            }}>{rarity} {pct}%</span>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${c}22`, paddingTop: 14, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{
            fontFamily: "Cinzel,serif", color: c, fontSize: 20, fontWeight: 800,
            textShadow: hovered ? `0 0 16px ${c}` : "none",
            transition: "text-shadow 0.25s",
          }}>
            {pack.price_vex.toLocaleString()}
          </span>
          <span style={{ color: "#666", fontSize: 11 }}> VEX</span>
        </div>
        <button
          onClick={() => onBuy(pack.pack_key)}
          disabled={buying || !canAfford}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10,
            background: canAfford
              ? `linear-gradient(135deg,${c}dd,${c}99)`
              : "rgba(255,255,255,.06)",
            border: `1px solid ${canAfford ? c : "rgba(255,255,255,.1)"}`,
            color: canAfford ? "#0a0a12" : "#555577",
            fontFamily: "Cinzel,serif", fontWeight: 700, fontSize: 13,
            cursor: buying || !canAfford ? "not-allowed" : "pointer",
            opacity: buying ? 0.7 : 1,
            transition: "all .2s",
            boxShadow: canAfford && hovered ? `0 0 20px ${c}55` : "none",
          }}
        >
          {buying ? "Comprando…" : canAfford ? <><ForgeIcon name="fusion" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Comprar Pack</> : "VEX insuficiente"}
        </button>
        {!canAfford && (
          <p style={{ textAlign: "center", color: "#444466", fontSize: 9,
            fontFamily: "Rajdhani,sans-serif", margin: "6px 0 0" }}>
            Necesitas {(pack.price_vex - vexBalance).toLocaleString()} VEX más
          </p>
        )}
      </div>
    </div>
  );
}

// ─── AP.3 — Shards Gained Summary ────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  Common: "#9ca3af", Uncommon: "#22c55e", Rare: "#60a5fa",
  Epic: "#a78bfa", Legendary: "#f59e0b", Mythic: "#ef4444",
};

function ShardsGainedToast({ gained }: { gained: Record<string, number> }) {
  const entries = Object.entries(gained).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div style={{
      maxWidth: 900, margin: "0 auto 20px",
      padding: "14px 18px", borderRadius: 12,
      background: "linear-gradient(135deg,rgba(167,139,250,.12),rgba(96,165,250,.08))",
      border: "1px solid rgba(167,139,250,.35)",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>
          <ForgeIcon name="spark" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />+{total.toLocaleString()} Fragmentos
        </div>
        <div style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 10, color: "#7a7a9a", marginTop: 2 }}>
          Ganados por cartas duplicadas
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {entries.map(([rarity, pts]) => (
          <span key={rarity} style={{
            background: (RARITY_COLOR[rarity] ?? "#a78bfa") + "18",
            border: `1px solid ${(RARITY_COLOR[rarity] ?? "#a78bfa")}44`,
            borderRadius: 6, padding: "4px 10px",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 10,
            color: RARITY_COLOR[rarity] ?? "#a78bfa",
          }}>+{pts} ({rarity})</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────
function PacksRoute() {
  const navigate = useNavigate();
  const {
    vexBalance, loading, authed, catalog, catalogError,
    buying, buyError, pendingOrderId,
    opening, openError, openedCards,
    buyWithVex, openOrder, clearOpenedCards,
  } = usePacks();

  const [selectedPackKey, setSelectedPackKey] = useState<string | null>(null);
  const [notification,    setNotification]    = useState<string | null>(null);
  const [shardsGained,    setShardsGained]    = useState<Record<string, number>>({});
  // Pity timer: track packs opened without a Legendary/Mythic drop
  const [pityCount, setPityCount] = useState<number>(() => {
    try { return Number(localStorage.getItem("vex_pity_counter") ?? "0"); } catch { return 0; }
  });
  const PITY_THRESHOLD = 10; // guaranteed Legendary/Mythic within 10 packs

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleBuy(packKey: string) {
    setSelectedPackKey(packKey);
    try { AudioEngine.sfxCardSelect(); } catch {}
    const res = await buyWithVex(packKey);
    if (!res.ok) {
      notify(res.reason ?? "Error al comprar el pack.");
      setSelectedPackKey(null);
    } else {
      notify("Pack comprado — ábrelo ahora.");
    }
  }

  // AP.3 — Pre-fetch owned cards → detect duplicates → grant shards post-apertura
  async function handleOpen() {
    if (!pendingOrderId) return;

    // Step 1: snapshot owned card IDs before the pack opens
    const playerId = await getCurrentPlayerId();
    const ownedIds = playerId
      ? new Set(await getOwnedCardIds(playerId))
      : new Set<string>();

    // Step 2: open the pack
    const res = await openOrder(pendingOrderId);
    if (!res.ok) {
      notify(res.reason ?? "Error al abrir el pack.");
      return;
    }

    // Step 3: detect duplicates and grant shards
    try { AudioEngine.sfxPackOpen(); } catch {}
    if (res.cards && playerId) {
      // Pity timer: check if any Legendary/Mythic dropped
      const hasHighRarity = res.cards.some(c => ["Legendary", "Mythic"].includes(c.rarity));
      const newPity = hasHighRarity ? 0 : pityCount + 1;
      setPityCount(newPity);
      try { localStorage.setItem("vex_pity_counter", String(newPity)); } catch {}

      const dupesByRarity: Record<string, number> = {};
      for (const card of res.cards) {
        if (ownedIds.has(card.id)) {
          const grant = SHARD_VALUES[card.rarity]?.grant ?? 0;
          if (grant > 0) {
            dupesByRarity[card.rarity] = (dupesByRarity[card.rarity] ?? 0) + grant;
          }
        }
      }
      const dupeEntries = Object.entries(dupesByRarity);
      if (dupeEntries.length > 0) {
        // Grant shards for duplicates — catch per-rarity so one failure doesn't block others
        const results = await Promise.allSettled(
          dupeEntries.map(([rarity, pts]) => grantShardsForDuplicate(rarity, pts))
        );
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.warn("[PacksRoute] grantShardsForDuplicate failed for", dupeEntries[i][0], r.reason);
          }
        });
        setShardsGained(dupesByRarity);
      } else {
        setShardsGained({});
      }
    }
  }

  function handleDismiss() {
    clearOpenedCards();
    setSelectedPackKey(null);
    setShardsGained({});
  }

  const selectedPack     = catalog.find(p => p.pack_key === selectedPackKey) ?? catalog[0];
  const currentPackVisual = selectedPack ? visualFor(selectedPack) : FALLBACK_TIERS[0];

  if (loading) return <PageLoader message="Cargando tienda de packs..." />;
  if (!authed) return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BlockedAuthState message="Inicia sesión para comprar y abrir packs de cartas." />
    </main>
  );

  return (
    <main style={{
      minHeight: "100vh",
      background: `linear-gradient(rgba(4,4,12,0.85),rgba(4,4,12,0.92)) center/cover, url('${BG_URL}') center/cover no-repeat`,
      padding: "28px 20px",
    }}>
      {/* Pack open sequence overlay */}
      {openedCards && (
        <PackOpenSequence
          cards={openedCards}
          packVisual={currentPackVisual}
          packKey={selectedPackKey ?? (selectedPack?.pack_key ?? "seed_pack")}
          onDismiss={handleDismiss}
          onInventory={() => { handleDismiss(); navigate("/inventory"); }}
          onOpenAnother={() => { clearOpenedCards(); setShardsGained({}); }}
        />
      )}

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 28, margin: "0 0 4px" }}>
              <ForgeIcon name="packs" size={21} style={{ verticalAlign: "middle", marginRight: 8 }} />Tienda de Packs
            </h1>
            <p style={{ color: "#666", margin: 0, fontSize: 12 }}>
              Compra packs con VEX y obtén nuevas cartas para tu colección.
            </p>
          </div>
          <div style={{ background: "#12121a", border: "1px solid #e8b84b33", borderRadius: 12, padding: "10px 20px", textAlign: "center" }}>
            <div style={{ color: "#e8b84b", fontFamily: "Cinzel,serif", fontSize: 20, fontWeight: 800 }}>
              {vexBalance.toLocaleString()}
            </div>
            <div style={{ color: "#666", fontSize: 10 }}>VEX disponible</div>
          </div>
        </div>
      </div>

      {/* AP.3 — Shards toast (shown after reveal, before dismiss) */}
      {Object.keys(shardsGained).length > 0 && !openedCards && (
        <ShardsGainedToast gained={shardsGained} />
      )}

      {/* Generic notifications */}
      {(notification || buyError || openError || catalogError) && (
        <div style={{
          maxWidth: 900, margin: "0 auto 20px",
          padding: "12px 18px", borderRadius: 10,
          background: buyError || openError || catalogError
            ? "rgba(227,87,63,0.12)" : "rgba(61,220,132,0.1)",
          border: `1px solid ${buyError || openError || catalogError ? "#e3573f44" : "#3ddc8444"}`,
          color: buyError || openError || catalogError ? "#e3573f" : "#3ddc84",
          fontSize: 13,
        }}>
          {buyError || openError || catalogError || notification}
        </div>
      )}

      {/* Pity timer display */}
      {pityCount > 0 && pityCount >= Math.floor(PITY_THRESHOLD * 0.6) && (
        <div style={{
          maxWidth: 900, margin: "0 auto 16px",
          padding: "10px 16px", borderRadius: 10,
          background: pityCount >= PITY_THRESHOLD - 1
            ? "rgba(232,184,75,0.18)"
            : "rgba(168,85,247,0.10)",
          border: `1px solid ${pityCount >= PITY_THRESHOLD - 1 ? "#e8b84b66" : "#a855f744"}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 20 }}>
            {pityCount >= PITY_THRESHOLD - 1 ? <ForgeIcon name="trophy" size={20} /> : <ForgeIcon name="target" size={20} />}
          </div>
          <div>
            <div style={{
              fontFamily: "Cinzel,serif", fontSize: 12, fontWeight: 700,
              color: pityCount >= PITY_THRESHOLD - 1 ? "#e8b84b" : "#a855f7",
            }}>
              {pityCount >= PITY_THRESHOLD - 1
                ? "¡Garantía activada! Próximo pack contiene Legendary o Mythic"
                : `Garantía de rareza: ${pityCount}/${PITY_THRESHOLD} packs`}
            </div>
            <div style={{ marginTop: 4, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", maxWidth: 280 }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (pityCount / PITY_THRESHOLD) * 100)}%`,
                background: pityCount >= PITY_THRESHOLD - 1
                  ? "linear-gradient(90deg,#e8b84b,#f0c050)"
                  : "linear-gradient(90deg,#a855f7,#c084fc)",
                borderRadius: 2, transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Pending open button */}
      {pendingOrderId && !openedCards && (
        <div style={{ maxWidth: 900, margin: "0 auto 24px", textAlign: "center" }}>
          <button
            onClick={handleOpen}
            disabled={opening}
            style={{
              padding: "14px clamp(20px,8vw,48px)", borderRadius: 12,
              background: "linear-gradient(135deg,#e8b84b,#c9901f)",
              border: "none", color: "#0a0a12",
              fontFamily: "Cinzel,serif", fontSize: 16, fontWeight: 800,
              cursor: opening ? "not-allowed" : "pointer",
              boxShadow: "0 0 32px rgba(232,184,75,0.4)", opacity: opening ? 0.7 : 1,
            }}
          >
            {opening ? "Abriendo…" : <><ForgeIcon name="packs" size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />¡Abrir Pack!</>}
          </button>
        </div>
      )}

      {/* Pack catalog */}
      {catalog.length === 0 ? (
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", color: "#666", padding: "60px 20px" }}>
          No hay packs disponibles en este momento.
        </div>
      ) : (
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))", gap: 20,
        }}>
          {catalog.map(pack => (
            <PackCard
              key={pack.pack_key}
              pack={pack}
              visual={visualFor(pack)}
              vexBalance={vexBalance}
              onBuy={handleBuy}
              buying={buying && selectedPackKey === pack.pack_key}
            />
          ))}
        </div>
      )}

      {/* Balance tip */}
      <p style={{ textAlign: "center", color: "#4a4a6a", fontSize: 11, marginTop: 32 }}>
        Gana VEX ganando batallas PvP, misiones diarias y eventos de temporada.
      </p>
    </main>
  );
}

export { PacksRoute };
