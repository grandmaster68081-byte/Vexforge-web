type AnimatedProgressBarProps = {
  current: number;
  max: number;
  color?: string;
  height?: number;
  showText?: boolean;
  label?: string;
  icon?: string;
  animate?: boolean;
  className?: string;
};

/** Barra de progreso animada con shimmer y glow tip — C.3 Retención */
export function AnimatedProgressBar({
  current,
  max,
  color     = "#e8b84b",
  height    = 8,
  showText  = false,
  label,
  icon,
  animate   = true,
  className = "",
}: AnimatedProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const pctDisplay = pct.toFixed(1);

  return (
    <div className={className} style={{ marginBottom: 4 }}>
      <style>{`
        @keyframes apb-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      {(label || showText) && (
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 6,
        }}>
          <span style={{
            color: "#888", fontSize: 11,
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 600, letterSpacing: "0.08em",
          }}>
            {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
            {label}
          </span>
          {showText && (
            <span style={{
              color, fontWeight: 700, fontSize: 12,
              fontFamily: '"IBM Plex Mono", monospace',
            }}>
              {current.toLocaleString()}{" "}
              <span style={{ color: "#444", fontWeight: 400, fontSize: 10 }}>
                / {max.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div style={{
        height, borderRadius: height,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Fill */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0,
          width: pct + "%",
          borderRadius: height,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: animate ? "width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
          overflow: "hidden",
        }}>
          {/* Shimmer sweep */}
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            width: "40%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            animation: "apb-shimmer 2.8s linear infinite",
          }} />
        </div>

        {/* Glow tip */}
        {pct > 3 && (
          <div style={{
            position: "absolute", top: "50%",
            left: `calc(${pct}% - ${height + 2}px)`,
            transform: "translateY(-50%)",
            width: height + 4, height: height + 4,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px 3px ${color}66`,
            transition: animate ? "left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
          }} />
        )}
      </div>

      {/* Sub-labels */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 4,
      }}>
        <span style={{
          color: "#333", fontSize: 10,
          fontFamily: '"IBM Plex Mono", monospace',
        }}>
          {pctDisplay}% completado
        </span>
        {max > 0 && (
          <span style={{
            color: "#333", fontSize: 10,
            fontFamily: '"IBM Plex Mono", monospace',
          }}>
            Faltan {(max - current).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
