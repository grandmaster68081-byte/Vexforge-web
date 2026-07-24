// VexForge AudioProvider v1.0 — Epic T.1: Sistema de Audio Global (chat74)
// Wires the AudioEngine section-ambient system to react-router navigation.
// - Hydrates persisted mute/volume prefs on mount.
// - Unlocks AudioContext on first user gesture (browser autoplay policy).
// - Maps the current pathname to a section palette and crossfades music.
// Renders nothing; safe to mount once inside <BrowserRouter>.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AudioEngine } from "../lib/audioEngine";
import type { VexforgeSection } from "../lib/audioEngine";

const SECTION_BY_PREFIX: Array<[string, VexforgeSection]> = [
  // Battle-heavy zones
  ["/pvp",           "battle"],
  ["/raids",         "battle"],
  ["/deck-builder",  "battle"],
  ["/bosses",        "bosses"],
  ["/world-bosses",  "bosses"],
  // Mission / quest zones
  ["/missions",      "missions"],
  ["/quests",        "missions"],
  ["/daily-quests",  "missions"],
  // Market / economy zones
  ["/market",        "market"],
  ["/packs",         "market"],
  ["/deposit",       "market"],
  ["/economy",       "market"],
  ["/fusion",        "market"],
  ["/evolution",     "market"],
  // Social zones
  ["/clans",         "social"],
  ["/friends",       "social"],
  ["/leaderboard",   "social"],
  ["/ranking",       "social"],
  ["/achievements",  "social"],
];

function sectionFor(pathname: string): VexforgeSection {
  for (const [prefix, section] of SECTION_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return section;
  }
  return "hub";
}

export function AudioProvider() {
  const { pathname } = useLocation();
  const unlockedRef  = useRef(false);
  const hydratedRef  = useRef(false);

  // 1. Hydrate persisted prefs once
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try { (AudioEngine as any).hydrateFromStorage?.(); } catch { /* silent */ }
  }, []);

  // 2. Unlock AudioContext on the first user gesture, then start current section
  useEffect(() => {
    if (unlockedRef.current) return;
    const onFirstGesture = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      try {
        (AudioEngine as any).unlock?.();
        (AudioEngine as any).startSectionAmbient?.(sectionFor(pathname));
      } catch { /* silent */ }
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown",     onFirstGesture);
      window.removeEventListener("touchstart",  onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: false });
    window.addEventListener("keydown",     onFirstGesture, { once: false });
    window.addEventListener("touchstart",  onFirstGesture, { once: false });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown",     onFirstGesture);
      window.removeEventListener("touchstart",  onFirstGesture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. On every route change (after unlock), crossfade to the matching section
  useEffect(() => {
    if (!unlockedRef.current) return;
    try { (AudioEngine as any).startSectionAmbient?.(sectionFor(pathname)); } catch { /* silent */ }
  }, [pathname]);

  return null;
}
