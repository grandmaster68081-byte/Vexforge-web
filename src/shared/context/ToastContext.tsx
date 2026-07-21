import { createContext, useCallback, useContext, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id:      string;
  kind:    ToastKind;
  title:   string;
  message?: string;
}

interface ToastCtx {
  addToast: (kind: ToastKind, title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastCtx>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Toast visual ─────────────────────────────────────────────────────────────
const KIND_COLOR: Record<ToastKind, string> = {
  success: "#3ddc84",
  error:   "#e3573f",
  info:    "#4a9eff",
  warning: "#e8b84b",
};

const KIND_ICON: Record<ToastKind, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  warning: "⚠",
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const c = KIND_COLOR[toast.kind];
  return (
    <div
      onClick={() => onDismiss(toast.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 16px", borderRadius: 10, cursor: "pointer",
        background: "rgba(18,18,31,0.97)",
        border: `1px solid ${c}44`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${c}22`,
        backdropFilter: "blur(8px)",
        minWidth: 260, maxWidth: 380,
        animation: "toast-slide-in 0.25s ease-out",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: `${c}22`, border: `1.5px solid ${c}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: c,
      }}>
        {KIND_ICON[toast.kind]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#e8e8f0", lineHeight: 1.3,
          fontFamily: '"Rajdhani", sans-serif',
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: 11, color: "#7a7a9a", marginTop: 3, lineHeight: 1.4 }}>
            {toast.message}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#4a4a6a", flexShrink: 0, marginTop: 2 }}>✕</div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
let _nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = String(_nextId++);
    setToasts(prev => [...prev.slice(-4), { id, kind, title, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed", bottom: 80, right: 16, zIndex: 9999,
          display: "flex", flexDirection: "column-reverse", gap: 8,
          pointerEvents: toasts.length === 0 ? "none" : "auto",
        }}
      >
        <style>{`
          @keyframes toast-slide-in {
            from { opacity: 0; transform: translateY(10px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
