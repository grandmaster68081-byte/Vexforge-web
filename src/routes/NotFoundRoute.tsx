import { Link } from "react-router-dom";

    export function NotFoundRoute() {
    return (
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#e8702a", lineHeight: 1, letterSpacing: "-4px", marginBottom: 4 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Página no encontrada</h1>
        <p className="muted" style={{ marginBottom: 32, maxWidth: 340 }}>
          Esta ruta no existe en el universo VEXFORGE. Quizás buscabas otra cosa.
        </p>
        <Link to="/" style={{ display: "inline-block", padding: "13px 32px", background: "#e8702a", color: "#fff", borderRadius: 7, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
          ← Volver al inicio
        </Link>
      </section>
    );
    }
    