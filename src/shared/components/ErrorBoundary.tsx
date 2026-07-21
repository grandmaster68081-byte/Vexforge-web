import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * ErrorBoundary — catches React render errors and shows a recovery screen.
 * v5.14: Updated to Spanish, VEXFORGE design system.
 */
interface Props  { children: ReactNode; label?: string; }
interface State  { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[VEXFORGE] Render error in", this.props.label ?? "component:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2
            style={{
              fontFamily: '"Cinzel", serif',
              color: "#E84040",
              fontSize: 20,
              margin: 0,
            }}
          >
            Error inesperado
          </h2>
          {this.props.label && (
            <p
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              {this.props.label}
            </p>
          )}
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              maxWidth: 400,
              margin: 0,
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {this.state.message || "Ha ocurrido un error al renderizar esta sección."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            style={{
              marginTop: 4,
              padding: "9px 24px",
              borderRadius: 8,
              border: "1px solid rgba(232,112,42,0.45)",
              background: "rgba(232,112,42,0.08)",
              color: "#e8702a",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: "0.06em",
            }}
          >
            ↺ Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
