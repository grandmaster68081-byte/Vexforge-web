import { useAssetGallery } from "../domains/assets/useAssets";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_assets.jpg";

// Packs with zero individual images extracted — only .zip bundle exists
const PENDING_PACKS = ["founders", "misc", "sessions", "ui_system", "clans"];

// Pack display order priority
const PACK_ORDER = ["cards","factions","regions","backgrounds","events","boosts","frames","icons","logo","progression","chests","cover","lobby","market","wallet","rewards","tutorial"];

import { SkeletonCardGrid } from "../shared/components/Skeleton";

export function AssetsRoute() {
  const { gallery, loading, error } = useAssetGallery();
  const packsWithImages = Object.keys(gallery).sort((a, b) => {
    const ai = PACK_ORDER.indexOf(a);
    const bi = PACK_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
        <div className="hero-banner-overlay">
          <h1>Visual Assets</h1>
        </div>
      </div>

      {loading && <SkeletonCardGrid count={9} minWidth={140} />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          {packsWithImages.map((pack) => (
            <div key={pack} style={{ marginBottom: 32 }}>
              <h2 style={{ textTransform: "capitalize", marginBottom: 12, fontSize: 16 }}>{pack}</h2>
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

          {PENDING_PACKS.some(p => !packsWithImages.includes(p)) && (
            <div className="empty-state" style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Pending — no individual images uploaded yet (zip bundle only):</p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PENDING_PACKS.filter(p => !packsWithImages.includes(p)).map((pack) => (
                  <li key={pack}>
                    <span className="mission-tag" style={{ textTransform: "capitalize" }}>{pack}</span>
                  </li>
                ))}
              </ul>
              <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                Once real images are uploaded and registered in vexforge_official_asset_manifest, they appear automatically above.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}