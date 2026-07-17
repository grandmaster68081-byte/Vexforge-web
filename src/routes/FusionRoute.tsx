import { useFusion } from "../domains/fusion/useFusion";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_fusion.jpg";

const rarityColor = (r: string) => ({
  Común:"#8b8b9e",Common:"#8b8b9e",Raro:"#4a9eff",Rare:"#4a9eff",
  Épico:"#a855f7",Epic:"#a855f7",Legendario:"#e8702a",Legendary:"#e8702a",
}[r] ?? "#e8e8e8");

import { SkeletonFusion } from "../shared/components/Skeleton";

export function FusionRoute() {
  const {
    myCards, loading, error,
    selectedSourceId, setSelectedSourceId, selectedSource,
    policy, policyLoading, targets,
    selectedTargetId, setSelectedTargetId,
    shardsFor, actionError, pending, lastResult, fuse,
  } = useFusion();

  const enoughSourceCards = selectedSource && policy ? selectedSource.quantity >= policy.neededCards : false;
  const enoughShards = policy ? shardsFor(selectedSource?.rarity ?? "") >= policy.requiredShards : false;
  const canFuse = Boolean(policy && selectedTargetId && enoughSourceCards && enoughShards && !pending);

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Fusion</h1>
        </div>
      </div>

      {loading && <SkeletonFusion />}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {lastResult && (
        <div className="stat-card" style={{ marginBottom: 16, borderColor: lastResult.ok ? "#3ddc84" : "#e3573f" }}>
          {lastResult.ok
            ? <p style={{ color: "#3ddc84" }}>✦ Fusion complete — new card forged.</p>
            : <p className="error">Fusion failed: {lastResult.reason}</p>}
        </div>
      )}

      {!loading && myCards.length === 0 && (
        <div className="empty-state">
          <p>No fusable cards right now.</p>
          <p className="muted">Cards need fusion_enabled = true and must be unlocked/unlisted.</p>
        </div>
      )}

      {myCards.length > 0 && (
        <div className="fusion-layout">
          <div className="fusion-panel">
            <h2>Source Card</h2>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="fusion-select"
            >
              <option value="">— Select source card —</option>
              {myCards.map((c) => (
                <option key={c.playerCardId} value={c.playerCardId}>
                  {c.name} · <span>{c.rarity}</span> · x{c.quantity}
                </option>
              ))}
            </select>

            {selectedSource && (
              <div className="fusion-card-preview">
                <div>
                  <p style={{ fontWeight: 600 }}>{selectedSource.name}</p>
                  <p style={{ color: rarityColor(selectedSource.rarity), fontSize: 12 }}>{selectedSource.rarity}</p>
                  <p className="muted" style={{ fontSize: 12 }}>Quantity: {selectedSource.quantity}</p>
                </div>
              </div>
            )}
          </div>

          {policyLoading && <p className="muted">Resolving fusion path…</p>}

          {policy && selectedSource && (
            <div className="fusion-panel">
              <h2>Fusion Requirements</h2>
              <div className="stat-card" style={{ marginBottom: 0 }}>
                <p style={{ marginBottom: 8 }}>
                  <span style={{ color: rarityColor(selectedSource.rarity) }}>{selectedSource.rarity}</span>
                  {" → "}
                  <span style={{ color: rarityColor(policy.targetRarity) }}>{policy.targetRarity}</span>
                </p>
                <div className="fusion-req-row">
                  <span className="muted">Cards needed</span>
                  <span style={{ color: enoughSourceCards ? "#3ddc84" : "#e3573f", fontWeight: 600 }}>
                    {selectedSource.quantity} / {policy.neededCards}
                  </span>
                </div>
                {policy.requiredShards > 0 && (
                  <div className="fusion-req-row">
                    <span className="muted">Shards needed</span>
                    <span style={{ color: enoughShards ? "#3ddc84" : "#e3573f", fontWeight: 600 }}>
                      {shardsFor(selectedSource.rarity)} / {policy.requiredShards}
                    </span>
                  </div>
                )}
                <div className="fusion-req-row">
                  <span className="muted">VEX cost</span>
                  <span style={{ color: "#e8702a", fontWeight: 600 }}>{policy.ingameCost}</span>
                </div>
              </div>

              {targets.length > 0 && (
                <>
                  <h2 style={{ marginTop: 20 }}>Target Card</h2>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="fusion-select"
                  >
                    <option value="">— Select target —</option>
                    {targets.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} · {t.rarity}</option>
                    ))}
                  </select>
                </>
              )}

              <button
                disabled={!canFuse}
                onClick={fuse}
                className="fusion-btn"
                style={{ marginTop: 20 }}
              >
                {pending ? "Forging…" : canFuse ? "✦ Fuse Cards" : "Requirements not met"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}