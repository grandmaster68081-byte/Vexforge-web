import type { ReactNode } from "react";
import { ForgeIcon, type ForgeIconName } from "./ForgeIcon";

export type ForgeStateArtVariant = "empty" | "loading" | "error" | "locked";

const FALLBACK_ICON: Record<ForgeStateArtVariant, ForgeIconName> = {
  empty: "collection",
  loading: "spark",
  error: "warning",
  locked: "lock",
};

/**
 * Shared VEXFORGE state mark for empty, loading, error and auth-blocked views.
 * The mark is decorative; the visible heading/message remains the accessible
 * source of truth and the state icon stays inside the ForgeIcon catalog.
 */
export function ForgeStateArt({
  variant,
  icon,
}: {
  variant: ForgeStateArtVariant;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`forge-state-art forge-state-art-${variant}`}
      data-forge-state-art={variant}
      aria-hidden="true"
    >
      <span className="forge-state-art-orbit forge-state-art-orbit-a" />
      <span className="forge-state-art-orbit forge-state-art-orbit-b" />
      <span className="forge-state-art-mark">
        {icon ?? <ForgeIcon name={FALLBACK_ICON[variant]} size={28} strokeWidth={1.5} />}
      </span>
    </div>
  );
}
