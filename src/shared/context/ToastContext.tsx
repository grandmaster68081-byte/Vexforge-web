import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, description?: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    addToast(type, message);
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const COLOR: Record<ToastType, string> = {
    success: "#3DC96B",
    error:   "#E3573F",
    info:    "#5B8BF5",
    warning: "#E8B84B",
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, showToast, removeToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 99999,
          display: "flex", flexDirection: "column", gap: 10, maxWidth: 360,
        }}>
          {toasts.map(t => (
            <div key={t.id} onClick={() => removeToast(t.id)} style={{
              background: "var(--layer-3, #1C1C38)",
              border: `1px solid ${COLOR[t.type]}55`,
              borderLeft: `4px solid ${COLOR[t.type]}`,
              borderRadius: 10, padding: "12px 16px", cursor: "pointer",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              animation: "slideInToast 0.25s ease",
            }}>
              <style>{`@keyframes slideInToast{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
              <div style={{ fontWeight: 700, color: COLOR[t.type], fontSize: 14 }}>{t.title}</div>
              {t.description && <div style={{ color: "var(--fg-muted, #8891A0)", fontSize: 12, marginTop: 4 }}>{t.description}</div>}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
