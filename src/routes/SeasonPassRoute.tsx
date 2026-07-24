import { useState, useCallback, useEffect, useRef } from "react";
import { useSeason } from "../domains/season/useSeason";
import type { SeasonTier, SeasonPassOrderData } from "../domains/season/repository";
import {
  claimSeasonTierReward,
  claimAllUnlockedTiers,
  createSeasonPassOrder,
  submitSeasonPassPayment,
  getMyPendingSeasonPassOrder,
} from "../domains/season/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { useToast } from "../shared/context/ToastContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};
const PREMIUM_PRICE_USDT = 9.99;

function rewardIcon(reward: Record<string, any>): string {
  if (reward.type === "card")     return "🃏";
  if (reward.type === "cosmetic") return "✨";
  if (reward.vex_ingame)          return "💰";
  if (reward.xp)                  return "⭐";
  return "🎁";
}

function rewardLabel(reward: Record<string, any>): string | null {
  if (reward.vex_ingame)          return `${reward.vex_ingame} VEX`;
  if (reward.card_rarity)         return reward.card_rarity;
  if (reward.type === "cosmetic") return "Cosm. Excl.";
  if (reward.xp)                  return `+${reward.xp} XP`;
  return null;
}

// ─── XP Section ──────────────────────────────────────────────────────────────
function XpSection({ playerXp, currentTier, tiers }: {
  playerXp: number; currentTier: number; tiers: SeasonTier[];
}) {
  const sorted    = [...tiers].sort((a, b) => a.tier - b.tier);
  const maxXp     = sorted[sorted.length - 1]?.xp_required ?? 50000;
  const currT     = sorted.find(t => t.tier === currentTier);
  const nextT     = sorted.find(t => t.tier === currentTier + 1);
  const tierStart = currT?.xp_required ?? 0;
  const tierEnd   = nextT?.xp_required ?? maxXp;
  const xpInTier  = Math.max(0, playerXp - tierStart);
  const xpNeeded  = tierEnd - tierStart;
  const tierPct   = xpNeeded > 0 ? Math.min(100, (xpInTier / xpNeeded) * 100) : 100;
  const totalPct  = maxXp > 0 ? Math.min(100, (playerXp / maxXp) * 100) : 0;
  const isMaxed   = playerXp >= maxXp;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!isMaxed && nextT && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "#888", fontSize: 11 }}>Progreso al Tier {nextT.tier}</span>
            <span style={{ color: "#e8b84b", fontWeight: 700, fontSize: 11 }}>
              {xpInTier.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </span>
          </div>
          <div style={{ background: "#0f0f1a", borderRadius: 6, height: 10, overflow: "hidden", border: "1px solid #1a1a2e" }}>
            <div style={{ width: `${tierPct}%`, height: "100%", background: "linear-gradient(90deg,#4a9eff,#5B8BF5)", transition: "width .6s ease" }} />
          </div>
        </div>
      )}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "#555", fontSize: 10 }}>XP Total de Temporada</span>
          <span style={{ color: "#666", fontSize: 10 }}>{playerXp.toLocaleString()} / {maxXp.toLocaleString()}</span>
        </div>
        <div style={{ background: "#0f0f1a", borderRadius: 6, height: 6, overflow: "hidden", border: "1px solid #1a1a2e" }}>
          <div style={{ width: `${totalPct}%`, height: "100%", background: isMaxed ? "linear-gradient(90deg,#3ddc84,#2a9c60)" : "linear-gradient(90deg,#e8b84b,#c9901f)", transition: "width .5s ease" }} />
        </div>
        {isMaxed && <div style={{ color: "#3ddc84", fontSize: 10, marginTop: 4, textAlign: "right" }}>✓ Season Pass completado</div>}
      </div>
    </div>
  );
}

