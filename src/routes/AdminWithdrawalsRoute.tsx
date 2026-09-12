// AdminWithdrawalsRoute — Y.2 — chat81 — Admin retiros panel
import { useState, useEffect, useCallback } from "react";
import {
  adminGetWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
} from "../domains/admin/withdrawalsAdmin";
import type { AdminWithdrawalDetailed } from "../domains/admin/withdrawalsAdmin";
import { PageLoader } from "../shared/components/PageLoader";
import { useToast }   from "../shared/context/ToastContext";

type StatusTab = "pending_review" | "approved" | "rejected" | "all";

const TABS: { id: StatusTab; label: string }[] = [
  { id:"pending_review", label:"Pendientes" },
  { id:"approved",       label:"Aprobados"  },
  { id:"rejected",       label:"Rechazados" },
  { id:"all",            label:"Todos"       },
];

const STATUS_COLOR: Record<string, string> = {
  pending_review:"#e8b84b", approved:"#3ddc84", rejected:"#e3573f",
};

const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30",  b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#E3573F",
  blue:"#4A9EFF", muted:"#7a7a9a", main:"#e8e8f0",
};

function fmtUsd(n: number | null | undefined): string {
  return n != null ? "$" + Number(n).toFixed(2) : "—";
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}

interface RowProps {
  wr: AdminWithdrawalDetailed;
  processing: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}
function WithdrawalAdminRow({ wr, processing, onApprove, onReject }: RowProps) {
  const sc  = STATUS_COLOR[wr.status] ?? C.muted;
  const busy = processing === wr.id;
  return (
    <div style={{
      background:C.bg1, border:"1px solid " + C.b1, borderRadius:10,
      padding:"14px 18px", display:"flex", gap:14, flexWrap:"wrap", alignItems:"center",
    }}>
      <div style={{ flex:1, minWidth:160 }}>
        <div style={{ color:C.main, fontWeight:700, fontSize:13, fontFamily:"Rajdhani,sans-serif" }}>
          {wr.tradeable_amount.toLocaleString()} VEX
        </div>
        <div style={{ color:C.muted, fontSize:10, marginTop:2 }}>{fmtDate(wr.created_at)}</div>
        <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
          marginTop:2, overflow:"hidden", textOverflow:"ellipsis", maxWidth:200 }}>
          {wr.player_id.slice(0,16)}...
        </div>
      </div>
      <div style={{ textAlign:"right", minWidth:110 }}>
        <div style={{ color:"#22c55e", fontWeight:700, fontSize:14 }}>{fmtUsd(wr.usdt_net)}</div>
        <div style={{ color:C.muted, fontSize:10 }}>
          bruto {fmtUsd(wr.usdt_gross)} — fee {fmtUsd(wr.fee_usdt)}
        </div>
      </div>
      <div style={{
        padding:"4px 12px", borderRadius:99, fontSize:10, fontWeight:700,
        background:sc + "18", color:sc, border:"1px solid " + sc + "44",
        fontFamily:'"IBM Plex Mono",monospace', whiteSpace:"nowrap" as const,
      }}>
        {wr.status.replace("_", " ")}
      </div>
      {wr.status === "pending_review" && (
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => onApprove(wr.id)}
            disabled={busy}
            style={{
              padding:"6px 14px", borderRadius:7, border:"1px solid #3ddc8444",
              background:busy ? C.bg2 : "transparent", color:busy ? C.muted : C.green,
              fontSize:11, fontWeight:700, cursor:busy ? "not-allowed" : "pointer",
            }}>
            {busy ? "..." : "Aprobar"}
          </button>
          <button
            onClick={() => onReject(wr.id)}
            disabled={busy}
            style={{
              padding:"6px 14px", borderRadius:7, border:"1px solid #e3573f44",
              background:busy ? C.bg2 : "transparent", color:busy ? C.muted : C.red,
              fontSize:11, fontWeight:700, cursor:busy ? "not-allowed" : "pointer",
            }}>
            Rechazar
          </button>
        </div>
      )}
      {wr.payout_tx_hash && (
        <div style={{ color:C.blue, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
          width:"100%", marginTop:4 }}>
          tx: {wr.payout_tx_hash}
        </div>
      )}
      {wr.rejected_reason && (
        <div style={{ color:C.red, fontSize:10, width:"100%", marginTop:4 }}>
          Motivo: {wr.rejected_reason}
        </div>
      )}
    </div>
  );
}

