import { useEffect, useState } from "react";
import { getInventory, type InventoryItem } from "./repository";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getInventory().then((result) => {
      if (cancelled) return;
      if (result.status === "blocked_auth") {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      if (result.data) setItems(result.data);
      if (result.reason) setError(result.reason);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error, signedIn };
}
