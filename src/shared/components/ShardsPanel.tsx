// ShardsPanel — Y.3 canonical reconstruction
// Shows player shard balance by rarity + forge guide
import { useShards } from "../../domains/packs/useShards";
import { SHARD_VALUES } from "../../domains/packs/shardsRepository";

const RARITY_COLOR: Record<string, string> = {
  Common:    "#9ca3af",
  Uncommon:  "#22c55e",
  Rare:      "#60a5fa",
  Epic:      "#a78bfa",
  Legendary: "#f59e0b",
  Mythic:    "#ef4444",
};
const RARITY_LABEL: Record<string, string> = {
  Common: "Común", Uncommon: "Infrecuente", Rare: "Rara",
  Epic: "Épica", Legendary: "Legendaria", Mythic: "Mítica",
};
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

export function ShardsPanel() {
  const { shards, loading, signedIn } = useShards();

  if (!signedIn && !loading) return null;
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.07)",
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif", fontSize: 12 }}>
            Cargando fragmentos…
          </span>
        </div>
      </div>
    );
  }

  const byRarity: Record<string, number> = {};
  shards.forEach(s => { byRarity[s.shard_rarity] = s.quantity; });
  const totalShards = shards.reduce((s, r) => s + r.quantity, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
      <div style={{
        background: "linear-gradient(135deg,rgba(139,92,246,.07),rgba(96,165,250,.04))",
        border: "1px solid rgba(139,92,246,.2)",
        borderRadius: 12, padding: "16px 20px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💎</span>
            <div>
              <div style={{
                fontFamily: "Cinzel,serif", color: "#a78bfa", fontSize: 13, fontWeight: 700,
              }}>Fragmentos de Forja</div>
              <div style={{ color: "#555577", fontSize: 10, fontFamily: "Rajdhani,sans-serif", marginTop: 1 }}>
                Se obtienen al abrir packs duplicados
              </div>
            </div>
          </div>
          {totalShards > 0 && (
            <div style={{
              background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.35)",
              borderRadius: 20, padding: "4px 14px",
              fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 12, color: "#a78bfa",
            }}>
              {totalShards.toLocaleString()} total
            </div>
          )}
        </div>

        {/* Shard grid */}
        {totalShards === 0 ? (
          <div style={{ color: "#555577", fontFamily: "Rajdhani,sans-serif", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
            Abre packs para obtener fragmentos al conseguir cartas duplicadas.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {RARITIES.map(rarity => {
              const qty  = byRarity[rarity] ?? 0;
              const cfg  = SHARD_VALUES[rarity];
              const pct  = cfg ? Math.min(100, (qty / cfg.forge) * 100) : 0;
              const col  = RARITY_COLOR[rarity];
              return (
                <div key={rarity} style={{
                  flex: "1 1 130px", minWidth: 110,
                  background: qty > 0 ? col + "0d" : "rgba(255,255,255,.02)",
                  border: `1px solid ${qty > 0 ? col + "33" : "rgba(255,255,255,.06)"}`,
                  borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{
                    fontFamily: "Rajdhani,sans-serif", fontSize: 10, fontWeight: 700,
                    color: qty > 0 ? col : "#444466",
                    textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
                  }}>{RARITY_LABEL[rarity]}</div>
                  <div style={{
                    fontFamily: "Cinzel,serif", fontSize: 18, fontWeight: 700,
                    color: qty > 0 ? col : "#333355", lineHeight: 1, marginBottom: 6,
                  }}>{qty.toLocaleString()}</div>
                  {/* Progress bar toward forge */}
                  {cfg && (
                    <>
                      <div style={{
                        height: 4, background: "rgba(255,255,255,.06)",
                        borderRadius: 2, overflow: "hidden", marginBottom: 4,
                      }}>
                        <div style={{
                          height: "100%", width: pct + "%", borderRadius: 2,
                          background: `linear-gradient(90deg,${col}88,${col})`,
                          transition: "width .6s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#444466", fontFamily: "Rajdhani,sans-serif" }}>
                        {qty}/{cfg.forge} para forjar
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
