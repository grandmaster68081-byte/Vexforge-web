import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useDeposit } from "../domains/deposit/useDeposit";
import { getTreasuryWallets, type TreasuryWallet } from "../domains/deposit/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";

// ── BRECHA-4 resuelto: metadatos de display por chain ───────────────────
const CHAIN_META: Record<string, { label: string; token: string; emoji: string; note: string }> = {
  ETH:  { label: "Ethereum",  token: "USDT", emoji: "⟠",  note: "USDT ERC-20" },
  BSC:  { label: "BNB Chain", token: "USDT", emoji: "🟡", note: "USDT BEP-20 · fees bajos" },
  SOL:  { label: "Solana",    token: "USDT", emoji: "◎",  note: "USDT SPL · fees mínimos" },
  TRON: { label: "TRON",      token: "USDT", emoji: "🔴", note: "USDT TRC-20 · sin fees" },
};

interface ChainOption {
  key: string; label: string; token: string;
  emoji: string; note: string; address: string;
}

const PACK_REF = [
  { name: "Seed Pack",       usdt: "$1.99",  vex: "199"  },
  { name: "Scout Pack",      usdt: "$4.99",  vex: "499"  },
  { name: "Expedition Pack", usdt: "$9.99",  vex: "999"  },
  { name: "Forge Pack",      usdt: "$24.99", vex: "2499" },
  { name: "Founder Pack",    usdt: "$49.99", vex: "4999" },
];

const STATUS_LABEL: Record<string, string> = {
  pending:  "⏳ Pendiente",
  approved: "✅ Acreditado",
  rejected: "❌ Rechazado",
};
const STATUS_COLOR: Record<string, string> = {
  pending:  "#e8b84b",
  approved: "#3DC96B",
  rejected: "#E84040",
};

// AE.2 chat92: tipo de tab extendido con historial
type DepositTab = "crypto" | "stripe" | "historial";

