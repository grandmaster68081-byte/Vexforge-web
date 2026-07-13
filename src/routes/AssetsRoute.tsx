import { useAssetGallery } from "../domains/assets/useAssets";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

/**
 * Packs that are officially named in the project but have zero individual
 * images actually uploaded to Storage yet (verified against storage.objects
 * directly, not just the manifest table -- only the .zip bundle exists).
 * These are NOT invented placeholders; they are an explicit pending list
 * for the next asset-generation pass. See vexforge_project_decisions,
 * chat31_visual_gallery_closed_with_existing_assets.
 */
const PENDING_PACKS = ["backgrounds", "clans", "events", "founders", "misc", "sessions", "ui_system"];

export function AssetsRoute() {
  const { gallery, loading, error } = useAssetGallery();
  const packsWithImages = Object.keys(gallery).sort();

  return (
    <section>
      <header className="route-header">
        <h1>Visual Assets</h1>
        <DomainStatusBadge status="ready" />
      </header>

      {loading && <p className="muted">Loading assets from Supabase Storage…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          {packsWithImages.map((pack) => (
            <div key={pack} style={{ marginBottom: 32 }}>
              <h2 style={{ textTransform: "capitalize", marginBottom: 12 }}>{pack}</h2>
              <div className="asset-gallery">
                {gallery[pack].map((asset) => (
                  <figure key={asset.id} className="asset-tile">
                    <img src={asset.image_url ?? undefined} alt={asset.display_name} loading="lazy" />
                    <figcaption className="muted">{asset.display_name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}

          <div className="empty-state">
            <p>Pending visual generation (no individual images uploaded yet, zip bundle only):</p>
            <ul>
              {PENDING_PACKS.map((pack) => (
                <li key={pack} style={{ textTransform: "capitalize" }}>{pack}</li>
              ))}
            </ul>
            <p className="muted">
              These packs are intentionally left empty here instead of showing invented art.
              Once real images are uploaded to Storage under their pack folder and registered in
              vexforge_official_asset_manifest, they will appear automatically above.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
