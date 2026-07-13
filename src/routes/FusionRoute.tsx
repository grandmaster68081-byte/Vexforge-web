import { useFusion } from "../domains/fusion/useFusion";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

export function FusionRoute() {
  const {
    myCards,
    loading,
    error,
    selectedSourceId,
    setSelectedSourceId,
    selectedSource,
    policy,
    policyLoading,
    targets,
    selectedTargetId,
    setSelectedTargetId,
    shardsFor,
    actionError,
    pending,
    lastResult,
    fuse,
  } = useFusion();

  const enoughSourceCards = selectedSource && policy ? selectedSource.quantity >= policy.neededCards : false;
  const enoughShards = policy ? shardsFor(selectedSource?.rarity ?? "") >= policy.requiredShards : false;
  const canFuse = Boolean(policy && selectedTargetId && enoughSourceCards && enoughShards && !pending);

  return (
    <section>
      <header className="route-header">
        <h1>Fusion</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading your cards from Supabase…</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {lastResult && !lastResult.ok && <p className="error">Fusion failed: {lastResult.reason}</p>}
      {lastResult?.ok && <p className="success">Fusion complete.</p>}

      {!loading && myCards.length === 0 && (
        <div className="empty-state">
          <p>You don't have any fusable cards right now.</p>
          <p className="muted">Cards need fusion_enabled = true and to be unlocked/unlisted.</p>
        </div>
      )}

      {myCards.length > 0 && (
        <>
          <h2>Choose a source card</h2>
          <select value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)}>
            <option value="">Select a card…</option>
            {myCards.map((c) => (
              <option key={c.playerCardId} value={c.playerCardId}>
                {c.name} ({c.rarity}) x{c.quantity}
              </option>
            ))}
          </select>

          {policyLoading && <p className="muted">Resolving fusion path…</p>}

          {policy && selectedSource && (
            <div className="fusion-requirements">
              <h2>Fusion path: {selectedSource.rarity} → {policy.targetRarity}</h2>
              <ul>
                <li>
                  Source cards needed: {policy.neededCards} (you have {selectedSource.quantity}){" "}
                  {!enoughSourceCards && <span className="error">insufficient</span>}
                </li>
                <li>
                  Shards needed: {policy.requiredShards} (you have {shardsFor(selectedSource.rarity)}){" "}
                  {!enoughShards && policy.requiredShards > 0 && <span className="error">insufficient</span>}
                </li>
                <li>VEX cost: {policy.ingameCost}</li>
              </ul>

              <h3>Choose the resulting card</h3>
              {targets.length === 0 ? (
                <p className="muted">No active {policy.targetRarity} cards are fusion-enabled yet.</p>
              ) : (
                <select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)}>
                  <option value="">Select a result…</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              <div>
                <button disabled={!canFuse} onClick={fuse}>
                  {pending ? "Fusing…" : "Fuse"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="muted">
        Fusion goes entirely through the vexforge_apply_fusion RPC (see
        src/domains/fusion/repository.ts) -- card burn/mint, shard burn, VEX debit and the
        fusion log are all written atomically server-side, never by direct table writes.
      </p>
    </section>
  );
}