export function DepositRoute() {
  const { balance, deposits, loading, submitting, submitResult, load, submit, reset } = useDeposit();
  const [tab, setTab]           = useState<DepositTab>("crypto");
  const [chains, setChains]     = useState<ChainOption[]>([]);
  const [chain, setChain]       = useState("");
  const [amount, setAmount]     = useState("");
  const [txHash, setTxHash]     = useState("");
  const [myWallet, setMyWallet] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [authed, setAuthed]     = useState<boolean | null>(null);

  // BRECHA-4: cargar wallets activas desde vexforge_treasury
  useEffect(() => {
    getTreasuryWallets().then(wallets => {
      const loaded: ChainOption[] = wallets.map(w => ({
        key:     w.chain,
        address: w.wallet_address,
        ...(CHAIN_META[w.chain] ?? {
          label: w.chain, token: w.token_symbol,
          emoji: "◈",    note:  w.token_symbol,
        }),
      }));
      setChains(loaded);
      if (loaded.length > 0) setChain(loaded[0].key);
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, []);

  const numAmount  = parseFloat(amount) || 0;
  const vexPreview = numAmount > 0 ? Math.floor(numAmount * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (numAmount < 1.99) { setError("Monto mínimo: $1.99 USDT"); return; }
    if (!txHash.trim())   { setError("Ingresa el TX Hash de tu transacción"); return; }
    if (!myWallet.trim()) { setError("Ingresa tu dirección de wallet"); return; }
    const selected = chains.find(c => c.key === chain) ?? chains[0];
    const res = await submit({
      amount_usdt: numAmount, chain,
      token_symbol: selected.token,
      tx_hash: txHash.trim(),
      payer_wallet_address: myWallet.trim(),
    });
    if (res.ok) {
      // Switch to historial tab after successful submit
      setTab("historial");
    } else {
      setError(res.reason || "Error al enviar el depósito");
    }
  }

  function copyAddress() {
    const activeAddr = chains.find(c => c.key === chain)?.address ?? "";
    navigator.clipboard.writeText(activeAddr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (authed === null || loading || chains.length === 0) return <PageLoader />;
  if (!authed) return <BlockedAuthState message="Inicia sesión para realizar depósitos de VEX." />;

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,144,31,0.15)",
    borderRadius: 12, padding: "20px 24px",
  };
  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,144,31,0.25)",
    borderRadius: 8, padding: "10px 14px", color: "#e8e8e8",
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, outline: "none",
  };

  // AE.2: tab button style helper
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: 8, cursor: "pointer",
    fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 13,
    border: active ? "1px solid #e8b84b" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "rgba(232,184,75,0.12)" : "transparent",
    color: active ? "#e8b84b" : "#666",
    transition: "all 0.15s ease",
  });

  return (
    <div style={{ color: "#e8e8e8", fontFamily: '"Rajdhani",sans-serif',
      maxWidth: 640, margin: "0 auto", padding: "24px 16px", paddingBottom: 80 }}>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#e8b84b",
          textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
          ─── Economía · Depósito ───
        </p>
        <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 26, color: "#e8b84b",
          margin: 0, marginBottom: 8 }}>Obtener VEX</h1>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          Deposita USDT y recibe VEX Tradeable (tras verificación).{" "}
          Tasa oficial: <strong style={{ color: "#e8b84b" }}>1 USDT = 100 VEX</strong>
        </p>
      </div>

      {!loading && balance && (
        <div style={{ ...card, marginBottom: 20, display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 4 }}>VEX Ingame</div>
            <div style={{ fontFamily: '"Cinzel",serif', fontSize: 22, color: "#e8b84b" }}>
              {(balance.vex_ingame || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Solo en juego · no retirable</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 4 }}>VEX Tradeable</div>
            <div style={{ fontFamily: '"Cinzel",serif', fontSize: 22, color: "#3DC96B" }}>
              {(balance.vex_tradeable || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
              aprox. {((balance.vex_tradeable || 0) * 0.01).toFixed(2)} USDT · retirable
            </div>
          </div>
        </div>
      )}

      {/* AE.2: 3 tabs — Crypto, Stripe, Historial */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setTab("crypto")} style={tabStyle(tab === "crypto")}>
          ⛓ Crypto (USDT)
        </button>
        <button onClick={() => setTab("stripe")} style={tabStyle(tab === "stripe")}>
          💳 Stripe
          <span style={{ fontSize: 10, marginLeft: 6, color: "#555" }}>Próximamente</span>
        </button>
        <button onClick={() => setTab("historial")} style={{
          ...tabStyle(tab === "historial"),
          position: "relative",
        }}>
          📋 Historial
          {deposits.length > 0 && (
            <span style={{
              marginLeft: 6,
              background: deposits.some(d => d.status === "pending") ? "#e8b84b" : "#3DC96B",
              color: "#000",
              borderRadius: 10,
              padding: "1px 6px",
              fontSize: 10,
              fontWeight: 700,
            }}>
              {deposits.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: CRYPTO ── */}
      {tab === "crypto" && (
        <>
          {submitResult?.ok ? (
            <div style={{ ...card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontFamily: '"Cinzel",serif', color: "#3DC96B", marginBottom: 8 }}>
                Depósito recibido
              </h2>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 4 }}>
                Tu depósito está en revisión. Recibirás:
              </p>
              <p style={{ fontFamily: '"Cinzel",serif', fontSize: 28, color: "#e8b84b", marginBottom: 4 }}>
                {(submitResult.vex_pending || 0).toLocaleString()} VEX Tradeable
              </p>
              <p style={{ color: "#666", fontSize: 12, marginBottom: 24 }}>
                Tiempo estimado de acreditación: 24–48 horas
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { reset(); setAmount(""); setTxHash(""); setMyWallet(""); }}
                  style={{ padding: "10px 28px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid rgba(232,184,75,0.4)",
                    background: "rgba(232,184,75,0.1)", color: "#e8b84b",
                    fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 14 }}>
                  Nuevo depósito
                </button>
                <button onClick={() => setTab("historial")}
                  style={{ padding: "10px 28px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid rgba(61,201,107,0.4)",
                    background: "rgba(61,201,107,0.1)", color: "#3DC96B",
                    fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 14 }}>
                  Ver historial
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ ...card, marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>
                  1. Selecciona la red
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {chains.map(c => (
                    <button key={c.key} type="button" onClick={() => setChain(c.key)} style={{
                      padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                      border: chain === c.key ? "1px solid #e8b84b" : "1px solid rgba(255,255,255,0.1)",
                      background: chain === c.key ? "rgba(232,184,75,0.12)" : "transparent",
                      color: chain === c.key ? "#e8b84b" : "#888",
                      fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 13,
                    }}>
                      {c.emoji} {c.label}
                      {c.note && (
                        <span style={{ fontSize: 9, marginLeft: 4, color: "#3DC96B" }}> {c.note}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...card, marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>
                  2. Envía USDT a la dirección de tesoro
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{ ...inp, flex: 1, fontSize: 11, color: "#e8b84b" }}>
                    {chains.find(c => c.key === chain)?.address ?? ""}
                  </code>
                  <button type="button" onClick={copyAddress} style={{
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                    border: "1px solid rgba(232,184,75,0.3)",
                    background: copied ? "rgba(61,201,107,0.15)" : "rgba(232,184,75,0.08)",
                    color: copied ? "#3DC96B" : "#e8b84b",
                    fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 12,
                  }}>
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#E84040", margin: "8px 0 0" }}>
                  ⚠ Incluye tu Player ID como memo en la transacción
                </p>
              </div>

              <div style={{ ...card, marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 14, fontWeight: 700 }}>
                  3. Registra tu depósito
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
                    Monto enviado (USDT) · mínimo $1.99
                  </label>
                  <input type="number" min="1.99" step="0.01" placeholder="9.99"
                    value={amount} onChange={e => setAmount(e.target.value)} style={inp} />
                  {vexPreview > 0 && (
                    <p style={{ fontSize: 12, color: "#3DC96B", marginTop: 6, marginBottom: 0 }}>
                      Recibirás {vexPreview.toLocaleString()} VEX Tradeable
                    </p>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
                    TX Hash (hash de la transacción en tu wallet)
                  </label>
                  <input type="text" placeholder="0xabc123... o TXID..."
                    value={txHash} onChange={e => setTxHash(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
                    Tu dirección de wallet (la que envió)
                  </label>
                  <input type="text" placeholder="Dirección de origen"
                    value={myWallet} onChange={e => setMyWallet(e.target.value)} style={inp} />
                </div>
              </div>

              {error && (
                <div style={{ background: "rgba(232,64,64,0.1)",
                  border: "1px solid rgba(232,64,64,0.3)", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 12, color: "#E84040", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} style={{
                width: "100%", padding: 14, borderRadius: 10,
                border: "1px solid rgba(232,184,75,0.5)",
                background: submitting ? "rgba(232,184,75,0.1)" : "rgba(232,184,75,0.2)",
                color: "#e8b84b", cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 15,
                letterSpacing: "0.05em",
              }}>
                {submitting ? "Enviando..." : "⚡ Enviar depósito"}
              </button>
            </form>
          )}

          <div style={{ ...card, marginTop: 20 }}>
            <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>
              Referencia de precios
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto",
              gap: "6px 20px", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>Pack</span>
              <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>USDT</span>
              <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>VEX</span>
              {PACK_REF.map(p => (
                <>
                  <span key={p.name} style={{ fontSize: 12, color: "#aaa" }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: "#e8b84b",
                    fontFamily: '"IBM Plex Mono",monospace' }}>{p.usdt}</span>
                  <span style={{ fontSize: 12, color: "#4A9EFF",
                    fontFamily: '"IBM Plex Mono",monospace' }}>{p.vex}</span>
                </>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: STRIPE ── */}
      {tab === "stripe" && (
        <div style={{ ...card, textAlign: "center", padding: 52 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💳</div>
          <h2 style={{ fontFamily: '"Cinzel",serif', color: "#e8b84b", marginBottom: 10 }}>
            Próximamente
          </h2>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7,
            maxWidth: 340, margin: "0 auto" }}>
            Pago con tarjeta de crédito/débito via Stripe.<br />
            Acreditará VEX Tradeable igual que crypto, sin necesidad de wallet.
          </p>
        </div>
      )}

      {/* ── TAB: HISTORIAL (AE.2) ── */}
      {tab === "historial" && (
        <div>
          {deposits.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 52 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h2 style={{ fontFamily: '"Cinzel",serif', color: "#888", marginBottom: 10 }}>
                Sin depósitos aún
              </h2>
              <p style={{ color: "#555", fontSize: 13, lineHeight: 1.6 }}>
                Tus depósitos aparecerán aquí tras enviarlos.<br />
                El tiempo de revisión es de 24–48 horas.
              </p>
              <button onClick={() => setTab("crypto")} style={{
                marginTop: 20, padding: "10px 28px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(232,184,75,0.4)",
                background: "rgba(232,184,75,0.1)", color: "#e8b84b",
                fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 14,
              }}>
                Realizar primer depósito
              </button>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{ ...card, marginBottom: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
                    letterSpacing: "0.1em", marginBottom: 4 }}>Total depósitos</div>
                  <div style={{ fontFamily: '"Cinzel",serif', fontSize: 20, color: "#e8b84b" }}>
                    {deposits.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
                    letterSpacing: "0.1em", marginBottom: 4 }}>Total USDT</div>
                  <div style={{ fontFamily: '"Cinzel",serif', fontSize: 20, color: "#e8b84b" }}>
                    ${deposits.reduce((s, d) => s + d.amount_usdt, 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
                    letterSpacing: "0.1em", marginBottom: 4 }}>VEX acreditados</div>
                  <div style={{ fontFamily: '"Cinzel",serif', fontSize: 20, color: "#3DC96B" }}>
                    {deposits
                      .filter(d => d.status === "approved")
                      .reduce((s, d) => s + d.vex_credited, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase",
                    letterSpacing: "0.1em", marginBottom: 4 }}>Pendientes</div>
                  <div style={{ fontFamily: '"Cinzel",serif', fontSize: 20, color: "#e8b84b" }}>
                    {deposits.filter(d => d.status === "pending").length}
                  </div>
                </div>
              </div>

              {/* Deposit list — AE.3: expanded details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deposits.map((d, idx) => (
                  <div key={d.id} style={{
                    ...card,
                    borderLeft: `3px solid ${STATUS_COLOR[d.status] || "#444"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: '"Cinzel",serif', fontSize: 18, color: "#e8b84b" }}>
                          {d.vex_credited.toLocaleString()} VEX Tradeable
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                          ${d.amount_usdt} USDT · {d.chain} · {d.token_symbol}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700,
                          color: STATUS_COLOR[d.status] || "#888" }}>
                          {STATUS_LABEL[d.status] || d.status}
                        </span>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          {new Date(d.created_at).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* TX Hash — expandible */}
                    {d.tx_hash && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
                          letterSpacing: "0.08em", marginBottom: 4 }}>TX Hash</div>
                        <code style={{
                          display: "block",
                          fontSize: 10,
                          color: "#4A9EFF",
                          fontFamily: '"IBM Plex Mono", monospace',
                          wordBreak: "break-all",
                          background: "rgba(74,158,255,0.06)",
                          borderRadius: 6,
                          padding: "6px 10px",
                        }}>
                          {d.tx_hash}
                        </code>
                      </div>
                    )}

                    {/* Deposit index label */}
                    <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>
                      Depósito #{deposits.length - idx}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setTab("crypto")} style={{
                marginTop: 20, padding: "10px 28px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(232,184,75,0.4)",
                background: "rgba(232,184,75,0.1)", color: "#e8b84b",
                fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 14,
              }}>
                + Nuevo depósito
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
