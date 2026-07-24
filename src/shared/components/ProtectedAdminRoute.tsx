import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PageLoader } from "./PageLoader";

const CONTROL_ADMIN_EMAIL = "cristiangalvez815@gmail.com";
const C = { bg0: "#0d0d14", b2: "#2a2a3a", gold: "#E8B84B", red: "#FF4B4B", muted: "#7a7a9a" };
interface Props { children: ReactNode; }

/** Navigation guard. The same exact email check is repeated by every admin RPC. */
export function ProtectedAdminRoute({ children }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied" | "unauthenticated">("loading");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) { setStatus("unauthenticated"); return; }
      if (session.user.email?.trim().toLowerCase() !== CONTROL_ADMIN_EMAIL) { setStatus("denied"); return; }
      const { data, error } = await supabase.rpc("vexforge_is_control_admin");
      if (!cancelled) setStatus(!error && data === true ? "allowed" : "denied");
    })();
    return () => { cancelled = true; };
  }, []);
  if (status === "loading") return <PageLoader />;
  if (status === "unauthenticated") return <div style={{ minHeight:"100vh", background:C.bg0, display:"grid", placeItems:"center", color:C.muted, padding:24, textAlign:"center" }}><div><div style={{ fontSize:52 }}>🔒</div><h2 style={{ color:C.gold }}>Acceso Restringido</h2><p>Debes iniciar sesión para acceder al panel de administración.</p><button onClick={() => navigate("/account")} style={{ padding:"10px 28px", borderRadius:10, background:C.gold, border:"none", cursor:"pointer" }}>Iniciar Sesión</button></div></div>;
  if (status === "denied") return <div style={{ minHeight:"100vh", background:C.bg0, display:"grid", placeItems:"center", color:C.muted, padding:24, textAlign:"center" }}><div><div style={{ fontSize:52 }}>⛔</div><h2 style={{ color:C.red }}>Acceso Denegado</h2><p>El panel administrativo está reservado exclusivamente para la cuenta de control autorizada.</p><button onClick={() => navigate("/")} style={{ padding:"10px 28px", borderRadius:10, border:"1px solid "+C.b2, background:"transparent", color:C.muted, cursor:"pointer" }}>← Volver al Inicio</button></div></div>;
  return <>{children}</>;
}
