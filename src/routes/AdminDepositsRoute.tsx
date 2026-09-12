import { useState, useEffect } from "react";
import { useToast } from "../shared/context/ToastContext";
import {
  adminGetDeposits,
  adminApproveDeposit,
  adminRejectDeposit,
} from "../domains/admin/depositsAdmin";
import type { AdminDeposit } from "../domains/admin/depositsAdmin";

const STATUS_TABS = ["pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_COLOR: Record<string, string> = {
  pending:  "#E8B84B",
  approved: "#3DC96B",
  rejected: "#FF4B4B",
};

const CHAIN_EMOJI: Record<string, string> = {
  ETH: "E", BSC: "B", SOL: "S", TON: "T", TRON: "R",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AdminDepositsRoute() {
  const [tab, setTab]               = useState<StatusTab>("pending");
  const [deposits, setDeposits]     = useState<AdminDeposit[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { addToast } = useToast();

  async function loadDeposits(status: StatusTab) {
    setLoading(true); setError(null);
    const result = await adminGetDeposits(status);
    setLoading(false);
    if (!result.data) { setError(result.reason ?? "Error cargando depositos."); setDeposits([]); }
    else { setDeposits(result.data); }
  }

  useEffect(() => { loadDeposits(tab); }, [tab]);


  async function handleApprove(id: string) {
    setProcessing(id);
    const r = await adminApproveDeposit(id);
    setProcessing(null);
    if (r.ok) {
      const credited = r.vex_credited ? r.vex_credited.toLocaleString() : "0";
      addToast("success", "Deposito aprobado — +" + credited + " VEX acreditados");
      loadDeposits(tab);
    } else {
      addToast("error", "Error", r.reason ?? "Error desconocido");
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    const r = await adminRejectDeposit(id, rejectReason.trim());
    setProcessing(null);
    setRejectTarget(null); setRejectReason("");
    if (r.ok) { addToast("success", "Deposito rechazado"); loadDeposits(tab); }
    else { addToast("error", "Error", r.reason ?? "Error desconocido"); }
  }

  const bg0 = "#0d0d14";
  const bg1 = "#12121f";
  const border1 = "#1e1e30";
  const border2 = "#2a2a3a";
  const textMuted = "#7a7a9a";
  const textDim = "#5a5a7a";
  const textMain = "#e8e8f0";
  const gold = "#E8B84B";
  const green = "#3DC96B";
  const red = "#FF4B4B";

  return (
    <div style={{ minHeight: "100vh", background: bg0, color: textMain, padding: "24px 16px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 28 }}>{"shield"}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: gold, letterSpacing: 1 }}>
              ADMIN — Depositos
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: textMuted }}>
              Panel de gestion de depositos USDT a VEX
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              style={{
                padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13, textTransform: "capitalize",
                background: tab === s ? STATUS_COLOR[s] : bg1,
                color: tab === s ? bg0 : textMuted,
                transition: "all 0.2s",
              }}
            >{s}</button>
          ))}
          <button
            onClick={() => loadDeposits(tab)}
            style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid " + border2, background: "transparent", color: textMuted, cursor: "pointer", fontSize: 13 }}
          >
            Actualizar
          </button>
        </div>

        {/* Loading */}
        {loading && <div style={{ textAlign: "center", padding: "60px 0", color: textMuted }}>Cargando depositos…</div>}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,75,75,0.1)", border: "1px solid " + red, color: red, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && deposits.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: textMuted }}>
            <p>No hay depositos con estado <strong>{tab}</strong></p>
          </div>
        )}

        {/* Deposit Cards */}
        {!loading && !error && deposits.map((dep) => (
          <div key={dep.id} style={{
            background: bg1, border: "1px solid " + border1, borderRadius: 12,
            padding: 18, marginBottom: 12,
            borderLeft: "4px solid " + (STATUS_COLOR[dep.status] ?? "#4A9EFF"),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  {(CHAIN_EMOJI[dep.chain] ?? "?") + " " + dep.chain + " / " + dep.token_symbol}
                  <span style={{ marginLeft: 10, fontSize: 18, color: gold, fontWeight: 800 }}>
                    {"$" + dep.amount_usdt.toFixed(2) + " USDT"}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 14, color: green }}>
                    {"-> " + dep.vex_credited.toLocaleString() + " VEX"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginBottom: 2 }}>
                  Jugador: <strong style={{ color: "#c8c8e0" }}>{dep.display_name ?? dep.player_id.slice(0, 8)}</strong>
                </div>
                {dep.tx_hash && (
                  <div style={{ fontSize: 11, color: textDim, wordBreak: "break-all" }}>TxHash: {dep.tx_hash}</div>
                )}
                {dep.payer_wallet_address && (
                  <div style={{ fontSize: 11, color: textDim, wordBreak: "break-all" }}>Wallet: {dep.payer_wallet_address}</div>
                )}
                {dep.notes && (
                  <div style={{ fontSize: 12, color: "#9a9ab0", marginTop: 4 }}>Nota: {dep.notes}</div>
                )}
                <div style={{ fontSize: 11, color: textDim, marginTop: 4 }}>{formatDate(dep.created_at)}</div>
              </div>

              {/* Actions — only for pending */}
              {dep.status === "pending" && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove(dep.id)}
                    disabled={processing === dep.id}
                    style={{
                      padding: "7px 16px", borderRadius: 8, border: "none",
                      cursor: processing === dep.id ? "not-allowed" : "pointer",
                      background: processing === dep.id ? "#1a3a25" : green,
                      color: processing === dep.id ? green : bg0,
                      fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {processing === dep.id ? "..." : "Aprobar"}
                  </button>
                  <button
                    onClick={() => { setRejectTarget(dep.id); setRejectReason(""); }}
                    disabled={processing === dep.id}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: "1px solid " + red,
                      cursor: "pointer", background: "transparent",
                      color: red, fontWeight: 700, fontSize: 13,
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>

            {/* Reject panel inline */}
            {rejectTarget === dep.id && (
              <div style={{ marginTop: 12, padding: 12, background: bg0, borderRadius: 8, border: "1px solid " + red }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: red }}>Motivo del rechazo:</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="invalid_transaction / duplicate / test"
                    style={{
                      flex: 1, padding: "7px 12px", borderRadius: 6,
                      border: "1px solid " + border2,
                      background: bg1, color: textMain, fontSize: 13,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReject(dep.id);
                      if (e.key === "Escape") setRejectTarget(null);
                    }}
                  />
                  <button
                    onClick={() => handleReject(dep.id)}
                    disabled={!rejectReason.trim() || processing === dep.id}
                    style={{
                      padding: "7px 14px", borderRadius: 6, border: "none",
                      background: rejectReason.trim() ? red : border2,
                      color: "#fff", fontWeight: 700,
                      cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                    }}
                  >Confirmar</button>
                  <button
                    onClick={() => setRejectTarget(null)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid " + border2, background: "transparent", color: textMuted, cursor: "pointer" }}
                  >X</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loop summary */}
        <div style={{ marginTop: 32, padding: 14, borderRadius: 10, background: bg1, border: "1px solid " + border1, fontSize: 12, color: textDim }}>
          <strong style={{ color: textMuted }}>Loop monetizacion: </strong>
          Jugador deposita USDT -&gt; Admin aprueba aqui -&gt; VEX acreditados -&gt; Jugador compra packs en /packs -&gt; Pack abierto -&gt; Cartas en inventario
        </div>
      </div>
    </div>
  );
}