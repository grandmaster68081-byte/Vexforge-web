import { useFusion } from "../domains/fusion/useFusion";
    import { Link } from "react-router-dom";

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
            <p className="hero-sub">Forja cartas superiores combinando duplicados</p>
          </div>
        </div>

        {loading && <SkeletonFusion />}
        {error && <p className="error">{error}</p>}
        {actionError && <p className="error">{actionError}</p>}

        {lastResult && (
          <div className="stat-card" style={{ marginBottom: 16, borderColor: lastResult.ok ? "#3ddc84" : "#e3573f" }}>
            {lastResult.ok
              ? <p style={{ color: "#3ddc84" }}>✦ Fusion completa — nueva carta forjada.</p>
              : <p className="error">Fusion fallida: {lastResult.reason}</p>}
          </div>
        )}

        {!loading && myCards.length === 0 && (
          <div className="empty-state">
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No tienes cartas disponibles para fusionar</p>
            <p className="muted">
              La Fusion requiere duplicados desbloqueados en tu inventario. Consigue más cartas abriendo Packs.
            </p>
            <Link to="/packs" style={{
              display: "inline-block", marginTop: 20, padding: "10px 28px",
              background: "#e8702a", color: "#fff", borderRadius: 6, fontWeight: 700, textDecoration: "none"
            }}>
              Abrir Packs →
            </Link>
          </div>
        )}

        {myCards.length > 0 && (
          <div className="fusion-layout">
            <div className="fusion-panel">
              <h2>Source Card</h2>
              <select value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)} className="fusion-select">
                <option value="">— Select source card —</option>
                {myCards.map((c) => (
                  <option key={c.playerCardId} value={c.playerCardId}>
                    {c.name} · {c.rarity} · x{c.quantity}
                  </option>
                ))}
              </select>
              {selectedSource && (
                <div className="fusion-card-preview">
                  <p style={{ fontWeight: 600 }}>{selectedSource.name}</p>
                  <p style={{ color: rarityColor(selectedSource.rarity), fontSize: 12 }}>{selectedSource.rarity}</p>
                  <p className="muted" style={{ fontSize: 12 }}>Quantity: {selectedSource.quantity}</p>
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
                  <div className="fusion-req-row">
                    <span className="muted">Shards needed</span>
                    <span style={{ color: enoughShards ? "#3ddc84" : "#e3573f", fontWeight: 600 }}>
                      {shardsFor(selectedSource.rarity)} / {policy.requiredShards}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {policy && targets.length > 0 && (
              <div className="fusion-panel">
                <h2>Target Card</h2>
                <select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} className="fusion-select">
                  <option value="">— Select target —</option>
                  {targets.map((t) => (<option key={t.id} value={t.id}>{t.name} · {t.rarity}</option>))}
                </select>
              </div>
            )}

            {policy && (
              <div className="fusion-panel">
                <button className="btn-primary" disabled={!canFuse}
                  onClick={() => fuse()}>
                  {pending ? "Fusing…" : "Fuse Cards"}
                </button>
                {!enoughSourceCards && selectedSource && (
                  <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                    Need {policy.neededCards} copies — you have {selectedSource.quantity}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    );
    }
    