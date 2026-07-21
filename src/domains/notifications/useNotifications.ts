import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type PlayerNotification,
} from "./repository";

export function useNotifications() {
  const [playerId, setPlayerId]         = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [loading, setLoading]           = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || cancelled) { setLoading(false); return; }

      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!player || cancelled) { setLoading(false); return; }

      setPlayerId(player.id);
      const notifs = await getNotifications(player.id);
      if (!cancelled) {
        setNotifications(notifs);
        setLoading(false);
      }

      // Real-time: new notifications pushed by server
      channelRef.current = supabase
        .channel(`pn:${player.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "player_notifications",
            filter: `player_id=eq.${player.id}`,
          },
          (payload) => {
            setNotifications(prev =>
              [payload.new as PlayerNotification, ...prev].slice(0, 20)
            );
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe();
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!playerId) return;
    await markAllNotificationsRead(playerId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [playerId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
}
