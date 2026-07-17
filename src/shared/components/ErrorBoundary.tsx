import { Component, type ErrorInfo, type ReactNode } from "react";

    interface Props { children: ReactNode; }
    interface State { hasError: boolean; message: string; }

    export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
      console.error("[VEXFORGE] Unhandled error:", error, info.componentStack);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h2 style={{ color: "#e3573f", marginBottom: 10 }}>Something went wrong</h2>
            <p className="muted" style={{ maxWidth: 400, margin: "0 auto 20px" }}>
              {this.state.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, message: "" })}
              style={{
                background: "#e8702a18", border: "1px solid #e8702a55",
                color: "#e8702a", padding: "8px 24px", borderRadius: 6,
                cursor: "pointer", fontSize: 14, fontWeight: 500,
              }}
            >
              Try again
            </button>
          </div>
        );
      }
      return this.props.children;
    }
    }
    