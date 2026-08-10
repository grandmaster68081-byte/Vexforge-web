import type { CSSProperties, ReactNode } from "react";
import { ForgeIcon } from "./ForgeIcon";

/**
 * EmptyState — canonical empty-content card for VEXFORGE routes.
 *
 * Usage:
 *   <EmptyState icon={<ForgeIcon name="cards" size={36} />} title="Sin cartas" description="Abre packs para conseguir tu primera carta." />
 *   <EmptyState icon={<ForgeIcon name="clans" size={36} />} title="Sin clan" action={{ label: "Ver directorio", onClick: () => setTab("directorio") }} />
 */
export interface EmptyStateProps {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void };
  /** Compact: reduced padding for inline use inside panels */
  compact?:     boolean;
  style?:       CSSProperties;
  children?:    ReactNode;
}

export function EmptyState({ icon = <ForgeIcon name="collection" size={36} />, title, description, action, compact, style, children }: EmptyStateProps) {
  const pad = compact ? "20px 16px" : "40px 24px";
  return (
    <div
      style={{
        textAlign: "center",
        padding: pad,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <div style={{ color: "var(--ember-gold-lt, #f0c050)", display: "grid", placeItems: "center", minHeight: compact ? 28 : 36 }}>
        {icon}
      </div>
      <div
        style={{
          color: "var(--fg-primary, #e8e8f0)",
          fontWeight: 700,
          fontSize: compact ? 13 : 15,
          fontFamily: '"Cinzel", serif',
        }}
      >
        {title}
      </div>
      {description && (
        <p
          style={{
            color: "var(--fg-dim, #666)",
            margin: 0,
            fontSize: 12,
            maxWidth: 340,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {children}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 4,
            padding: "8px 22px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg,#e8b84b,#c9901f)",
            color: "#0a0a12",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.04em",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
