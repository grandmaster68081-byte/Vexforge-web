import type { CSSProperties } from "react";

    const SPINNER_STYLE: CSSProperties = {
    width: 44, height: 44,
    border: "3px solid #1C1C3840",
    borderTop: "3px solid #C9901F",
    borderRadius: "50%",
    animation: "forge-spin 0.75s linear infinite",
    };

    const WRAP_STYLE: CSSProperties = {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "60vh", gap: 14,
    };

    const LABEL_STYLE: CSSProperties = {
    color: "#8891A0", fontSize: 12,
    fontFamily: '"IBM Plex Mono", monospace',
    letterSpacing: "0.12em", textTransform: "uppercase",
    };

    export function PageLoader({ message = "Cargando sección..." }: { message?: string }) {
    return (
      <div style={WRAP_STYLE}>
        <div style={SPINNER_STYLE} />
        <p style={LABEL_STYLE}>{message}</p>
        <style>{`@keyframes forge-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
    }
    