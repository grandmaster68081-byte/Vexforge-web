// CX.1 — HoloCard v2 — Touch + Gyro + Sparkles (FASE 2)
// Wraps any card element with dynamic tilt + holographic shimmer overlay.
// Mobile: DeviceOrientationEvent gyroscope. Desktop: mouse-move parallax.
// Legendary/Mythic: animated sparkle particles.

import { useRef, useCallback, useEffect, useState } from "react";

interface HoloCardProps {
  rarity: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

// Only Rare+ get the holo effect
const HOLO_RARITIES = new Set(["Rare", "Epic", "Legendary", "Mythic"]);

const RARITY_HOLO: Record<string, { c1: string; c2: string; c3: string; glow: string }> = {
  Rare:      { c1: "#4a9eff44", c2: "#ffffff22", c3: "#4a9eff44", glow: "rgba(74,158,255,0.45)" },
  Epic:      { c1: "#a855f744", c2: "#ffffff22", c3: "#c084fc44", glow: "rgba(168,85,247,0.5)"  },
  Legendary: { c1: "#f59e0b44", c2: "#fde68a22", c3: "#f59e0b44", glow: "rgba(245,158,11,0.6)" },
  Mythic:    { c1: "#ef444444", c2: "#fca5a522", c3: "#ef444488", glow: "rgba(239,68,68,0.65)"  },
};

interface Sparkle { id: number; x: number; y: number; size: number; dur: number; delay: number; color: string; }

const SPARKLE_COLORS_LEGENDARY = ["#fde68a", "#f59e0b", "#fcd34d", "#ffffff"];
const SPARKLE_COLORS_MYTHIC    = ["#fca5a5", "#f87171", "#ef4444", "#fde68a", "#ffffff"];

let sparkleIdCounter = 0;
function makeSparkles(rarity: string): Sparkle[] {
  const colors = rarity === "Mythic" ? SPARKLE_COLORS_MYTHIC : SPARKLE_COLORS_LEGENDARY;
  const count = rarity === "Mythic" ? 9 : 6;
  return Array.from({ length: count }, () => ({
    id: ++sparkleIdCounter,
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    size: Math.random() * 4 + 2,
    dur: Math.random() * 1.4 + 1.2,
    delay: Math.random() * 2.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

export function HoloCard({ rarity, children, style, className, disabled }: HoloCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const holoRef      = useRef<HTMLDivElement>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const isHolo    = !disabled && HOLO_RARITIES.has(rarity);
  const hasSparks = !disabled && (rarity === "Legendary" || rarity === "Mythic");
  const holoColors = RARITY_HOLO[rarity] ?? RARITY_HOLO.Rare;

  // Generate sparkles once on mount for Legendary / Mythic
  useEffect(() => {
    if (hasSparks) setSparkles(makeSparkles(rarity));
  }, [rarity, hasSparks]);

  // ── Desktop: mouse-move tilt ────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el   = containerRef.current;
    const holo = holoRef.current;
    if (!el || !holo) return;
    const rect = el.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width;
    const y    = (e.clientY - rect.top)  / rect.height;
    const rotX = (y - 0.5) * -16;
    const rotY = (x - 0.5) *  16;
    el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
    holo.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    holo.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el   = containerRef.current;
    const holo = holoRef.current;
    if (el)   el.style.transform   = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
    if (holo) holo.style.opacity   = "0";
  }, []);

  // ── Mobile: DeviceOrientation gyroscope tilt ────────────────────────────
  useEffect(() => {
    if (!isHolo || typeof DeviceOrientationEvent === "undefined") return;

    let active = false;
    const handleTouch = () => { active = true; };
    window.addEventListener("touchstart", handleTouch, { once: true });

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!active) return;
      const el   = containerRef.current;
      const holo = holoRef.current;
      if (!el || !holo) return;
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0));  // left-right
      const beta  = Math.max(-30, Math.min(30, e.beta  ?? 0));  // front-back
      const rotX  = (beta  / 30) * -10;
      const rotY  = (gamma / 30) *  10;
      el.style.transform            = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
      holo.style.backgroundPosition = `${((gamma / 30) + 1) * 50}% ${((beta  / 30) + 1) * 50}%`;
      holo.style.opacity             = "0.7";
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("touchstart", handleTouch);
    };
  }, [isHolo]);

  const sparkleKeyframes = `
    @keyframes holo-sparkle {
      0%   { opacity: 0; transform: scale(0) rotate(0deg); }
      40%  { opacity: 1; transform: scale(1) rotate(120deg); }
      70%  { opacity: 0.8; transform: scale(0.8) rotate(200deg); }
      100% { opacity: 0; transform: scale(0.2) rotate(360deg); }
    }
    @keyframes holo-scanline {
      0%   { top: -10%; opacity: 0; }
      10%  { opacity: 0.5; }
      90%  { opacity: 0.4; }
      100% { top: 110%; opacity: 0; }
    }
  `;

  return (
    <div
      ref={containerRef}
      onMouseMove={isHolo ? handleMouseMove : undefined}
      onMouseLeave={isHolo ? handleMouseLeave : undefined}
      className={className}
      style={{
        position: "relative",
        transition: "transform 0.15s ease, box-shadow 0.3s ease",
        willChange: "transform",
        ...style,
      }}
    >
      {children}

      {/* Sparkle keyframes injection */}
      {hasSparks && <style>{sparkleKeyframes}</style>}

      {/* Holographic shimmer overlay */}
      {isHolo && (
        <div
          ref={holoRef}
          style={{
            position: "absolute", inset: 0, borderRadius: "inherit",
            opacity: 0, transition: "opacity 0.2s ease",
            pointerEvents: "none", zIndex: 10,
            background: `
              linear-gradient(
                105deg,
                ${holoColors.c1} 0%,
                ${holoColors.c2} 40%,
                transparent 55%,
                ${holoColors.c3} 80%,
                transparent 100%
              )`,
            backgroundSize: "220% 220%",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Scanline sweep — Legendary / Mythic */}
      {hasSparks && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "-20%", right: "-20%",
            height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${holoColors.glow} 40%, rgba(255,255,255,0.5) 50%, ${holoColors.glow} 60%, transparent 100%)`,
            pointerEvents: "none",
            zIndex: 12,
            animation: "holo-scanline 4s ease-in-out infinite",
            transform: "skewX(-18deg)",
          }}
        />
      )}

      {/* Sparkle particles */}
      {hasSparks && sparkles.map(s => (
        <div
          key={s.id}
          aria-hidden
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top:  `${s.y}%`,
            width:  s.size,
            height: s.size,
            borderRadius: "50%",
            background: s.color,
            pointerEvents: "none",
            zIndex: 11,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animation: `holo-sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
