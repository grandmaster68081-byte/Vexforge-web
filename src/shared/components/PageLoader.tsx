import type { CSSProperties } from "react";

// VEXFORGE PageLoader v2 — Cinematic edition (FASE 2)
// Multi-ring spinner with faction runes and VEXFORGE branding.

const RUNE_SYMS = ["✦", "◈", "⬡", "✧", "◆", "⊕", "★", "⟐"];

const KEYFRAMES = `
  @keyframes forge-spin-cw  { to { transform: rotate(360deg);  } }
  @keyframes forge-spin-ccw { to { transform: rotate(-360deg); } }
  @keyframes forge-spin-mid { to { transform: rotate(220deg);  } }
  @keyframes loader-fade-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes rune-orbit {
    0%   { transform: rotate(var(--base-rot,0deg)) translateX(var(--orbit-r,52px)) rotate(calc(-1 * var(--base-rot,0deg))); opacity: 0; }
    15%  { opacity: 0.55; }
    85%  { opacity: 0.45; }
    100% { transform: rotate(calc(var(--base-rot,0deg) + 360deg)) translateX(var(--orbit-r,52px)) rotate(calc(-1 * (var(--base-rot,0deg) + 360deg))); opacity: 0; }
  }
  @keyframes loader-text-pulse {
    0%,100% { opacity: 0.45; }
    50%     { opacity: 0.9; letter-spacing: 0.22em; }
  }
  @keyframes loader-dot-blink {
    0%,80%,100% { opacity: 0; }
    40%         { opacity: 1; }
  }
`;

const WRAP_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  gap: 20,
  animation: "loader-fade-in 0.35s ease",
  position: "relative",
};

export function PageLoader({ message }: { message?: string }) {
  const label = message ?? "Cargando…";
  return (
    <div style={WRAP_STYLE}>
      <style>{KEYFRAMES}</style>

      {/* Multi-ring spinner */}
      <div style={{ position: "relative", width: 88, height: 88 }}>
        {/* Outer ring — clockwise gold */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#C9901F",
          borderRightColor: "#C9901F44",
          animation: "forge-spin-cw 1.4s linear infinite",
        }} />
        {/* Middle ring — counter-clockwise violet */}
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: "1.5px solid transparent",
          borderBottomColor: "#7B4FD4",
          borderLeftColor: "#7B4FD444",
          animation: "forge-spin-ccw 0.9s linear infinite",
        }} />
        {/* Inner ring — clockwise gold-dim */}
        <div style={{
          position: "absolute", inset: 24, borderRadius: "50%",
          border: "1px solid transparent",
          borderTopColor: "#F0C05066",
          animation: "forge-spin-cw 0.65s linear infinite",
        }} />

        {/* Orbiting rune particles */}
        {RUNE_SYMS.slice(0, 5).map((r, i) => (
          <div key={r} style={{
            position: "absolute",
            top: "50%", left: "50%",
            marginTop: -6, marginLeft: -6,
            width: 12, height: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: i % 2 === 0 ? "#C9901F" : "#7B4FD4",
            fontSize: `${8 + (i % 2) * 3}px`,
            // @ts-expect-error CSS custom props
            "--base-rot": `${i * 72}deg`,
            "--orbit-r": `44px`,
            animation: `rune-orbit ${2.5 + i * 0.3}s linear ${i * 0.5}s infinite`,
          }}>{r}</div>
        ))}

        {/* Center — V logo */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: 22, fontWeight: 900,
            background: "linear-gradient(135deg, #F0C050 0%, #C9901F 60%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px rgba(201,144,31,0.7))",
          }}>V</div>
        </div>
      </div>

      {/* Loading text */}
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#8891A0",
        animation: "loader-text-pulse 2s ease-in-out infinite",
        display: "flex", alignItems: "center", gap: 2,
      }}>
        {label}
        {/* Animated dots */}
        <span style={{ animation: "loader-dot-blink 1.4s ease-in-out 0.0s infinite" }}>·</span>
        <span style={{ animation: "loader-dot-blink 1.4s ease-in-out 0.2s infinite" }}>·</span>
        <span style={{ animation: "loader-dot-blink 1.4s ease-in-out 0.4s infinite" }}>·</span>
      </div>
    </div>
  );
}
