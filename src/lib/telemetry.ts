import { supabase } from "./supabase";

export const TELEMETRY_EVENT_KEYS = [
  "session_start",
  "forge_action",
  "combat_resolved",
  "reward_claimed",
  "return_visit",
] as const;

export type TelemetryEventKey = (typeof TELEMETRY_EVENT_KEYS)[number];
type TelemetryValue = string | number | boolean | null;
type TelemetryPayload = Record<string, TelemetryValue>;

const SESSION_STORAGE_KEY = "vxf_client_session_id";
const SESSION_STARTED_KEY = "vxf_session_started";
const LAST_VISIT_KEY = "vxf_last_authenticated_visit";
const RETURN_THRESHOLD_MS = 8 * 60 * 60 * 1000;

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getClientSessionId(): string | null {
  const storage = safeSessionStorage();
  if (!storage) return null;

  try {
    const existing = storage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget product observation. This must never affect the game flow.
 * The database derives user_id from auth.uid(); callers cannot choose it.
 */
export async function emitTelemetry(
  eventKey: TelemetryEventKey,
  payload: TelemetryPayload = {},
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    await supabase.from("vexforge_telemetry_events").insert({
      event_key: eventKey,
      client_session_id: getClientSessionId(),
      payload,
    });
  } catch {
    // Observation is deliberately best-effort: never interrupt rendering or play.
  }
}

let sessionEntryPromise: Promise<void> | null = null;

export function trackSessionEntry(): Promise<void> {
  if (sessionEntryPromise) return sessionEntryPromise;

  sessionEntryPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const sessionStorage = safeSessionStorage();
      const localStorage = safeLocalStorage();
      const now = Date.now();
      const sessionStarted = sessionStorage?.getItem(SESSION_STARTED_KEY) === "1";
      const lastVisit = Number(localStorage?.getItem(LAST_VISIT_KEY) ?? 0);

      if (!sessionStarted) {
        sessionStorage?.setItem(SESSION_STARTED_KEY, "1");
        await emitTelemetry("session_start", { entry: "authenticated" });
      }

      if (lastVisit > 0 && now - lastVisit >= RETURN_THRESHOLD_MS) {
        await emitTelemetry("return_visit", {
          hours_since_last_visit: Math.round((now - lastVisit) / (60 * 60 * 1000)),
        });
      }

      localStorage?.setItem(LAST_VISIT_KEY, String(now));
    } catch {
      // Storage and auth availability must never block the app.
    }
  })();

  return sessionEntryPromise;
}