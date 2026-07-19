import { useEffect, useState } from "react";
import { useSession } from "../../providers/AuthProvider";
import { getSettings, updateSettings, type PlayerSettings, type SettingsUpdate } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useSettings() {
const { session, loading: sessionLoading } = useSession();
const [settings, setSettings] = useState<PlayerSettings | null>(null);
const [status, setStatus] = useState<DomainStatus>("blocked_auth");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [reason, setReason] = useState<string | null>(null);
const [saveError, setSaveError] = useState<string | null>(null);

useEffect(() => {
  if (sessionLoading) return;
  if (!session) {
    setStatus("blocked_auth");
    setReason("No auth session. Sign in on the Account page first.");
    setLoading(false);
    return;
  }
  let cancelled = false;
  setLoading(true);
  getSettings().then((result) => {
    if (cancelled) return;
    setStatus(result.status);
    setSettings(result.data ?? null);
    setReason(result.reason ?? null);
    setLoading(false);
  });
  return () => { cancelled = true; };
}, [session, sessionLoading]);

async function save(patch: SettingsUpdate): Promise<boolean> {
  setSaving(true);
  setSaveError(null);
  const result = await updateSettings(patch);
  setSaving(false);
  if (result.data) { setSettings(result.data); return true; }
  setSaveError(result.reason ?? "Failed to save settings.");
  return false;
}

return { settings, status, loading, saving, reason, saveError, save, signedIn: !!session };
}
