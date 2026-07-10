import { useEffect, useState } from "react";
import { listActiveCards, type Card } from "./repository";

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listActiveCards().then((result) => {
      if (cancelled) return;
      if (result.data) setCards(result.data);
      if (result.reason) setError(result.reason);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { cards, loading, error };
}
