import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} to="/" aria-label="VEXFORGE — inicio">
      <span className="brand__sigil" aria-hidden="true">V</span>
      <span className="brand__logoWrap">
        <img src={ASSETS.logo} alt="VEXFORGE" className="brand__logo" />
      </span>
    </Link>
  );
}
