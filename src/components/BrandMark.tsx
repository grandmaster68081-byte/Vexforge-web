import { Link } from "react-router-dom";
import { ForgeGlyph } from "./ForgeGlyph";

export function BrandMark() {
  return <Link className="brandMark" to="/" aria-label="VEXFORGE — inicio">
    <span className="brandMark__crest" aria-hidden="true"><ForgeGlyph variant="core" /></span>
    <span className="brandMark__type"><strong>VEXFORGE</strong></span>
  </Link>;
}
