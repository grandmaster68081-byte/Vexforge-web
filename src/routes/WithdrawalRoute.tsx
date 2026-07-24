// WithdrawalRoute — Y.2 — chat81 — Flujo de retiro VEX Tradeable → USDT
import { useState, useEffect } from "react";
import { useWithdrawal } from "../domains/withdrawal/useWithdrawal";
import { PageLoader }       from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast }         from "../shared/context/ToastContext";
import type { WithdrawalRequest } from "../domains/withdrawal/repository";

// ─── Constants ────────────────────────────────────────────────────────────────
const RATE    = 100;    // 100 VEX tradeable = 1 USDT
const FEE_PCT = 0.08;   // 8%
const MIN_VEX = 2500;

const STATUS_COLOR: Record<string, string> = {
  pending_review: "#e8b84b",
  approved:       "#3ddc84",
  rejected:       "#e3573f",
};
const STATUS_LABEL: Record<string, string> = {
  pending_review: "En revision",
  approved:       "Aprobado",
  rejected:       "Rechazado",
};

const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30",  b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#E3573F",
  blue:"#4A9EFF", muted:"#7a7a9a", main:"#e8e8f0",
};

function fmtUsd(n: number | undefined): string {
  return n != null ? "$" + n.toFixed(2) : "—";
}
function fmtVex(n: number): string {
  return n.toLocaleString() + " VEX";
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}
function calcFees(vex: number) {
  const gross = vex / RATE;
  const fee   = gross * FEE_PCT;
  const net   = Math.max(gross - fee, 0);
  return { gross, fee, net };
}

