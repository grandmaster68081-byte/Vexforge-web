import { useNft } from "../domains/nft/useNft";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import type { NftMintQueueEntry } from "../domains/nft/repository";

const RARITY_COLOR: Record<string, string> = {
  Rare:      "#4a9eff",
  Epic:      "#a855f7",
  Legendary: "#f59e0b",
  Mythic:    "#ef4444",
};
const MINTABLE_RARITIES = ["Rare", "Epic", "Legendary", "Mythic"];

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { bg: string; color: string }> = {
    pending:    { bg: "rgba(234,179,8,0.15)",  color: "#eab308" },
    processing: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    confirmed:  { bg: "rgba(34,197,94,0.15)",  color: "#4ade80" },
    failed:     { bg: "rgba(239,68,68,0.15)",  color: "#f87171" },
    deployed:   { bg: "rgba(34,197,94,0.15)",  color: "#4ade80" },
  };
  const s = MAP[status] ?? MAP.pending;
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: 1,
    }}>{status}</span>
  );
}

function MintQueueRow({ entry }: { entry: NftMintQueueEntry }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderRadius: 10, gap: 12,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>
          Card: {entry.card_id.substring(0, 12)}…
        </span>
        {entry.tx_hash && (
          <a href={`https://polygonscan.com/tx/${entry.tx_hash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#60a5fa", textDecoration: "underline" }}>
            Tx: {entry.tx_hash.substring(0, 18)}…
          </a>
        )}
        {entry.error_message && (
          <span style={{ fontSize: 11, color: "#f87171" }}>{entry.error_message}</span>
        )}
      </div>
      <StatusBadge status={entry.status} />
    </div>
  );
}

export function NftRoute() {
  const {
    contract, contractLoading, contractDeployed,
    walletAddress, walletLink, mintQueue,
    isAuth, connecting, connectError, mintError,
    connectWallet, refresh,
  } = useNft();

  if (contractLoading) return <PageLoader />;
  if (!isAuth) return <BlockedAuthState message="Inicia sesión para acceder a NFT Forge" />;

  const linkedWallet = walletAddress ?? walletLink?.wallet_address ?? null;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 6 }}>
          💠 NFT Forge
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Convierte tus cartas Rare, Epic, Legendary y Mythic en NFTs ERC-721 en Polygon.
        </p>
      </div>

      {/* Contract status */}
      <div style={{
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
        background: contractDeployed ? "rgba(34,197,94,0.06)" : "rgba(234,179,8,0.06)",
        padding: "18px 20px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{contractDeployed ? "✅" : "⏳"}</span>
          <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15 }}>
            Contrato VexforgeCards (VFC)
          </span>
          {contract && <StatusBadge status={contract.status} />}
        </div>
        {contract && contractDeployed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Dirección: <span style={{ fontFamily: "monospace", color: "#60a5fa" }}>{contract.contract_address}</span>
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Polygon Mainnet · Max supply: {contract.max_supply.toLocaleString()}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "#eab308" }}>Pendiente del propietario:</strong> el contrato ERC-721 aún no ha sido desplegado en Polygon.
            El minteo se activa tras el deploy (~$2-5 MATIC en gas).
          </p>
        )}
      </div>

      {/* Wallet */}
      <div style={{
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)", padding: "18px 20px", marginBottom: 24,
      }}>
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15, marginBottom: 12 }}>
          🦊 Tu Wallet
        </h2>
        {linkedWallet ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Conectada:</span>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "#e2e8f0" }}>
                {linkedWallet.substring(0, 6)}…{linkedWallet.slice(-4)}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#4a9eff" }}>Polygon Mainnet (MATIC)</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Conecta MetaMask para vincular tu wallet y acceder al minteo.
            </p>
            <button onClick={connectWallet} disabled={connecting} style={{
              padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
              background: connecting ? "rgba(255,255,255,0.08)" : "rgba(234,179,8,0.2)",
              color: "#eab308", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
            }}>
              {connecting ? "Conectando…" : "🦊 Conectar MetaMask"}
            </button>
            {connectError && <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{connectError}</p>}
          </div>
        )}
      </div>

      {/* Mintable rarities */}
      <div style={{
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)", padding: "18px 20px", marginBottom: 24,
      }}>
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15, marginBottom: 10 }}>
          🃏 Raridades Minteables
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
          Solo cartas de rareza superior pueden convertirse en NFTs. Common y Uncommon quedan excluidas por diseño del protocolo.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MINTABLE_RARITIES.map(r => (
            <span key={r} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: RARITY_COLOR[r] + "22", color: RARITY_COLOR[r],
              border: `1px solid ${RARITY_COLOR[r]}55`,
            }}>{r}</span>
          ))}
        </div>
        {mintError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 12 }}>{mintError}</p>}
      </div>

      {/* Mint queue */}
      <div style={{
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)", padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15 }}>📋 Cola de Minteo</h2>
          <button onClick={refresh} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 12, cursor: "pointer",
          }}>Actualizar</button>
        </div>
        {mintQueue.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#475569" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌑</div>
            <p style={{ margin: 0, fontSize: 14 }}>Sin solicitudes de minteo todavía.</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>
              El minteo se activa cuando el contrato sea desplegado en Polygon.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mintQueue.map(entry => <MintQueueRow key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}
