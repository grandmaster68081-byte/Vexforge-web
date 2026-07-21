import { useState } from "react";
import { useSeason } from "../domains/season/useSeason";
import type { SeasonTier } from "../domains/season/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";

const RARITY_COLOR: Record<string, string> = {
  Common: "#8b8b9e", Uncommon: "#3ddc84", Rare: "#4a9eff",
  Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
};

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
  if (reward.type === "cosmetic") return "Marco Excl.";
  if (reward.xp)                  return `+${reward.xp} XP`;
  return null;
}

function TierCard({ tier, currentTier, isPremiumPlayer }: {
  tier: SeasonTier; currentTier: number; isPremiumPlayer: boolean;
}) {
  const isCurrent    = tier.tier === currentTier;
  const unlocked     = tier.unlocked;
  const isPremLocked = tier.is_premium && !isPremiumPlayer;
  const rc           = tier.reward.card_rarity ? (RARITY_COLOR[tier.reward.card_rarity] ?? "#888") : "#e8b84b";
  const label        = rewardLabel(tier.reward);

  return (
    <div style={{
      borderRadius: 10, padding: "12px 10px", textAlign: "center", position: "relative",
      background: unlocked
        ? "linear-gradient(145deg,#1a2a1a,#12121a)"
        : isCurrent ? "linear-gradient(145deg,#1a1a2e,#0f0f20)" : "#1a1a2e",
      border: isCurrent
        ? "1px solid rgba(232,184,75,0.7)"
        : unlocked ? "1px solid rgba(61,220,132,0.3)" : "1px solid #2a2a3a",
      boxShadow: isCurrent ? "0 0 14px rgba(232,184,75,0.2)" : "none",
      opacity: (!unlocked && !isCurrent && !isPremLocked) ? 0.6 : 1,
      transition: "opacity .2s",
    }}>
      {isPremLocked && (
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(10,10,20,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <span style={{ fontSize: 16 }}>🔒</span>
        </div>
      )}
      <div style={{ color: isCurrent ? "#e8b84b" : unlocked ? "#3ddc84" : "#555", fontSize: 9, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.1em", marginBottom: 6 }}>
        T{tier.tier}
      </div>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{rewardIcon(tier.reward)}</div>
      {label && (
        <div style={{ color: tier.reward.card_rarity ? rc : "#e8b84b", fontSize: 9, fontWeight: 700, fontFamily: '"Rajdhani",sans-serif' }}>
          {label}
        </div>
      )}
      {tier.is_premium && !isPremLocked && (
        <div style={{ marginTop: 4, fontSize: 8, color: "#e8b84b", fontWeight: 800 }}>★ PREM</div>
      )}
      {unlocked && !isCurrent && (
        <div style={{ color: "#3ddc84", fontSize: 8, marginTop: 4 }}>✓</div>
      )}
      {isCurrent && (
        <div style={{ color: "#e8b84b", fontSize: 8, marginTop: 4, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.05em" }}>ACTUAL</div>
      )}
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 0 }}>
      {!isMaxed && nextT && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "#888", fontSize: 11 }}>Progreso al Tier {nextT.tier}</span>
            <span style={{ color: "#e8b84b", fontWeight: 700, fontSize: 11 }}>{xpInTier.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
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

export function SeasonPassRoute() {
  const { status, data, reload } = useSeason();
  const [showAll, setShowAll]    = useState(false);

  if (status === "loading") return <PageLoader />;

  if (status === "blocked_auth") {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, marginBottom: 16 }}>🎫 Season Pass</h1>
        <BlockedAuthState message="Inicia sesión para ver tu progreso de temporada." />
      </main>
    );
  }

  if (!data?.ok) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, marginBottom: 16 }}>🎫 Season Pass</h1>
        <EmptyState icon="📅" title="Sin temporada activa" description={data?.reason ?? "No hay una temporada activa en este momento."} />
      </main>
    );
  }

  if (status === "ready" && !data) {
    return <ErrorState message="Error al cargar el Season Pass" onRetry={reload} />;
  }

  const tiers       = data.tiers ?? [];
  const playerXp    = data.player_xp ?? 0;
  const currentTier = data.current_tier ?? 0;
  const isPremium   = data.is_premium ?? false;
  const seasonName  = data.season_name ?? "Temporada Actual";
  const endAt       = data.end_at ? new Date(data.end_at).toLocaleDateString() : null;
  const shownTiers  = showAll ? tiers : tiers.slice(0, 20);

  return (
    <>
      <style>{`
        @keyframes sp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,184,75,0); }
          50%      { box-shadow: 0 0 0 6px rgba(232,184,75,0.15); }
        }
      `}</style>
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Temporada ───</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>🎫 {seasonName}</h1>
              {endAt && <p style={{ color: "#555", margin: 0, fontSize: 11 }}>Finaliza: {endAt}</p>}
            </div>
            <button onClick={reload} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>↻ Actualizar</button>
          </div>
        </div>

        {/* Player stats card */}
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
            {isPremium && (
              <div style={{ background: "#e8b84b22", border: "1px solid #e8b84b44", borderRadius: 8, padding: "6px 14px" }}>
                <div style={{ color: "#e8b84b", fontSize: 11, fontWeight: 800 }}>★ PREMIUM</div>
              </div>
            )}
          </div>
          <XpSection playerXp={playerXp} currentTier={currentTier} tiers={tiers} />
        </div>

        {/* Tier grid */}
        {tiers.length > 0 && (
          <>
            <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, marginBottom: 14 }}>Recompensas por Tier</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 6, marginBottom: 16 }}>
              {shownTiers.map(tier => (
                <TierCard key={tier.tier} tier={tier} currentTier={currentTier} isPremiumPlayer={isPremium} />
              ))}
            </div>
            {tiers.length > 20 && (
              <button onClick={() => setShowAll(s => !s)} style={{ display: "block", margin: "0 auto 24px", padding: "8px 24px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>
                {showAll ? "Ver menos" : `Ver todos (${tiers.length})`}
              </button>
            )}
          </>
        )}

        {/* XP sources */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>¿Cómo ganar XP de Temporada?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
            {[
              { icon: "⚔️", label: "Misiones PvE",    xp: "+30–150 XP" },
              { icon: "🏆", label: "Victoria PvP",     xp: "+100 XP"   },
              { icon: "🔮", label: "Fusión de cartas", xp: "+50 XP"    },
              { icon: "💰", label: "Venta en mercado", xp: "+25 XP"    },
              { icon: "📦", label: "Abrir packs",      xp: "+20 XP"    },
              { icon: "🗓️", label: "Quest diaria",     xp: "+75 XP"    },
            ].map(source => (
              <div key={source.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{source.icon}</span>
                <div>
                  <div style={{ color: "#e8e8f0", fontSize: 11, fontWeight: 600 }}>{source.label}</div>
                  <div style={{ color: "#e8b84b", fontSize: 10, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace' }}>{source.xp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
