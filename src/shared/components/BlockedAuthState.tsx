import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

/**
 * BlockedAuthState — canonical "sign in required" screen for VEXFORGE routes.
 * 
 * Usage:
 *   <BlockedAuthState message="Inicia sesión para ver tu progreso." />
 */
export interface BlockedAuthStateProps {
  message?: string;
  style?:   CSSProperties;
}

export function BlockedAuthState({
  message = "Inicia sesión para acceder a esta sección.",
  style,
}: BlockedAuthStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, ...style }}>
      <div style={{ fontSize: 48 }}>🔐</div>
      <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 18, fontFamily: '"Cinzel", serif' }}>
        Acceso Requerido
      </div>
      <p style={{ color: "#666", margin: 0, fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
        {message}
      </p>
      <Link
        to="/account"
        style={{ marginTop: 8, padding: "10px 28px", borderRadius: 10, background: "linear-gradient(135deg,#e8b84b,#c9901f)", color: "#0a0a12", fontWeight: 800, fontSize: 13, textDecoration: "none", fontFamily: '"Cinzel", serif' }}
      >
        Iniciar Sesión
      </Link>
    </div>
  );
}
