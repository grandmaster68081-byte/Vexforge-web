export function ForgeGlyph({ variant = "core" }: { variant?: "core" | "battle" | "nexus" | "forge" }) {
  return <span className={`forgeGlyph forgeGlyph--${variant}`} aria-hidden="true">
    <svg viewBox="0 0 100 100" focusable="false">
      <path className="forgeGlyph__outer" d="M50 4 87 14 96 50 87 86 50 96 13 86 4 50 13 14Z" />
      <path className="forgeGlyph__inner" d="M50 16 74 23 84 50 74 77 50 84 26 77 16 50 26 23Z" />
      <path className="forgeGlyph__mark" d={variant === "battle" ? "M29 30 45 46 39 52 23 36ZM71 30 55 46 61 52 77 36ZM36 64 64 36M64 64 36 36" : variant === "nexus" ? "M50 22 67 50 50 78 33 50Z M50 31V69 M41 50 50 56 59 50 50 44Z" : variant === "forge" ? "M42 22 72 52 60 64 30 34Z M39 60 27 72 39 84 51 72" : "M50 20 61 40 80 50 61 60 50 80 39 60 20 50 39 40Z"} />
    </svg>
  </span>;
}
