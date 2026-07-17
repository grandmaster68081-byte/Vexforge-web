import { useEffect, useState } from "react";
    import { listAssetsGrouped, type GameAsset } from "./repository";

    /**
    * Loads all VEXFORGE visual assets from Storage, grouped by folder.
    * Used by AssetsRoute to render the full visual asset gallery.
    */
    export function useAssetGallery() {
    const [gallery, setGallery] = useState<Record<string, GameAsset[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      listAssetsGrouped().then((result) => {
        if (cancelled) return;
        if (result.data) setGallery(result.data);
        if (result.reason) setError(result.reason);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }, []);

    return { gallery, loading, error };
    }
    