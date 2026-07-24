// PacksRoute v4.0 — chat91 AP.3: grantShardsForDuplicate integrado post-apertura
// Base: v3.0 chat72 P.2 (catalog from vexforge_pack_catalog)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePacks } from "../domains/packs/usePacks";
import type { CatalogPack } from "../domains/packs/repository";
import { PackOpenSequence, type PackVisualData } from "../components/PackOpenSequence";
import { PageLoader } from "../shared/components/PageLoader";
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
    icon: "🌱", name: "Seed Pack",
    color: "#3ddc84",
    glow: "rgba(61,220,132,0.45)",
    gradient: "linear-gradient(135deg,#1a3d28,#0f1f16)",
  },
  scout_pack: {
    icon: "🧭", name: "Scout Pack",
    color: "#4dabf7",
    glow: "rgba(77,171,247,0.45)",
    gradient: "linear-gradient(135deg,#132a3d,#0c1720)",
  },
  expedition_pack: {
    icon: "🗺️", name: "Expedition Pack",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.5)",
    gradient: "linear-gradient(135deg,#2a1640,#160c28)",
  },
  forge_pack: {
    icon: "⚒️", name: "Forge Pack",
    color: "#e8b84b",
    glow: "rgba(232,184,75,0.55)",
    gradient: "linear-gradient(135deg,#3a2a08,#1e1504)",
  },
  founder_pack: {
    icon: "👑", name: "Founder Pack",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.6)",
    gradient: "linear-gradient(135deg,#3a0f1a,#1e070d)",
  },
};

const FALLBACK_TIERS: PackVisualData[] = [
  { icon: "📦", name: "Pack", color: "#3ddc84", glow: "rgba(61,220,132,0.45)", gradient: "linear-gradient(135deg,#1a3d28,#0f1f16)" },
  { icon: "💎", name: "Pack", color: "#4dabf7", glow: "rgba(77,171,247,0.45)", gradient: "linear-gradient(135deg,#132a3d,#0c1720)" },
  { icon: "🔮", name: "Pack", color: "#a855f7", glow: "rgba(168,85,247,0.5)",  gradient: "linear-gradient(135deg,#2a1640,#160c28)" },
  { icon: "⚡", name: "Pack", color: "#e8b84b", glow: "rgba(232,184,75,0.55)", gradient: "linear-gradient(135deg,#3a2a08,#1e1504)" },
  { icon: "👑", name: "Pack", color: "#f43f5e", glow: "rgba(244,63,94,0.6)",   gradient: "linear-gradient(135deg,#3a0f1a,#1e070d)" },
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
  return (
    <div style={{
      background: visual.gradient, borderRadius: 16,
      border: `1.5px solid ${c}44`, padding: "28px 24px",
      display: "flex", flexDirection: "column", gap: 14, position: "relative",
      boxShadow: `0 0 32px ${visual.glow}, 0 4px 24px rgba(0,0,0,0.6)`,
      transition: "transform 0.2s", cursor: "default",
    }}>
      <div style={{ fontSize: 48, textAlign: "center" }}>{visual.icon}</div>
      <div style={{ textAlign: "center" }}>
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
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(pack.rarity_weights).map(([rarity, pct]) => (
            <span key={rarity} style={{
              fontSize: 9, fontFamily: "Rajdhani,sans-serif", fontWeight: 700,
              background: "rgba(255,255,255,.06)", borderRadius: 4, padding: "2px 7px",
              color: "#9a9ab0", textTransform: "uppercase",
            }}>{rarity} {pct}%</span>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${c}22`, paddingTop: 14 }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "Cinzel,serif", color: c, fontSize: 20, fontWeight: 800 }}>
            {pack.price_vex.toLocaleString()}
          </span>
          <span style={{ color: "#666", fontSize: 11 }}> VEX</span>
        </div>
        <button
          onClick={() => onBuy(pack.pack_key)}
          disabled={buying || !canAfford}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10,
            background: canAfford
              ? `linear-gradient(135deg,${c}cc,${c}88)`
              : "rgba(255,255,255,.06)",
            border: `1px solid ${canAfford ? c : "rgba(255,255,255,.1)"}`,
            color: canAfford ? "#0a0a12" : "#555577",
            fontFamily: "Cinzel,serif", fontWeight: 700, fontSize: 13,
            cursor: buying || !canAfford ? "not-allowed" : "pointer",
            opacity: buying ? 0.7 : 1,
            transition: "all .2s",
          }}
        >
          {buying ? "Comprando…" : canAfford ? "Comprar Pack" : "VEX insuficiente"}
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
          💎 +{total.toLocaleString()} Fragmentos
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
        // Fire-and-forget upserts per rarity (client-side, no RPC needed)
        await Promise.all(
          dupeEntries.map(([rarity, pts]) => grantShardsForDuplicate(rarity, pts))
        );
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
              📦 Tienda de Packs
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
            {opening ? "Abriendo…" : "🎴 ¡Abrir Pack!"}
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
      <p style={{ textAlign: "center", color: "#333", fontSize: 11, marginTop: 32 }}>
        Gana VEX ganando batallas PvP, misiones diarias y eventos de temporada.
      </p>
    </main>
  );
}

export { PacksRoute };
