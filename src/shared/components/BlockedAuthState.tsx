import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ForgeIcon, type ForgeIconName } from "./ForgeIcon";

/**
 * BlockedAuthState — pantalla épica "acceso requerido" de VEXFORGE.
 * Diseño cinematico con branding de facción y efectos atmosféricos.
 */
export interface BlockedAuthStateProps {
  message?: string;
  style?: CSSProperties;
}

const AMBIENT_SIGILS: ForgeIconName[] = ["spark", "cards", "arena", "shield", "target", "relics", "crown", "energy"];

export function BlockedAuthState({
  message = "Inicia sesión para acceder a esta sección.",
  style,
}: BlockedAuthStateProps) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      minHeight: 420, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "56px 24px",
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,144,31,0.12) 0%, rgba(5,5,13,0.0) 70%)",
      ...style
    }}>
      {/* Keyframes inline */}
      <style>{`
        @keyframes ba-rune-float {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.06; }
          50%      { transform: translateY(-20px) rotate(15deg); opacity: 0.18; }
        }
        @keyframes ba-lock-breathe {
          0%,100% { filter: drop-shadow(0 0 16px rgba(201,144,31,0.4)) drop-shadow(0 0 32px rgba(201,144,31,0.15)); transform: scale(1) rotate(-3deg); }
          50%      { filter: drop-shadow(0 0 28px rgba(201,144,31,0.7)) drop-shadow(0 0 56px rgba(201,144,31,0.3)); transform: scale(1.06) rotate(3deg); }
        }
        @keyframes ba-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ba-divider-grow {
          from { width: 0; opacity: 0; }
          to   { width: 180px; opacity: 1; }
        }
        @keyframes ba-btn-glow {
          0%,100% { box-shadow: 0 4px 20px rgba(201,144,31,0.4); }
          50%      { box-shadow: 0 4px 32px rgba(201,144,31,0.7), 0 0 60px rgba(201,144,31,0.2); }
        }
      `}</style>

      {/* Floating rune background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {AMBIENT_SIGILS.map((name, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 13 + 7) % 88 + 6}%`,
            top: `${(i * 17 + 8) % 70 + 10}%`,
            color: "#C9901F",
            fontSize: `${(i % 3) * 6 + 10}px`,
            animation: `ba-rune-float ${(i % 3) * 1.5 + 4}s ease-in-out infinite`,
            animationDelay: `${i * 0.55}s`,
           }}>
            <ForgeIcon name={name} size={(i % 3) * 6 + 10} />
          </div>
        ))}
      </div>

      {/* Top decorative line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(201,144,31,0.7) 20%, rgba(240,192,80,1) 50%, rgba(201,144,31,0.7) 80%, transparent)",
        opacity: 0.6,
      }} />

      {/* Lock sigil */}
      <div style={{
        color: "#f0c050", marginBottom: 20, lineHeight: 1,
        animation: "ba-lock-breathe 3s ease-in-out infinite",
        zIndex: 1,
      }}>
        <ForgeIcon name="lock" size={56} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: '"Cinzel", serif', fontSize: 22, fontWeight: 900,
        color: "#eee",
        letterSpacing: "0.12em", textTransform: "uppercase",
        textShadow: "0 0 30px rgba(201,144,31,0.4)",
        animation: "ba-fade-up 0.5s 0.1s ease both",
        zIndex: 1,
        marginBottom: 8,
      }}>
        Acceso Requerido
      </div>

      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16, zIndex: 1,
        animation: "ba-fade-up 0.5s 0.2s ease both",
      }}>
        <div style={{ height: 1, width: 60, background: "linear-gradient(90deg, transparent, rgba(201,144,31,0.6))" }} />
        <ForgeIcon name="spark" size={12} style={{ color: "#C9901F", opacity: 0.7 }} />
        <div style={{ height: 1, width: 60, background: "linear-gradient(90deg, rgba(201,144,31,0.6), transparent)" }} />
      </div>

      {/* Message */}
      <p style={{
        color: "#6a7080", margin: "0 0 28px", fontSize: 13,
        maxWidth: 340, lineHeight: 1.7, textAlign: "center",
        fontFamily: '"Rajdhani", sans-serif', letterSpacing: "0.04em",
        animation: "ba-fade-up 0.5s 0.25s ease both",
        zIndex: 1,
      }}>
        {message}
      </p>

      {/* CTA Button */}
      <Link
        to="/account"
        style={{
          padding: "13px 36px", borderRadius: 12,
          background: "linear-gradient(135deg, #e8b84b 0%, #c9901f 50%, #b07a15 100%)",
          color: "#0a0a12", fontWeight: 900, fontSize: 14,
          textDecoration: "none", fontFamily: '"Cinzel", serif',
          letterSpacing: "0.1em", textTransform: "uppercase",
          animation: "ba-btn-glow 2.5s ease-in-out infinite, ba-fade-up 0.5s 0.35s ease both",
          zIndex: 1, position: "relative",
          border: "1px solid rgba(255,220,100,0.4)",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px) scale(1.03)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
      >
         <ForgeIcon name="account" size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
         Iniciar Sesión
      </Link>

      {/* Bottom decorative text */}
      <div style={{
        marginTop: 20, fontSize: 9, color: "rgba(201,144,31,0.3)",
        fontFamily: '"Rajdhani", sans-serif', letterSpacing: "0.25em",
        textTransform: "uppercase", zIndex: 1,
        animation: "ba-fade-up 0.5s 0.45s ease both",
      }}>
        VEXFORGE — FORJA TU LEYENDA
      </div>

      {/* Bottom decorative line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(201,144,31,0.4) 50%, transparent)",
        opacity: 0.5,
      }} />
    </div>
  );
}
