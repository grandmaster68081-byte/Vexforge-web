import type { CSSProperties } from "react";

/**
 * ErrorState — canonical error display for VEXFORGE domain failures.
 *
 * Usage:
 *   <ErrorState message={error} onRetry={load} />
 *   <ErrorState message="Sin conexión al servidor." />
 *   <ErrorState message={error} icon="🔐" title="Acceso requerido" />
 */
export interface ErrorStateProps {
  message:    string;
  title?:     string;
  icon?:      string;
  onRetry?:   () => void;
  retryLabel?: string;
  /** Compact mode: smaller padding, used inside panels */
  compact?:   boolean;
  style?:     CSSProperties;
}

export function ErrorState({
  message, title = "Algo salió mal", icon = "⚠️",
  onRetry, retryLabel = "Reintentar", compact, style,
}: ErrorStateProps) {
  const pad = compact ? "16px" : "32px 24px";
  return (
    <div
      style={{
        textAlign: "center",
        padding: pad,
        background: "rgba(232,64,64,0.05)",
        border: "1px solid rgba(232,64,64,0.25)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <div style={{ fontSize: compact ? 24 : 32 }}>{icon}</div>
      <div
        style={{
          color: "#E84040",
          fontWeight: 700,
          fontSize: compact ? 13 : 15,
          fontFamily: '"Cinzel", serif',
        }}
      >
        {title}
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          margin: 0,
          fontSize: 12,
          maxWidth: 360,
          lineHeight: 1.5,
          fontFamily: '"IBM Plex Mono", monospace',
          letterSpacing: "0.02em",
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: "7px 20px",
            borderRadius: 7,
            border: "1px solid rgba(232,64,64,0.4)",
            background: "rgba(232,64,64,0.08)",
            color: "#E84040",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.05em",
          }}
        >
          ↺ {retryLabel}
        </button>
      )}
    </div>
  );
}

/**
 * BlockedAuthState — shown when a route requires authentication.
 * Replaces generic "Sign in" text with a consistent, branded screen.
 */
export function BlockedAuthState({ description = "Inicia sesión para acceder a esta sección." }: { description?: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 44 }}>🔐</div>
      <div
        style={{
          color: "var(--fg-primary, #e8e8f0)",
          fontWeight: 700,
          fontSize: 18,
          fontFamily: '"Cinzel", serif',
        }}
      >
        Acceso requerido
      </div>
      <p
        style={{
          color: "var(--fg-dim, #666)",
          margin: 0,
          fontSize: 13,
          maxWidth: 300,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}
