import { useState, useEffect, useCallback } from "react";
import { useToast } from "../shared/context/ToastContext";
import { PageLoader } from "../shared/components/PageLoader";
import { adminGetShopOrders, adminApproveShopOrder, adminRejectShopOrder } from "../domains/admin/shopOrders";
import type { AdminShopOrder } from "../domains/admin/shopOrders";

const C = { bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a", b1:"#1e1e30", b2:"#2a2a3a", gold:"#E8B84B", green:"#3DC96B", red:"#E3573F", muted:"#7a7a9a", main:"#e8e8f0" };
const TABS = ["pending_payment", "approved", "rejected", "all"] as const;
type Tab = typeof TABS[number];
const statusLabel = (s: string) => s === "pending_payment" ? "Pendientes" : s === "approved" ? "Aprobadas" : s === "rejected" ? "Rechazadas" : "Todas";
const date = (s: string) => new Date(s).toLocaleString("es-MX", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

export function AdminShopOrdersRoute() {
  const [tab, setTab] = useState<Tab>("pending_payment");
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const { addToast } = useToast();
  const load = useCallback(async (s: Tab) => {
    setLoading(true); setError(null);
    const r = await adminGetShopOrders(s);
    setLoading(false);
    if (!r.data) { setError(r.reason ?? "No se pudieron cargar las órdenes."); setOrders([]); } else setOrders(r.data);
  }, []);
  useEffect(() => { load(tab); }, [load, tab]);
  async function approve(id: string) { setProcessing(id); const r = await adminApproveShopOrder(id); setProcessing(null); if (r.ok) { addToast("success", "Orden aprobada y fulfilment aplicado."); load(tab); } else addToast("error", r.reason ?? "La orden no puede aprobarse."); }
  async function reject(id: string) { const reason = window.prompt("Motivo del rechazo", "invalid_transaction")?.trim(); if (!reason) return; setProcessing(id); const r = await adminRejectShopOrder(id, reason); setProcessing(null); if (r.ok) { addToast("success", "Orden rechazada."); load(tab); } else addToast("error", r.reason ?? "No se pudo rechazar."); }
  return <div style={{ minHeight:"100vh", background:C.bg0, color:C.main, padding:"26px 16px", fontFamily:"Rajdhani,sans-serif" }}><div style={{ maxWidth:980, margin:"0 auto" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap", marginBottom:22 }}><div><div style={{ color:C.gold, fontFamily:"IBM Plex Mono,monospace", fontSize:10, letterSpacing:".12em" }}>ADMIN · COMPRAS DE TIENDA</div><h1 style={{ margin:"6px 0 0", fontFamily:"Cinzel,serif", fontSize:24 }}>Órdenes comerciales</h1><div style={{ color:C.muted, fontSize:12, marginTop:5 }}>Pago confirmado por revisión administrativa · fulfilment server-owned</div></div><button onClick={() => load(tab)} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid "+C.b2, background:"transparent", color:C.muted, cursor:"pointer" }}>Actualizar</button></div>
    <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:18 }}>{TABS.map(s => <button key={s} onClick={() => setTab(s)} style={{ padding:"7px 13px", borderRadius:8, border:"1px solid "+(tab===s?C.gold+"66":C.b2), background:tab===s?C.gold+"18":"transparent", color:tab===s?C.gold:C.muted, cursor:"pointer", fontSize:12 }}>{statusLabel(s)}</button>)}</div>
    {loading && <PageLoader />}{error && <div style={{ padding:14, borderRadius:8, color:C.red, background:C.red+"15", border:"1px solid "+C.red+"44" }}>{error}</div>}
    {!loading && !error && orders.length===0 && <div style={{ color:C.muted, textAlign:"center", padding:42 }}>No hay órdenes en este estado.</div>}
    <div style={{ display:"grid", gap:10 }}>{!loading && !error && orders.map(o => <div key={o.id} style={{ background:C.bg1, border:"1px solid "+C.b1, borderRadius:11, padding:16 }}><div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}><div><div style={{ color:C.main, fontWeight:800 }}>{o.item_name} · ${Number(o.price_usdt).toFixed(2)} USDT</div><div style={{ color:C.muted, fontSize:11, marginTop:4 }}>Jugador: {o.display_name ?? o.player_id.slice(0,8) ?? o.player_id} · {date(o.created_at)}</div><div style={{ color:C.muted, fontSize:10, marginTop:3, fontFamily:"monospace" }}>Orden {o.id}</div></div><div style={{ color:o.status==="approved"?C.green:o.status==="rejected"?C.red:C.gold, fontWeight:800, fontSize:12 }}>{statusLabel(o.status)} · {o.fulfillment_status}</div></div><div style={{ marginTop:12, display:"grid", gap:5, fontSize:11, color:C.muted }}><div>TX: <span style={{ color:C.main, fontFamily:"monospace", wordBreak:"break-all" }}>{o.tx_hash ?? "No registrado"}</span></div><div>Wallet pagadora: <span style={{ color:C.main, fontFamily:"monospace", wordBreak:"break-all" }}>{o.payer_wallet_address ?? "No registrada"}</span></div><div>Tesorería: <span style={{ color:C.main, fontFamily:"monospace", wordBreak:"break-all" }}>{o.treasury_wallet_address}</span></div></div>{o.status==="pending_payment" && <div style={{ display:"flex", gap:8, marginTop:14 }}><button disabled={processing===o.id} onClick={() => approve(o.id)} style={{ padding:"7px 14px", borderRadius:7, border:"1px solid "+C.green+"55", background:"transparent", color:C.green, fontWeight:700, cursor:"pointer" }}>{processing===o.id?"…":"Aprobar y entregar"}</button><button disabled={processing===o.id} onClick={() => reject(o.id)} style={{ padding:"7px 14px", borderRadius:7, border:"1px solid "+C.red+"55", background:"transparent", color:C.red, fontWeight:700, cursor:"pointer" }}>Rechazar</button></div>}</div>)}</div>
  </div></div>;
}
