import { useEffect, useState } from "react";
import { getMyShards, type PlayerShard } from "./shardsRepository";

export function useShards() {
  const [shards, setShards]   = useState<PlayerShard[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyShards().then(r => {
      if (cancelled) return;
      if (r.status === "blocked_auth") {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      if (r.data)   setShards(r.data);
      if (r.reason) setError(r.reason);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { shards, loading, signedIn, error };
}
