import AsyncStorage from '@react-native-async-storage/async-storage';
import { insertTelemetryEvent, type Session } from '@/lib/supabase';

export const TELEMETRY_EVENT_KEYS = [
  'session_start',
  'forge_action',
  'combat_resolved',
  'reward_claimed',
  'return_visit',
] as const;

export type TelemetryEventKey = (typeof TELEMETRY_EVENT_KEYS)[number];
type TelemetryValue = string | number | boolean | null;
type TelemetryPayload = Record<string, TelemetryValue>;

const LAST_VISIT_KEY_PREFIX = 'vexforge.telemetry.last_visit.';
const RETURN_THRESHOLD_MS = 8 * 60 * 60 * 1000;
let clientSessionId: string | null = null;
const startedUsers = new Set<string>();
const sessionEntryPromises = new Map<string, Promise<void>>();

function getClientSessionId() {
  if (!clientSessionId) {
    clientSessionId = 'android-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }
  return clientSessionId;
}

/** Observation is best-effort and must never affect rendering or play. */
export async function emitTelemetry(
  session: Session | null,
  eventKey: TelemetryEventKey,
  payload: TelemetryPayload = {},
): Promise<void> {
  if (!session?.user?.id) return;
  try {
    await insertTelemetryEvent(session, eventKey, getClientSessionId(), payload);
  } catch {
    // Telemetry failures never interrupt the Android game loop.
  }
}

export function trackSessionEntry(session: Session | null): Promise<void> {
  const userId = session?.user?.id;
  if (!userId) return Promise.resolve();
  const existing = sessionEntryPromises.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const visitKey = LAST_VISIT_KEY_PREFIX + userId;
      const lastVisit = Number((await AsyncStorage.getItem(visitKey)) ?? 0);
      const now = Date.now();
      if (!startedUsers.has(userId)) {
        startedUsers.add(userId);
        await emitTelemetry(session, 'session_start', { entry: 'authenticated' });
      }
      if (lastVisit > 0 && now - lastVisit >= RETURN_THRESHOLD_MS) {
        await emitTelemetry(session, 'return_visit', { hours_since_last_visit: Math.round((now - lastVisit) / (60 * 60 * 1000)) });
      }
      await AsyncStorage.setItem(visitKey, String(now));
    } catch {
      // Storage and auth availability must never block the app.
    }
  })();
  sessionEntryPromises.set(userId, promise);
  return promise;
}
