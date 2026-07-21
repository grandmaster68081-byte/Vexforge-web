import { useEffect, useState } from "react";
import {
  getDailyFeaturedCard,
  getRecentActivity,
  type DailyCard,
  type ActivityItem,
} from "./repository";

export type { DailyCard, ActivityItem };

export interface UseHomeActivityResult {
  dailyCard:      DailyCard | null;
  activity:       ActivityItem[];
  loading:        boolean;
}

/**
 * Bloque 5.8: Loads daily featured card + recent activity feed in parallel.
 * Both queries are public (no auth required).
 */
export function useHomeActivity(): UseHomeActivityResult {
  const [dailyCard, setDailyCard] = useState<DailyCard | null>(null);
  const [activity,  setActivity]  = useState<ActivityItem[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDailyFeaturedCard(),
      getRecentActivity(8),
    ]).then(([card, acts]) => {
      if (cancelled) return;
      setDailyCard(card);
      setActivity(acts);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { dailyCard, activity, loading };
}
