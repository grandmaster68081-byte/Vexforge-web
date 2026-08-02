const USER_SAFE_ERROR = "No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.";

type RuntimeIssue = {
  source: "render" | "window_error" | "unhandled_rejection";
  message: string;
  timestamp: string;
};

const MAX_ISSUES = 20;
const issues: RuntimeIssue[] = [];

function toSafeMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  return "Error inesperado";
}

/**
 * Keeps a bounded, local-only diagnostic trail for browser failures.
 * It never sends data or auth/session information to a third party.
 */
export function recordRuntimeIssue(source: RuntimeIssue["source"], value: unknown): void {
  const message = toSafeMessage(value).slice(0, 500);
  issues.unshift({ source, message, timestamp: new Date().toISOString() });
  issues.splice(MAX_ISSUES);
  console.error(`[VEXFORGE:${source}]`, message);
}

export function getRuntimeIssues(): readonly RuntimeIssue[] {
  return issues;
}

export function getSafeErrorMessage(value: unknown, fallback = USER_SAFE_ERROR): string {
  const message = toSafeMessage(value).trim();
  if (!message) return fallback;

  const normalized = message.toLowerCase();
  const safeMessages: Record<string, string> = {
    "failed to fetch": "No se pudo conectar con VEXFORGE. Comprueba tu conexión e inténtalo de nuevo.",
    "network request failed": "No se pudo conectar con VEXFORGE. Comprueba tu conexión e inténtalo de nuevo.",
    "jwt expired": "Tu sesión expiró. Inicia sesión de nuevo para continuar.",
    "invalid jwt": "Tu sesión ya no es válida. Inicia sesión de nuevo para continuar.",
    "not authenticated": "Inicia sesión para continuar.",
    "permission denied": "No tienes permisos para realizar esta acción.",
    "row-level security": "No tienes permisos para realizar esta acción.",
    "rate limit": "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
  };

  const match = Object.entries(safeMessages).find(([needle]) => normalized.includes(needle));
  return match?.[1] ?? fallback;
}

export function installRuntimeDiagnostics(): () => void {
  const onError = (event: ErrorEvent) => {
    recordRuntimeIssue("window_error", event.error ?? event.message);
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    recordRuntimeIssue("unhandled_rejection", event.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}