export function AdminWithdrawalsRoute() {
  const [tab, setTab]             = useState<StatusTab>("pending_review");
  const [list, setList]           = useState<AdminWithdrawalDetailed[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { addToast } = useToast();

  const load = useCallback(async (s: StatusTab) => {
    setLoading(true); setError(null);
    const r = await adminGetWithdrawals(s);
    setLoading(false);
    if (!r.data) setError(r.reason ?? "Error al cargar retiros.");
    else setList(r.data);
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  async function handleApprove(id: string) {
    setProcessing(id);
    const r = await adminApproveWithdrawal(id);
    setProcessing(null);
    if (r.ok) { addToast("success", "Retiro aprobado."); load(tab); }
    else addToast("error", r.reason ?? "Error al aprobar.");
  }

  function openReject(id: string) { setRejectTarget(id); setRejectReason(""); }

  async function confirmReject() {
    if (!rejectTarget) return;
    setProcessing(rejectTarget);
    const r = await adminRejectWithdrawal(rejectTarget, rejectReason || "Rechazado por admin.");
    setProcessing(null); setRejectTarget(null);
    if (r.ok) { addToast("success", "Retiro rechazado."); load(tab); }
    else addToast("error", r.reason ?? "Error al rechazar.");
  }

  const pending = list.filter(w => w.status === "pending_review").length;

  return (
    <div style={{ padding:"28px 24px", maxWidth:800, margin:"0 auto", fontFamily:"Rajdhani,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ color:C.gold, fontSize:11, fontFamily:'"IBM Plex Mono",monospace',
          letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
          Admin Panel
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <h1 style={{ color:C.main, fontFamily:"Cinzel,serif", fontSize:24, margin:0, fontWeight:700 }}>
            Gestion de Retiros
          </h1>
          {pending > 0 && (
            <span style={{
              background:"#e8b84b22", color:C.gold, border:"1px solid #e8b84b44",
              borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700,
            }}>
              {pending} pendientes
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding:"7px 16px", borderRadius:8, fontSize:11, fontWeight:700,
              fontFamily:"Rajdhani,sans-serif",
              cursor:"pointer",
              background:tab === t.id ? C.gold + "22" : "transparent",
              color:tab === t.id ? C.gold : C.muted,
              border:"1px solid " + (tab === t.id ? C.gold + "55" : C.b2),
              transition:"all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <PageLoader />}
      {error && (
        <div style={{ background:"#1a0808", border:"1px solid #e3573f44",
          borderRadius:8, padding:"12px 16px", color:C.red, fontSize:12 }}>
          {error}
        </div>
      )}
      {!loading && !error && list.length === 0 && (
        <div style={{ textAlign:"center", color:C.muted, fontSize:12, marginTop:32 }}>
          No hay retiros en esta categoria.
        </div>
      )}
      {!loading && !error && list.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {list.map(wr => (
            <WithdrawalAdminRow
              key={wr.id} wr={wr}
              processing={processing}
              onApprove={handleApprove}
              onReject={openReject}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999,
        }}>
          <div style={{
            background:C.bg1, border:"1px solid " + C.b2,
            borderRadius:14, padding:"28px 32px", width:380, maxWidth:"90vw",
          }}>
            <div style={{ color:C.main, fontFamily:"Cinzel,serif", fontSize:16,
              fontWeight:700, marginBottom:16 }}>Rechazar Retiro</div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (opcional)"
              rows={3}
              style={{
                width:"100%", boxSizing:"border-box" as const,
                background:C.bg2, border:"1px solid " + C.b2,
                borderRadius:8, padding:"10px 12px",
                color:C.main, fontSize:13, fontFamily:"Rajdhani,sans-serif",
                resize:"vertical" as const, outline:"none", marginBottom:16,
              }}
            />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setRejectTarget(null)}
                style={{ padding:"8px 18px", borderRadius:8, border:"1px solid " + C.b2,
                  background:"transparent", color:C.muted, cursor:"pointer", fontSize:12 }}>
                Cancelar
              </button>
              <button onClick={confirmReject}
                style={{ padding:"8px 18px", borderRadius:8, border:"1px solid #e3573f44",
                  background:"transparent", color:C.red, cursor:"pointer",
                  fontSize:12, fontWeight:700 }}>
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}