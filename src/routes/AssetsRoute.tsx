const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_assets.jpg";

    export function AssetsRoute() {
    return (
      <section>
        <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
          <div className="hero-banner-overlay">
            <h1>Sistema</h1>
            <p className="hero-sub">Área de administración interna</p>
          </div>
        </div>
        <div className="stat-card" style={{ marginTop: 24, maxWidth: 480 }}>
          <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Acceso Restringido</p>
          <p className="muted">
            Esta sección es exclusiva para administradores de VEXFORGE.
            Si eres parte del equipo, accede a través del panel de Supabase.
          </p>
          <a href="/" style={{ display: "inline-block", marginTop: 16, color: "#e8702a", fontWeight: 600 }}>
            ← Volver al inicio
          </a>
        </div>
      </section>
    );
    }
    