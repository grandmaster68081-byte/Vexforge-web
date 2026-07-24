import { useEffect, useState } from "react";
import {
  getMyActiveBoosts,
  getMyConsumables,
  type PlayerActiveBoost,
  type PlayerConsumable,
} from "./repository";

export function usePlayerItems() {
  const [boosts,      setBoosts]      = useState<PlayerActiveBoost[]>([]);
  const [consumables, setConsumables] = useState<PlayerConsumable[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [signedIn,    setSignedIn]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getMyActiveBoosts(), getMyConsumables()]).then(([br, cr]) => {
      if (cancelled) return;
      if (br.status === "blocked_auth" || cr.status === "blocked_auth") {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      setBoosts(br.data ?? []);
      setConsumables(cr.data ?? []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return { boosts, consumables, loading, signedIn };
}