// ─── TierCard ────────────────────────────────────────────────────────────────
function TierCard({ tier, currentTier, isPremiumPlayer, claimed, pendingClaim, onClaim }: {
  tier: SeasonTier; currentTier: number; isPremiumPlayer: boolean;
  claimed: boolean; pendingClaim: boolean; onClaim: (t: number) => void;
}) {
  const isCurrent    = tier.tier === currentTier;
  const unlocked     = tier.unlocked;
  const isPremLocked = tier.is_premium && !isPremiumPlayer;
  const claimable    = unlocked && !claimed && !isPremLocked;
  const rc           = tier.reward.card_rarity ? (RARITY_COLOR[tier.reward.card_rarity] ?? "#888") : "#e8b84b";
  const label        = rewardLabel(tier.reward);

  return (
    <div style={{
      borderRadius: 10, padding: "10px 8px", textAlign: "center", position: "relative", overflow: "hidden",
      background: claimed ? "linear-gradient(145deg,#0a1a0a,#0a120a)" : unlocked ? "linear-gradient(145deg,#1a2a1a,#12121a)" : isCurrent ? "linear-gradient(145deg,#1a1a2e,#0f0f20)" : "#121220",
      border: claimable ? "1px solid rgba(232,184,75,0.7)" : claimed ? "1px solid rgba(61,220,132,0.25)" : isCurrent ? "1px solid rgba(232,184,75,0.5)" : unlocked ? "1px solid rgba(61,220,132,0.2)" : "1px solid #1e1e2e",
      boxShadow: claimable ? "0 0 12px rgba(232,184,75,0.15)" : "none",
      opacity: (!unlocked && !isCurrent && !isPremLocked) ? 0.55 : 1,
      transition: "all 0.2s",
      animation: claimable ? "tier-pulse 2s ease-in-out infinite" : "none",
    }}>
      <style>{`
        @keyframes tier-pulse { 0%,100% { box-shadow: 0 0 6px rgba(232,184,75,0.1); } 50% { box-shadow: 0 0 18px rgba(232,184,75,0.3); } }
        @keyframes tier-claim-spin { to { transform: rotate(360deg); } }
      `}</style>

      {isPremLocked && (
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(10,10,20,0.65)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <span style={{ fontSize: 16 }}>🔒</span>
        </div>
      )}

      <div style={{ color: isCurrent ? "#e8b84b" : claimed ? "#3ddc84" : unlocked ? "#3ddc84" : "#444", fontSize: 8, fontWeight: 700, fontFamily: "IBM Plex Mono,monospace", letterSpacing: "0.1em", marginBottom: 4 }}>T{tier.tier}</div>
      <div style={{ fontSize: 20, marginBottom: 2 }}>{rewardIcon(tier.reward)}</div>
      {label && <div style={{ color: tier.reward.card_rarity ? rc : "#e8b84b", fontSize: 8, fontWeight: 700, fontFamily: "Rajdhani,sans-serif", lineHeight: 1.2 }}>{label}</div>}
      {tier.is_premium && !isPremLocked && <div style={{ marginTop: 2, fontSize: 7, color: "#e8b84b", fontWeight: 800 }}>★</div>}
      {claimed && <div style={{ color: "#3ddc84", fontSize: 9, marginTop: 3, fontWeight: 700 }}>✓</div>}
      {!claimed && isCurrent && <div style={{ color: "#e8b84b", fontSize: 7, marginTop: 3, fontFamily: "IBM Plex Mono,monospace" }}>ACTUAL</div>}
      {claimable && (
        <button disabled={pendingClaim} onClick={e => { e.stopPropagation(); onClaim(tier.tier); }} style={{ marginTop: 5, width: "100%", padding: "4px 2px", borderRadius: 5, border: "none", background: pendingClaim ? "rgba(232,184,75,0.1)" : "#e8b84b", color: pendingClaim ? "#e8b84b" : "#0a0a12", fontSize: 8, fontWeight: 800, cursor: pendingClaim ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
          {pendingClaim ? <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #e8b84b44", borderTopColor: "#e8b84b", animation: "tier-claim-spin 0.7s linear infinite" }} /> : "Reclamar"}
        </button>
      )}
    </div>
  );
}

// ─── AO.3: Payment Modal ──────────────────────────────────────────────────────
function UpgradePaymentModal({
  order, txHash, setTxHash, payerWallet, setPayerWallet,
  submitting, onSubmit, onClose,
}: {
  order: SeasonPassOrderData;
  txHash: string; setTxHash: (v: string) => void;
  payerWallet: string; setPayerWallet: (v: string) => void;
  submitting: boolean; onSubmit: () => void; onClose: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #2a2a3a", background: "#0d0d14",
    color: "#e8e8f0", fontSize: 13, fontFamily: "IBM Plex Mono,monospace",
    boxSizing: "border-box",
  };

  function copyWallet() {
    if (order.treasury_wallet_address) {
      navigator.clipboard?.writeText(order.treasury_wallet_address).catch(() => {});
    }
  }

  const canSubmit = txHash.trim().length > 10 && payerWallet.trim().length > 10;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#12121f", border: "1px solid #2a2a3a", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", position: "relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ color: "#e8b84b", fontFamily: "Cinzel,serif", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>⭐ Activar Season Pass Premium</div>
        <div style={{ color: "#7a7a9a", fontSize: 12, marginBottom: 20 }}>Pago manual verificado por el equipo · Activación en 24–48h hábiles</div>

        {/* Step 1 */}
        <div style={{ background: "#0d0d14", border: "1px solid #1e1e30", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", fontFamily: "IBM Plex Mono,monospace", marginBottom: 10 }}>PASO 1 — ENVÍA EL PAGO</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#7a7a9a", fontSize: 11 }}>Monto exacto:</span>
            <span style={{ color: "#3DC96B", fontWeight: 800, fontSize: 14, fontFamily: "IBM Plex Mono,monospace" }}>${Number(order.price_usdt ?? PREMIUM_PRICE_USDT).toFixed(2)} {order.token_symbol ?? "USDT"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#7a7a9a", fontSize: 11 }}>Red:</span>
            <span style={{ color: "#e8e8f0", fontSize: 11, fontFamily: "IBM Plex Mono,monospace" }}>{order.chain ?? "BSC"} ({order.token_standard ?? "BEP-20"})</span>
          </div>
          <div style={{ color: "#7a7a9a", fontSize: 10, marginBottom: 6 }}>Dirección del tesoro:</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#0a0a12", border: "1px solid #2a2a3a", borderRadius: 7, padding: "8px 10px", fontSize: 11, color: "#4a9eff", fontFamily: "IBM Plex Mono,monospace", wordBreak: "break-all" }}>
              {order.treasury_wallet_address ?? "—"}
            </div>
            {order.treasury_wallet_address && (
              <button onClick={copyWallet} style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid #2a2a3a", background: "#1a1a2e", color: "#e8b84b", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>📋</button>
            )}
          </div>
          {!order.treasury_wallet_address && (
            <div style={{ color: "#E3573F", fontSize: 11, marginTop: 8 }}>⚠ No hay wallet de tesoro activa. Contacta al administrador.</div>
          )}
        </div>

        {/* Step 2 */}
        <div style={{ background: "#0d0d14", border: "1px solid #1e1e30", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", fontFamily: "IBM Plex Mono,monospace", marginBottom: 12 }}>PASO 2 — REGISTRA TU PAGO</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: "#7a7a9a", fontSize: 11, display: "block", marginBottom: 5 }}>Hash de la transacción (TX Hash) *</label>
            <input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." style={inputStyle} disabled={submitting} />
          </div>
          <div>
            <label style={{ color: "#7a7a9a", fontSize: 11, display: "block", marginBottom: 5 }}>Tu dirección de wallet (remitente) *</label>
            <input value={payerWallet} onChange={e => setPayerWallet(e.target.value)} placeholder="0x..." style={inputStyle} disabled={submitting} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #2a2a3a", background: "transparent", color: "#7a7a9a", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button
            onClick={onSubmit}
            disabled={submitting || !canSubmit || !order.treasury_wallet_address}
            style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: (!canSubmit || !order.treasury_wallet_address) ? "rgba(232,184,75,0.15)" : "linear-gradient(135deg,#e8b84b,#c9901f)", color: (!canSubmit || !order.treasury_wallet_address) ? "#e8b84b88" : "#0a0a12", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13, cursor: (!canSubmit || !order.treasury_wallet_address) ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Registrando..." : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PremiumUpgradeCard — AO.3 ────────────────────────────────────────────────
function PremiumUpgradeCard({
  isPremium, pendingOrder, onUpgrade, upgrading,
}: {
  isPremium: boolean;
  pendingOrder: { hasPending: boolean; txSubmitted?: boolean };
  onUpgrade: () => void;
  upgrading: boolean;
}) {
  if (isPremium) {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(232,184,75,0.08),rgba(232,184,75,0.04))", border: "1px solid rgba(232,184,75,0.3)", borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 32 }}>★</div>
        <div>
          <div style={{ color: "#e8b84b", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 16 }}>Pase Premium Activo</div>
          <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>Tienes acceso a todas las recompensas premium de esta temporada.</div>
        </div>
      </div>
    );
  }

  if (pendingOrder.hasPending && pendingOrder.txSubmitted) {
    return (
      <div style={{ background: "linear-gradient(135deg,#0e1a0e,#0d1210)", border: "1px solid rgba(61,201,107,0.35)", borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 28 }}>⏳</div>
        <div>
          <div style={{ color: "#3DC96B", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 15 }}>Pago en verificación</div>
          <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>Tu pago ha sido registrado y está siendo revisado. La activación ocurre en 24–48h hábiles una vez confirmado.</div>
        </div>
      </div>
    );
  }

  if (pendingOrder.hasPending && !pendingOrder.txSubmitted) {
    return (
      <div style={{ background: "linear-gradient(135deg,#0e0e1a,#12121f)", border: "1px solid rgba(232,184,75,0.3)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", fontFamily: "IBM Plex Mono,monospace", marginBottom: 8 }}>ORDEN PENDIENTE DE PAGO</div>
        <p style={{ color: "#888", fontSize: 12, margin: "0 0 14px", lineHeight: 1.6 }}>Ya tienes una orden creada para el Season Pass Premium. Regístrala para activarla.</p>
        <button onClick={onUpgrade} disabled={upgrading} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#e8b84b,#c9901f)", color: "#0a0a12", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          {upgrading ? "Cargando..." : "Registrar pago pendiente"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg,#0e0e1a,#12121f)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>⭐</span>
            <span style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 18, fontWeight: 800 }}>Season Pass Premium</span>
          </div>
          <p style={{ color: "#888", fontSize: 12, margin: "0 0 12px", lineHeight: 1.6 }}>
            Desbloquea recompensas exclusivas en cada tier — cartas legendarias, cosméticos únicos y VEX extra.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["🃏 Recompensas dobles", "✨ Cosméticos exclusivos", "💰 VEX extra por tier"].map(b => (
              <span key={b} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 8, padding: "3px 10px", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ color: "#3DC96B", fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 900 }}>${PREMIUM_PRICE_USDT.toFixed(2)}</div>
          <div style={{ color: "#666", fontSize: 10, marginBottom: 12 }}>USDT (BSC)</div>
          <button
            disabled={upgrading}
            onClick={onUpgrade}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: upgrading ? "rgba(168,85,247,0.2)" : "linear-gradient(135deg,#a855f7,#7c3aed)", color: upgrading ? "#a855f7" : "#fff", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13, cursor: upgrading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {upgrading ? <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid #a855f744", borderTopColor: "#a855f7", animation: "tier-claim-spin 0.7s linear infinite" }} /> : null}
            {upgrading ? "Procesando..." : "Obtener Premium"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SeasonPassRoute() {
  const { status, data, reload } = useSeason();
  const { addToast } = useToast();

  const [claimedSet,  setClaimedSet]  = useState<Set<number>>(new Set());
  const [claimingAll, setClaimingAll] = useState(false);
  const [upgrading,   setUpgrading]   = useState(false);
  const [showAll,     setShowAll]     = useState(false);

  // AO.3: payment modal state
  const [upgradeOrder, setUpgradeOrder] = useState<SeasonPassOrderData | null>(null);
  const [txHash,       setTxHash]       = useState("");
  const [payerWallet,  setPayerWallet]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    hasPending: boolean; txSubmitted?: boolean; orderId?: string; treasuryWallet?: string;
  }>({ hasPending: false });
  const pendingChecked = useRef(false);

  // Check for existing pending order on mount
  useEffect(() => {
    if (pendingChecked.current) return;
    pendingChecked.current = true;
    getMyPendingSeasonPassOrder().then(r => setPendingOrder(r));
  }, []);

  // ── Claim single tier ────────────────────────────────────────────────────
  const handleClaim = useCallback(async (tierNum: number) => {
    setClaimedSet(s => { const n = new Set(s); n.add(tierNum); return n; });
    const res = await claimSeasonTierReward(tierNum);
    if (res.status === "blocked_auth") {
      setClaimedSet(s => { const n = new Set(s); n.delete(tierNum); return n; });
      addToast("error", "Inicia sesión", "Inicia sesión para reclamar.");
      return;
    }
    if (res.data?.ok) {
      addToast("success", `Tier ${tierNum} reclamado`, "Recompensa añadida a tu inventario.");
      reload();
    } else {
      setClaimedSet(s => { const n = new Set(s); n.delete(tierNum); return n; });
      addToast("error", "Error al reclamar", res.data?.reason ?? "Inténtalo de nuevo.");
    }
  }, [addToast, reload]);

  // ── Claim all unlocked ───────────────────────────────────────────────────
  const handleClaimAll = useCallback(async () => {
    const tiers = data?.tiers ?? [];
    const isPremium = data?.is_premium ?? false;
    const unclaimed = tiers
      .filter(t => t.unlocked && !claimedSet.has(t.tier) && !(t.is_premium && !isPremium))
      .map(t => t.tier);
    if (unclaimed.length === 0) return;
    setClaimingAll(true);
    const { claimed, failed } = await claimAllUnlockedTiers(unclaimed);
    setClaimedSet(s => new Set([...s, ...claimed]));
    setClaimingAll(false);
    if (claimed.length > 0) {
      addToast("success", `${claimed.length} recompensa${claimed.length > 1 ? "s" : ""} reclamada${claimed.length > 1 ? "s" : ""}`, "");
      reload();
    }
    if (failed.length > 0) {
      addToast("error", `${failed.length} tier${failed.length > 1 ? "s" : ""} fallaron`, "Inténtalo de nuevo.");
    }
  }, [data, claimedSet, addToast, reload]);

  // ── AO.3: Open upgrade payment flow ─────────────────────────────────────
  const handleUpgrade = useCallback(async () => {
    setUpgrading(true);

    // If there's a pending order without TX, reload it and show modal
    if (pendingOrder.hasPending && !pendingOrder.txSubmitted && pendingOrder.orderId) {
      setUpgradeOrder({
        ok: true,
        order_id: pendingOrder.orderId,
        price_usdt: PREMIUM_PRICE_USDT,
        treasury_wallet_address: pendingOrder.treasuryWallet,
        chain: "BSC",
        token_symbol: "USDT",
        token_standard: "BEP-20",
      });
      setTxHash(""); setPayerWallet("");
      setUpgrading(false);
      return;
    }

    // Create a new order
    const res = await createSeasonPassOrder();
    setUpgrading(false);
    if (res.status === "blocked_auth") {
      addToast("error", "Inicia sesión", "Inicia sesión para actualizar el Season Pass.");
      return;
    }
    if (!res.data?.ok) {
      addToast("error", "Error al crear orden", res.data?.reason ?? "Inténtalo de nuevo.");
      return;
    }
    setUpgradeOrder(res.data);
    setTxHash(""); setPayerWallet("");
  }, [addToast, pendingOrder]);

  // ── AO.3: Submit payment proof ───────────────────────────────────────────
  const handleSubmitPayment = useCallback(async () => {
    if (!upgradeOrder?.order_id || !txHash.trim() || !payerWallet.trim()) return;
    setSubmitting(true);
    const res = await submitSeasonPassPayment(upgradeOrder.order_id, txHash, payerWallet);
    setSubmitting(false);
    if (res.ok) {
      addToast("success", "Pago registrado", "El equipo verificará tu pago en 24–48h hábiles.");
      setUpgradeOrder(null);
      setPendingOrder({ hasPending: true, txSubmitted: true, orderId: upgradeOrder.order_id });
      pendingChecked.current = false;
    } else {
      addToast("error", "Error al registrar", res.reason ?? "Inténtalo de nuevo.");
    }
  }, [upgradeOrder, txHash, payerWallet, addToast]);

  // ── Render states ────────────────────────────────────────────────────────
  if (status === "loading") return <PageLoader />;

  if (status === "blocked_auth") return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, marginBottom: 16 }}>🎫 Season Pass</h1>
      <BlockedAuthState message="Inicia sesión para ver tu progreso de temporada." />
    </main>
  );

  if (!data?.ok) return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, marginBottom: 16 }}>🎫 Season Pass</h1>
      <EmptyState icon="📅" title="Sin temporada activa" description={data?.reason ?? "No hay una temporada activa en este momento."} />
    </main>
  );

  if (status === "ready" && !data) return <ErrorState message="Error al cargar el Season Pass" onRetry={reload} />;

  const tiers       = data.tiers ?? [];
  const playerXp    = data.player_xp ?? 0;
  const currentTier = data.current_tier ?? 0;
  const isPremium   = data.is_premium ?? false;
  const seasonName  = data.season_name ?? "Temporada Actual";
  const endAt       = data.end_at
    ? new Date(data.end_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const shownTiers  = showAll ? tiers : tiers.slice(0, 20);
  const claimableCount = tiers.filter(
    t => t.unlocked && !claimedSet.has(t.tier) && !(t.is_premium && !isPremium)
  ).length;

  return (
    <>
      <style>{`
        @keyframes tier-claim-spin { to { transform: rotate(360deg); } }
        @keyframes sp-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,184,75,0); } 50% { box-shadow: 0 0 0 6px rgba(232,184,75,0.12); } }
      `}</style>

      {/* AO.3: Payment Modal */}
      {upgradeOrder && (
        <UpgradePaymentModal
          order={upgradeOrder}
          txHash={txHash} setTxHash={setTxHash}
          payerWallet={payerWallet} setPayerWallet={setPayerWallet}
          submitting={submitting}
          onSubmit={handleSubmitPayment}
          onClose={() => setUpgradeOrder(null)}
        />
      )}

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px", paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Temporada ───</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>🎫 {seasonName}</h1>
              {endAt && <p style={{ color: "#555", margin: 0, fontSize: 11 }}>Finaliza: {endAt}</p>}
            </div>
            <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
          </div>
        </div>

        {/* AO.3: Premium upgrade card */}
        <PremiumUpgradeCard
          isPremium={isPremium}
          pendingOrder={pendingOrder}
          onUpgrade={handleUpgrade}
          upgrading={upgrading}
        />

        {/* Player stats */}
        <div style={{ background: "linear-gradient(135deg,#1a1a2e,#12121a)", border: "1px solid #e8b84b33", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>TIER ACTUAL</div>
              <div style={{ color: "#e8b84b", fontFamily: "Cinzel,serif", fontSize: 28, fontWeight: 700 }}>T{currentTier}</div>
            </div>
            <div>
              <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>XP DE TEMPORADA</div>
              <div style={{ color: "#e8e8f0", fontSize: 22, fontWeight: 700 }}>{playerXp.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>TIPO DE PASS</div>
              <div style={{ color: isPremium ? "#e8b84b" : "#555", fontSize: 14, fontWeight: 700 }}>
                {isPremium ? "★ PREMIUM" : "F2P"}
              </div>
            </div>
          </div>
          <XpSection playerXp={playerXp} currentTier={currentTier} tiers={tiers} />
        </div>

        {/* Claim all */}
        {claimableCount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claimingAll}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: claimingAll ? "rgba(232,184,75,0.1)" : "#e8b84b", color: claimingAll ? "#e8b84b" : "#0a0a12", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 14, cursor: claimingAll ? "not-allowed" : "pointer", marginBottom: 20 }}
          >
            {claimingAll ? "Reclamando..." : `Reclamar todo (${claimableCount})`}
          </button>
        )}

        {/* Tiers grid */}
        {tiers.length === 0 ? (
          <EmptyState icon="🎫" title="Sin tiers disponibles" description="Esta temporada aún no tiene tiers configurados." />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 8, marginBottom: 16 }}>
              {shownTiers.map(t => (
                <TierCard
                  key={t.tier} tier={t}
                  currentTier={currentTier} isPremiumPlayer={isPremium}
                  claimed={claimedSet.has(t.tier)}
                  pendingClaim={claimedSet.has(t.tier) && !(data?.tiers?.find(dt => dt.tier === t.tier)?.claimed)}
                  onClaim={handleClaim}
                />
              ))}
            </div>
            {tiers.length > 20 && (
              <button
                onClick={() => setShowAll(s => !s)}
                style={{ display: "block", margin: "0 auto 24px", padding: "8px 24px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}
              >
                {showAll ? "Ver menos" : `Ver todos (${tiers.length})`}
              </button>
            )}
          </>
        )}

        {/* XP Sources */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>¿Cómo ganar XP de Temporada?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
            {[
              { icon: "⚔️", label: "Misiones PvE",    xp: "+30–150 XP" },
              { icon: "🏆", label: "Victoria PvP",     xp: "+100 XP"   },
              { icon: "🔮", label: "Fusión de cartas", xp: "+50 XP"    },
              { icon: "💰", label: "Venta en mercado", xp: "+25 XP"    },
              { icon: "📦", label: "Abrir packs",      xp: "+20 XP"    },
              { icon: "🗓️", label: "Quest diaria",     xp: "+75 XP"    },
            ].map(src => (
              <div key={src.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{src.icon}</span>
                <div>
                  <div style={{ color: "#e8e8f0", fontSize: 11, fontWeight: 600 }}>{src.label}</div>
                  <div style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, fontFamily: "IBM Plex Mono,monospace" }}>{src.xp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
