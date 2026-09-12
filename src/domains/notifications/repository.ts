import { supabase } from "../../lib/supabase";

export type PlayerNotification = {
  id: string;
  player_id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export async function getNotifications(
  playerId: string,
  limit = 20
): Promise<PlayerNotification[]> {
  const { data, error } = await supabase
    .from("player_notifications")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as PlayerNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase
    .from("player_notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(playerId: string): Promise<void> {
  await supabase
    .from("player_notifications")
    .update({ read: true })
    .eq("player_id", playerId)
    .eq("read", false);
}
