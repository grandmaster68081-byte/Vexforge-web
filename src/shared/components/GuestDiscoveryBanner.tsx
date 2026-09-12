import { useState } from "react";
import { Link } from "react-router-dom";
import { ForgeIcon } from "./ForgeIcon";

/**
 * GuestDiscoveryBanner — P6
 * Banner no bloqueante para visitantes sin sesión.
 * Se cierra con una X y no vuelve a aparecer en la sesión (sessionStorage).
 * Diseño dark-fantasy coherente con la estética de VEXFORGE.
 */

const STORAGE_KEY = "vxf_guest_banner_closed";

export function GuestDiscoveryBanner() {
  const [closed, setClosed] = useState(() =>
    typeof sessionStorage !== "undefined" && !!sessionStorage.getItem(STORAGE_KEY)
  );

  if (closed) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setClosed(true);
  }

  return (
    <div style={{
      position: "relative",
      margin: "0 0 20px",
      padding: "14px 48px 14px 20px",
      background: "linear-gradient(135deg, rgba(201,144,31,0.10) 0%, rgba(120,80,10,0.08) 100%)",
      border: "1px solid rgba(201,144,31,0.25)",
      borderLeft: "3px solid #C9901F",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
    }}>
      <style>{`
        @keyframes vxf-guest-glow {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .vxf-guest-cta:hover { background: rgba(201,144,31,0.25) !important; }
      `}</style>

      {/* Rune pulse */}
      <span style={{
        fontSize: 22, flexShrink: 0,
        animation: "vxf-guest-glow 2.5s ease-in-out infinite",
      }}>
        <ForgeIcon name="arena" size={18} />
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{
          margin: 0,
          fontFamily: '"Rajdhani", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: "#d8c080",
          letterSpacing: "0.04em",
        }}>
          Explorando como visitante
        </p>
        <p style={{
          margin: "2px 0 0",
          fontFamily: '"Rajdhani", sans-serif',
          fontSize: 12,
          color: "#7a7a9a",
          letterSpacing: "0.02em",
        }}>
          Crea una cuenta gratis para guardar tu colección, construir mazos y competir en el ranking.
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/account"
        className="vxf-guest-cta"
        style={{
          padding: "8px 20px",
          borderRadius: 8,
          background: "rgba(201,144,31,0.15)",
          border: "1px solid rgba(201,144,31,0.4)",
          color: "#e8b84b",
          fontFamily: '"Cinzel", serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        Crear cuenta
      </Link>

      {/* Close */}
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "transparent",
          border: "none",
          color: "#555577",
          fontSize: 16,
          cursor: "pointer",
          lineHeight: 1,
          padding: 4,
        }}
      >
        <ForgeIcon name="close" size={14} />
      </button>
    </div>
  );
}
