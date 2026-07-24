// GL.3 — Session Summary Toast (chat99)
// After 3+ battles in a session, shows a brief summary toast on app.
// Tracks battle results in sessionStorage.

import { useEffect, useState } from "react";

const SESSION_KEY = "vexforge_session_battles_v1";
const SHOW_AFTER_BATTLES = 3;
const TOAST_DURATION_MS = 5000;

export interface SessionBattleRecord {
  wins: number;
  losses: number;
  vexEarned: number;
  streak: number;
  startedAt: number;
}

/** Call this after any battle result to record it in session storage */
export function recordSessionBattle(won: boolean, vexEarned: number, currentStreak: number): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const rec: SessionBattleRecord = raw
      ? JSON.parse(raw)
      : { wins: 0, losses: 0, vexEarned: 0, streak: 0, startedAt: Date.now() };
    if (won) rec.wins++; else rec.losses++;
    rec.vexEarned += vexEarned;
    rec.streak = currentStreak;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rec));
  } catch { /* silent */ }
}

export function getSessionRecord(): SessionBattleRecord | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Hook: shows the session summary toast when threshold is crossed */
export function useSessionSummaryToast() {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<SessionBattleRecord | null>(null);

  useEffect(() => {
    const check = () => {
      const rec = getSessionRecord();
      if (!rec) return;
      const total = rec.wins + rec.losses;
      if (total >= SHOW_AFTER_BATTLES && !visible) {
        setRecord(rec);
        setVisible(true);
        setTimeout(() => setVisible(false), TOAST_DURATION_MS);
      }
    };
    // Check immediately and also when storage changes
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [visible]);

  return { visible, record, dismiss: () => setVisible(false) };
}

/** Renders the session summary toast */
export function SessionSummaryToast() {
  const { visible, record, dismiss } = useSessionSummaryToast();
  if (!visible || !record) return null;

  const total = record.wins + record.losses;
  const winRate = total > 0 ? Math.round((record.wins / total) * 100) : 0;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 9000, cursor: "pointer",
        background: "rgba(10,10,28,0.96)",
        border: "1px solid rgba(232,184,75,0.4)",
        borderRadius: 14, padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(232,184,75,0.12)",
        animation: "sessionToastIn 0.35s ease",
        minWidth: 280, maxWidth: 380,
      }}
    >
      <style>{`
        @keyframes sessionToastIn {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={{ fontSize: 28 }}>⚔️</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#e8b84b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
          Sesión de hoy
        </div>
        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>
          {record.wins}V · {record.losses}D · {winRate}% victorias
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          +{record.vexEarned.toLocaleString()} VEX ganados
          {record.streak >= 3 && <span style={{ color: "#f59e0b", marginLeft: 8 }}>🔥 Racha {record.streak}</span>}
        </div>
      </div>
      <div style={{ fontSize: 18, color: "#475569" }}>✕</div>
    </div>
  );
}
