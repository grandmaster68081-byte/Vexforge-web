import type { SVGProps } from "react";

type IconName = "arrow" | "download" | "menu" | "close" | "chevron" | "globe" | "play" | "card" | "forge" | "battle" | "nexus" | "external" | "plus" | "minus" | "discord" | "youtube" | "x" | "instagram";

export function Icon({ name, size = 18, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const base = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "arrow": return <svg {...base} {...props}><path d="M4.5 12h14"/><path d="m13 6.5 5.5 5.5-5.5 5.5"/></svg>;
    case "download": return <svg {...base} {...props}><path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 18.5v2h14v-2"/></svg>;
    case "menu": return <svg {...base} {...props}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>;
    case "close": return <svg {...base} {...props}><path d="m6 6 12 12"/><path d="m18 6-12 12"/></svg>;
    case "chevron": return <svg {...base} {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case "globe": return <svg {...base} {...props}><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4"/><path d="M12 3.5c2.2 2.3 3.3 5.15 3.3 8.5S14.2 18.2 12 20.5C9.8 18.2 8.7 15.35 8.7 12S9.8 5.8 12 3.5Z"/></svg>;
    case "play": return <svg {...base} {...props}><circle cx="12" cy="12" r="8.6"/><path d="m10.3 8.5 5.2 3.5-5.2 3.5z" fill="currentColor" stroke="none"/></svg>;
    case "card": return <svg {...base} {...props}><rect x="6.1" y="3.4" width="11.8" height="17.2" rx="1.5" transform="rotate(7.5 12 12)"/><path d="m9.6 12 2.1 2 3.7-4"/></svg>;
    case "forge": return <svg {...base} {...props}><path d="m14.4 4.4 5.2 5.2"/><path d="m12.2 6.6 5.2 5.2"/><path d="m8.6 11.7-4.2 4.2L8 19.5l4.2-4.2"/><path d="m11.2 13.9 4.2-4.2"/></svg>;
    case "battle": return <svg {...base} {...props}><path d="m6.8 4.3 5 5-2.7 2.6-5-5"/><path d="m17.2 4.3-5 5 2.7 2.6 5-5"/><path d="m8.7 13.2 6.6 6.5"/><path d="m15.3 13.2-6.6 6.5"/></svg>;
    case "nexus": return <svg {...base} {...props}><path d="m12 3 6 9-6 9-6-9z"/><path d="M12 7v10"/><path d="m8.5 12 3.5 2 3.5-2-3.5-2z"/></svg>;
    case "external": return <svg {...base} {...props}><path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M18 13v5H6V6h5"/></svg>;
    case "plus": return <svg {...base} {...props}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case "minus": return <svg {...base} {...props}><path d="M5 12h14"/></svg>;
    case "discord": return <svg {...base} {...props}><path d="M7.2 8.3c3.2-1.4 6.4-1.4 9.6 0 1.4 1.7 2.1 3.8 2.1 6.3-1.6 1.4-3.4 2.3-5.2 2.6l-.7-1.2"/><path d="M7.2 8.3c-1.4 1.7-2.1 3.8-2.1 6.3 1.6 1.4 3.4 2.3 5.2 2.6"/><circle cx="9.6" cy="12.1" r=".7" fill="currentColor" stroke="none"/><circle cx="14.4" cy="12.1" r=".7" fill="currentColor" stroke="none"/></svg>;
    case "youtube": return <svg {...base} {...props}><rect x="4" y="6.5" width="16" height="11" rx="2.8"/><path d="m10 9.4 5 2.6-5 2.6z" fill="currentColor" stroke="none"/></svg>;
    case "x": return <svg {...base} {...props}><path d="m5 5 14 14"/><path d="M19 5 5 19"/></svg>;
    case "instagram": return <svg {...base} {...props}><rect x="4.5" y="4.5" width="15" height="15" rx="4"/><circle cx="12" cy="12" r="3.3"/><circle cx="16.7" cy="7.7" r=".7" fill="currentColor" stroke="none"/></svg>;
  }
}
