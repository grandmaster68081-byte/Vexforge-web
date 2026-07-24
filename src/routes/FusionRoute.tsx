// FusionRoute v2.0 — Epic E: Crucible of Fusion — Phase 6+7
    // Crucible state: select source card → see policy → pick target → fuse
    import { useFusion } from "../domains/fusion/useFusion";
    import { PageLoader } from "../shared/components/PageLoader";
    import { BlockedAuthState } from "../shared/components/BlockedAuthState";
    import { EmptyState } from "../shared/components/EmptyState";

    const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_forge.jpg";

    const RARITY_COLOR: Record<string, string> = {
    Common: "#9a9ab0", Uncommon: "#3ddc84", Rare: "#4a9eff",
    Epic: "#a855f7", Legendary: "#e8b84b", Mythic: "#ff4444",
    };
    const FACTION_COLOR: Record<string, string> = {
    Guerrero: "#E84040", Mago: "#5B8BF5", "Paladín": "#3DC96B", "Pícaro": "#7B4FD4",
    };

    // ─── Sub-components ───────────────────────────────────────────────────────────

    function RarityBadge({ rarity }: { rarity: string }) {
    const c = RARITY_COLOR[rarity] ?? "#8b8b9e";
    return (
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 20,
        fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.08em", fontWeight: 700,
        background: c + "22", border: `1px solid ${c}55`, color: c,
      }}>
        {rarity}
      </span>
    );
    }

    function ShardCounter({ rarity, count }: { rarity: string; count: number }) {
    const c = RARITY_COLOR[rarity] ?? "#8b8b9e";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
        <span style={{ fontSize: 12, color: "#888" }}>{count} shards {rarity}</span>
      </div>
    );
    }

    // ─── Source card picker ───────────────────────────────────────────────────────

    function SourceSlot({
    cards, selectedId, onSelect,
    }: {
    cards: Array<{ playerCardId: string; name: string; rarity: string; quantity: number }>;
    selectedId: string;
    onSelect: (id: string) => void;
    }) {
    if (cards.length === 0) return (
      <EmptyState
        icon="🃏"
        title="Sin cartas fusionables"
        description="Consigue cartas con fusion_enabled para usar este crucible."
      />
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cards.map(c => {
          const col = RARITY_COLOR[c.rarity] ?? "#8b8b9e";
          const sel = selectedId === c.playerCardId;
          return (
            <button
              key={c.playerCardId}
              onClick={() => onSelect(c.playerCardId)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderRadius: 9, border: `1.5px solid ${sel ? col : col + "33"}`,
                background: sel ? col + "18" : "rgba(12,12,22,0.8)",
                color: "#e8e8f0", cursor: "pointer", textAlign: "left",
                boxShadow: sel ? `0 0 12px ${col}44` : "none",
                transition: "all 0.18s",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ marginTop: 3 }}><RarityBadge rarity={c.rarity} /></div>
              </div>
              <div style={{ color: "#555", fontSize: 11 }}>×{c.quantity}</div>
            </button>
          );
        })}
      </div>
    );
    }

    // ─── Policy info panel ────────────────────────────────────────────────────────

    function PolicyPanel({
    policy, shardsFor, sourceRarity,
    }: {
    policy: { neededCards: number; requiredShards: number; ingameCost: number; targetRarity: string } | null;
    shardsFor: (r: string) => number;
    sourceRarity: string;
    }) {
    if (!policy) return <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 16 }}>Selecciona una carta para ver el coste de fusión.</div>;

    const availShards = shardsFor(sourceRarity);
    const hasShards   = availShards >= policy.requiredShards;
    const c = RARITY_COLOR[policy.targetRarity] ?? "#e8b84b";

    return (
      <div style={{ background: "rgba(12,12,22,0.9)", border: `1px solid ${c}33`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: c, marginBottom: 12 }}>Coste de Fusión</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666", fontSize: 12 }}>Cartas requeridas</span>
            <span style={{ color: "#e8e8f0", fontSize: 12, fontWeight: 700 }}>{policy.neededCards}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666", fontSize: 12 }}>Shards requeridos</span>
            <span style={{ color: hasShards ? "#3ddc84" : "#e3573f", fontSize: 12, fontWeight: 700 }}>
              {policy.requiredShards} (tienes: {availShards})
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666", fontSize: 12 }}>Coste VEX</span>
            <span style={{ color: "#e8b84b", fontSize: 12, fontWeight: 700 }}>{policy.ingameCost.toLocaleString()}</span>
          </div>
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666", fontSize: 12 }}>Resultado</span>
            <RarityBadge rarity={policy.targetRarity} />
          </div>
        </div>
      </div>
    );
    }

    // ─── Main Route ───────────────────────────────────────────────────────────────

    export function FusionRoute() {
    const {
      myCards, shards, loading, error,
      selectedSourceId, setSelectedSourceId,
      selectedSource, policy, policyLoading,
      targets, selectedTargetId, setSelectedTargetId,
      shardsFor, actionError, pending, lastResult,
      fuse,
    } = useFusion();

    const authed = error !== "Sign in to see your cards." && error !== "Sign in to fuse cards.";

    if (loading) return <PageLoader message="Cargando Crucible de Fusión..." />;

    if (!authed) return (
      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BlockedAuthState message="Inicia sesión para fusionar tus cartas en el Crucible." />
      </main>
    );

    const canFuse = !!selectedSourceId && !!selectedTargetId && !pending && !policyLoading;

    return (
      <main style={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(4,4,12,0.88),rgba(4,4,12,0.94)) center/cover, url('${BG_URL}') center/cover no-repeat`,
        padding: "28px 20px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 28, margin: "0 0 4px" }}>🔥 Crucible de Fusión</h1>
            <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Fusiona copias de una carta para ascender su rareza. Requiere cartas + shards + VEX.</p>
          </div>

          {/* Result banner */}
          {lastResult && (
            <div style={{
              marginBottom: 20, padding: "14px 20px", borderRadius: 10,
              background: lastResult.ok ? "rgba(61,220,132,0.1)" : "rgba(227,87,63,0.1)",
              border: `1px solid ${lastResult.ok ? "#3ddc8444" : "#e3573f44"}`,
              color: lastResult.ok ? "#3ddc84" : "#e3573f", fontSize: 13,
            }}>
              {lastResult.ok ? "✅ Fusión exitosa — la carta ha ascendido de rareza." : (lastResult.reason ?? "Fusión fallida.")}
            </div>
          )}

          {/* Action error */}
          {actionError && (
            <div style={{
              marginBottom: 20, padding: "12px 18px", borderRadius: 10,
              background: "rgba(227,87,63,0.1)", border: "1px solid #e3573f44",
              color: "#e3573f", fontSize: 13,
            }}>
              {actionError}
            </div>
          )}

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Left: Source selection */}
            <div>
              <div style={{ fontFamily: "Cinzel,serif", fontSize: 14, color: "#e8b84b", marginBottom: 14 }}>
                1. Elige la carta fuente
              </div>
              <SourceSlot
                cards={myCards}
                selectedId={selectedSourceId}
                onSelect={setSelectedSourceId}
              />

              {/* Shards */}
              {shards.length > 0 && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(12,12,22,0.7)", borderRadius: 10, border: "1px solid #1a1a2e" }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tus Shards</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {shards.map(s => (
                      <ShardCounter key={s.rarity} rarity={s.rarity} count={s.quantity} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Policy + Target + Action */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Policy */}
              {policyLoading ? (
                <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 20 }}>Calculando coste...</div>
              ) : (
                <PolicyPanel
                  policy={policy}
                  shardsFor={shardsFor}
                  sourceRarity={selectedSource?.rarity ?? ""}
                />
              )}

              {/* Target picker */}
              {targets.length > 0 && (
                <div>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 14, color: "#e8b84b", marginBottom: 10 }}>
                    2. Elige la carta objetivo
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {targets.map(t => {
                      const col = RARITY_COLOR[t.rarity] ?? "#8b8b9e";
                      const sel = selectedTargetId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTargetId(t.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 9,
                            border: `1.5px solid ${sel ? col : col + "33"}`,
                            background: sel ? col + "18" : "rgba(12,12,22,0.8)",
                            color: "#e8e8f0", cursor: "pointer", textAlign: "left",
                            boxShadow: sel ? `0 0 12px ${col}44` : "none",
                            transition: "all 0.18s",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                            <div style={{ marginTop: 3 }}><RarityBadge rarity={t.rarity} /></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fuse button */}
              {selectedSource && (
                <button
                  onClick={fuse}
                  disabled={!canFuse}
                  style={{
                    padding: "16px 24px", borderRadius: 12, border: "none",
                    background: canFuse
                      ? "linear-gradient(135deg,#e8b84b,#c9901f)"
                      : "#2a2a3a",
                    color: canFuse ? "#0a0a12" : "#444",
                    fontFamily: "Cinzel,serif", fontSize: 15, fontWeight: 800,
                    cursor: canFuse ? "pointer" : "not-allowed",
                    opacity: pending ? 0.7 : 1,
                    boxShadow: canFuse ? "0 0 28px rgba(232,184,75,0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {pending ? "Fusionando..." : "🔥 Fusionar"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
    }
    