// CX.0 — HoloCard holographic shimmer effect (chat99)
// Wraps any card element with a dynamic tilt + holographic gradient overlay.

import { useRef, useCallback } from "react";

interface HoloCardProps {
  rarity: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

// Only Rare+ get the holo effect
const HOLO_RARITIES = new Set(["Rare", "Epic", "Legendary", "Mythic"]);

const RARITY_HOLO: Record<string, { c1: string; c2: string; c3: string }> = {
  Rare:      { c1: "#4a9eff44", c2: "#ffffff22", c3: "#4a9eff44" },
  Epic:      { c1: "#a855f744", c2: "#ffffff22", c3: "#c084fc44" },
  Legendary: { c1: "#f59e0b44", c2: "#fde68a22", c3: "#f59e0b44" },
  Mythic:    { c1: "#ef444444", c2: "#fca5a522", c3: "#ef444488" },
};

export function HoloCard({ rarity, children, style, className }: HoloCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    const holo = holoRef.current;
    if (!el || !holo) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top)  / rect.height; // 0..1
    const rotX = (y - 0.5) * -14; // tilt up/down
    const rotY = (x - 0.5) * 14;  // tilt left/right
    el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
    // Shift holo gradient origin
    holo.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    holo.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = containerRef.current;
    const holo = holoRef.current;
    if (el) el.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
    if (holo) holo.style.opacity = "0";
  }, []);

  const isHolo = HOLO_RARITIES.has(rarity);
  const holoColors = RARITY_HOLO[rarity] ?? RARITY_HOLO.Rare;

  return (
    <div
      ref={containerRef}
      onMouseMove={isHolo ? handleMouseMove : undefined}
      onMouseLeave={isHolo ? handleMouseLeave : undefined}
      className={className}
      style={{
        position: "relative",
        transition: "transform 0.15s ease",
        willChange: "transform",
        ...style,
      }}
    >
      {children}
      {isHolo && (
        <div
          ref={holoRef}
          style={{
            position: "absolute", inset: 0, borderRadius: "inherit",
            opacity: 0, transition: "opacity 0.2s ease",
            pointerEvents: "none", zIndex: 10,
            background: `linear-gradient(
              105deg,
              ${holoColors.c1} 0%,
              ${holoColors.c2} 40%,
              ${holoColors.c3} 80%,
              transparent 100%
            )`,
            backgroundSize: "200% 200%",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