// ─── Withdrawal history row ──────────────────────────────────────────────────
function WithdrawalRow({ wr }: { wr: WithdrawalRequest }) {
  const sc  = STATUS_COLOR[wr.status] ?? C.muted;
  const lbl = STATUS_LABEL[wr.status] ?? wr.status;
  return (
    <div style={{
      background:C.bg1, border:"1px solid " + C.b1,
      borderRadius:10, padding:"14px 18px",
      display:"flex", alignItems:"center", gap:14, flexWrap:"wrap",
    }}>
      <div style={{ flex:1, minWidth:120 }}>
        <div style={{ color:C.main, fontWeight:700, fontFamily:"Rajdhani,sans-serif", fontSize:13 }}>
          {fmtVex(wr.tradeable_amount)}
        </div>
        <div style={{ color:C.muted, fontSize:10, marginTop:2 }}>{fmtDate(wr.created_at)}</div>
      </div>
      <div style={{ textAlign:"right", minWidth:110 }}>
        <div style={{ color:"#22c55e", fontWeight:700, fontSize:13 }}>
          {fmtUsd(wr.usdt_net)} USDT
        </div>
        <div style={{ color:C.muted, fontSize:10 }}>
          bruto {fmtUsd(wr.usdt_gross)} — fee {fmtUsd(wr.fee_usdt)}
        </div>
      </div>
      <div style={{
        padding:"4px 12px", borderRadius:99, fontSize:10, fontWeight:700,
        background:sc + "18", color:sc, border:"1px solid " + sc + "44",
        fontFamily:'"IBM Plex Mono",monospace',
      }}>
        {lbl}
      </div>
      {wr.payout_tx_hash && (
        <div style={{ color:C.blue, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
          overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }}>
          tx: {wr.payout_tx_hash.slice(0,16)}...
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

// ─── Main Route ──────────────────────────────────────────────────────────────
export function WithdrawalRoute() {
  const { withdrawals, balance, requesting, request } = useWithdrawal();
  const { addToast } = useToast();
  const [authed, setAuthed]     = useState<boolean | null>(null);
  const [amount, setAmount]     = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errMsg, setErrMsg]     = useState<string | null>(null);

  useEffect(() => {
    import("../lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    });
  }, []);

  if (authed === null || withdrawals.status === "loading") return <PageLoader />;
  if (!authed || withdrawals.status === "blocked_auth") return <BlockedAuthState />;

  const vex      = parseFloat(amount) || 0;
  const fees     = calcFees(vex);
  const avail    = balance?.balance ?? 0;
  const valid    = vex >= MIN_VEX && avail >= vex;
  const hasPending = balance?.pending ||
    (withdrawals.data ?? []).some(w => w.status === "pending_review");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !confirmed || requesting) return;
    setErrMsg(null);
    const res = await request(vex);
    if (res.ok) {
      addToast("success", "Retiro solicitado — recibirás ~" + fmtUsd(res.usdt_net) + " USDT");
      setAmount(""); setConfirmed(false);
    } else {
      const msg = res.reason ?? "Error al solicitar retiro.";
      setErrMsg(msg);
      addToast("error", msg);
    }
  }

  const histList = withdrawals.data ?? [];

  return (
    <div style={{ padding:"28px 24px", maxWidth:680, margin:"0 auto", fontFamily:"Rajdhani,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ color:C.gold, fontSize:11, fontFamily:'"IBM Plex Mono",monospace',
          letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
          VEX Forge
        </div>
        <h1 style={{ color:C.main, fontFamily:"Cinzel,serif", fontSize:26, margin:0, fontWeight:700 }}>
          Retiro de Fondos
        </h1>
        <p style={{ color:C.muted, fontSize:13, margin:"6px 0 0" }}>
          Convierte VEX Tradeable en USDT. Tasa: 100 VEX = 1 USDT · Comision: 8%
        </p>
      </div>

      {/* Balance card */}
      <div style={{
        background:"linear-gradient(135deg,#1a2a18,#0f1a0e)",
        border:"1px solid #3ddc8444", borderRadius:14, padding:"20px 24px",
        marginBottom:24, display:"flex", gap:32, flexWrap:"wrap", alignItems:"center",
      }}>
        <div>
          <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>
            VEX Disponible
          </div>
          <div style={{ color:C.green, fontFamily:"Cinzel,serif", fontSize:28, fontWeight:700 }}>
            {avail.toLocaleString()}
            <span style={{ fontSize:13, color:C.muted, fontFamily:"Rajdhani,sans-serif",
              fontWeight:400, marginLeft:6 }}>VEX</span>
          </div>
        </div>
        {(balance?.locked ?? 0) > 0 && (
          <div>
            <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
              letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>
              Bloqueado
            </div>
            <div style={{ color:C.gold, fontFamily:"Cinzel,serif", fontSize:22, fontWeight:700 }}>
              {(balance?.locked ?? 0).toLocaleString()}
              <span style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani,sans-serif",
                fontWeight:400, marginLeft:6 }}>VEX</span>
            </div>
          </div>
        )}
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>
            USDT aprox.
          </div>
          <div style={{ color:"#22c55e", fontFamily:"Cinzel,serif", fontSize:22, fontWeight:700 }}>
            {fmtUsd((avail / RATE) * (1 - FEE_PCT))}
          </div>
        </div>
      </div>

      {/* Pending notice */}
      {hasPending && (
        <div style={{
          background:"#1a1a08", border:"1px solid #e8b84b55", borderRadius:10,
          padding:"16px 20px", marginBottom:24, display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <span style={{ fontSize:20 }}>{"⏳"}</span>
          <div>
            <div style={{ color:C.gold, fontWeight:700, fontSize:13 }}>Retiro en proceso</div>
            <div style={{ color:C.muted, fontSize:11, marginTop:3 }}>
              Tienes un retiro pendiente de revision. Solo puedes tener uno activo a la vez.
              El equipo de VEXFORGE lo procesara en 24-72h habiles.
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal form */}
      {!hasPending && (
        <div style={{
          background:C.bg1, border:"1px solid " + C.b1, borderRadius:14,
          padding:"24px", marginBottom:24,
        }}>
          <div style={{ color:C.main, fontFamily:"Cinzel,serif", fontSize:15, fontWeight:700,
            marginBottom:18 }}>
            Solicitar Retiro
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ color:C.muted, fontSize:11, fontFamily:'"IBM Plex Mono",monospace',
                letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
                Cantidad VEX Tradeable (min. {MIN_VEX.toLocaleString()})
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrMsg(null); setConfirmed(false); }}
                placeholder="2500"
                min={MIN_VEX}
                max={avail}
                step="100"
                style={{
                  width:"100%", boxSizing:"border-box" as const,
                  background:C.bg2, border:"1px solid " + (amount && !valid ? C.red + "88" : C.b2),
                  borderRadius:8, padding:"10px 14px",
                  color:C.main, fontSize:15, fontFamily:"Rajdhani,sans-serif", outline:"none",
                }}
              />
              {!!amount && vex < MIN_VEX && (
                <div style={{ color:C.red, fontSize:10, marginTop:4 }}>
                  Minimo: {MIN_VEX.toLocaleString()} VEX
                </div>
              )}
              {!!amount && vex > 0 && vex > avail && (
                <div style={{ color:C.red, fontSize:10, marginTop:4 }}>
                  Saldo insuficiente
                </div>
              )}
            </div>

            {/* Fee breakdown */}
            {vex >= MIN_VEX && (
              <div style={{
                background:C.bg2, border:"1px solid " + C.b1, borderRadius:10,
                padding:"14px 18px", marginBottom:16,
              }}>
                <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
                  letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
                  Desglose
                </div>
                {[
                  { label:"VEX a retirar", val: fmtVex(vex),            color:C.main },
                  { label:"USDT bruto",    val: fmtUsd(fees.gross),      color:C.main },
                  { label:"Comision 8%",   val: "-" + fmtUsd(fees.fee),  color:C.red  },
                  { label:"USDT neto",     val: fmtUsd(fees.net),        color:"#22c55e" },
                ].map(row => (
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:6 }}>
                    <span style={{ color:C.muted, fontSize:11 }}>{row.label}</span>
                    <span style={{ color:row.color, fontWeight:700, fontSize:12,
                      fontFamily:'"IBM Plex Mono",monospace' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm */}
            {valid && (
              <label style={{ display:"flex", alignItems:"flex-start", gap:10,
                marginBottom:16, cursor:"pointer" }}>
                <input type="checkbox" checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ marginTop:2, accentColor:C.gold }} />
                <span style={{ color:C.muted, fontSize:11, lineHeight:1.5 }}>
                  Confirmo que la comision del 8% es no reembolsable y que el proceso
                  puede tardar 24-72 horas habiles.
                </span>
              </label>
            )}

            <button type="submit" disabled={!valid || !confirmed || requesting}
              style={{
                width:"100%", padding:"12px", borderRadius:9,
                fontFamily:"Cinzel,serif", fontSize:14, fontWeight:700,
                cursor: valid && confirmed ? "pointer" : "not-allowed",
                background: valid && confirmed
                  ? "linear-gradient(90deg,#e8b84b,#d4a03a)" : C.bg2,
                color: valid && confirmed ? "#0d0d14" : C.muted,
                border: valid && confirmed ? "none" : "1px solid " + C.b2,
                transition:"all 0.2s",
              }}>
              {requesting ? "Procesando..." : "Solicitar Retiro"}
            </button>
          </form>

          {errMsg && (
            <div style={{
              marginTop:14, background:"#1a0808",
              border:"1px solid #e3573f44", borderRadius:8,
              padding:"12px 16px", color:C.red, fontSize:12,
            }}>
              {errMsg}
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div style={{
        background:C.bg1, border:"1px solid " + C.b1,
        borderRadius:12, padding:"16px 20px", marginBottom:24,
      }}>
        <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
          Como funciona
        </div>
        {([
          ["1. Solicita", "Ingresa la cantidad de VEX Tradeable (min. 2,500 VEX = 25 USDT bruto)."],
          ["2. Revision", "El equipo VEXFORGE verifica y aprueba en 24-72h habiles."],
          ["3. Pago",     "Recibes el USDT neto (bruto - 8% comision) en tu wallet registrada."],
        ] as [string,string][]).map(([t, d]) => (
          <div key={t} style={{ display:"flex", gap:12, marginBottom:8 }}>
            <span style={{ color:C.gold, fontWeight:800, fontSize:12, minWidth:90,
              fontFamily:"Rajdhani,sans-serif" }}>{t}</span>
            <span style={{ color:C.muted, fontSize:11 }}>{d}</span>
          </div>
        ))}
      </div>

      {/* History */}
      {histList.length > 0 && (
        <div>
          <div style={{ color:C.muted, fontSize:10, fontFamily:'"IBM Plex Mono",monospace',
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>
            Historial de Retiros
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {histList.map(wr => <WithdrawalRow key={wr.id} wr={wr} />)}
          </div>
        </div>
      )}
      {histList.length === 0 && !hasPending && (
        <div style={{ textAlign:"center", color:C.muted, fontSize:12, marginTop:20, paddingBottom:40 }}>
          Aun no tienes retiros. Acumula VEX Tradeable y empieza a ganar.
        </div>
      )}
    </div>
  );
}