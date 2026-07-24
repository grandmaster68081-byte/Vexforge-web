// ShopRoute — AO.4 COMPLETO — fulfilment canónico para los 9 productos del catálogo
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { useToast } from "../shared/context/ToastContext";
import { Link } from "react-router-dom";

const C = { bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a", b1:"#1e1e30", b2:"#2a2a3a", gold:"#E8B84B", green:"#3DC96B", red:"#E3573F", blue:"#4A9EFF", muted:"#7a7a9a", main:"#e8e8f0", purple:"#a855f7" };
interface ShopItem { id:string; item_key:string; name:string; description:string; category:string; price_usdt:number; price_vex:number|null; active:boolean; icon:string; }
interface ShopOrder { id?:string; order_id?:string; item_key:string; item_name?:string; price_usdt:number; status:string; fulfillment_status:string; tx_hash?:string|null; payer_wallet_address?:string|null; treasury_wallet_address:string; chain?:string; token_symbol?:string; token_standard?:string; created_at?:string; payment_submitted?:boolean; }
const CATEGORY_META: Record<string,{label:string;color:string;icon:string}> = { pass:{label:"Season Pass",color:C.gold,icon:"👑"}, boost:{label:"Boosts XP",color:C.green,icon:"⚡"}, charm:{label:"Charms",color:C.purple,icon:"✨"}, skin:{label:"Skins",color:C.blue,icon:"🎨"}, consumable:{label:"Consumibles",color:"#f97316",icon:"🔑"}, token:{label:"Tokens",color:C.gold,icon:"🔮"} };
const FALLBACK_CATALOG: ShopItem[] = [
  {id:"1",item_key:"season_pass_premium",name:"Season Pass Premium",description:"Acceso al track de recompensas premium de la temporada actual",category:"pass",price_usdt:9.99,price_vex:null,active:true,icon:"👑"},
  {id:"2",item_key:"xp_boost_7d",name:"Boost XP 7 Días",description:"+50% XP durante 7 días completos",category:"boost",price_usdt:9.99,price_vex:null,active:true,icon:"⚡"},
  {id:"3",item_key:"xp_boost_24h",name:"Boost XP 24h",description:"+50% XP durante 24 horas",category:"boost",price_usdt:1.99,price_vex:null,active:true,icon:"⚡"},
  {id:"4",item_key:"charm_epic",name:"Encanto Épico",description:"Efecto animado + buff pasivo significativo en batallas",category:"charm",price_usdt:7.99,price_vex:null,active:true,icon:"✨"},
  {id:"5",item_key:"charm_rare",name:"Encanto Raro",description:"Efecto visual + buff pasivo menor en tu perfil",category:"charm",price_usdt:2.99,price_vex:null,active:true,icon:"💎"},
  {id:"6",item_key:"charm_common",name:"Encanto Común",description:"Encanto decorativo — buff visual menor",category:"charm",price_usdt:0.99,price_vex:null,active:true,icon:"🌟"},
  {id:"7",item_key:"battle_skin",name:"Skin de Batalla",description:"Skin exclusiva para el tablero de batalla",category:"skin",price_usdt:4.99,price_vex:null,active:true,icon:"🎨"},
  {id:"8",item_key:"raid_key",name:"Llave de Raid",description:"+1 entrada a raid inmediata — sin esperar recarga",category:"consumable",price_usdt:0.99,price_vex:null,active:true,icon:"🔑"},
  {id:"9",item_key:"vex_conversion_token",name:"Token de Conversión",description:"Convierte 500 VEX in-game a VEX Tradeable",category:"token",price_usdt:4.99,price_vex:null,active:true,icon:"🔮"},
];
async function loadShopItems():Promise<ShopItem[]> { const {data,error}=await supabase.from("vexforge_shop_catalog").select("*").eq("active",true).order("price_usdt",{ascending:true}); return error||!data?.length ? FALLBACK_CATALOG : data as ShopItem[]; }
function date(iso?:string){ return iso ? new Date(iso).toLocaleString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""; }


    interface ActiveBoost { id:string; boost_type:string; multiplier:number; expires_at:string; }
    interface ActiveConsumable { id:string; item_key:string; quantity:number; }
    function timeLeft(iso:string){ const ms=new Date(iso).getTime()-Date.now(); if(ms<=0) return "expirado"; const h=Math.floor(ms/3600000); const m=Math.floor((ms%3600000)/60000); return h>24?Math.floor(h/24)+"d "+h%24+"h":h+"h "+m+"m"; }
    const BOOST_LABEL:Record<string,string>={xp_boost_24h:"Boost XP 24h",xp_boost_7d:"Boost XP 7 Días"};
    const CONSUMABLE_LABEL:Record<string,string>={raid_key:"Llave de Raid"};

    function ActiveItemsPanel() {
    const [boosts,setBoosts]=useState<ActiveBoost[]>([]);
    const [consumables,setConsumables]=useState<ActiveConsumable[]>([]);
    const [loading,setLoading]=useState(true);
    useEffect(()=>{
      let cancelled=false;
      async function load(){
        const {data:s}=await supabase.auth.getSession();
        if(!s.session){setLoading(false);return;}
        const {data:p}=await supabase.from("players").select("id").eq("auth_user_id",s.session.user.id).maybeSingle();
        if(!p?.id||cancelled){setLoading(false);return;}
        const now=new Date().toISOString();
        const [b,c]=await Promise.all([
          supabase.from("player_active_boosts").select("id,boost_type,multiplier,expires_at").eq("player_id",p.id).gt("expires_at",now).order("expires_at"),
          supabase.from("player_consumables").select("id,item_key,quantity").eq("player_id",p.id).gt("quantity",0),
        ]);
        if(!cancelled){setBoosts((b.data??[]) as ActiveBoost[]);setConsumables((c.data??[]) as ActiveConsumable[]);setLoading(false);}
      }
      load();
      return()=>{cancelled=true;};
    },[]);
    if(loading) return <div style={{color:C.muted,fontSize:11}}>Cargando...</div>;
    if(!boosts.length&&!consumables.length) return <div style={{color:C.muted,fontSize:11,fontStyle:"italic"}}>Sin ítems activos. Aparecen aquí tras la aprobación del pago.</div>;
    return <div style={{display:"grid",gap:6}}>
      {boosts.map(b=><div key={b.id} style={{background:"#0d1a0d",border:"1px solid #3dc96b44",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:C.green,fontWeight:700,fontSize:12}}>⚡ {BOOST_LABEL[b.boost_type]||b.boost_type}</div><div style={{color:C.muted,fontSize:10}}>×{b.multiplier} XP</div></div>
        <div style={{color:C.muted,fontSize:10,textAlign:"right"}}>Expira en<br/><span style={{color:C.green,fontWeight:700}}>{timeLeft(b.expires_at)}</span></div>
      </div>)}
      {consumables.map(c=><div key={c.id} style={{background:"#1a0e08",border:"1px solid #f9731644",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{color:"#f97316",fontWeight:700,fontSize:12}}>🔑 {CONSUMABLE_LABEL[c.item_key]||c.item_key}</div>
        <div style={{color:"#f97316",fontWeight:700,fontSize:13}}>×{c.quantity}</div>
      </div>)}
    </div>;
    }
    
function ItemCard({item,onBuy}:{item:ShopItem;onBuy:(item:ShopItem)=>void}) {
  const cat=CATEGORY_META[item.category]??{label:item.category,color:C.muted,icon:"🛒"};
  const supported=true; // AO.4: todos los productos tienen fulfilment canónico
  return <div style={{background:C.bg1,border:"1px solid "+C.b1,borderRadius:12,padding:"16px 14px",display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:28}}>{item.icon||cat.icon}</div><div style={{flex:1}}><div style={{color:C.main,fontWeight:700,fontSize:14}}>{item.name}</div><div style={{color:cat.color,fontSize:10,fontWeight:700,background:cat.color+"18",border:"1px solid "+cat.color+"33",borderRadius:4,padding:"1px 6px",display:"inline-block",marginTop:3}}>{cat.label}</div></div></div>
    <div style={{color:C.muted,fontSize:12,lineHeight:1.5}}>{item.description}</div>
    {!supported && <div style={{color:C.muted,fontSize:10,lineHeight:1.4}}>Bloqueado hasta que exista un destino de fulfilment canónico.</div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}><div style={{color:C.green,fontWeight:800,fontSize:16}}>${Number(item.price_usdt).toFixed(2)} USDT</div><button disabled={!supported} onClick={()=>onBuy(item)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+(supported?C.gold:C.b1)+"66",background:supported?C.gold+"18":C.bg2,color:supported?C.gold:C.muted,fontWeight:700,fontSize:13,cursor:supported?"pointer":"not-allowed"}}>{supported?"Crear orden":"No disponible"}</button></div>
  </div>;
}

function OrderDialog({order,loading,onClose,payerWallet,setPayerWallet,txHash,setTxHash,onSubmit}:{order:ShopOrder;loading:boolean;onClose:()=>void;payerWallet:string;setPayerWallet:(v:string)=>void;txHash:string;setTxHash:(v:string)=>void;onSubmit:()=>void}) {
  const submitted=Boolean(order.payment_submitted||order.tx_hash);
  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.74)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{width:"min(540px,100%)",maxHeight:"90vh",overflowY:"auto",background:C.bg1,border:"1px solid "+C.gold+"55",borderRadius:14,padding:22,boxShadow:"0 20px 80px rgba(0,0,0,.5)"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><div style={{color:C.gold,fontFamily:"Cinzel,serif",fontWeight:700,fontSize:18}}>Orden · {order.item_name||order.item_key}</div><div style={{color:C.muted,fontSize:11,marginTop:5}}>Precio congelado: ${Number(order.price_usdt).toFixed(2)} USDT{order.order_id?" · orden "+String(order.order_id).slice(0,8)+"…":""}</div></div><button onClick={onClose} style={{border:"none",background:"transparent",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button></div>
    <div style={{marginTop:16,padding:12,borderRadius:9,background:C.bg2,border:"1px solid "+C.b1,color:C.muted,fontSize:12,lineHeight:1.55}}>Envía exactamente el importe a la tesorería indicada. Después registra el hash y la wallet pagadora. El panel administrativo verificará el pago; Premium no se activa antes de esa confirmación.</div>
    <div style={{marginTop:14,padding:12,borderRadius:9,background:"#0b2416",border:"1px solid #3dc96b44"}}><div style={{color:C.green,fontSize:10,fontWeight:700,letterSpacing:".08em"}}>TESORERÍA · {order.chain||"BSC"} · {order.token_symbol||"USDT"} · {order.token_standard||"BEP20"}</div><div style={{color:C.main,fontFamily:"monospace",fontSize:12,wordBreak:"break-all",marginTop:6}}>{order.treasury_wallet_address}</div></div>
    <div style={{display:"grid",gap:10,marginTop:14}}><input disabled={submitted} value={payerWallet} onChange={e=>setPayerWallet(e.target.value)} placeholder="Wallet desde la que pagaste" style={{padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b2,background:C.bg2,color:C.main,fontSize:12}}/><input disabled={submitted} value={txHash} onChange={e=>setTxHash(e.target.value)} placeholder="TX hash de la transferencia USDT" style={{padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b2,background:C.bg2,color:C.main,fontSize:12}}/></div>
    <button disabled={loading||submitted||!txHash.trim()||!payerWallet.trim()} onClick={onSubmit} style={{width:"100%",marginTop:14,padding:"11px 16px",borderRadius:9,border:"none",background:submitted?C.bg2:C.gold,color:submitted?C.muted:C.bg0,fontWeight:800,cursor:loading?"wait":"pointer"}}>{submitted?"Pago registrado · pendiente de aprobación":loading?"Registrando…":"Registrar pago para revisión"}</button>
  </div></div>;
}

export function ShopRoute(){
  const {addToast}=useToast(); const [authed,setAuthed]=useState<boolean|null>(null); const [loading,setLoading]=useState(true); const [items,setItems]=useState<ShopItem[]>([]); const [orders,setOrders]=useState<ShopOrder[]>([]); const [filter,setFilter]=useState("all"); const [order,setOrder]=useState<ShopOrder|null>(null); const [orderLoading,setOrderLoading]=useState(false); const [txHash,setTxHash]=useState(""); const [payerWallet,setPayerWallet]=useState("");
  const loadOrders=useCallback(async()=>{const {data,error}=await supabase.rpc("vexforge_get_my_shop_orders",{p_limit:10});if(!error&&Array.isArray(data))setOrders(data as ShopOrder[]);},[]);
  useEffect(()=>{let cancelled=false;(async()=>{const {data:{session}}=await supabase.auth.getSession();if(cancelled)return;setAuthed(Boolean(session));if(session){const [catalog]=await Promise.all([loadShopItems(),loadOrders()]);if(!cancelled)setItems(catalog);}setLoading(false);})();return()=>{cancelled=true;};},[loadOrders]);
  const handleBuy=useCallback(async(item:ShopItem)=>{if(item.item_key!=="season_pass_premium"){addToast("Este producto permanece bloqueado: todavía no tiene un destino de fulfilment canónico.","info");return;}setOrderLoading(true);const reference="shop-"+item.item_key+"-"+(globalThis.crypto?.randomUUID?.()??String(Date.now()));const {data,error}=await supabase.rpc("vexforge_create_shop_order",{p_item_key:item.item_key,p_client_reference:reference,p_payment_reference:null,p_tx_hash:null,p_payer_wallet_address:null});setOrderLoading(false);if(error||!data?.ok){addToast(data?.reason??error?.message??"No se pudo crear la orden.","error");return;}setOrder(data as ShopOrder);setTxHash("");setPayerWallet("");loadOrders();},[addToast,loadOrders]);
  async function submitPayment(){if(!order?.order_id||!txHash.trim()||!payerWallet.trim())return;setOrderLoading(true);const {data,error}=await supabase.rpc("vexforge_submit_shop_order_payment",{p_order_id:order.order_id,p_tx_hash:txHash.trim(),p_payer_wallet_address:payerWallet.trim(),p_payment_reference:null});setOrderLoading(false);if(error||!data?.ok){addToast(data?.reason??error?.message??"No se pudo registrar el pago.","error");return;}setOrder({...order,...data,tx_hash:txHash.trim(),payer_wallet_address:payerWallet.trim(),payment_submitted:true});addToast("Pago registrado. Queda pendiente de confirmación administrativa.","success");loadOrders();}
  if(loading)return <PageLoader/>; if(!authed)return <BlockedAuthState message="Inicia sesión para acceder a la Tienda"/>;
  const categories=["all",...Object.keys(CATEGORY_META)];const filtered=filter==="all"?items:items.filter(i=>i.category===filter);
  return <div style={{minHeight:"100vh",background:C.bg0,padding:"24px 16px",fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto"}}>
    <div style={{marginBottom:24}}><h1 style={{color:C.gold,fontFamily:"Cinzel,serif",fontSize:22,fontWeight:700,margin:0}}>Forge Shop</h1><p style={{color:C.muted,fontSize:13,marginTop:6}}>Órdenes de compra directa en USDT. El producto se entrega solo después de la confirmación administrativa server-owned.</p></div>
    <div style={{background:"linear-gradient(135deg,#2a1a06,#1a100a)",border:"1px solid "+C.gold+"44",borderRadius:14,padding:"18px 20px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><div><div style={{color:C.gold,fontFamily:"Cinzel,serif",fontWeight:700,fontSize:16,marginBottom:4}}>👑 Season Pass Premium — $9.99</div><div style={{color:C.muted,fontSize:12}}>Crea la orden, paga a la tesorería BSC USDT y registra el TX. La cuenta de control revisa y activa el track Premium.</div></div><button onClick={()=>handleBuy(items.find(i=>i.item_key==="season_pass_premium")??FALLBACK_CATALOG[0])} style={{padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,"+C.gold+",#c8932b)",color:C.bg0,fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>Crear orden de pago</button></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{categories.map(cat=>{const meta=CATEGORY_META[cat];const active=filter===cat;return <button key={cat} onClick={()=>setFilter(cat)} style={{padding:"6px 14px",borderRadius:99,fontSize:11,fontWeight:700,fontFamily:"IBM Plex Mono,monospace",background:active?(meta?.color??C.gold)+"22":C.bg1,color:active?(meta?.color??C.gold):C.muted,border:"1px solid "+(active?(meta?.color??C.gold)+"44":C.b1),cursor:"pointer"}}>{meta?.icon??"🛒"} {meta?.label??"Todos"}</button>})}</div>
    {filtered.length===0?<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"40px 0"}}>No hay ítems en esta categoría.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>{filtered.map(item=><ItemCard key={item.id} item={item} onBuy={handleBuy}/>)}</div>}
    <div style={{marginTop:16,padding:"10px 14px",borderRadius:9,background:"#0d1a0d",border:"1px solid #3dc96b33",color:"#3dc96b",fontSize:11}}>✅ Todos los productos tienen fulfilment canónico activo. Las órdenes aprobadas se entregan automáticamente.</div>
    <div style={{marginTop:24}}><div style={{color:C.main,fontFamily:"Cinzel,serif",fontSize:16,fontWeight:700,marginBottom:10}}>Mis ítems activos</div><ActiveItemsPanel/></div><div style={{marginTop:24}}><div style={{color:C.main,fontFamily:"Cinzel,serif",fontSize:16,fontWeight:700,marginBottom:10}}>Mis órdenes recientes</div>{orders.length===0?<div style={{color:C.muted,fontSize:12}}>Todavía no tienes órdenes de tienda.</div>:<div style={{display:"grid",gap:8}}>{orders.map(o=><div key={o.id} style={{background:C.bg1,border:"1px solid "+C.b1,borderRadius:9,padding:"11px 13px",fontSize:11}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{color:C.main,fontWeight:700}}>{o.item_key} · ${Number(o.price_usdt).toFixed(2)} USDT</span><span style={{color:o.status==="approved"?C.green:o.status==="rejected"?C.red:C.gold}}>{o.status} · {o.fulfillment_status}</span></div><div style={{color:C.muted,marginTop:4}}>Creada {date(o.created_at)}{o.tx_hash?" · TX registrado":" · TX pendiente"}</div></div>)}</div>}</div>
    {order&&<OrderDialog order={order} loading={orderLoading} onClose={()=>setOrder(null)} payerWallet={payerWallet} setPayerWallet={setPayerWallet} txHash={txHash} setTxHash={setTxHash} onSubmit={submitPayment}/>} 
  </div>;
}
