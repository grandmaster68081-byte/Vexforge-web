import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ForgeIcon } from "../shared/components/ForgeIcon";

type TutorialAccess = "checking" | "signed-out" | "signed-in";

/**
 * Public entry point for the canonical tutorial overlay.
 *
 * The tutorial itself remains owned by TutorialOverlay and the authoritative
 * tutorial_step flow. This route only makes that existing flow discoverable;
 * it never rewrites progress or creates a battle run.
 */
export function TutorialRoute() {
  const [access, setAccess] = useState<TutorialAccess>("checking");

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setAccess(data.session ? "signed-in" : "signed-out");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (access === "checking") {
    return (
      <section className="forge-page" aria-busy="true">
        <div className="empty-state">
          <ForgeIcon name="refresh" size={28} />
          <h1>Comprobando acceso</h1>
          <p>La Forja está preparando tu entrada al tutorial.</p>
        </div>
      </section>
    );
  }

  if (access === "signed-out") {
    return (
      <section className="forge-page" aria-labelledby="tutorial-title">
        <div className="empty-state">
          <ForgeIcon name="lock" size={44} style={{ color: "#e8b84b" }} />
          <h1 id="tutorial-title">Tutorial de la Forja</h1>
          <p>
            Inicia sesión para continuar con el tutorial oficial y conservar
            tu progreso.
          </p>
          <Link className="forge-btn forge-btn-primary" to="/account">
            <ForgeIcon name="account" size={16} />
            Iniciar sesión
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="forge-page" aria-labelledby="tutorial-title">
      <div className="empty-state">
        <ForgeIcon name="arena" size={44} style={{ color: "#e8b84b" }} />
        <h1 id="tutorial-title">Tutorial de la Forja</h1>
        <p>
          El tutorial oficial se abre sobre esta pantalla cuando tu progreso
          está pendiente. Usa el flujo guiado para aprender sin alterar los
          resultados autoritativos de la batalla.
        </p>
        <Link className="forge-btn forge-btn-primary" to="/">
          <ForgeIcon name="home" size={16} />
          Volver a la Forja
        </Link>
      </div>
    </section>
  );
}