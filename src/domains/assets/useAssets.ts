import { useEffect, useState } from "react";
import { listImageAssetsByPack, type OfficialAsset } from "./repository";

export function useAssetGallery() {
  const [gallery, setGallery] = useState<Record<string, OfficialAsset[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listImageAssetsByPack().then((result) => {
      if (cancelled) return;
      if (result.data) setGallery(result.data);
      if (result.reason) setError(result.reason);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { gallery, loading, error };
}
