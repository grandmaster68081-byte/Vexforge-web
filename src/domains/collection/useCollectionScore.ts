import { useState, useEffect } from "react";
    import { getCollectionScore } from "./repository";
    import type { CollectionScore } from "./repository";

    export function useCollectionScore() {
    const [score,   setScore]   = useState<CollectionScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [status,  setStatus]  = useState("loading");

    useEffect(() => {
      let active = true;
      (async () => {
        const res = await getCollectionScore();
        if (!active) return;
        setStatus(res.status);
        setScore(res.data ?? null);
        setLoading(false);
      })();
      return () => { active = false; };
    }, []);

    return { score, loading, status };
    }
    