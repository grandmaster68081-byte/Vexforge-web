import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../domains/notifications/useNotifications";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate        = useNavigate();
  const panelRef        = useRef<HTMLDivElement>(null);
  const btnRef          = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) return null;

  const badgeCount = Math.min(unreadCount, 9);
  const hasBadge   = unreadCount > 0;

  async function handleNotifClick(notif: typeof notifications[0]) {
    if (!notif.read) await markRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* ── Bell button ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        title="Notificaciones"
        style={{
          position: "relative",
          background: open ? "rgba(232,184,75,0.08)" : "transparent",
          border: "1px solid " + (open ? "rgba(232,184,75,0.3)" : "rgba(255,255,255,0.06)"),
          borderRadius: 8,
          width: 36, height: 36,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17,
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        🔔
        {hasBadge && (
          <span style={{
            position: "absolute",
            top: -4, right: -4,
            background: "#e3573f",
            color: "#fff",
            borderRadius: 99,
            minWidth: 16, height: 16,
            fontSize: 9,
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
            border: "1.5px solid #0e0e1a",
          }}>
            {unreadCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {/* ── Notifications panel ── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 440,
            background: "#0e0e1a",
            border: "1px solid rgba(232,184,75,0.2)",
            borderRadius: 12,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 13, fontWeight: 700, color: "#e8b84b",
            }}>
              Notificaciones
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8,
                  background: "rgba(232,184,75,0.15)",
                  border: "1px solid rgba(232,184,75,0.3)",
                  borderRadius: 99,
                  fontSize: 9,
                  fontFamily: '"IBM Plex Mono", monospace',
                  padding: "1px 6px", color: "#e8b84b",
                }}>
                  {unreadCount} sin leer
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 9, color: "#666",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8b84b")}
                onMouseLeave={e => (e.currentTarget.style.color = "#666")}
              >
                Leer todo
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#555",
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 11,
              }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    width: "100%",
                    display: "flex", gap: 12,
                    padding: "12px 16px",
                    background: notif.read ? "transparent" : "rgba(232,184,75,0.04)",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: notif.link ? "pointer" : "default",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!notif.read || notif.link) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = notif.read ? "transparent" : "rgba(232,184,75,0.04)"; }}
                >
                  {/* Unread dot */}
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: notif.read ? "transparent" : "#e8b84b",
                    marginTop: 5, flexShrink: 0,
                    alignSelf: "flex-start",
                  }} />

                  {/* Icon */}
                  <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>
                    {notif.icon}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: '"Rajdhani", sans-serif',
                      fontWeight: notif.read ? 500 : 700,
                      fontSize: 13, color: notif.read ? "#9a9ab0" : "#e8e8f0",
                      lineHeight: 1.3, marginBottom: 2,
                    }}>
                      {notif.title}
                    </div>
                    <div style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10, color: "#666",
                      lineHeight: 1.5,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as "vertical",
                    }}>
                      {notif.message}
                    </div>
                  </div>

                  {/* Time */}
                  <span style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 9, color: "#555",
                    flexShrink: 0, alignSelf: "flex-start",
                    marginTop: 2,
                  }}>
                    {relativeTime(notif.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: "8px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <span style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 9, color: "#555",
                letterSpacing: "0.1em",
              }}>
                VEXFORGE — SISTEMA DE NOTIFICACIONES
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
